/**
 * Bounds for filtering `journal_trade.close_time` so calendar days match the user's local clock
 * (same idea as "Today" in MetaTrader when the terminal uses local or broker-aligned display).
 */
export function localDayBoundsIso(dayYmd: string): { from: string; to: string } {
  const parts = dayYmd.split("-").map(Number);
  const y = parts[0] ?? 0;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  const start = new Date(y, m - 1, d, 0, 0, 0, 0);
  const end = new Date(y, m - 1, d, 23, 59, 59, 999);
  return { from: start.toISOString(), to: end.toISOString() };
}

export function localMonthBoundsIso(year: number, monthIndex0: number): { from: string; to: string } {
  const start = new Date(year, monthIndex0, 1, 0, 0, 0, 0);
  const end = new Date(year, monthIndex0 + 1, 0, 23, 59, 59, 999);
  return { from: start.toISOString(), to: end.toISOString() };
}

/** Start of a calendar range N years back (local midnight). */
export function localYearsAgoStartIso(yearsBack: number): string {
  const s = new Date();
  s.setFullYear(s.getFullYear() - yearsBack);
  s.setMonth(0, 1);
  s.setHours(0, 0, 0, 0);
  return s.toISOString();
}

/** `yyyy-MM-dd` in the user's local timezone (matches dashboard / MT-style day cells). */
export function localYmdFromIso(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function localYmFromIso(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** `yyyy-MM-dd` for `date` interpreted in IANA `timeZone` (e.g. Europe/Rome). */
export function ymdInTimeZone(date: Date, timeZone: string): string {
  const tz = (timeZone ?? "").trim() || "UTC";
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export function normalizeIanaTimeZone(raw: string | null | undefined): string {
  const s = (raw ?? "").trim() || "UTC";
  try {
    Intl.DateTimeFormat("en-US", { timeZone: s });
    return s;
  } catch {
    return "UTC";
  }
}
