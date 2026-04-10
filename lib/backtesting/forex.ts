import type { BtTradeDirection } from "./btTypes";

/** Rough pip size for retail FX-style symbols (replay P&L is simplified). */
export function pipSize(symbol: string): number {
  const s = symbol.toUpperCase().replace(/[^A-Z]/g, "");
  if (s.includes("JPY")) return 0.01;
  if (s.includes("XAU")) return 0.01;
  if (s.includes("BTC") || s.includes("ETH")) return 0.01;
  return 0.0001;
}

export function pipsToPriceDelta(symbol: string, pips: number, direction: 1 | -1): number {
  return direction * pips * pipSize(symbol);
}

/**
 * Simplified forex P&L (per user spec).
 * direction: BUY => +1, SELL => -1
 */
export function calcPl(
  entry: number,
  exitPx: number,
  lotSize: number,
  direction: BtTradeDirection
): number {
  const m = direction === "BUY" ? 1 : -1;
  return (exitPx - entry) * lotSize * 100_000 * m;
}

export function calcPlPct(balance: number, pl: number): number {
  if (!Number.isFinite(balance) || balance === 0) return 0;
  return (pl / balance) * 100;
}

export function plannedRiskReward(
  entry: number,
  sl: number,
  tp: number,
  direction: BtTradeDirection
): number {
  const risk = Math.abs(entry - sl);
  const reward = Math.abs(tp - entry);
  if (risk === 0) return 0;
  return reward / risk;
}
