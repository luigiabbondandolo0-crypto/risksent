import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { deleteProvisionedMetaTraderAccount } from "@/lib/metaapiProvisioning";
import { verifyProvisionedMetaApiAccount } from "@/lib/metaapiVerifyProvisionedAccount";

/**
 * Runs after HTTP response: poll MetaApi until account-information succeeds, then update balances;
 * on failure, delete MetaApi account + matching DB rows (invalid credentials / server).
 */
export async function finalizeJournalAccountAfterProvision(params: {
  userId: string;
  journalAccountId: string;
  metaapiAccountId: string;
}): Promise<void> {
  const { userId, journalAccountId, metaapiAccountId } = params;
  let admin: ReturnType<typeof createSupabaseAdmin>;
  try {
    admin = createSupabaseAdmin();
  } catch (e) {
    console.warn("[finalizeJournalAccount] skipped (admin client unavailable):", e);
    return;
  }

  const verified = await verifyProvisionedMetaApiAccount(metaapiAccountId);
  if (!verified.ok) {
    await deleteProvisionedMetaTraderAccount(metaapiAccountId);
    await admin.from("trading_account").delete().eq("user_id", userId).eq("metaapi_account_id", metaapiAccountId);
    await admin.from("journal_account").delete().eq("id", journalAccountId).eq("user_id", userId);
    console.warn("[finalizeJournalAccount] verify failed, removed account:", verified.error?.slice(0, 200));
    return;
  }

  const info = verified.info;
  const currency = String(info.currency ?? "USD")
    .trim()
    .toUpperCase()
    .slice(0, 8);
  const balance = Number(info.balance);
  const equity = Number(info.equity);
  const initial_balance = Number.isFinite(balance) ? balance : 0;
  const current_balance = Number.isFinite(equity) ? equity : initial_balance;
  const now = new Date().toISOString();

  await admin
    .from("journal_account")
    .update({
      currency: currency || "USD",
      initial_balance,
      current_balance,
      last_synced_at: now,
      status: "active"
    })
    .eq("id", journalAccountId)
    .eq("user_id", userId);
}
