import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseServer";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  getAccountSummary,
  getClosedOrders,
  getOpenPositions,
  accountSelectColumns,
  type TradingAccountRow
} from "@/lib/tradingApi";

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

  let accountRow: TradingAccountRow | null = null;
  const { data: accounts } = await supabase
    .from("trading_account")
    .select(accountSelectColumns())
    .eq("user_id", user.id)
    .limit(1);
  accountRow = (accounts?.[0] as unknown as TradingAccountRow) ?? null;

  if (!accountRow?.metaapi_account_id) {
    return NextResponse.json({ rules, live: null });
  }

  const apiKey = process.env.METATRADERAPI_API_KEY;
  const account: TradingAccountRow = {
    ...accountRow,
    provider: (accountRow.provider as "metaapi" | "mtapi") ?? "metaapi"
  };

  try {
    const [summaryResult, closedResult, openResult] = await Promise.all([
      getAccountSummary(account, apiKey),
      getClosedOrders(account, apiKey),
      getOpenPositions(account, apiKey)
    ]);

    if (!summaryResult.ok || !summaryResult.summary) {
      return NextResponse.json({ rules, live: null });
    }
    const summary = summaryResult.summary;
    const balance = Number(summary.balance) ?? 0;
    const equity = Number(summary.equity) ?? balance;

    let dailyLossPct: number | null = null;
    if (closedResult.ok) {
      const orders = closedResult.orders;
      const today = new Date().toISOString().slice(0, 10);
      const todayOrders = orders.filter(
        (o: unknown) => {
          const x = o as { closeTime?: string; profit?: number };
          return x?.closeTime?.startsWith(today) && typeof x?.profit === "number";
        }
      );
      const todayProfit = todayOrders.reduce((s: number, o: unknown) => s + ((o as { profit?: number }).profit ?? 0), 0);
      const initialBalance = balance - todayProfit;
      if (initialBalance > 0 && todayProfit < 0) {
        dailyLossPct = Math.abs((todayProfit / initialBalance) * 100);
      } else if (todayProfit >= 0) {
        dailyLossPct = 0;
      }
    }

    let currentExposurePct: number | null = null;
    if (openResult.ok && openResult.positions.length > 0 && equity > 0) {
      const CONTRACT = 100_000;
      let total = 0;
      for (const p of openResult.positions) {
        if (p == null || typeof p !== "object") continue;
        const vol = Number((p as { volume?: number; lots?: number }).volume ?? (p as { lots?: number }).lots) || 0;
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
