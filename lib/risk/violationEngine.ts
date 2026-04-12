import type { RiskGaugeStatus, RiskRuleType, RiskRulesDTO, RiskViolationCandidate, LiveStatsForRisk } from "./riskTypes";

const WATCH_RATIO = 0.75;

export function gaugeStatusFromRatio(ratio: number): RiskGaugeStatus {
  if (ratio >= 1) return "danger";
  if (ratio >= WATCH_RATIO) return "watch";
  return "safe";
}

/** Daily DD: loss is negative; limit is positive (e.g. 5 means max 5% loss). */
export function dailyDdRatio(dailyDdPct: number | null, limitPct: number): number {
  if (limitPct <= 0 || dailyDdPct == null) return 0;
  if (dailyDdPct >= 0) return 0;
  return Math.abs(dailyDdPct) / limitPct;
}

export function exposureRatio(exposurePct: number | null, limitPct: number): number {
  if (limitPct <= 0 || exposurePct == null || exposurePct <= 0) return 0;
  return exposurePct / limitPct;
}

export function riskPerTradeRatio(maxOpenRiskPct: number | null, limitPct: number): number {
  if (limitPct <= 0 || maxOpenRiskPct == null || maxOpenRiskPct <= 0) return 0;
  return maxOpenRiskPct / limitPct;
}

/** Consecutive losses at end vs threshold (integer). */
export function revengeRatio(consecutive: number, threshold: number): number {
  if (threshold <= 0) return 0;
  return consecutive / threshold;
}

export function buildViolationCandidates(rules: RiskRulesDTO, live: LiveStatsForRisk): RiskViolationCandidate[] {
  const out: RiskViolationCandidate[] = [];

  const ddR = dailyDdRatio(live.dailyDdPct, rules.daily_loss_pct);
  if (ddR >= WATCH_RATIO && rules.daily_loss_pct > 0) {
    const val = live.dailyDdPct ?? 0;
    out.push({
      rule_type: "daily_dd",
      value_at_violation: val,
      limit_value: rules.daily_loss_pct,
      message:
        ddR >= 1
          ? `Daily drawdown ${val.toFixed(2)}% exceeds limit −${rules.daily_loss_pct}%.`
          : `Daily drawdown ${val.toFixed(2)}% is approaching −${rules.daily_loss_pct}% limit.`,
      severity: ddR >= 1 ? "danger" : "watch"
    });
  }

  const exR = exposureRatio(live.currentExposurePct, rules.max_exposure_pct);
  if (exR >= WATCH_RATIO && rules.max_exposure_pct > 0 && live.currentExposurePct != null) {
    out.push({
      rule_type: "exposure",
      value_at_violation: live.currentExposurePct,
      limit_value: rules.max_exposure_pct,
      message:
        exR >= 1
          ? `Open exposure ${live.currentExposurePct.toFixed(2)}% exceeds limit ${rules.max_exposure_pct}%.`
          : `Open exposure ${live.currentExposurePct.toFixed(2)}% is approaching ${rules.max_exposure_pct}% limit.`,
      severity: exR >= 1 ? "danger" : "watch"
    });
  }

  const rtR = riskPerTradeRatio(live.maxOpenRiskPct, rules.max_risk_per_trade_pct);
  if (rtR >= WATCH_RATIO && rules.max_risk_per_trade_pct > 0 && live.maxOpenRiskPct != null) {
    out.push({
      rule_type: "risk_per_trade",
      value_at_violation: live.maxOpenRiskPct,
      limit_value: rules.max_risk_per_trade_pct,
      message:
        rtR >= 1
          ? `Largest open risk ${live.maxOpenRiskPct.toFixed(2)}% exceeds per-trade limit ${rules.max_risk_per_trade_pct}%.`
          : `Largest open risk ${live.maxOpenRiskPct.toFixed(2)}% is approaching ${rules.max_risk_per_trade_pct}% limit.`,
      severity: rtR >= 1 ? "danger" : "watch"
    });
  }

  const thr = rules.revenge_threshold_trades;
  const consec = live.consecutiveLossesAtEnd;
  if (thr > 0 && consec > 0) {
    if (consec >= thr) {
      out.push({
        rule_type: "revenge",
        value_at_violation: consec,
        limit_value: thr,
        message: `${consec} consecutive losses reached threshold ${thr}.`,
        severity: "danger"
      });
    } else if (thr > 1 && consec >= thr - 1) {
      out.push({
        rule_type: "revenge",
        value_at_violation: consec,
        limit_value: thr,
        message: `${consec} consecutive losses approaching threshold ${thr}.`,
        severity: "watch"
      });
    }
  }

  return out;
}

export function notifyFlagForRule(
  ruleType: RiskRuleType,
  settings: {
    notify_daily_dd: boolean;
    notify_exposure: boolean;
    notify_revenge: boolean;
    notify_risk_per_trade: boolean;
  }
): boolean {
  switch (ruleType) {
    case "daily_dd":
      return settings.notify_daily_dd;
    case "exposure":
      return settings.notify_exposure;
    case "revenge":
      return settings.notify_revenge;
    case "risk_per_trade":
      return settings.notify_risk_per_trade;
    default:
      return false;
  }
}

export function formatValueForTelegram(ruleType: RiskRuleType, value: number): string {
  switch (ruleType) {
    case "daily_dd":
      return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
    case "exposure":
    case "risk_per_trade":
      return `${value.toFixed(1)}%`;
    case "revenge":
      return String(Math.round(value));
    default:
      return String(value);
  }
}

export function formatLimitForTelegram(ruleType: RiskRuleType, limit: number): string {
  switch (ruleType) {
    case "daily_dd":
      return `−${limit.toFixed(1)}%`;
    case "exposure":
    case "risk_per_trade":
      return `${limit.toFixed(1)}%`;
    case "revenge":
      return String(Math.round(limit));
    default:
      return String(limit);
  }
}
