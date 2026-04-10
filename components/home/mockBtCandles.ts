import type { Candle } from "@/lib/backtesting/btTypes";

/** Deterministic OHLC for marketing / homepage (no randomness — stable SSR). */
export function buildHomeMockCandles(): Candle[] {
  const start = Math.floor(Date.UTC(2024, 5, 10, 6, 0, 0) / 1000);
  let p = 1.0842;
  const out: Candle[] = [];
  const n = 48;
  for (let i = 0; i < n; i++) {
    const wave = Math.sin(i * 0.35) * 0.00035;
    const trend = i > 32 ? -0.00012 * (i - 32) : i * 0.000008;
    const open = p;
    const close = p + wave + trend + (i % 5 === 0 ? -0.00008 : 0.00004);
    const high = Math.max(open, close) + 0.00012;
    const low = Math.min(open, close) - 0.0001;
    out.push({ time: start + i * 900, open, high, low, close });
    p = close;
  }
  return out;
}

export const HOME_MOCK_ENTRY = 1.0836;
export const HOME_MOCK_SL = 1.08225;
export const HOME_MOCK_TP = 1.0864;
