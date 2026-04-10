export type JournalAccountStatus = "active" | "disconnected";
export type JournalPlatform = "MT4" | "MT5";
export type JournalTradeDirection = "BUY" | "SELL";
export type JournalTradeStatus = "open" | "closed";

export type JournalAccountRow = {
  id: string;
  user_id: string;
  nickname: string;
  broker_server: string;
  account_number: string;
  account_password: string;
  platform: JournalPlatform;
  currency: string;
  initial_balance: number;
  current_balance: number;
  status: JournalAccountStatus;
  last_synced_at: string | null;
  created_at: string | null;
};

/** Safe shape returned from APIs (no password). */
export type JournalAccountPublic = Omit<JournalAccountRow, "account_password">;

export type JournalTradeRow = {
  id: string;
  user_id: string;
  account_id: string;
  ticket: string;
  symbol: string;
  direction: JournalTradeDirection;
  open_time: string;
  close_time: string | null;
  open_price: number;
  close_price: number | null;
  lot_size: number;
  stop_loss: number | null;
  take_profit: number | null;
  pl: number | null;
  commission: number | null;
  swap: number | null;
  pips: number | null;
  risk_reward: number | null;
  setup_tags: string[] | null;
  notes: string | null;
  screenshot_url: string | null;
  status: JournalTradeStatus;
  created_at: string | null;
};
