import type { SupabaseClient } from "@supabase/supabase-js";
import type { TradingAccountRow } from "@/lib/tradingApi";

export type JournalAccountBrief = {
  id: string;
  nickname: string;
  broker_server: string | null;
  account_number: string;
};

/**
 * Match trading_account.account_number to journal_account for the same user.
 */
export async function resolveJournalAccountForTradingRow(
  supabase: SupabaseClient,
  userId: string,
  trading: Pick<TradingAccountRow, "account_number">
): Promise<JournalAccountBrief | null> {
  const num = String(trading.account_number ?? "").trim();
  if (!num) return null;

  const { data } = await supabase
    .from("journal_account")
    .select("id, nickname, broker_server, account_number")
    .eq("user_id", userId)
    .eq("account_number", num)
    .maybeSingle();

  if (!data?.id) return null;

  return {
    id: data.id as string,
    nickname: String(data.nickname ?? "Account"),
    broker_server: data.broker_server != null ? String(data.broker_server) : null,
    account_number: String(data.account_number ?? num),
  };
}
