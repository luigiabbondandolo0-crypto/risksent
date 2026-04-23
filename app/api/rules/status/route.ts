import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import {
  getAccountSummary,
  getClosedOrders,
  getOpenPositions,
  fetchSymbolTickSizes,
  accountSelectColumns,
  type TradingAccountRow
} from "@/lib/tradingApi";
import { computeCurrentExposurePct, parseOpenPositions } from "@/lib/risk/dashboardMetrics";

/**
 * GET /api/rules/status
 * Returns saved rules + live values from linked account for Rules page badges and exposure bar.
 * Live data: from trading provider (dashboard-stats logic). If no account or provider error, live values are null.
 */
export async function GET() {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: row } = await supabase
    .from("app_user")
    .select("daily_loss_pct, max_risk_per_trade_pct, max_exposure_pct, revenge_threshold_trades")
    .eq("id", user.id)
    .limit(1)
    .maybeSingle();

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

  const account = accountRow as TradingAccountRow;

  try {
    const [summaryResult, closedResult, openResult] = await Promise.all([
      getAccountSummary(account),
      getClosedOrders(account),
      getOpenPositions(account)
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
      const positions = parseOpenPositions(openResult.positions);
      const syms = positions.map((p) => String(p.symbol ?? "").trim()).filter((s) => s.length > 0);
      const tickSizes = await fetchSymbolTickSizes(account, syms);
      currentExposurePct = computeCurrentExposurePct(positions, equity, tickSizes);
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
