/**
 * Format a date/ISO string in a specific IANA timezone using Intl.DateTimeFormat.
 * Pass timezone = "local" (or empty) to use the browser's local timezone.
 */
export function fmtInTz(
  isoOrDate: string | Date | number,
  timezone: string,
  opts: Omit<Intl.DateTimeFormatOptions, "timeZone">,
): string {
  const d =
    typeof isoOrDate === "string"
      ? new Date(isoOrDate)
      : isoOrDate instanceof Date
        ? isoOrDate
        : new Date(isoOrDate);
  const tz = timezone && timezone !== "local" ? timezone : undefined;
  return new Intl.DateTimeFormat(undefined, {
    ...opts,
    ...(tz ? { timeZone: tz } : {}),
  }).format(d);
}

/** "Mar 29, 2025, 14:30" — equivalent to date-fns PPpp but TZ-aware */
export function fmtDateTimeLong(iso: string, tz: string): string {
  return fmtInTz(iso, tz, {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

/** "Mar 29, 14:30" — equivalent to "MMM d, HH:mm" */
export function fmtDateTimeShort(iso: string, tz: string): string {
  return fmtInTz(iso, tz, {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

/** "14:30" — time only */
export function fmtTimeOnly(iso: string, tz: string): string {
  return fmtInTz(iso, tz, { hour: "2-digit", minute: "2-digit", hour12: false });
}

/** "Mar 29" — date only, no year */
export function fmtDateShort(iso: string, tz: string): string {
  return fmtInTz(iso, tz, { month: "short", day: "numeric" });
}
