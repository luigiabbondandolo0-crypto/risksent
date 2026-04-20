export const TIMEFRAME_LABELS: Record<string, string> = {
  M1:  "1m",
  M5:  "5m",
  M15: "15m",
  M30: "30m",
  H1:  "1H",
  H4:  "4H",
  D1:  "1D",
};

export const TIMEFRAMES = ["M1", "M5", "M15", "M30", "H1", "H4", "D1"] as const;

export type SymbolGroup = {
  label: string;
  symbols: string[];
};

export const SYMBOL_GROUPS: SymbolGroup[] = [
  {
    label: "Forex Majors",
    symbols: ["EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "USDCAD", "NZDUSD"],
  },
  {
    label: "Forex Minors",
    symbols: [
      "EURGBP", "EURJPY", "EURCAD", "EURCHF", "EURAUD",
      "GBPJPY", "GBPCHF", "GBPAUD", "GBPCAD",
      "AUDJPY", "AUDCAD", "AUDNZD", "CADJPY", "NZDJPY",
    ],
  },
  {
    label: "Indices",
    symbols: ["US30", "US500", "US100", "UK100", "GER40", "JPN225"],
  },
  {
    label: "Commodities",
    symbols: ["XAUUSD", "XAGUSD", "USOIL"],
  },
  {
    label: "Crypto",
    symbols: ["BTCUSD", "ETHUSD"],
  },
];

export const ALL_SYMBOLS: string[] = SYMBOL_GROUPS.flatMap((g) => g.symbols);

/** Returns pips for a given symbol and price difference (direction-adjusted). */
export function calcPips(symbol: string, priceDiff: number): number {
  const s = symbol.toUpperCase();
  if (s.includes("JPY")) return priceDiff * 100;
  if (["XAUUSD", "XAGUSD", "USOIL", "US30", "US500", "US100", "UK100", "GER40", "JPN225", "BTCUSD", "ETHUSD"].includes(s)) {
    return priceDiff; // points
  }
  return priceDiff * 10000; // standard forex
}

/** Simple PnL estimate in account currency (approximate USD). */
export function calcPnl(symbol: string, priceDiff: number, lotSize: number): number {
  const s = symbol.toUpperCase();
  if (["XAUUSD"].includes(s)) return priceDiff * lotSize * 100;
  if (["XAGUSD"].includes(s)) return priceDiff * lotSize * 5000;
  if (["USOIL"].includes(s))  return priceDiff * lotSize * 1000;
  if (["US30", "US500", "US100", "UK100", "GER40", "JPN225"].includes(s)) return priceDiff * lotSize;
  if (["BTCUSD", "ETHUSD"].includes(s)) return priceDiff * lotSize;
  // Standard forex: pip value ≈ $10 per standard lot
  return calcPips(s, priceDiff) * 10 * lotSize;
}

/** Pip size for display. */
export function pipSize(symbol: string): number {
  const s = symbol.toUpperCase();
  if (s.includes("JPY")) return 0.01;
  if (["XAUUSD", "XAGUSD", "USOIL", "US30", "US500", "US100", "UK100", "GER40", "JPN225", "BTCUSD", "ETHUSD"].includes(s)) return 1;
  return 0.0001;
}

/** Format price for a given symbol (appropriate decimal places). */
export function fmtPrice(symbol: string, price: number): string {
  const s = symbol.toUpperCase();
  if (s.includes("JPY")) return price.toFixed(3);
  if (["BTCUSD"].includes(s)) return price.toFixed(0);
  if (["ETHUSD"].includes(s)) return price.toFixed(2);
  if (["US30", "US500", "US100", "UK100", "GER40", "JPN225"].includes(s)) return price.toFixed(2);
  return price.toFixed(5);
}
