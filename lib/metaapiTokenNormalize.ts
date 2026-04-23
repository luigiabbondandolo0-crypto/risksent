/**
 * MetaApi expects the raw API token in the `auth-token` header (not `Bearer <token>`).
 */
export function normalizeMetaApiToken(raw: string | null | undefined): string {
  if (raw == null) return "";
  let t = String(raw).trim().replace(/^\uFEFF/, "");
  t = t.replace(/^["']|["']$/g, "");
  if (/^bearer\s+/i.test(t)) t = t.replace(/^bearer\s+/i, "").trim();
  return t;
}
