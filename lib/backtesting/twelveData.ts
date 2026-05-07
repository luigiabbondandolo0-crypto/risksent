import type { BtTimeframe } from "./btTypes";
import type { Candle } from "./btTypes";

const INTERVAL_MAP: Record<BtTimeframe, string> = {
  M1: "1min",
  M5: "5min",
  M15: "15min",
  M30: "30min",
  H1: "1h",
  H4: "4h",
  D1: "1day"
};

/** Twelve Data / CFD ticker overrides (user-facing symbol → API symbol). */
const SYMBOL_OVERRIDES: Record<string, string> = {
  // Indices (common Twelve Data tickers)
  US30: "DJI",
  US500: "SPX",
  US100: "NDX",
  UK100: "UK100",
  GER40: "GDAXI",
  FRA40: "CAC40",
  JPN225: "NI225",
  AUS200: "AXJO",
  HK50: "HSI",
  ESP35: "IBEX",
  // Commodities / energy (may vary by plan — adjust if API returns errors)
  XAUUSD: "XAU/USD",
  XAGUSD: "XAG/USD",
  XPTUSD: "XPT/USD",
  USOIL: "WTI",
  UKOIL: "BRENT",
  NATGAS: "NATURAL_GAS",
  // Crypto CFD
  BTCUSD: "BTC/USD",
  ETHUSD: "ETH/USD",
  LTCUSD: "LTC/USD",
  XRPUSD: "XRP/USD",
  SOLUSD: "SOL/USD"
};

export function timeframeToInterval(tf: BtTimeframe): string {
  return INTERVAL_MAP[tf];
}

/**
 * Normalize user symbol (e.g. EURUSD, US30) to Twelve Data `symbol` query value.
 */
export function normalizeTwelveDataSymbol(raw: string): string {
  const s = raw.trim().toUpperCase();
  if (s.includes("/")) return s;

  const o = SYMBOL_OVERRIDES[s];
  if (o) return o;

  if (s.length === 6 && /^[A-Z]{6}$/.test(s)) {
    return `${s.slice(0, 3)}/${s.slice(3)}`;
  }

  return s;
}

type TwelveBar = {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
};

export function parseTwelveDataResponse(body: unknown): Candle[] {
  const values = (body as { values?: TwelveBar[] }).values;
  if (!Array.isArray(values)) return [];
  const seen = new Set<number>();
  const out: Candle[] = [];
  for (const v of values) {
    const normalized = v.datetime.includes("T") ? v.datetime : v.datetime.replace(" ", "T") + "Z";
    const t = Date.parse(normalized);
    if (!Number.isFinite(t)) continue;
    const time = Math.floor(t / 1000);
    if (seen.has(time)) continue;
    const open  = Number(v.open);
    const high  = Number(v.high);
    const low   = Number(v.low);
    const close = Number(v.close);
    if (
      !Number.isFinite(open)  || open  <= 0 ||
      !Number.isFinite(high)  || high  <= 0 ||
      !Number.isFinite(low)   || low   <= 0 ||
      !Number.isFinite(close) || close <= 0 ||
      high < low ||
      high < open || high < close ||
      low  > open || low  > close
    ) continue;
    seen.add(time);
    out.push({ time, open, high, low, close });
  }
  out.sort((a, b) => a.time - b.time);
  return out;
}
