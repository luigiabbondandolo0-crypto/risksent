import type { JournalAccountPublic } from "@/lib/journal/journalTypes";

export const DEMO_METAAPI_ACCOUNT_ID = "demo-metaapi-linked";

/** Same identity as journaling mock — must match `trading_account.account_number` for dashboard meta resolution. */
export const DEMO_JOURNAL_ACCOUNT_PUBLIC: JournalAccountPublic = {
  id: "demo-account",
  user_id: "demo-user",
  nickname: "Demo Account (IC Markets)",
  broker_server: "ICMarkets-Demo",
  account_number: "12345678",
  platform: "MT5",
  metaapi_account_id: DEMO_METAAPI_ACCOUNT_ID,
  currency: "USD",
  initial_balance: 10_000,
  current_balance: 12_847.3,
  status: "active",
  last_synced_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
};
