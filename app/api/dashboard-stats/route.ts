import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseServer";
import { buildRealStats, parseOrders, type ClosedOrder } from "@/lib/dashboard/buildRealStats";
import {
  computeCurrentExposurePct,
  consecutiveLossesAtEndFromClosed,
  maxOpenPositionRiskPct,
  parseOpenPositions
} from "@/lib/risk/dashboardMetrics";
import { runDashboardRiskViolationSideEffect } from "@/lib/risk/persistViolations";
import type { RiskRulesDTO } from "@/lib/risk/riskTypes";
import {
  getAccountSummary,
  getClosedOrders,
  getOpenPositions,
  accountSelectColumns,
  type TradingAccountRow
} from "@/lib/tradingApi";

function accountLabelFromRow(a: TradingAccountRow): string {
  const n = a.account_number ?? "";
  const tail = n.length > 4 ? `••••${n.slice(-4)}` : n || "Account";
  return `${a.broker_type ?? "MT"} ${tail}`;
}

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const uuid = searchParams.get("uuid");

  let accountRow: TradingAccountRow | null = null;
  if (uuid) {
    const { data } = await supabase
      .from("trading_account")
      .select(accountSelectColumns())
      .eq("user_id", user.id)
      .eq("metaapi_account_id", uuid)
      .limit(1)
      .single();
    accountRow = data && typeof data === "object" && "metaapi_account_id" in data ? (data as unknown as TradingAccountRow) : null;
  }
  if (!accountRow) {
    const { data: accounts } = await supabase
      .from("trading_account")
      .select(accountSelectColumns())
      .eq("user_id", user.id)
      .limit(1);
    accountRow = (accounts?.[0] as unknown as TradingAccountRow) ?? null;
  }

  if (!accountRow?.metaapi_account_id) {
    return NextResponse.json({
      balance: 0,
      equity: 0,
      winRate: null,
      maxDd: null,
      equityCurve: [],
      error: "No account selected or linked"
    });
  }

  const account = accountRow as TradingAccountRow;

  try {
    console.log("[api/dashboard-stats] fetch");
    const [summaryResult, closedResult, openResult] = await Promise.all([
      getAccountSummary(account),
      getClosedOrders(account),
      getOpenPositions(account)
    ]);

    if (!summaryResult.ok || !summaryResult.summary) {
      return NextResponse.json(
        { error: summaryResult.error ?? "AccountSummary failed", balance: 0, equity: 0, winRate: null, maxDd: null, equityCurve: [] },
        { status: 502 }
      );
    }
    const summary = summaryResult.summary;
    const balance = Number(summary.balance) ?? 0;
    const equity = Number(summary.equity) ?? 0;
    const currency = summary.currency ?? "EUR";

    let closedOrders: ClosedOrder[] = [];
    if (closedResult.ok) {
      closedOrders = parseOrders(closedResult.orders);
    }

    const useEq = equity > 0 ? equity : balance;
    let currentExposurePct: number | null = null;
    let maxOpenRiskPct: number | null = null;
    if (openResult.ok && openResult.positions.length > 0) {
      const positions = parseOpenPositions(openResult.positions);
      currentExposurePct = computeCurrentExposurePct(positions, useEq);
      maxOpenRiskPct = maxOpenPositionRiskPct(positions, useEq);
    }

    const consecutiveLossesAtEnd = consecutiveLossesAtEndFromClosed(closedOrders);

    const {
      winRate,
      maxDd,
      highestDdPct,
      peakDdDate,
      maxDdDollars,
      dailyDdPct,
      avgRiskReward,
      avgWin,
      avgLoss,
      avgWinPct,
      avgLossPct,
      winsCount,
      lossesCount,
      drawsCount,
      profitFactor,
      equityCurve,
      dailyStats,
      totalProfit,
      initialBalance
    } = buildRealStats(balance, equity, closedOrders);

    const balancePct =
      initialBalance > 0 ? ((balance - initialBalance) / initialBalance) * 100 : null;
    const equityPct =
      initialBalance > 0 ? ((equity - initialBalance) / initialBalance) * 100 : null;

    const { data: appUser } = await supabase
      .from("app_user")
      .select("daily_loss_pct, max_risk_per_trade_pct, max_exposure_pct, revenge_threshold_trades")
      .eq("id", user.id)
      .maybeSingle();

    const rules: RiskRulesDTO = {
      daily_loss_pct: Number(appUser?.daily_loss_pct) ?? 5,
      max_risk_per_trade_pct: Number(appUser?.max_risk_per_trade_pct) ?? 1,
      max_exposure_pct: Number(appUser?.max_exposure_pct) ?? 6,
      revenge_threshold_trades: Number(appUser?.revenge_threshold_trades) ?? 3
    };

    void runDashboardRiskViolationSideEffect({
      userId: user.id,
      supabase,
      rules,
      live: {
        dailyDdPct,
        currentExposurePct,
        maxOpenRiskPct,
        consecutiveLossesAtEnd
      },
      accountLabel: accountLabelFromRow(account)
    });

    return NextResponse.json({
      balance,
      equity,
      currency,
      winRate,
      maxDd,
      highestDdPct,
      peakDdDate,
      maxDdDollars,
      dailyDdPct,
      currentExposurePct,
      maxOpenRiskPct,
      consecutiveLossesAtEnd,
      avgRiskReward,
      avgWin,
      avgLoss,
      avgWinPct,
      avgLossPct,
      winsCount,
      lossesCount,
      drawsCount,
      profitFactor,
      balancePct,
      equityPct,
      equityCurve,
      dailyStats,
      totalProfit,
      initialBalance,
      updatedAt: new Date().toISOString()
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch account" },
      { status: 502 }
    );
  }
}
