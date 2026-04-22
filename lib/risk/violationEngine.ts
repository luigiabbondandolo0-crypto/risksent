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
        rule_type: "revenge_trading",
        value_at_violation: consec,
        limit_value: thr,
        message: `${consec} consecutive losses reached threshold ${thr}. Possible revenge trading.`,
        severity: "danger"
      });
    } else if (thr > 1 && consec >= thr - 1) {
      out.push({
        rule_type: "revenge_trading",
        value_at_violation: consec,
        limit_value: thr,
        message: `${consec} consecutive losses approaching threshold ${thr}.`,
        severity: "watch"
      });
    }
  }

  // --- Consecutive losses (softer signal, independent of user's revenge threshold) ---
  // Emitted only when BELOW the revenge threshold to avoid double-counting with revenge_trading.
  const CONSEC_WATCH = 3;
  const CONSEC_DANGER = 5;
  if (consec >= CONSEC_WATCH && (thr <= 0 || consec < thr)) {
    const severity = consec >= CONSEC_DANGER ? "danger" : "watch";
    out.push({
      rule_type: "consecutive_losses",
      value_at_violation: consec,
      limit_value: CONSEC_WATCH,
      message:
        severity === "danger"
          ? `${consec} consecutive losses reached — take a break before the next trade.`
          : `${consec} consecutive losses — consider slowing down.`,
      severity
    });
  }

  // --- Overtrading (today's trades vs recent average) ---
  const todayTrades = live.todayTrades ?? null;
  const avgTrades = live.avgTradesPerDay ?? null;
  if (todayTrades != null && todayTrades >= 5) {
    const baseline = avgTrades != null && avgTrades > 0 ? avgTrades : null;
    const ratio = baseline != null ? todayTrades / baseline : null;
    const isDanger = ratio != null ? ratio >= 2 : todayTrades >= 15;
    const isWatch = ratio != null ? ratio >= 1.5 : todayTrades >= 10;
    if (isDanger || isWatch) {
      const severity = isDanger ? "danger" : "watch";
      const limitValue = baseline != null ? baseline : 5;
      const baselineLabel = baseline != null ? `avg ${baseline.toFixed(1)}/day` : "no baseline";
      out.push({
        rule_type: "overtrading",
        value_at_violation: todayTrades,
        limit_value: limitValue,
        message:
          severity === "danger"
            ? `Overtrading: ${todayTrades} trades today exceed usual pace (${baselineLabel}).`
            : `Trade pace today (${todayTrades}) above usual (${baselineLabel}).`,
        severity
      });
    }
  }

  return out;
}

export type NotifySettingsLike = {
  notify_daily_dd?: boolean | null;
  notify_max_dd?: boolean | null;
  notify_position_size?: boolean | null;
  notify_consecutive_losses?: boolean | null;
  notify_weekly_loss?: boolean | null;
  notify_overtrading?: boolean | null;
  notify_revenge?: boolean | null;
  /** @deprecated legacy — merged into notify_position_size */
  notify_exposure?: boolean | null;
  /** @deprecated legacy — merged into notify_position_size */
  notify_risk_per_trade?: boolean | null;
};

/** Match `/api/risk/notifications` `shape()`: never spread-merge DB rows; use `x !== false` and legacy position-size fallbacks. */
export function effectiveNotifySettings(row: NotifySettingsLike | null | undefined): NotifySettingsLike {
  const r = row ?? {};
  const positionSizeOn =
    r.notify_position_size != null
      ? r.notify_position_size !== false
      : (r.notify_risk_per_trade !== false) && (r.notify_exposure !== false);
  return {
    notify_daily_dd: r.notify_daily_dd !== false,
    notify_max_dd: r.notify_max_dd !== false,
    notify_position_size: positionSizeOn,
    notify_consecutive_losses: r.notify_consecutive_losses !== false,
    notify_weekly_loss: r.notify_weekly_loss !== false,
    notify_overtrading: r.notify_overtrading !== false,
    notify_revenge: r.notify_revenge !== false,
    notify_exposure: r.notify_exposure !== false,
    notify_risk_per_trade: r.notify_risk_per_trade !== false
  };
}

/**
 * Decide whether a rule type should surface an alert for the current user.
 *
 * Accepts every alias the system produces (engine rule_type, legacy finding type,
 * Telegram alertType) so callers don't have to normalise.
 */
export function notifyFlagForRule(ruleType: string, settings: NotifySettingsLike): boolean {
  const t = ruleType.toLowerCase();

  // `effectiveNotifySettings` already merged `notify_position_size` with legacy flags.
  const positionSize = settings.notify_position_size !== false;

  switch (t) {
    case "daily_dd":
    case "daily_drawdown":
    case "daily_loss":
      return settings.notify_daily_dd !== false;

    case "max_dd":
    case "max_drawdown":
      return settings.notify_max_dd !== false;

    case "risk_per_trade":
    case "position_size":
    case "exposure":
    case "current_exposure":
    case "max_risk_per_trade":
      return positionSize !== false;

    case "consecutive_losses":
      return settings.notify_consecutive_losses !== false;

    case "weekly_loss":
    case "weekly_dd":
    case "weekly_drawdown":
      return settings.notify_weekly_loss !== false;

    case "overtrading":
      return settings.notify_overtrading !== false;

    case "revenge":
    case "revenge_trading":
      return settings.notify_revenge !== false;

    default:
      return true;
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
    case "revenge_trading":
    case "consecutive_losses":
    case "overtrading":
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
    case "revenge_trading":
    case "consecutive_losses":
      return String(Math.round(limit));
    case "overtrading":
      return `~${limit.toFixed(1)}/day`;
    default:
      return String(limit);
  }
}
