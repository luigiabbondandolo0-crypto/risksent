import type { BtSessionRow, StrategyWithStats } from "@/lib/backtesting/btTypes";
import { MOCK_BT_SESSIONS } from "@/lib/demo/mockData";

export function buildDemoBacktestingSeed(): {
  strategies: StrategyWithStats[];
  sessions: BtSessionRow[];
} {
  const strategies: StrategyWithStats[] = MOCK_BT_SESSIONS.map((s, idx) => {
    const stratId = `demo-bt-strat-${s.id}`;
    const pl = s.finalBalance - s.initialBalance;
    return {
      id: stratId,
      user_id: "demo-user",
      name: s.name,
      description: `${s.symbol} · ${s.timeframe} · sample session`,
      created_at: new Date(2026, idx, 1).toISOString(),
      session_count: 1,
      completed_session_count: s.status === "completed" ? 1 : 0,
      win_rate_pct: s.winRate,
      avg_rr: s.avgRR,
      total_pl: pl,
      total_trades: s.totalTrades,
    };
  });

  const sessions: BtSessionRow[] = MOCK_BT_SESSIONS.map((s, idx) => ({
    id: `demo-bt-session-${s.id}`,
    user_id: "demo-user",
    strategy_id: `demo-bt-strat-${s.id}`,
    name: `${s.name} · ${s.dateFrom}`,
    symbol: s.symbol,
    timeframe: s.timeframe as BtSessionRow["timeframe"],
    date_from: s.dateFrom,
    date_to: s.dateTo,
    initial_balance: s.initialBalance,
    current_balance: s.finalBalance,
    status: s.status,
    created_at: new Date(2026, idx + 1, 5).toISOString(),
  }));

  return { strategies, sessions };
}
