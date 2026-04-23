import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClosedOrder } from "@/lib/dashboard/buildRealStats";
import { buildRealStats } from "@/lib/dashboard/buildRealStats";
import {
  consecutiveLossesAtEndFromClosed,
  todayAndAvgTradesFromClosed
} from "@/lib/risk/dashboardMetrics";
import type { LiveStatsForRisk } from "@/lib/risk/riskTypes";

/**
 * Build live risk stats from journal_trades + journal_account when the
 * external trading provider (MetaAPI) is unavailable or returns no summary.
 * Keeps dashboard-stats + persistRiskViolations aligned with violation
 * history that is driven from journal data.
 */
export async function buildLiveStatsFromJournal(
  supabase: SupabaseClient,
  userId: string,
  journalAccountId: string
): Promise<LiveStatsForRisk | null> {
  const { data: acc, error: accErr } = await supabase
    .from("journal_account")
    .select("initial_balance, current_balance")
    .eq("id", journalAccountId)
    .eq("user_id", userId)
    .maybeSingle();

  if (accErr || !acc) return null;

  const { data: rows, error: trErr } = await supabase
    .from("journal_trade")
    .select("pl, close_time, status")
    .eq("user_id", userId)
    .eq("account_id", journalAccountId)
    .eq("status", "closed")
    .not("close_time", "is", null);

  if (trErr) return null;

  const orders: ClosedOrder[] = (rows ?? [])
    .filter((r) => r.close_time != null && r.pl != null)
    .map((r) => ({
      closeTime: String(r.close_time),
      profit: Number(r.pl)
    }));

  const currentBal = Number(acc.current_balance);
  const initialBal = Number(acc.initial_balance);
  const balance = Number.isFinite(currentBal) && currentBal > 0 ? currentBal : initialBal > 0 ? initialBal : 0;
  const equity = balance;

  const br = buildRealStats(balance, equity, orders);
  const consecutiveLossesAtEnd = consecutiveLossesAtEndFromClosed(orders);
  const { todayTrades, avgTradesPerDay } = todayAndAvgTradesFromClosed(orders);

  return {
    dailyDdPct: br.dailyDdPct,
    currentExposurePct: null,
    maxOpenRiskPct: null,
    consecutiveLossesAtEnd,
    todayTrades,
    avgTradesPerDay
  };
}
