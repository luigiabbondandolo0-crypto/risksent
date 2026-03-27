import { getSanityLevel } from "../components/SanityBadge";

const CONTRACT_SIZE = 100_000;

export type TradeInsightContext = {
  consecutiveLossesBefore: number;
  riskPct: number | null;
  maxRiskPct: number;
  revengeThreshold: number;
  balance: number;
  profit: number;
  hasStopLoss: boolean;
};

/** 0–100: higher = more aligned with your risk rules (deterministic). */
export function computeTradeSanityScore(ctx: TradeInsightContext): number {
  let score = 100;
  const { riskPct, maxRiskPct, consecutiveLossesBefore, balance, profit, hasStopLoss } = ctx;

  const isRedRisk = riskPct != null && maxRiskPct > 0 && riskPct > maxRiskPct;
  const isYellowRisk =
    riskPct != null && maxRiskPct > 0 && riskPct > maxRiskPct * 0.8 && riskPct <= maxRiskPct;
  const isRedRevenge = consecutiveLossesBefore >= 3;
  const isYellowStreak = consecutiveLossesBefore === 2;

  if (isRedRisk) score -= 42;
  else if (isYellowRisk) score -= 14;

  if (isRedRevenge) score -= 38;
  else if (isYellowStreak) score -= 12;

  if (!hasStopLoss) score -= 8;

  if (riskPct != null && maxRiskPct > 0 && balance > 0 && profit > 0) {
    const riskAmount = (riskPct / 100) * balance;
    if (riskAmount > 0) {
      const rMultiple = profit / riskAmount;
      if (rMultiple < 0.5) score -= 18;
      else if (rMultiple < 1) score -= 10;
    }
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function buildTradeInsightIssues(ctx: TradeInsightContext): string[] {
  const issues: string[] = [];
  const sanity = getSanityLevel({
    consecutiveLossesBefore: ctx.consecutiveLossesBefore,
    riskPct: ctx.riskPct,
    maxRiskPct: ctx.maxRiskPct,
    revengeThreshold: ctx.revengeThreshold,
  });
  issues.push(sanity.tooltip);

  if (!ctx.hasStopLoss) {
    issues.push("No stop loss on record — risk % cannot be verified (treat as higher uncertainty).");
  }

  if (ctx.riskPct != null && ctx.balance > 0 && ctx.profit > 0) {
    const riskAmount = (ctx.riskPct / 100) * ctx.balance;
    if (riskAmount > 0) {
      const rMultiple = ctx.profit / riskAmount;
      if (rMultiple < 1) {
        issues.push(
          `Realized R vs risk at entry ≈ ${rMultiple.toFixed(2)} — below 1R; consider wider targets or smaller risk.`
        );
      }
    }
  }

  return issues.filter(Boolean);
}

export function riskPctForTrade(params: {
  stopLoss: number | null | undefined;
  lots: number;
  openPrice: number;
  equity: number;
}): number | null {
  const { stopLoss, lots, openPrice, equity } = params;
  if (
    stopLoss == null ||
    !Number.isFinite(stopLoss) ||
    lots <= 0 ||
    equity <= 0
  ) {
    return null;
  }
  const riskAmount = lots * CONTRACT_SIZE * Math.abs(openPrice - stopLoss);
  return (riskAmount / equity) * 100;
}
