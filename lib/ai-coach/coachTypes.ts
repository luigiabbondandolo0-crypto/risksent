export type CoachModel = "claude" | "gpt4";

export type ErrorType =
  | "revenge_trading"
  | "overtrading"
  | "poor_rr"
  | "size_error"
  | "tilt"
  | "fomo"
  | "early_exit"
  | "late_exit"
  | "news_trading"
  | "overexposure";

export type ErrorSeverity = "critical" | "high" | "medium" | "low";
export type AdaptationPriority = "high" | "medium" | "low";
export type TradingSession = "London" | "NY" | "Asia" | "Other";

export interface CoachError {
  type: ErrorType;
  severity: ErrorSeverity;
  description: string;
  estimated_cost_usd: number;
  trades_affected: number;
  occurrences: number;
}

export interface CoachPrediction {
  risk: string;
  probability: number;
  description: string;
  trigger: string;
}

export interface CoachInsight {
  category: string;
  title: string;
  description: string;
  recommendation: string;
  estimated_impact: string;
}

export interface CoachAdaptation {
  rule: string;
  reason: string;
  priority: AdaptationPriority;
  implementation: string;
}

export interface ChallengeResult {
  would_pass: boolean;
  pass_probability: number;
  reason: string;
  critical_issues: string[];
  estimated_days_to_fail: number | null;
}

export interface CoachReport {
  summary: string;
  emotional_score: number;
  performance_score: number;
  discipline_score: number;
  risk_consistency_score: number;
  strategy_adherence_score: number;
  errors: CoachError[];
  predictions: CoachPrediction[];
  insights: CoachInsight[];
  adaptations: CoachAdaptation[];
  challenge_simulation: {
    ftmo_phase1: ChallengeResult;
    ftmo_simplified: ChallengeResult;
  };
  best_trading_hours: string[];
  worst_trading_hours: string[];
  best_symbols: string[];
  worst_symbols: string[];
  best_session: TradingSession;
  worst_session: TradingSession;
  weekly_summary: string;
  worst_pattern: string;
  one_thing_to_fix_this_week: string;
}

export interface CoachReportRow {
  id: string;
  user_id: string;
  model: CoachModel;
  period_from: string | null;
  period_to: string | null;
  trades_analyzed: number | null;
  report: CoachReport;
  created_at: string;
}

export interface CoachMessage {
  id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  model: CoachModel;
  created_at: string;
}
