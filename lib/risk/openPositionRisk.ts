import { calcPnl } from "@/lib/backtesting/symbolMap";

/** Strip broker suffixes so "XAUUSD#" / "EURUSD.m" match symbolMap entries. */
export function normalizeMetaapiSymbol(raw: string): string {
  let s = String(raw ?? "").trim().toUpperCase();
  if (!s) return s;
  for (const sep of [".", "#", ":", "-"] as const) {
    const i = s.indexOf(sep);
    if (i > 0) s = s.slice(0, i);
  }
  return s;
}

function positionSideFromType(type: string | undefined | null): "buy" | "sell" {
  const t = String(type ?? "").toLowerCase();
  return t.includes("sell") ? "sell" : "buy";
}

/**
 * Signed price delta (open → stop) in the direction of the stop; `calcPnl` uses long convention.
 * Buy + SL below: negative. Sell + SL above: negative.
 */
function signedDeltaToStop(openPrice: number, stopLoss: number, side: "buy" | "sell"): number {
  return side === "sell" ? openPrice - stopLoss : stopLoss - openPrice;
}

/**
 * Estimated risk in account currency (same USD-oriented approximation as `calcPnl`) if SL is hit.
 */
export function estimateRiskMoneyAtStopLoss(
  symbol: string,
  openPrice: number,
  stopLoss: number,
  volumeLots: number,
  typeOrSide?: string | null
): number | null {
  if (!symbol || volumeLots <= 0 || !Number.isFinite(openPrice) || !Number.isFinite(stopLoss)) return null;
  if (stopLoss <= 0 || stopLoss === openPrice) return null;
  const sym = normalizeMetaapiSymbol(symbol);
  const side = positionSideFromType(typeOrSide);
  const signed = signedDeltaToStop(openPrice, stopLoss, side);
  if (signed === 0) return null;
  const pnl = calcPnl(sym, signed, volumeLots);
  const risk = Math.abs(pnl);
  return risk > 0 && Number.isFinite(risk) ? risk : null;
}

export function riskPctOfEquityAtStopLoss(
  symbol: string,
  openPrice: number,
  stopLoss: number,
  volumeLots: number,
  equity: number,
  typeOrSide?: string | null
): number | null {
  if (equity <= 0) return null;
  const money = estimateRiskMoneyAtStopLoss(symbol, openPrice, stopLoss, volumeLots, typeOrSide);
  if (money == null) return null;
  return (money / equity) * 100;
}
