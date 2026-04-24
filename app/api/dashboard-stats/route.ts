import type { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { normalizeIanaTimeZone } from "@/lib/journal/calendarBounds";
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
import { buildLiveStatsFromJournal } from "@/lib/risk/liveStatsFromJournal";
import { loadMergedRiskRules } from "@/lib/risk/loadMergedRiskRules";
import { resolveJournalAccountForTradingRow } from "@/lib/risk/resolveJournalForTrading";
import type { RiskRulesDTO } from "@/lib/risk/riskTypes";
import {
  getAccountSummary,
  getClosedOrders,
  getOpenPositions,
  fetchSymbolTickSizes,
  accountSelectColumns,
  type TradingAccountRow
} from "@/lib/tradingApi";

function accountLabelFromRow(a: TradingAccountRow): string {
  const n = a.account_number ?? "";
  const tail = n.length > 4 ? `••••${n.slice(-4)}` : n || "Account";
  return `${a.broker_type ?? "MT"} ${tail}`;
}

/**
 * Resolve trading row for MetaApi calls: prefer trading_account, fall back to journal_account.metaapi_account_id.
 */
async function resolveStatsTradingRow(
  supabase: SupabaseClient,
  userId: string,
  uuid: string | null
): Promise<TradingAccountRow | null> {
  if (uuid) {
    const { data: tradingByMeta } = await supabase
      .from("trading_account")
      .select(accountSelectColumns())
      .eq("user_id", userId)
      .eq("metaapi_account_id", uuid)
      .maybeSingle();
    if (
      tradingByMeta &&
      typeof tradingByMeta === "object" &&
      "metaapi_account_id" in tradingByMeta &&
      String((tradingByMeta as { metaapi_account_id?: string }).metaapi_account_id ?? "").trim()
    ) {
      return tradingByMeta as unknown as TradingAccountRow;
    }
    const { data: journalRow } = await supabase
      .from("journal_account")
      .select("account_number, platform, broker_server, metaapi_account_id")
      .eq("user_id", userId)
      .eq("metaapi_account_id", uuid)
      .maybeSingle();
    if (journalRow?.metaapi_account_id) {
      return {
        metaapi_account_id: String(journalRow.metaapi_account_id),
        account_number: String(journalRow.account_number ?? ""),
        broker_type: journalRow.platform === "MT4" ? "MT4" : "MT5",
        broker_host: journalRow.broker_server != null ? String(journalRow.broker_server) : null,
        broker_port: null
      };
    }
    return null;
  }

  const { data: tradingFirst } = await supabase
    .from("trading_account")
    .select(accountSelectColumns())
    .eq("user_id", userId)
    .not("metaapi_account_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (
    tradingFirst &&
    typeof tradingFirst === "object" &&
    "metaapi_account_id" in tradingFirst &&
    String((tradingFirst as { metaapi_account_id?: string }).metaapi_account_id ?? "").trim()
  ) {
    return tradingFirst as unknown as TradingAccountRow;
  }

  const { data: journalFirst } = await supabase
    .from("journal_account")
    .select("account_number, platform, broker_server, metaapi_account_id")
    .eq("user_id", userId)
    .not("metaapi_account_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (journalFirst?.metaapi_account_id) {
    return {
      metaapi_account_id: String(journalFirst.metaapi_account_id),
      account_number: String(journalFirst.account_number ?? ""),
      broker_type: journalFirst.platform === "MT4" ? "MT4" : "MT5",
      broker_host: journalFirst.broker_server != null ? String(journalFirst.broker_server) : null,
      broker_port: null
    };
  }

  return null;
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
  const paramTz = searchParams.get("tz");
  const { data: auTz } = await supabase
    .from("app_user")
    .select("preference_timezone")
    .eq("id", user.id)
    .maybeSingle();
  const timeZone =
    paramTz != null && paramTz.trim() !== ""
      ? normalizeIanaTimeZone(paramTz)
      : normalizeIanaTimeZone(auTz?.preference_timezone ?? null);

  const accountRow = await resolveStatsTradingRow(supabase, user.id, uuid);

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
      console.warn("[api/dashboard-stats] summary not ok; degraded KPI + optional journal risk side effect", errMsg);
      // Still run persistRiskViolations from journal so violation history, alert table,
      // dashboard live alerts, and headbar stay aligned when the broker API is off.
      const journalCtx = await resolveJournalAccountForTradingRow(supabase, user.id, account);
      if (journalCtx?.id) {
        const fromJournal = await buildLiveStatsFromJournal(supabase, user.id, journalCtx.id, timeZone);
        if (fromJournal) {
          const rules: RiskRulesDTO = await loadMergedRiskRules(
            supabase,
            user.id,
            journalCtx.id
          );
          void runDashboardRiskViolationSideEffect({
            userId: user.id,
            supabase,
            rules,
            live: fromJournal,
            journalAccountId: journalCtx.id,
            accountNickname: journalCtx.nickname,
            brokerServer: journalCtx.broker_server,
            timeZone
          });
        }
      }
      // Do not 502: same JSON shape as success + `error` for UI.
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
      const syms = positions.map((p) => String(p.symbol ?? "").trim()).filter((s) => s.length > 0);
      const tickSizes = await fetchSymbolTickSizes(account, syms);
      currentExposurePct = computeCurrentExposurePct(positions, useEq, tickSizes);
      maxOpenRiskPct = maxOpenPositionRiskPct(positions, useEq, tickSizes);
    }

    const consecutiveLossesAtEnd = consecutiveLossesAtEndFromClosed(closedOrders, timeZone);
    const { todayTrades, avgTradesPerDay } = todayAndAvgTradesFromClosed(closedOrders, 30, timeZone);

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
    } = buildRealStats(balance, equity, closedOrders, { timeZone });

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
      brokerServer: journalCtx?.broker_server ?? null,
      timeZone
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
