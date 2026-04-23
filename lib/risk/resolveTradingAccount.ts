import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getAccountSummary,
  getClosedOrders,
  getOpenPositions,
  fetchSymbolTickSizes,
  accountSelectColumns,
  type TradingAccountRow
} from "@/lib/tradingApi";
import { buildRealStats, parseOrders, type ClosedOrder } from "@/lib/dashboard/buildRealStats";
import {
  computeCurrentExposurePct,
  consecutiveLossesAtEndFromClosed,
  maxOpenPositionRiskPct,
  parseOpenPositions,
  todayAndAvgTradesFromClosed
} from "@/lib/risk/dashboardMetrics";

export async function resolveTradingAccountForUser(
  supabase: SupabaseClient,
  userId: string,
  uuid: string | null
): Promise<TradingAccountRow | null> {
  let accountRow: TradingAccountRow | null = null;
  if (uuid) {
    const { data } = await supabase
      .from("trading_account")
      .select(accountSelectColumns())
      .eq("user_id", userId)
      .eq("metaapi_account_id", uuid)
      .limit(1)
      .single();
    accountRow = data && typeof data === "object" && "metaapi_account_id" in data ? (data as unknown as TradingAccountRow) : null;
  }
  if (!accountRow) {
    const { data: accounts } = await supabase
      .from("trading_account")
      .select(accountSelectColumns())
      .eq("user_id", userId)
      .limit(1);
    accountRow = (accounts?.[0] as unknown as TradingAccountRow) ?? null;
  }
  return accountRow?.metaapi_account_id ? accountRow : null;
}

export function tradingAccountLabel(a: TradingAccountRow): string {
  const n = a.account_number ?? "";
  const tail = n.length > 4 ? `••••${n.slice(-4)}` : n || "Account";
  return `${a.broker_type ?? "MT"} ${tail}`;
}

export type RiskLiveSnapshot = {
  dailyDdPct: number | null;
  currentExposurePct: number | null;
  maxOpenRiskPct: number | null;
  consecutiveLossesAtEnd: number;
  todayTrades: number;
  avgTradesPerDay: number | null;
  account: TradingAccountRow;
};

export async function fetchRiskLiveSnapshot(account: TradingAccountRow): Promise<RiskLiveSnapshot | null> {
  const [summaryResult, closedResult, openResult] = await Promise.all([
    getAccountSummary(account),
    getClosedOrders(account),
    getOpenPositions(account)
  ]);
  if (!summaryResult.ok || !summaryResult.summary) return null;
  const balance = Number(summaryResult.summary.balance) ?? 0;
  const equity = Number(summaryResult.summary.equity) ?? 0;
  const useEq = equity > 0 ? equity : balance;

  let closedOrders: ClosedOrder[] = [];
  if (closedResult.ok) {
    closedOrders = parseOrders(closedResult.orders);
  }

  let currentExposurePct: number | null = null;
  let maxOpenRiskPct: number | null = null;
  if (openResult.ok && openResult.positions.length > 0) {
    const positions = parseOpenPositions(openResult.positions);
    const syms = positions.map((p) => String(p.symbol ?? "").trim()).filter((s) => s.length > 0);
    const tickSizes = await fetchSymbolTickSizes(account, syms);
    currentExposurePct = computeCurrentExposurePct(positions, useEq, tickSizes);
    maxOpenRiskPct = maxOpenPositionRiskPct(positions, useEq, tickSizes);
  }

  const consecutiveLossesAtEnd = consecutiveLossesAtEndFromClosed(closedOrders);
  const { dailyDdPct } = buildRealStats(balance, equity, closedOrders);
  const { todayTrades, avgTradesPerDay } = todayAndAvgTradesFromClosed(closedOrders);

  return {
    dailyDdPct,
    currentExposurePct,
    maxOpenRiskPct,
    consecutiveLossesAtEnd,
    todayTrades,
    avgTradesPerDay,
    account
  };
}
