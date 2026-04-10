import type { BtTradeDirection, Candle } from "./btTypes";

export type HitResult =
  | { hit: "none" }
  | { hit: "sl"; price: number }
  | { hit: "tp"; price: number };

/** If both SL and TP fall inside the bar, prefer SL (conservative). */
export function checkSlTpHit(
  candle: Candle,
  direction: BtTradeDirection,
  sl: number,
  tp: number
): HitResult {
  const { high, low } = candle;
  if (direction === "BUY") {
    const slHit = low <= sl;
    const tpHit = high >= tp;
    if (slHit) return { hit: "sl", price: sl };
    if (tpHit) return { hit: "tp", price: tp };
    return { hit: "none" };
  }
  const slHit = high >= sl;
  const tpHit = low <= tp;
  if (slHit) return { hit: "sl", price: sl };
  if (tpHit) return { hit: "tp", price: tp };
  return { hit: "none" };
}

export function unrealizedPl(
  markPrice: number,
  entry: number,
  lotSize: number,
  direction: BtTradeDirection
): number {
  const m = direction === "BUY" ? 1 : -1;
  return (markPrice - entry) * lotSize * 100_000 * m;
}
