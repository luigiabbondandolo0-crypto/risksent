export type BtTimeframe = "M1" | "M5" | "M15" | "M30" | "H1" | "H4" | "D1";

export type BtTradeDirection = "BUY" | "SELL";

export type BtTradeStatus = "open" | "closed";

export type BtSessionStatus = string;

export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type BtStrategyRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at?: string;
};

export type BtSessionRow = {
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
  created_at?: string;
  updated_at?: string;
};

export type BtTradeRow = {
  id: string;
  session_id: string;
  user_id: string;
  symbol: string;
  direction: BtTradeDirection;
  entry_price: number;
  exit_price: number | null;
  stop_loss: number;
  take_profit: number;
  lot_size: number;
  pl: number | null;
  pl_pct: number | null;
  risk_reward: number | null;
  entry_time: string;
  exit_time: string | null;
  status: BtTradeStatus;
  notes: string | null;
};

export type StrategyWithStats = BtStrategyRow & {
  session_count: number;
  completed_session_count: number;
  win_rate_pct: number | null;
  avg_rr: number | null;
  total_pl: number;
  total_trades: number;
};
