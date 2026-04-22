import type { SessionStats, Trade } from "@/lib/backtesting/types";

export function calcSessionStats(trades: Trade[]): SessionStats {
  const closed = trades.filter((t) => t.status === "closed");
  const wins = closed.filter((t) => (t.pnl ?? 0) > 0);
  const losses = closed.filter((t) => (t.pnl ?? 0) <= 0);
  const totalPnl = closed.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const gross_profit = wins.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const gross_loss = Math.abs(losses.reduce((s, t) => s + (t.pnl ?? 0), 0));
  const pnls = closed.map((t) => t.pnl ?? 0);

  let peak = 0;
  let runningPnl = 0;
  let maxDd = 0;
  for (const p of pnls) {
    runningPnl += p;
    if (runningPnl > peak) peak = runningPnl;
    const dd = peak - runningPnl;
    if (dd > maxDd) maxDd = dd;
  }

  const validRR = closed.filter((t) => t.risk_reward != null).map((t) => t.risk_reward!);
  const avgRR = validRR.length > 0 ? validRR.reduce((a, b) => a + b, 0) / validRR.length : 0;

  return {
    totalTrades: closed.length,
    openTrades: trades.filter((t) => t.status === "open").length,
    wins: wins.length,
    losses: losses.length,
    winRate: closed.length > 0 ? (wins.length / closed.length) * 100 : 0,
    totalPnl,
    avgRR,
    profitFactor: gross_loss > 0 ? gross_profit / gross_loss : gross_profit > 0 ? Infinity : 0,
    maxDrawdown: maxDd,
    bestTrade: pnls.length > 0 ? Math.max(...pnls) : 0,
    worstTrade: pnls.length > 0 ? Math.min(...pnls) : 0,
  };
}
