/**
 * Risk check: confronta statistiche di trading con le regole utente e produce
 * findings (avvicinamento o superamento limiti) con livello lieve/medio/alto e consiglio.
 */

export type RiskRules = {
  daily_loss_pct: number;
  max_risk_per_trade_pct: number;
  max_exposure_pct: number;
  revenge_threshold_trades: number;
};

export type StatsForRisk = {
  initialBalance: number;
  dailyStats: { date: string; profit: number }[];
  highestDdPct: number | null;
  consecutiveLossesAtEnd: number;
};

export type RiskLevel = "lieve" | "medio" | "alto";

export type RiskFinding = {
  type: "daily_loss" | "max_drawdown" | "max_risk_per_trade" | "revenge_trading";
  level: RiskLevel;
  message: string;
  advice: string;
  severity: "medium" | "high";
};

/** Open position with optional stop loss for max risk per trade check. riskPct = risk if SL hits as % of equity (caller should set). */
export type OpenPositionForRisk = {
  symbol: string;
  volume: number;
  openPrice: number;
  stopLoss?: number | null;
  type?: "buy" | "sell";
  riskPct?: number | null;
};

const APPROACH_THRESHOLD = 0.8; // consideriamo "in avvicinamento" a 80% del limite

export type RiskCheckOptions = {
  openPositions?: OpenPositionForRisk[];
  equity?: number;
  /** Current exposure as % of equity (from open positions). If set, checked against max_exposure_pct. */
  currentExposurePct?: number | null;
};

export function getRiskFindings(
  rules: RiskRules,
  stats: StatsForRisk,
  options?: RiskCheckOptions
): RiskFinding[] {
  const findings: RiskFinding[] = [];
  const { initialBalance, dailyStats, highestDdPct, consecutiveLossesAtEnd } = stats;
  const { openPositions = [], equity, currentExposurePct } = options ?? {};

  // --- Daily loss ---
  if (initialBalance > 0 && dailyStats.length > 0) {
    const worstDayPct = Math.min(
      ...dailyStats.map((d) => (d.profit / initialBalance) * 100)
    );
    const limit = rules.daily_loss_pct;
    const approachLimit = -limit * APPROACH_THRESHOLD;

    if (worstDayPct <= -limit) {
      const ratio = Math.abs(worstDayPct / limit);
      const level: RiskLevel = ratio >= 1.5 ? "alto" : ratio >= 1.1 ? "medio" : "medio";
      findings.push({
        type: "daily_loss",
        level,
        message: `Daily loss: ${worstDayPct.toFixed(2)}% (limit ${limit}%).`,
        advice: getDailyLossAdvice(level, worstDayPct, limit),
        severity: level === "alto" ? "high" : "medium"
      });
    } else if (worstDayPct < approachLimit) {
      findings.push({
        type: "daily_loss",
        level: "lieve",
        message: `Approaching daily loss limit: worst day ${worstDayPct.toFixed(2)}% (limit ${limit}%).`,
        advice: getDailyLossAdvice("lieve", worstDayPct, limit),
        severity: "medium"
      });
    }
  }

  // --- Max risk per trade (da posizioni aperte con SL) ---
  if (rules.max_risk_per_trade_pct > 0 && openPositions.length > 0) {
    const limit = rules.max_risk_per_trade_pct;
    for (const pos of openPositions) {
      const riskPct = pos.riskPct;
      if (riskPct != null && riskPct > limit) {
        const ratio = riskPct / limit;
        const level: RiskLevel = ratio >= 1.5 ? "alto" : ratio >= 1.1 ? "medio" : "medio";
        findings.push({
          type: "max_risk_per_trade",
          level,
          message: `Risk on trade ${pos.symbol}: ${riskPct.toFixed(2)}% (limit ${limit}%). Reduce stop loss or lot size.`,
          advice: "Close or downsize the position to respect max risk per trade. Check RiskSent → Rules.",
          severity: level === "alto" ? "high" : "medium"
        });
      }
    }
  }

  // --- Current exposure (from open positions) ---
  if (currentExposurePct != null && rules.max_exposure_pct > 0) {
    const limit = rules.max_exposure_pct;
    const approachLimit = limit * APPROACH_THRESHOLD;
    if (currentExposurePct >= limit) {
      const ratio = currentExposurePct / limit;
      const level: RiskLevel = ratio >= 1.5 ? "alto" : ratio >= 1.1 ? "medio" : "medio";
      findings.push({
        type: "max_drawdown",
        level,
        message: `Current exposure: ${currentExposurePct.toFixed(2)}% (limit ${limit}%).`,
        advice: getDrawdownAdvice(level, currentExposurePct, limit),
        severity: level === "alto" ? "high" : "medium"
      });
    } else if (currentExposurePct >= approachLimit) {
      findings.push({
        type: "max_drawdown",
        level: "lieve",
        message: `Exposure approaching limit: ${currentExposurePct.toFixed(2)}% (limit ${limit}%).`,
        advice: getDrawdownAdvice("lieve", currentExposurePct, limit),
        severity: "medium"
      });
    }
  }

  // --- Max drawdown (historical from curve) ---
  if (highestDdPct != null && rules.max_exposure_pct > 0) {
    const limit = rules.max_exposure_pct;
    const approachLimit = limit * APPROACH_THRESHOLD;

    if (highestDdPct >= limit) {
      const ratio = highestDdPct / limit;
      const level: RiskLevel = ratio >= 1.5 ? "alto" : ratio >= 1.1 ? "medio" : "medio";
      findings.push({
        type: "max_drawdown",
        level,
        message: `Max drawdown: ${highestDdPct.toFixed(2)}% (exposure limit ${limit}%).`,
        advice: getDrawdownAdvice(level, highestDdPct, limit),
        severity: level === "alto" ? "high" : "medium"
      });
    } else if (highestDdPct >= approachLimit) {
      findings.push({
        type: "max_drawdown",
        level: "lieve",
        message: `Drawdown approaching limit: ${highestDdPct.toFixed(2)}% (limit ${limit}%).`,
        advice: getDrawdownAdvice("lieve", highestDdPct, limit),
        severity: "medium"
      });
    }
  }

  // --- Revenge trading (consecutive losses) ---
  const threshold = rules.revenge_threshold_trades;
  if (threshold > 0 && consecutiveLossesAtEnd >= threshold) {
    const level: RiskLevel =
      consecutiveLossesAtEnd >= threshold + 2 ? "alto" : consecutiveLossesAtEnd > threshold ? "medio" : "medio";
    findings.push({
      type: "revenge_trading",
      level,
      message: `${consecutiveLossesAtEnd} consecutive losses (threshold ${threshold}). Possible revenge trading.`,
      advice: getRevengeAdvice(level, consecutiveLossesAtEnd, threshold),
      severity: level === "alto" ? "high" : "medium"
    });
  } else if (threshold > 0 && consecutiveLossesAtEnd === threshold - 1 && consecutiveLossesAtEnd > 0) {
    findings.push({
      type: "revenge_trading",
      level: "lieve",
      message: `${consecutiveLossesAtEnd} consecutive losses: one more and you reach the threshold (${threshold}).`,
      advice: getRevengeAdvice("lieve", consecutiveLossesAtEnd, threshold),
      severity: "medium"
    });
  }

  return findings;
}

function getDailyLossAdvice(level: RiskLevel, currentPct: number, limit: number): string {
  switch (level) {
    case "lieve":
      return "Reduce position size or avoid new entries until tomorrow. Check RiskSent → Rules.";
    case "medio":
      return "Daily loss limit exceeded. Stop trading for today, close any at-risk positions and review rules tomorrow.";
    case "alto":
      return "Daily loss far above limit. Do not open new trades; close at-risk positions and consider a one-day break to review strategy.";
    default:
      return "Review rules in RiskSent → Rules and adjust risk.";
  }
}

function getDrawdownAdvice(level: RiskLevel, currentPct: number, limit: number): string {
  switch (level) {
    case "lieve":
      return "Exposure is approaching the maximum. Reduce open position sizes or close part of the exposure.";
    case "medio":
      return "Exposure/drawdown limit exceeded. Reduce open positions now and do not open new trades until back under the limit.";
    case "alto":
      return "Drawdown far above limit. Reduce exposure immediately, close worst positions and suspend new entries.";
    default:
      return "Check exposure in RiskSent → Dashboard and reduce risk.";
  }
}

function getRevengeAdvice(level: RiskLevel, consecutive: number, threshold: number): string {
  switch (level) {
    case "lieve":
      return "Near revenge-trading threshold. Take at least a 30-minute break before the next trade and respect position size.";
    case "medio":
      return "Possible revenge trading: too many consecutive losses. Stop for today; do not try to recover with impulsive trades. Resume tomorrow with clear rules.";
    case "alto":
      return "Clear revenge-trading pattern. Stop trading for today and tomorrow. Review plan and rules in RiskSent → Rules before resuming.";
    default:
      return "Respect the consecutive-loss threshold set in Rules and take breaks between loss runs.";
  }
}
