export type JournalAccountStatus = "active" | "disconnected";
export type JournalBias = "Bullish" | "Bearish" | "Neutral";
export type JournalEmotion = "Calm" | "Confident" | "Anxious" | "FOMO" | "Revenge";
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
  /** MetaApi.cloud id for live broker stats (see trading_account.metaapi_account_id) */
  metaapi_account_id: string | null;
  last_synced_at: string | null;
  created_at: string | null;
};

/** Safe shape returned from APIs (no password). */
export type JournalAccountPublic = Omit<JournalAccountRow, "account_password">;

export type JournalSession = {
  id: string;
  user_id: string;
  account_id: string | null;
  session_date: string;
  bias: JournalBias | null;
  key_levels: string | null;
  watchlist: string[] | null;
  notes: string | null;
  images: string[] | null;
  /** Checklist item id → completed today */
  checklist_done?: Record<string, boolean> | null;
  /** Rule id → trader marked YES (following) */
  rules_followed?: Record<string, boolean> | null;
  created_at: string | null;
  updated_at: string | null;
};

export type JournalStrategy = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string | null;
};

export type JournalChecklistItem = {
  id: string;
  user_id: string;
  text: string;
  order_index: number;
  created_at: string | null;
};

export type JournalRule = {
  id: string;
  user_id: string;
  text: string;
  order_index: number;
  created_at: string | null;
};

export type JournalTradeReview = {
  id: string;
  user_id: string;
  trade_id: string;
  strategy_id: string | null;
  checklist_results: Record<string, boolean>;
  rules_followed: Record<string, boolean>;
  emotion: JournalEmotion | null;
  rating: number | null;
  notes: string | null;
  images: string[] | null;
  created_at: string | null;
  updated_at: string | null;
};

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
