import type { SessionEquityPoint } from "./types";

/** Deterministic PRNG from string seed (Mulberry32 variant on hash). */
function seedRandom(seed: string): () => number {
  let h = 1779033703;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
}

export type SimulatedRun = {
  equity: SessionEquityPoint[];
  tradesTested: number;
  winRatePct: number;
  avgRMultiple: number;
  maxDrawdownPct: number;
  netPnlPct: number;
};

/**
 * Lightweight synthetic backtest curve for UX demo — deterministic from session id.
 */
export function simulateSessionRun(
  sessionId: string,
  initialBalance: number,
  durationMinutes: number,
  asset: string
): SimulatedRun {
  const rnd = seedRandom(`${sessionId}|${asset}|${durationMinutes}|${initialBalance}`);
  const steps = Math.min(120, Math.max(24, Math.floor(durationMinutes / 2) + 20));
  const tradesTested = Math.floor(30 + rnd() * 80 + durationMinutes / 10);
  let balance = initialBalance;
  let peak = balance;
  let maxDd = 0;
  const equity: SessionEquityPoint[] = [];

  for (let i = 0; i <= steps; i++) {
    const drift = (rnd() - 0.48) * 0.004 * initialBalance;
    const noise = (rnd() - 0.5) * 0.002 * initialBalance;
    if (i > 0) balance += drift + noise;
    if (balance > peak) peak = balance;
    const dd = peak > 0 ? ((peak - balance) / peak) * 100 : 0;
    if (dd > maxDd) maxDd = dd;
    const pct = ((balance - initialBalance) / initialBalance) * 100;
    equity.push({
      step: i,
      label: `T${i}`,
      balance,
      pct
    });
  }

  const netPnlPct = ((balance - initialBalance) / initialBalance) * 100;
  const winRatePct = Math.min(85, Math.max(35, 50 + netPnlPct * 0.8 + (rnd() - 0.5) * 15));
  const avgRMultiple = Math.min(2.5, Math.max(0.4, 1 + netPnlPct / 40 + (rnd() - 0.5) * 0.4));

  return {
    equity,
    tradesTested,
    winRatePct,
    avgRMultiple,
    maxDrawdownPct: maxDd,
    netPnlPct
  };
}
