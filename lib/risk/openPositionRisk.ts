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

/** Keys that `calcPnl` handles with non–FX math (must NOT fall through to pip×10000 default). */
const CFD_CALCPNL_KEYS = new Set([
  "XAUUSD",
  "XAGUSD",
  "USOIL",
  "US30",
  "US500",
  "US100",
  "UK100",
  "GER40",
  "JPN225",
  "BTCUSD",
  "ETHUSD"
]);

/** Map broker symbols to the nearest `calcPnl` instrument key. */
function aliasToCalcPnlKey(sym: string): string {
  const s = normalizeMetaapiSymbol(sym);
  const map: Record<string, string> = {
    // US Tech 100 / Nasdaq
    NAS100: "US100",
    NASDAQ: "US100",
    NAS100MINI: "US100",
    ND100: "US100",
    US100TECH: "US100",
    USTEC: "US100",
    USTECH100: "US100",
    TECH100: "US100",
    // S&P / US500
    SPX500: "US500",
    SP500: "US500",
    SPXM: "US500",
    US500IDX: "US500",
    // Dow
    WS30: "US30",
    DJ30: "US30",
    DOW30: "US30",
    US30IDX: "US30",
    // DAX / Germany
    DAX40: "GER40",
    DE40: "GER40",
    GER30: "GER40",
    // FTSE
    FTSE100: "UK100",
    // Oil
    UKOIL: "USOIL",
    BRENT: "USOIL",
    WTI: "USOIL",
    WTICO: "USOIL",
    CL: "USOIL",
    // Metals (text names)
    GOLD: "XAUUSD",
    SILVER: "XAGUSD",
    XAU: "XAUUSD",
    XAG: "XAGUSD"
  };
  if (map[s]) return map[s];
  if (s.startsWith("BTC")) return "BTCUSD";
  if (s.startsWith("ETH")) return "ETHUSD";
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

/** 6-letter spot FX (avoids treating NAS100, GER40, … as forex). */
function isSixLetterFxCode(s: string): boolean {
  return /^[A-Z]{6}$/.test(s);
}

function isLikelyStandardForexPair(sym: string, openPrice: number): boolean {
  if (!isSixLetterFxCode(sym)) return false;
  const o = Math.abs(openPrice);
  return o >= 0.2 && o <= 350;
}

function isLikelyJpyForexPair(sym: string, openPrice: number): boolean {
  const s = sym.toUpperCase();
  if (!s.includes("JPY")) return false;
  const o = Math.abs(openPrice);
  return o >= 25 && o <= 500;
}

/**
 * Unknown indices / CFDs: same rough model as `calcPnl` US30 — $1 account move per 1 price unit per 1 lot.
 * This avoids the FX default path (`priceDiff * 10000 * 10 * lot`) which explodes on large quotes.
 */
function pointsPerLotRiskUsd(signedDiff: number, volumeLots: number): number {
  return Math.abs(signedDiff) * volumeLots;
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
  const symRaw = normalizeMetaapiSymbol(symbol);
  const side = positionSideFromType(typeOrSide);
  const signed = signedDeltaToStop(openPrice, stopLoss, side);
  if (signed === 0) return null;

  const calcKey = aliasToCalcPnlKey(symRaw);

  if (CFD_CALCPNL_KEYS.has(calcKey)) {
    const pnl = calcPnl(calcKey, signed, volumeLots);
    const risk = Math.abs(pnl);
    return risk > 0 && Number.isFinite(risk) ? risk : null;
  }

  if (isLikelyJpyForexPair(symRaw, openPrice) || isLikelyStandardForexPair(symRaw, openPrice)) {
    const pnl = calcPnl(symRaw, signed, volumeLots);
    const risk = Math.abs(pnl);
    return risk > 0 && Number.isFinite(risk) ? risk : null;
  }

  const risk = pointsPerLotRiskUsd(signed, volumeLots);
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
