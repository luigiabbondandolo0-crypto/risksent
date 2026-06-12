/**
 * POST /api/journal/accounts/:id/sync for each account with a MetaApi id.
 * All syncs run in parallel (not sequential) to reduce latency.
 * @returns number of failed sync responses
 */
export async function syncAllJournalMetaAccounts(
  accounts: { id: string; metaapi_account_id: string | null | undefined }[]
): Promise<number> {
  const results = await Promise.allSettled(
    accounts
      .filter((a) => a.metaapi_account_id?.trim())
      .map((a) =>
        fetch(`/api/journal/accounts/${a.id}/sync`, { method: "POST" }).then(
          (res) => (res.ok ? 0 : 1),
          () => 1
        )
      )
  );
  return results.reduce(
    (n, r) => n + (r.status === "fulfilled" ? r.value : 1),
    0
  );
}
