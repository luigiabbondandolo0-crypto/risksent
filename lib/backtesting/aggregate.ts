import type { BacktestSession, StrategyRollup } from "./types";

export function rollupStrategy(strategyId: string, sessions: BacktestSession[]): StrategyRollup {
  const mine = sessions.filter((s) => s.strategyId === strategyId);
  const completed = mine.filter((s) => s.status === "completed");
  const withStats = completed.filter(
    (s) =>
      s.tradesTested != null &&
      s.winRatePct != null &&
      s.maxDrawdownPct != null &&
      s.netPnlPct != null
  );

  let totalTrades = 0;
  let winSum = 0;
  let ddSum = 0;
  let best: number | null = null;
  let worst: number | null = null;

  for (const s of withStats) {
    const t = s.tradesTested ?? 0;
    totalTrades += t;
    winSum += (s.winRatePct ?? 0) * t;
    ddSum += s.maxDrawdownPct ?? 0;
    const pnl = s.netPnlPct ?? 0;
    best = best === null ? pnl : Math.max(best, pnl);
    worst = worst === null ? pnl : Math.min(worst, pnl);
  }

  const avgWinRatePct =
    totalTrades > 0 ? winSum / totalTrades : withStats.length ? withStats.reduce((a, s) => a + (s.winRatePct ?? 0), 0) / withStats.length : null;
  const avgMaxDdPct = withStats.length ? ddSum / withStats.length : null;

  return {
    strategyId,
    sessionCount: mine.length,
    completedCount: completed.length,
    avgWinRatePct,
    avgMaxDdPct,
    bestNetPnlPct: best,
    worstNetPnlPct: worst,
    totalTrades
  };
}
