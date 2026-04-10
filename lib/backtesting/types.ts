export type BacktestStrategy = {
  id: string;
  name: string;
  createdAt: string;
};

export type BacktestSessionStatus = "draft" | "running" | "completed";

export type BacktestSession = {
  id: string;
  strategyId: string;
  name: string;
  /** Wall-clock length the user chose for the session (minutes). */
  durationMinutes: number;
  asset: string;
  initialBalance: number;
  createdAt: string;
  status: BacktestSessionStatus;
  startedAt?: string;
  endedAt?: string;
  /** Filled when run completes */
  tradesTested?: number;
  winRatePct?: number;
  avgRMultiple?: number;
  maxDrawdownPct?: number;
  netPnlPct?: number;
};

export type SessionEquityPoint = {
  step: number;
  label: string;
  balance: number;
  pct: number;
};

export type StrategyRollup = {
  strategyId: string;
  sessionCount: number;
  completedCount: number;
  avgWinRatePct: number | null;
  avgMaxDdPct: number | null;
  bestNetPnlPct: number | null;
  worstNetPnlPct: number | null;
  totalTrades: number;
};
