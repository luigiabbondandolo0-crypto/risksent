/**
 * AI-driven What-If projection: detect patterns (revenge, high risk) from trades/stats
 * and return a scenario with projected probabilities if the user follows the recommendation.
 * No user input – all derived from data.
 */

export type AIWhatIfResult = {
  scenario: string;
  recommendation: string;
  detectedPatterns: string[];
  projectedProbFtmo2StepP1: number;
  projectedProbFtmo2StepP2: number;
  projectedProbFtmo1Step: number;
  projectedProbSimplifiedP1: number;
  projectedProbSimplifiedP2: number;
  projectedDaysToTarget: number;
  projectedBreachRiskPct: number;
};

type Trade = { profit: number };
type Stats = {
  profit_pct: number;
  trading_days: number;
  worst_daily_pct: number;
  max_drawdown_pct: number;
  daily_loss_breach: boolean;
  max_loss_breach: boolean;
};

const FTMO_P1 = { profit_target_pct: 10, daily_loss_limit_pct: 5, max_loss_pct: 10 };
const FTMO_P2 = { profit_target_pct: 5, daily_loss_limit_pct: 5, max_loss_pct: 10 };
const FTMO_1STEP = { profit_target_pct: 10, daily_loss_limit_pct: 3, max_loss_pct: 10 };
const SIMP_P1 = { profit_target_pct: 8, daily_loss_limit_pct: 4, max_loss_pct: 8 };
const SIMP_P2 = { profit_target_pct: 4, daily_loss_limit_pct: 4, max_loss_pct: 8 };

/** Count max consecutive losing trades */
function maxConsecutiveLosses(trades: Trade[]): number {
  let max = 0;
  let current = 0;
  for (const t of trades) {
    if (t.profit < 0) {
      current++;
      max = Math.max(max, current);
    } else current = 0;
  }
  return max;
}

/** Simulate "improved" stats if user reduces risk / stops revenge: better daily DD and max DD headroom */
function projectedStats(stats: Stats, patterns: string[]): Stats {
  const hasRevenge = patterns.some((p) => p.toLowerCase().includes("revenge"));
  const hasHighRisk = patterns.some((p) => p.toLowerCase().includes("risk") || p.toLowerCase().includes("drawdown"));
  let worstDaily = stats.worst_daily_pct;
  let maxDd = stats.max_drawdown_pct;
  if (hasRevenge) {
    worstDaily = Math.min(stats.worst_daily_pct + 1.5, -0.5);
    maxDd = Math.max(0, stats.max_drawdown_pct - 2);
  }
  if (hasHighRisk) {
    maxDd = Math.max(0, stats.max_drawdown_pct - 1.5);
  }
  return {
    ...stats,
    worst_daily_pct: worstDaily,
    max_drawdown_pct: maxDd,
    daily_loss_breach: false,
    max_loss_breach: false
  };
}

function projectProb(
  stats: Stats,
  rule: { profit_target_pct: number; daily_loss_limit_pct: number; max_loss_pct: number }
): number {
  const breach = stats.worst_daily_pct < -rule.daily_loss_limit_pct || stats.max_drawdown_pct > rule.max_loss_pct;
  if (breach) return 0;
  const progress = Math.min(1, stats.profit_pct / rule.profit_target_pct);
  const dailyBuffer = Math.max(0, (rule.daily_loss_limit_pct + stats.worst_daily_pct) / rule.daily_loss_limit_pct);
  const ddBuffer = Math.max(0, (rule.max_loss_pct - stats.max_drawdown_pct) / rule.max_loss_pct);
  return Math.round(progress * 40 + dailyBuffer * 30 + ddBuffer * 30);
}

export function computeAIWhatIf(stats: Stats | null, trades: Trade[]): AIWhatIfResult | null {
  if (!stats || trades.length === 0) {
    return {
      scenario: "Not enough data yet.",
      recommendation: "Close more trades to get an AI projection based on your behavior.",
      detectedPatterns: [],
      projectedProbFtmo2StepP1: 50,
      projectedProbFtmo2StepP2: 45,
      projectedProbFtmo1Step: 48,
      projectedProbSimplifiedP1: 52,
      projectedProbSimplifiedP2: 48,
      projectedDaysToTarget: 30,
      projectedBreachRiskPct: 25
    };
  }

  const consecutiveLosses = maxConsecutiveLosses(trades);
  const patterns: string[] = [];
  if (consecutiveLosses >= 3) {
    patterns.push(`Revenge trading risk: ${consecutiveLosses} consecutive losses in recent history.`);
  }
  if (stats.max_drawdown_pct > 6) {
    patterns.push("High risk per trade: max drawdown above 6%.");
  }
  if (stats.worst_daily_pct < -3) {
    patterns.push("Heavy daily loss days: close to or over a 3% daily limit in some sessions.");
  }

  const improved = projectedStats(stats, patterns);
  const scenario =
    patterns.length > 0
      ? `Based on your last ${trades.length} trades we detected: ${patterns.join(" ")}`
      : "No critical patterns detected. Your current style is within safe bounds for the rules.";
  const recommendation =
    patterns.length > 0
      ? "Reduce size after 2 consecutive losses, cap at 3 trades per day, and keep max exposure under 5%. These changes would improve your pass odds and lower breach risk."
      : "Keep current risk and discipline; consider a slight size reduction if you want to lower breach risk further.";

  return {
    scenario,
    recommendation,
    detectedPatterns: patterns,
    projectedProbFtmo2StepP1: Math.min(95, projectProb(improved, FTMO_P1) + (patterns.length > 0 ? 12 : 0)),
    projectedProbFtmo2StepP2: Math.min(90, projectProb(improved, FTMO_P2) + (patterns.length > 0 ? 10 : 0)),
    projectedProbFtmo1Step: Math.min(95, projectProb(improved, FTMO_1STEP) + (patterns.length > 0 ? 10 : 0)),
    projectedProbSimplifiedP1: Math.min(95, projectProb(improved, SIMP_P1) + (patterns.length > 0 ? 10 : 0)),
    projectedProbSimplifiedP2: Math.min(90, projectProb(improved, SIMP_P2) + (patterns.length > 0 ? 8 : 0)),
    projectedDaysToTarget: Math.max(1, stats.trading_days === 0 ? 30 : Math.round((10 - stats.profit_pct) / (stats.profit_pct / stats.trading_days + 0.2))),
    projectedBreachRiskPct: Math.max(5, patterns.length > 0 ? 15 : 25)
  };
}
