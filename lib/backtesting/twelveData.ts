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

export function timeframeToInterval(tf: BtTimeframe): string {
  return INTERVAL_MAP[tf];
}

/** Twelve Data forex/crypto symbols use slash, e.g. EUR/USD */
export function normalizeTwelveDataSymbol(raw: string): string {
  const s = raw.trim().toUpperCase();
  if (s.includes("/")) return s;
  if (s.length === 6 && /^[A-Z]{6}$/.test(s)) {
    return `${s.slice(0, 3)}/${s.slice(3)}`;
  }
  if (s === "XAUUSD") return "XAU/USD";
  if (s === "BTCUSD") return "BTC/USD";
  if (s === "ETHUSD") return "ETH/USD";
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
  const out: Candle[] = [];
  for (const v of values) {
    const t = Date.parse(v.datetime);
    if (!Number.isFinite(t)) continue;
    const time = Math.floor(t / 1000);
    out.push({
      time,
      open: Number(v.open),
      high: Number(v.high),
      low: Number(v.low),
      close: Number(v.close)
    });
  }
  out.sort((a, b) => a.time - b.time);
  return out;
}
