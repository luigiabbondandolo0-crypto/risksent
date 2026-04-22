export type RiskRuleType =
  | "daily_dd"
  | "exposure"
  | "revenge"
  | "risk_per_trade"
  | "consecutive_losses"
  | "overtrading"
  | "revenge_trading";

export type RiskRulesDTO = {
  daily_loss_pct: number;
  max_risk_per_trade_pct: number;
  max_exposure_pct: number;
  revenge_threshold_trades: number;
};

export type RiskNotificationsRow = {
  id: string;
  user_id: string;
  telegram_chat_id: string | null;
  telegram_enabled: boolean;
  notify_daily_dd: boolean;
  notify_max_dd: boolean;
  notify_position_size: boolean;
  notify_consecutive_losses: boolean;
  notify_weekly_loss: boolean;
  notify_overtrading: boolean;
  notify_revenge: boolean;
  /** @deprecated kept for backward compat — merged into notify_position_size */
  notify_exposure: boolean;
  /** @deprecated kept for backward compat — merged into notify_position_size */
  notify_risk_per_trade: boolean;
  created_at: string;
  updated_at: string;
};

export type RiskViolationRow = {
  id: string;
  user_id: string;
  rule_type: string;
  value_at_violation: number;
  limit_value: number;
  message: string;
  notified_telegram: boolean;
  created_at: string;
};

export type RiskViolationCandidate = {
  rule_type: RiskRuleType;
  value_at_violation: number;
  limit_value: number;
  message: string;
  /** watch = approach threshold; danger = at or past limit */
  severity: "watch" | "danger";
};

export type RiskGaugeStatus = "safe" | "watch" | "danger";

export type LiveStatsForRisk = {
  dailyDdPct: number | null;
  currentExposurePct: number | null;
  maxOpenRiskPct: number | null;
  consecutiveLossesAtEnd: number;
  /** Trades closed today (UTC). Optional: if omitted, overtrading check is skipped. */
  todayTrades?: number | null;
  /** Average trades per active day over the prior window (excluding today). Optional. */
  avgTradesPerDay?: number | null;
};
