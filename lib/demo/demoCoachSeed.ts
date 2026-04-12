import type {
  CoachMessage,
  CoachReport,
  CoachReportRow,
} from "@/lib/ai-coach/coachTypes";
import { MOCK_AI_MESSAGES, MOCK_AI_REPORT } from "@/lib/demo/mockData";

export function buildDemoCoachReportRow(): CoachReportRow {
  const report: CoachReport = {
    summary: MOCK_AI_REPORT.summary,
    emotional_score: 71,
    performance_score: 76,
    discipline_score: 68,
    risk_consistency_score: 82,
    strategy_adherence_score: 74,
    errors: [
      {
        type: "revenge_trading",
        severity: "medium",
        description:
          "Two losses on Friday within 30 minutes — pattern consistent with revenge-style entries.",
        estimated_cost_usd: 240,
        trades_affected: 6,
        occurrences: 3,
      },
      {
        type: "overtrading",
        severity: "low",
        description: "New positions opened after 15:00 London on 4 sessions — outside your stated window.",
        estimated_cost_usd: 120,
        trades_affected: 4,
        occurrences: 4,
      },
    ],
    predictions: [
      {
        risk: "Friday drawdown cluster",
        probability: 0.42,
        description: "Historical Friday win rate is 38% vs 74% Tue–Thu.",
        trigger: "Opening a trade on Friday after a same-day loss",
      },
    ],
    insights: MOCK_AI_REPORT.insights.map((text, i) => ({
      category: i === 0 ? "Risk" : i === 1 ? "Edge" : i === 2 ? "Watch" : "Action",
      title: `Insight ${i + 1}`,
      description: text,
      recommendation: "Track this in your journal for two weeks.",
      estimated_impact: "Medium",
    })),
    adaptations: [
      {
        rule: "No new trades after 15:00 London",
        reason: "80% of losing trades cluster in this window.",
        priority: "high",
        implementation: "Set a phone alarm and close the platform at cutoff.",
      },
    ],
    challenge_simulation: {
      ftmo_phase1: {
        would_pass: false,
        pass_probability: 0.58,
        reason: "Friday inconsistency and max DD buffer are slightly tight for typical prop rules.",
        critical_issues: ["Friday win rate", "Afternoon overtrading"],
        estimated_days_to_fail: 18,
      },
      ftmo_simplified: {
        would_pass: true,
        pass_probability: 0.72,
        reason: "Core risk metrics are solid; fixing Friday behaviour would lift pass odds materially.",
        critical_issues: [],
        estimated_days_to_fail: null,
      },
    },
    best_trading_hours: ["08:00–11:00", "13:00–15:00"],
    worst_trading_hours: ["15:30–18:00"],
    best_symbols: ["EURUSD", "XAUUSD"],
    worst_symbols: ["GBPUSD"],
    best_session: "London",
    worst_session: "NY",
    weekly_summary:
      "Strong core metrics with clear session-based edge. Tighten Friday and post-loss discipline to unlock the next tier of consistency.",
    worst_pattern: "Re-entries within 30 minutes of a stop-out on Fridays.",
    one_thing_to_fix_this_week: "Hard stop: no new trades after 15:00 London until stats improve.",
  };

  return {
    id: "demo-coach-report",
    user_id: "demo-user",
    model: "claude",
    period_from: "2026-03-01",
    period_to: "2026-04-12",
    trades_analyzed: 94,
    report,
    created_at: new Date().toISOString(),
  };
}

export function buildDemoCoachMessages(): CoachMessage[] {
  const base = new Date("2026-04-12T10:00:00.000Z").getTime();
  return MOCK_AI_MESSAGES.map((m, i) => ({
    id: `demo-msg-${i}`,
    user_id: "demo-user",
    role: m.role,
    content: m.content,
    model: "claude",
    created_at: new Date(base + i * 120_000).toISOString(),
  }));
}
