import type { CoachMessage, CoachReport, CoachReportRow } from "./coachTypes";

export const MOCK_REPORT: CoachReport = {
  summary:
    "Your trading data reveals a trader with genuine edge being consistently undermined by emotional decision-making. Your London session performance is solid, but you systematically destroy gains through revenge trading after losses and FOMO continuation after winning days. The data is unambiguous: discipline is your single biggest performance drag, costing an estimated $847 over the analyzed period.",

  emotional_score: 58,
  performance_score: 72,
  discipline_score: 45,
  risk_consistency_score: 61,
  strategy_adherence_score: 67,

  errors: [
    {
      type: "revenge_trading",
      severity: "critical",
      description:
        "You placed 11 trades within 30 minutes of a significant loss, each with increased lot size (average 1.8x your normal size). This is textbook revenge trading. On 4 separate days you turned a manageable loss into a account-damaging session. The pattern is consistent: after losing >$150 on a trade, you re-enter immediately with higher size. You are not thinking — you are reacting.",
      estimated_cost_usd: 412,
      trades_affected: 11,
      occurrences: 4,
    },
    {
      type: "poor_rr",
      severity: "high",
      description:
        "Your average R:R over the last 30 trades is 1:0.87 — below breakeven. You are cutting winners early (average exit at 38% of target) while holding losers to full stop-loss. This asymmetry alone accounts for the majority of your underperformance. With your win rate of 58%, you need a minimum 1:1 R:R to be profitable. You are operating below that threshold.",
      estimated_cost_usd: 289,
      trades_affected: 18,
      occurrences: 18,
    },
    {
      type: "overtrading",
      severity: "medium",
      description:
        "On 6 days you exceeded 5 trades per session. Your win rate on trades 5+ is 27% — compared to 64% on your first 3 trades. After your third trade of the day, your performance collapses. You are chasing setups that do not meet your criteria. Your best 2-hour window is 08:00–10:00 UTC (London open). Outside that window, your edge disappears.",
      estimated_cost_usd: 146,
      trades_affected: 22,
      occurrences: 6,
    },
  ],

  predictions: [
    {
      risk: "Drawdown breach within 2 weeks",
      probability: 74,
      description:
        "Based on your revenge trading frequency and position sizing patterns, you are statistically likely to hit a 6%+ drawdown day within the next 10 trading sessions if behavior is unchanged.",
      trigger: "Two consecutive losses in the same session",
    },
    {
      risk: "Win rate regression",
      probability: 61,
      description:
        "Overtrading is degrading your entry quality. As you take more trades outside your A+ criteria, your overall win rate will continue declining from its current 58%.",
      trigger: "Continuing to trade after 3 trades per day",
    },
  ],

  insights: [
    {
      category: "Session Timing",
      title: "London open is your edge — protect it",
      description:
        "08:00–10:30 UTC is where 71% of your profitable trades occur. Your win rate in this window is 68% with an average R:R of 1.4. This is your genuine edge.",
      recommendation:
        "You must restrict trading to 07:45–11:00 UTC only. Close the platform after 11:00. No exceptions.",
      estimated_impact: "+$180–240/month estimated",
    },
    {
      category: "Position Sizing",
      title: "Lot size inconsistency destroying risk management",
      description:
        "Your lot sizes range from 0.05 to 1.2 on the same account. This inconsistency means your risk per trade varies by 24x. Risk management is impossible under these conditions.",
      recommendation:
        "Fix lot size at exactly 0.3 lots per trade (or 1% risk calculation) for the next 30 trading days. No deviations.",
      estimated_impact: "Risk-adjusted returns improve 15–25%",
    },
    {
      category: "Exit Strategy",
      title: "You are paying a premium to be wrong on exits",
      description:
        "Closing trades early is not conservative — it is expensive. You left an estimated $289 on the table by exiting before targets were hit, while simultaneously taking full losses on losing trades.",
      recommendation:
        "Set TP and let it run. If you have conviction to enter, you must have conviction to hold. Remove your hand from the mouse after entry.",
      estimated_impact: "R:R improves from 0.87 to projected 1.3+",
    },
    {
      category: "Trading Psychology",
      title: "Implement a mandatory cooling-off protocol",
      description:
        "After any loss exceeding 0.8% of account, you must wait 45 minutes before re-entering any trade. Data shows your post-loss trades have a 23% win rate — significantly below your baseline.",
      recommendation:
        "Set a timer. Leave the desk. The market will still be there. Your account may not be if you continue this pattern.",
      estimated_impact: "Estimated $410+ savings per month",
    },
  ],

  adaptations: [
    {
      rule: "Maximum 3 trades per trading day",
      reason:
        "Your performance data shows a statistically significant drop after trade #3. You have no edge on trade 4+.",
      priority: "high",
      implementation:
        "Set a hard limit in your broker platform. When trade #3 closes, log off. Write the result in your journal and close the laptop.",
    },
    {
      rule: "Mandatory 45-minute break after any loss > 0.8% account",
      reason: "Post-loss revenge trading is your single most expensive behavioral pattern.",
      priority: "high",
      implementation:
        "Use a physical timer. Step away from screens. Review the losing trade in your journal before considering any new entry.",
    },
    {
      rule: "Do not adjust TP after entry",
      reason:
        "You are consistently cutting winners short. Your original TP levels are set with analysis — trust them.",
      priority: "medium",
      implementation:
        "Once a trade is entered with SL and TP, the only allowed action is to move SL to breakeven after 1:1 is hit. No early exits.",
    },
  ],

  challenge_simulation: {
    ftmo_phase1: {
      would_pass: false,
      pass_probability: 18,
      reason:
        "Replaying your trades on a $100,000 FTMO account, you breach the 5% daily loss limit on day 7 (Wednesday) due to a revenge trading cascade after two London session losses. The account would be terminated before reaching the 10% profit target.",
      critical_issues: [
        "Daily loss limit (5%) breached on 2 of 20 trading days",
        "Revenge trading adds 3.2% additional drawdown per incident",
        "Overtrading reduces win rate below minimum viable threshold",
      ],
      estimated_days_to_fail: 7,
    },
    ftmo_simplified: {
      would_pass: false,
      pass_probability: 26,
      reason:
        "Under the simplified model (4% daily limit, 8% total DD), your behavior pattern still causes a breach on day 9. The tighter daily loss limit makes revenge trading immediately account-threatening.",
      critical_issues: [
        "4% daily loss limit insufficient buffer for current behavior",
        "Position sizing inconsistency creates unpredictable daily exposure",
        "Win rate of 58% with R:R of 0.87 is mathematically unprofitable long-term",
      ],
      estimated_days_to_fail: 9,
    },
  },

  best_trading_hours: ["08:00", "08:30", "09:00", "09:30", "10:00"],
  worst_trading_hours: ["12:00", "13:00", "19:00", "20:00", "21:00"],
  best_symbols: ["EURUSD", "XAUUSD"],
  worst_symbols: ["US30", "GBPJPY"],
  best_session: "London",
  worst_session: "NY",

  weekly_summary:
    "Week of April 7: 23 trades, WR 57%, Net P&L -$124. Key issue: Revenge trading on Tuesday cost $412 and turned a +$280 day into -$132. One thing you did well: Your first 2 London session trades each day were profitable 80% of the time. This week you must focus on: stopping after your 3rd trade, no exceptions.",

  worst_pattern: "Revenge trading after losses (4 incidents, $412 estimated cost)",
  one_thing_to_fix_this_week: "Hard stop after 3 trades per day — close the platform, log out, walk away.",
};

export const MOCK_REPORT_ROW: CoachReportRow = {
  id: "mock-report-001",
  user_id: "demo-user",
  model: "claude",
  period_from: "2025-03-11",
  period_to: "2025-04-11",
  trades_analyzed: 30,
  report: MOCK_REPORT,
  created_at: new Date().toISOString(),
};

export const MOCK_MESSAGES: CoachMessage[] = [
  {
    id: "mock-msg-1",
    user_id: "demo-user",
    role: "user",
    content: "What's my biggest weakness right now?",
    model: "claude",
    created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
  {
    id: "mock-msg-2",
    user_id: "demo-user",
    role: "assistant",
    content:
      "Your biggest weakness is unambiguously revenge trading after losses. The data shows you placed 11 trades within 30 minutes of significant losses, each time increasing your lot size by an average of 1.8x. This single pattern cost you an estimated $412 over the analyzed period.\n\nThe mechanism is predictable: you take a loss above $150, your emotional state shifts, and you immediately re-enter with higher size to 'recover'. This is not a strategy — it is a reaction. And it is destroying your account.\n\nYou must implement a hard rule: after any loss exceeding 0.8% of your account, you close the platform and wait 45 minutes. No exceptions. The trades you place in the 30 minutes after a loss have a 23% win rate. You are not thinking clearly in that window.",
    model: "claude",
    created_at: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
  },
  {
    id: "mock-msg-3",
    user_id: "demo-user",
    role: "user",
    content: "Would I pass an FTMO challenge with my current trading?",
    model: "claude",
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: "mock-msg-4",
    user_id: "demo-user",
    role: "assistant",
    content:
      "No. With your current behavior, you would fail FTMO Phase 1 with an 82% probability.\n\nReplaying your trades on a $100,000 simulated account, you breach the 5% daily loss limit on day 7 — a Wednesday — due to a revenge trading cascade following two London session losses. The account would be terminated before you even come close to the 10% profit target.\n\nThe specific issues that kill you on FTMO:\n\n1. **Daily loss limit breached on 2 of 20 trading days** — a 10% breach rate is unsustainable.\n2. **Revenge trading adds 3.2% additional drawdown per incident** — on a $100k account, that's $3,200 in a single emotional episode.\n3. **Your R:R of 0.87 means you need a win rate above 53.5% just to break even** — you are currently operating on a razor's edge.\n\nTo pass FTMO, you need to fix your daily loss discipline first. Everything else is secondary.",
    model: "claude",
    created_at: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
  },
];
