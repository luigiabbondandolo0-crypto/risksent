/**
 * Map journal account selection to trading_account.metaapi_account_id for /api/dashboard-stats ?uuid=
 * by matching account_number. Returns undefined to let the API pick the default (first) linked account.
 */
export function resolveMetaapiUuidForJournalSelection(
  selectedId: "all" | string,
  journals: { id: string; account_number: string }[],
  tradings: { account_number: string; metaapi_account_id: string | null }[]
): string | undefined {
  if (selectedId === "all") return undefined;
  const j = journals.find((x) => x.id === selectedId);
  if (!j) return undefined;
  const t = tradings.find((tr) => tr.account_number === j.account_number);
  const id = t?.metaapi_account_id;
  return id && String(id).trim() ? String(id).trim() : undefined;
}
