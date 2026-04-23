function currencySymbol(code: string): string {
  const map: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    CHF: "Fr",
    CAD: "C$",
    AUD: "A$",
    NZD: "NZ$"
  };
  return map[code.toUpperCase()] ?? code;
}

/** Daily P/L on calendar cells — full amount, no k/integer rounding. */
export function fmtDayPl(pl: number, currency?: string): string {
  const sign = pl >= 0 ? "+" : "-";
  const sym = currency ? currencySymbol(currency) : "";
  const abs = Math.abs(pl);
  const jpy = currency?.toUpperCase() === "JPY";
  const formatted = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: jpy ? 0 : 2,
    maximumFractionDigits: jpy ? 0 : 2
  }).format(abs);
  return `${sign}${sym}${formatted}`;
}
