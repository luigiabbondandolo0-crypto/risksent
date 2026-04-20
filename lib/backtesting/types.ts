// New types matching the bt_strategies / bt_sessions / bt_trades Supabase tables

export type BtTimeframe = "M1" | "M5" | "M15" | "M30" | "H1" | "H4" | "D1";
export type BtDirection = "BUY" | "SELL";
export type BtTradeStatus = "open" | "closed";
export type BtSessionStatus = "active" | "completed" | "paused";

export type Candle = {
  time: number;   // Unix seconds UTC
  open: number;
  high: number;
  low: number;
  close: number;
};

export type Strategy = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type Session = {
  id: string;
  user_id: string;
  strategy_id: string;
  name: string;
  symbol: string;
  timeframe: BtTimeframe;
  date_from: string;
  date_to: string;
  initial_balance: number;
  current_balance: number;
  status: BtSessionStatus;
  created_at: string;
  updated_at: string;
};

export type Trade = {
  id: string;
  session_id: string;
  user_id: string;
  symbol: string;
  direction: BtDirection;
  entry_price: number;
  exit_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  lot_size: number;
  pnl: number | null;
  pips: number | null;
  risk_reward: number | null;
  entry_time: string;
  exit_time: string | null;
  status: BtTradeStatus;
  notes: string | null;
  created_at: string;
};

export type StrategyWithStats = Strategy & {
  sessions: SessionWithStats[];
};

export type SessionWithStats = Session & {
  trades: Trade[];
  stats: SessionStats;
};

export type SessionStats = {
  totalTrades: number;
  openTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
  avgRR: number;
  profitFactor: number;
  maxDrawdown: number;
  bestTrade: number;
  worstTrade: number;
};
