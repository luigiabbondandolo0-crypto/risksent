/**
 * POST /api/journal/accounts/:id/sync for each account with a MetaApi id.
 * @returns number of failed sync responses
 */
export async function syncAllJournalMetaAccounts(
  accounts: { id: string; metaapi_account_id: string | null | undefined }[]
): Promise<number> {
  let failures = 0;
  for (const a of accounts) {
    if (!a.metaapi_account_id?.trim()) continue;
    try {
      const res = await fetch(`/api/journal/accounts/${a.id}/sync`, { method: "POST" });
      if (!res.ok) failures += 1;
    } catch {
      failures += 1;
    }
  }
  return failures;
}
