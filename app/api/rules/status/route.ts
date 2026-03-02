import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseServer";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

const METAAPI_BASE = "https://api.metatraderapi.dev";

/**
 * GET /api/rules/status
 * Returns saved rules + live values from linked account for Rules page badges and exposure bar.
 * Live data: from MetaAPI (dashboard-stats logic). If no account or API error, live values are null.
 */
export async function GET() {
  const supabase = createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdmin();
  const { data: row } = await admin
    .from("app_user")
    .select("daily_loss_pct, max_risk_per_trade_pct, max_exposure_pct, revenge_threshold_trades")
    .eq("id", user.id)
    .single();

  const rules = {
    daily_loss_pct: Number(row?.daily_loss_pct) ?? 2,
    max_risk_per_trade_pct: Number(row?.max_risk_per_trade_pct) ?? 1,
    max_exposure_pct: Number(row?.max_exposure_pct) ?? 15,
    revenge_threshold_trades: Number(row?.revenge_threshold_trades) ?? 2
  };

  let accountId: string | null = null;
  const { data: accounts } = await supabase
    .from("trading_account")
    .select("metaapi_account_id")
    .eq("user_id", user.id)
    .limit(1);
  accountId = accounts?.[0]?.metaapi_account_id ?? null;

  if (!accountId) {
    return NextResponse.json({ rules, live: null });
  }

  const apiKey = process.env.METATRADERAPI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ rules, live: null });
  }

  try {
    const [summaryRes, closedRes] = await Promise.all([
      fetch(`${METAAPI_BASE}/AccountSummary?id=${encodeURIComponent(accountId)}`, {
        headers: { "x-api-key": apiKey, Accept: "application/json" }
      }),
      fetch(`${METAAPI_BASE}/ClosedOrders?id=${encodeURIComponent(accountId)}`, {
        headers: { "x-api-key": apiKey, Accept: "application/json" }
      })
    ]);
    
    // Try multiple endpoint variations for open positions
    // Based on docs: HistoryPositions or OrderHistory filtered by state="Started"
    const endpoints = [
      `${METAAPI_BASE}/HistoryPositions?id=${encodeURIComponent(accountId)}`,
      `${METAAPI_BASE}/OrderHistory?id=${encodeURIComponent(accountId)}&from=${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}&sort=OpenTime&ascending=false`,
      `${METAAPI_BASE}/OpenPositions?id=${encodeURIComponent(accountId)}`,
      `${METAAPI_BASE}/Positions?id=${encodeURIComponent(accountId)}`
    ];
    
    const headers = { "x-api-key": apiKey, Accept: "application/json" };
    let openRes: Response | null = null;
    let rawData: unknown = null;
    
    for (const endpoint of endpoints) {
      openRes = await fetch(endpoint, { headers });
      if (openRes.ok) {
        rawData = await openRes.json();
        break; // Found working endpoint
      }
      if (openRes.status !== 403) {
        continue; // Try next endpoint
      }
    }

    if (!summaryRes.ok) {
      return NextResponse.json({ rules, live: null });
    }

    const summary = await summaryRes.json();
    const balance = Number(summary.balance) ?? 0;
    const equity = Number(summary.equity) ?? balance;

    let dailyLossPct: number | null = null;
    if (closedRes.ok) {
      const raw = await closedRes.json();
      const orders = Array.isArray(raw) ? raw : raw?.orders ?? raw ?? [];
      const today = new Date().toISOString().slice(0, 10);
      const todayOrders = orders.filter(
        (o: { closeTime?: string; profit?: number }) =>
          o?.closeTime?.startsWith(today) && typeof o?.profit === "number"
      );
      const todayProfit = todayOrders.reduce((s: number, o: { profit?: number }) => s + (o.profit ?? 0), 0);
      const initialBalance = balance - todayProfit;
      if (initialBalance > 0 && todayProfit < 0) {
        dailyLossPct = Math.abs((todayProfit / initialBalance) * 100);
      } else if (todayProfit >= 0) {
        dailyLossPct = 0;
      }
    }

    let currentExposurePct: number | null = null;
    if (openRes?.ok && rawData && equity > 0) {
      let rawList: unknown[] = [];
      
      // Handle different response formats
      if (Array.isArray(rawData)) {
        rawList = rawData;
      } else if (typeof rawData === 'object' && rawData !== null) {
        // OrderHistory returns { orders: [...] }
        if ('orders' in rawData && Array.isArray(rawData.orders)) {
          // Filter for open positions: state="Started" or closeTime is null/empty
          rawList = (rawData.orders as unknown[]).filter((o: any) => 
            o?.state === "Started" || !o?.closeTime || o?.closeTime === ""
          );
        } else if ('positions' in rawData && Array.isArray(rawData.positions)) {
          rawList = rawData.positions;
        } else {
          rawList = [rawData];
        }
      }
      
      const CONTRACT = 100_000;
      let total = 0;
      for (const p of rawList) {
        if (p == null || typeof p !== "object") continue;
        const vol = Number((p as { volume?: number }).volume) || 0;
        const open = Number((p as { openPrice?: number }).openPrice) || 0;
        const sl = (p as { stopLoss?: number }).stopLoss;
        if (vol && open && sl != null && Number.isFinite(Number(sl))) {
          const risk = Math.abs(open - Number(sl)) * vol * CONTRACT;
          total += (risk / equity) * 100;
        }
      }
      if (total > 0) currentExposurePct = total;
    }

    return NextResponse.json({
      rules,
      live: {
        dailyLossPct,
        currentExposurePct
      }
    });
  } catch {
    return NextResponse.json({ rules, live: null });
  }
}
