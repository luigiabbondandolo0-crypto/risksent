import type { ClosedOrder } from "@/lib/dashboard/buildRealStats";
import { riskPctOfEquityAtStopLoss, type MetaTickRiskInput } from "@/lib/risk/openPositionRisk";

export function consecutiveLossesAtEndFromClosed(orders: ClosedOrder[]): number {
  const valid = orders.filter(
    (o): o is { closeTime: string; profit: number } =>
      o != null && typeof o.closeTime === "string" && typeof o.profit === "number"
  );
  if (valid.length === 0) return 0;
  const sorted = [...valid].sort(
    (a, b) => new Date(b.closeTime).getTime() - new Date(a.closeTime).getTime()
  );
  let n = 0;
  for (const o of sorted) {
    if (o.profit < 0) n++;
    else break;
  }
  return n;
}

/**
 * Count trades closed today (UTC) and average trades/active-day over the prior window.
 * Used for overtrading detection. Excludes today from the average.
 */
export function todayAndAvgTradesFromClosed(
  orders: ClosedOrder[],
  lookbackDays = 30
): { todayTrades: number; avgTradesPerDay: number | null } {
  const valid = orders.filter(
    (o): o is { closeTime: string; profit: number } =>
      o != null && typeof o.closeTime === "string" && typeof o.profit === "number"
  );
  if (valid.length === 0) return { todayTrades: 0, avgTradesPerDay: null };

  const todayStr = new Date().toISOString().slice(0, 10);
  const cutoff = Date.now() - lookbackDays * 24 * 60 * 60 * 1000;

  let todayTrades = 0;
  const dayCounts = new Map<string, number>();
  for (const o of valid) {
    const ts = new Date(o.closeTime).getTime();
    if (Number.isNaN(ts)) continue;
    const day = o.closeTime.slice(0, 10);
    if (day === todayStr) {
      todayTrades += 1;
      continue;
    }
    if (ts < cutoff) continue;
    dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
  }

  if (dayCounts.size === 0) {
    return { todayTrades, avgTradesPerDay: null };
  }
  const totalPrev = Array.from(dayCounts.values()).reduce((s, n) => s + n, 0);
  const avgTradesPerDay = totalPrev / dayCounts.size;
  return { todayTrades, avgTradesPerDay };
}

export type RawOpenPosition = {
  symbol?: string;
  volume?: number;
  openPrice?: number;
  stopLoss?: number;
  type?: string;
  /** MetaAPI `currentTickValue` on the position (account currency). */
  currentTickValue?: number;
};

export function parseOpenPositions(raw: unknown): RawOpenPosition[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (o): o is RawOpenPosition =>
      o != null && typeof o === "object" && typeof (o as RawOpenPosition).symbol === "string"
  );
}

function metaTicksForPosition(
  p: RawOpenPosition,
  tickSizeBySymbol?: Map<string, number>
): MetaTickRiskInput | null {
  const sym = String(p.symbol ?? "").trim();
  if (!sym || !tickSizeBySymbol) return null;
  const tickSize = tickSizeBySymbol.get(sym);
  const tv = p.currentTickValue;
  const tickValue = tv != null && Number.isFinite(tv) && tv > 0 ? tv : null;
  if (tickSize != null && tickSize > 0 && tickValue != null) {
    return { tickSize, tickValue };
  }
  return null;
}

export function computeCurrentExposurePct(
  rawPositions: RawOpenPosition[],
  equity: number,
  tickSizeBySymbol?: Map<string, number>
): number | null {
  if (equity <= 0) return null;
  let total = 0;
  for (const p of rawPositions) {
    const volume = Number(p.volume) || 0;
    const openPrice = Number(p.openPrice) || 0;
    const stopLoss = p.stopLoss != null ? Number(p.stopLoss) : undefined;
    if (!volume || !openPrice) continue;
    if (stopLoss != null && Number.isFinite(stopLoss) && stopLoss !== openPrice) {
      const meta = metaTicksForPosition(p, tickSizeBySymbol);
      const pct = riskPctOfEquityAtStopLoss(
        p.symbol ?? "",
        openPrice,
        stopLoss,
        volume,
        equity,
        p.type,
        meta
      );
      if (pct != null) total += pct;
    }
  }
  return total > 0 ? total : null;
}

export function maxOpenPositionRiskPct(
  positions: RawOpenPosition[],
  equity: number,
  tickSizeBySymbol?: Map<string, number>
): number | null {
  if (equity <= 0) return null;
  let maxR: number | null = null;
  for (const p of positions) {
    const volume = Number(p.volume) || 0;
    const openPrice = Number(p.openPrice) || 0;
    const stopLoss = p.stopLoss != null ? Number(p.stopLoss) : undefined;
    if (!volume || !openPrice) continue;
    if (stopLoss != null && Number.isFinite(stopLoss) && stopLoss !== openPrice) {
      const meta = metaTicksForPosition(p, tickSizeBySymbol);
      const pct = riskPctOfEquityAtStopLoss(
        p.symbol ?? "",
        openPrice,
        stopLoss,
        volume,
        equity,
        p.type,
        meta
      );
      if (pct != null) maxR = maxR == null ? pct : Math.max(maxR, pct);
    }
  }
  return maxR;
}
