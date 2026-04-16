import type { SupabaseClient } from "@supabase/supabase-js";

/** True if a journal_account row exists for this user. */
export async function isJournalAccountOwnedBy(
  supabase: SupabaseClient,
  userId: string,
  journalAccountId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("journal_account")
    .select("id")
    .eq("id", journalAccountId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

/** True if a journal_strategy row exists for this user. */
export async function isJournalStrategyOwnedBy(
  supabase: SupabaseClient,
  userId: string,
  strategyId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("journal_strategy")
    .select("id")
    .eq("id", strategyId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}
