/**
 * Map journal account selection to MetaApi account id for /api/dashboard-stats ?uuid=
 * (prefers journal.metaapi_account_id, then trading row matched by account_number).
 */
export function resolveMetaapiUuidForJournalSelection(
  selectedId: "all" | string,
  journals: { id: string; account_number: string; metaapi_account_id?: string | null }[],
  tradings: { account_number: string; metaapi_account_id: string | null }[]
): string | undefined {
  if (selectedId === "all") return undefined;
  const j = journals.find((x) => x.id === selectedId);
  if (!j) return undefined;
  const direct = j.metaapi_account_id;
  if (direct && String(direct).trim()) return String(direct).trim();
  const t = tradings.find((tr) => tr.account_number === j.account_number);
  const id = t?.metaapi_account_id;
  return id && String(id).trim() ? String(id).trim() : undefined;
}
