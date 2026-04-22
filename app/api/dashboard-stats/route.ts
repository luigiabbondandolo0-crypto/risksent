import { NextRequest, NextResponse } from "next/server";
import { requireRouteUser } from "@/lib/supabase/requireRouteUser";
import { buildRealStats, parseOrders, type ClosedOrder } from "@/lib/dashboard/buildRealStats";
import {
  computeCurrentExposurePct,
  consecutiveLossesAtEndFromClosed,
  maxOpenPositionRiskPct,
  parseOpenPositions,
  todayAndAvgTradesFromClosed
} from "@/lib/risk/dashboardMetrics";
import { runDashboardRiskViolationSideEffect } from "@/lib/risk/persistViolations";
import { loadMergedRiskRules } from "@/lib/risk/loadMergedRiskRules";
import { resolveJournalAccountForTradingRow } from "@/lib/risk/resolveJournalForTrading";
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

function degradedBody(error: string) {
  const t = new Date().toISOString();
  return {
    balance: 0,
    equity: 0,
    currency: "USD",
    winRate: null,
    maxDd: null,
    highestDdPct: null,
    peakDdDate: null,
    maxDdDollars: null,
    dailyDdPct: null,
    currentExposurePct: null,
    maxOpenRiskPct: null,
    consecutiveLossesAtEnd: 0,
    avgRiskReward: null,
    avgWin: null,
    avgLoss: null,
    avgWinPct: null,
    avgLossPct: null,
    winsCount: 0,
    lossesCount: 0,
    drawsCount: 0,
    profitFactor: null,
    balancePct: null,
    equityPct: null,
    equityCurve: [],
    dailyStats: [],
    totalProfit: null,
    initialBalance: null,
    error,
    updatedAt: t
  };
}

export async function GET(req: NextRequest) {
  const auth = await requireRouteUser(req);
  if (auth instanceof NextResponse) return auth;
  const { supabase, user } = auth;

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
      const errMsg = summaryResult.error ?? "Account summary unavailable";
      console.warn("[api/dashboard-stats] summary not ok (returning 200 + degraded body)", errMsg);
      // Do not 502: trading provider is often stubbed/disabled; clients like Risk Manager use
      // `if (!res.ok) return` and would break. Same JSON shape as success + `error` for UI.
      return NextResponse.json(degradedBody(errMsg));
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
    const { todayTrades, avgTradesPerDay } = todayAndAvgTradesFromClosed(closedOrders);

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

    const journalCtx = await resolveJournalAccountForTradingRow(supabase, user.id, account);
    const rules: RiskRulesDTO = await loadMergedRiskRules(
      supabase,
      user.id,
      journalCtx?.id ?? null
    );

    void runDashboardRiskViolationSideEffect({
      userId: user.id,
      supabase,
      rules,
      live: {
        dailyDdPct,
        currentExposurePct,
        maxOpenRiskPct,
        consecutiveLossesAtEnd,
        todayTrades,
        avgTradesPerDay
      },
      journalAccountId: journalCtx?.id ?? null,
      accountNickname: journalCtx?.nickname ?? accountLabelFromRow(account),
      brokerServer: journalCtx?.broker_server ?? null
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
