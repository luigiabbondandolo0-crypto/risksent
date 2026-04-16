/**
 * Shared input validation / sanitization for API routes (no extra deps).
 * Supabase/PostgREST uses parameterized queries; still validate types and bounds.
 */

/** UUID (hex segments; Supabase uses standard string ids). */
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value.trim());
}

export function parseUuidParam(value: string | null, label = "id"): { ok: true; id: string } | { ok: false; error: string } {
  const s = String(value ?? "").trim();
  if (!s) return { ok: false, error: `${label} is required` };
  if (!isUuid(s)) return { ok: false, error: `Invalid ${label}` };
  return { ok: true, id: s };
}

/** Remove NUL and most control characters; normalize newlines for free text. */
export function sanitizeText(input: string, maxLen: number): string {
  let s = input.replace(/\0/g, "");
  s = s.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "");
  if (s.length > maxLen) {
    s = s.slice(0, maxLen);
  }
  return s.trim();
}

/** Integer in inclusive range. */
export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

/** Positive integers only (e.g. ticket ids). */
export function parsePositiveIntList(raw: unknown, maxItems: number, maxValue = 1e12): number[] {
  if (!Array.isArray(raw)) return [];
  const out: number[] = [];
  for (const item of raw) {
    const n = typeof item === "number" ? item : Number.parseInt(String(item), 10);
    if (!Number.isFinite(n) || n < 1 || n > maxValue) continue;
    out.push(Math.trunc(n));
    if (out.length >= maxItems) break;
  }
  return out;
}

/** ISO date YYYY-MM-DD */
export function isIsoDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const t = Date.parse(`${s}T00:00:00.000Z`);
  return Number.isFinite(t);
}

/**
 * Twelve Data / backtesting symbol: letters, digits, slash, dot, dash, space, colon, parens — bounded length.
 */
export function sanitizeMarketSymbol(raw: string, maxLen = 64): { ok: true; symbol: string } | { ok: false; error: string } {
  const s = raw.trim();
  if (!s) return { ok: false, error: "symbol required" };
  if (s.length > maxLen) return { ok: false, error: "symbol too long" };
  if (!/^[A-Za-z0-9/.\-:()\s]+$/.test(s)) {
    return { ok: false, error: "invalid symbol" };
  }
  return { ok: true, symbol: s };
}

const IMAGE_EXT = new Set(["png", "jpg", "jpeg", "webp", "gif"]);

export function safeImageFilename(filename: string | undefined): { ext: string } | null {
  const base = (filename ?? "image.png").split(/[/\\]/).pop() ?? "image.png";
  const ext = base.split(".").pop()?.toLowerCase() ?? "png";
  if (!IMAGE_EXT.has(ext)) return null;
  return { ext: ext === "jpg" ? "jpeg" : ext };
}

/** Max decoded image size for journal upload (bytes). */
export const MAX_JOURNAL_IMAGE_BYTES = 6 * 1024 * 1024;

export function assertJsonBodySize(req: Request, maxBytes: number): boolean {
  const cl = req.headers.get("content-length");
  if (!cl) return true;
  const n = Number.parseInt(cl, 10);
  if (!Number.isFinite(n) || n < 0) return false;
  return n <= maxBytes;
}
