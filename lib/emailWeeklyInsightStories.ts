/**
 * Pre-written weekly insight stories.
 * Cycled by week number: stories[weeksSinceEpoch % stories.length]
 * Add new stories freely — the cron picks the next one automatically.
 */

import {
  emailCtaButton,
  emailCtaSubLink,
  emailDocumentFooter,
  emailDocumentOpen,
  emailSiteBase,
} from "./emailBrandHtml";

interface Story {
  traderName: string;
  headline: string;
  preheader: string;
  problem: string;
  turning: string;
  application: string;
  result: string;
  metric: string;
  tip: string;
  tipCtaLabel: string;
  tipCtaPath: string;
}

export const WEEKLY_INSIGHT_STORIES: Story[] = [
  // ── Story 1: The Daily Loss Limit Saver ────────────────────────────────────
  {
    traderName: "Luca B.",
    headline: "He blew 3 accounts in 18 months. The fourth is still alive — 14 months later.",
    preheader: "One rule. One alert. The difference between a career and a blown account.",
    problem:
      "Luca had been trading forex for two years. He was technically skilled — his entries were solid, his setups well-reasoned. But he kept blowing accounts. Not slowly. In bursts. A bad morning would turn into a revenge-trading spiral. Before he could stop himself, he had given back three weeks of profits in a single session.\n\nHe knew the daily loss limit rule. Every trading coach talks about it. He had even written it down. But in the heat of a losing session, with positions open and ego bruised, the rule became noise.",
    turning:
      "His fourth funded account came with a condition he set for himself: no manual discipline. He connected it to RiskSent and set a hard 2% daily loss limit. Not a reminder. Not a journal entry. An automated rule that would fire an alert the moment he crossed the line.\n\nThe first test came three days later. A bad gap open put him down 1.4% before the London session even started. He added to the losing position — old habit. At 2.1%, the Telegram alert fired.",
    application:
      "He closed everything. Not because he wanted to. Because the alert made the cost of continuing concrete and immediate. He stepped away, had coffee, came back in the afternoon with a clear head. The session ended flat for the day. That was the turning point.\n\nOver the following months, the alert fired 11 more times. He respected it every time. Not out of discipline — out of habit formed by repetition. The rule did the disciplining. He just had to follow it.",
    result:
      "Fourteen months later, the fourth account is his largest ever. He upgraded to the Experienced plan and added two more accounts to RiskSent. His maximum single-day loss in the last year: 1.9%. His average losing month: –1.3%.",
    metric: "Max drawdown: –23% (account 3) → –6.4% (account 4, 14 months)",
    tip: "Set your daily loss limit at 1.5–2% of your account. Not 5%, not 3%. Tight enough to preserve the account on a genuinely bad day, loose enough not to fire on normal session variance. Then treat the alert as a hard stop — not a suggestion.",
    tipCtaLabel: "Set my daily loss limit",
    tipCtaPath: "/app/risk-manager",
  },
  // ── Story 2: The Prop Firm Challenge Breakthrough ──────────────────────────
  {
    traderName: "Marco T.",
    headline: "Two failed FTMO challenges and €600 in fees. The third attempt: passed in 19 days.",
    preheader: "He wasn't trading badly. He was trading without understanding the rules of the game.",
    problem:
      "Marco had been trading profitably for three years. Not explosively — consistently. He averaged around 4-5% per month on his personal account, low drawdown, good risk management. Then he decided to scale with a prop firm.\n\nHe failed his first FTMO evaluation on day 11. He hit the 5% daily loss limit on a volatile NFP Friday. He thought he had managed the session well — until he realized the daily limit resets at midnight server time, not when your trading day starts. The rules were different from what he assumed.\n\nHe paid for a second attempt. Failed again on day 14 — this time by accumulating 9.8% drawdown over two weeks, just below the 10% max. He had been mentally tracking his drawdown but made a calculation error.",
    turning:
      "Before his third attempt, he rebuilt everything around RiskSent. He set up his account with FTMO-compatible rules: 5% daily loss, 10% max drawdown, 10% profit target. He ran the simulator against three months of his own historical trades first, using his actual strategy on real data.\n\nThe simulator flagged a problem immediately: his Friday sessions had 3× the variance of any other day. His average win on Fridays was higher — but so was his average loss. The daily limit was almost always at risk on Fridays.",
    application:
      "He set an additional rule in RiskSent: a 2% Friday-only alert that fired as a warning before the hard 5% limit. Not a block — just a flag to slow down and assess.\n\nOn the third attempt, the Friday alert fired twice. Both times he stepped back, waited, and let the session close without adding new positions. He also caught himself approaching the max drawdown limit mid-challenge — the dashboard showed him the cumulative number clearly, unlike the broker platform where he had to calculate it manually.",
    result:
      "Passed the evaluation in 19 days. Now trading a €200,000 funded account. He still runs his personal account in parallel with the same risk rules — the discipline carried over.",
    metric: "Evaluation attempts before passing: 3 → 1 (with simulator pre-check)",
    tip: "Before paying for any prop firm challenge, run your last 3 months of trades through the simulator with that firm's exact rules. You'll find where your strategy breaks the rules — usually on specific days or sessions — before it costs you a fee.",
    tipCtaLabel: "Run a backtest",
    tipCtaPath: "/app/backtesting",
  },
  // ── Story 3: The Hidden Pattern ────────────────────────────────────────────
  {
    traderName: "Sara M.",
    headline: "She was profitable. Her AI Coach told her she was also leaving 40% on the table.",
    preheader: "When you're winning, you stop asking questions. That's when the patterns hide.",
    problem:
      "Sara had been profitable for two consecutive years. Not dramatically — around 7-8% annually net of fees, with a Sharpe ratio she was proud of. She had refined her system over time and had no obvious edge leaking.\n\nThe problem with being profitable is that you stop examining your losing trades carefully. Losses felt like random noise — outliers in an otherwise good system. She had never done a systematic analysis of when and why she lost, because the aggregate numbers looked fine.",
    turning:
      "She started logging trades in RiskSent's journal after a friend recommended it. After eight weeks and 240 logged trades, she asked AI Coach a simple question: \"Is there a pattern in my losing trades?\"\n\nThe response came back with something she had never noticed. 71% of her losing trades — by both frequency and P&L impact — were taken in the first 30 minutes after the London-New York overlap. Her winning trades were clustered outside that window. She had no rule about session timing.",
    application:
      "She set a risk rule in RiskSent: position size capped at 25% of normal during the overlap window. Not a prohibition — a friction point that forced her to think twice before entering.\n\nShe also asked AI Coach a follow-up: \"What is different about my entries during that window versus other times?\" The answer was specific: her risk-to-reward ratio during the overlap averaged 1.1:1 versus 2.3:1 the rest of the day. She was taking worse setups without realizing it, possibly because the price action felt more active and she was confusing volatility with opportunity.",
    result:
      "12 months after applying the overlap restriction, her win rate stayed flat but her profit factor improved from 1.4 to 2.1. Same number of trades, significantly better results. The losing trades she eliminated were the ones she hadn't noticed were systematically bad.",
    metric: "Profit factor: 1.4 → 2.1 (same strategy, one rule change)",
    tip: "Ask AI Coach \"where do I lose the most?\" and then follow up with \"what is different about those trades?\" You are looking for a systematic pattern — time of day, day of week, instrument, position size. One rule change targeting a consistent pattern is worth months of strategy optimization.",
    tipCtaLabel: "Ask AI Coach",
    tipCtaPath: "/app/ai-coach",
  },
  // ── Story 4: The Journal Habit ─────────────────────────────────────────────
  {
    traderName: "James K.",
    headline: "He added one 15-minute habit to his routine. His drawdown dropped by half.",
    preheader: "Journaling is not bookkeeping. It's the feedback loop that makes every mistake pay.",
    problem:
      "James had been trading part-time for four years alongside a full-time job. He was experienced enough to know what he was doing wrong — overtrading, sizing up after wins, revenge trading after losses. He had read about all of it. He had journaled for a few weeks at different points. It had never stuck.\n\nThe problem was friction. His previous journal was a spreadsheet he had to fill in manually, which he inevitably stopped updating after a week. Without data, there was nothing to review. Without review, mistakes repeated without consequence.",
    turning:
      "When he connected his MT4 account to RiskSent, trades appeared in the journal automatically. Entry, exit, size, P&L, duration — all there without him lifting a finger. For the first time, he had a complete record of everything he had traded over 60 days.\n\nHe spent 15 minutes on Sunday evening reviewing the week. He filtered trades by tag — he had started tagging entries as \"planned\", \"impulsive\", or \"revenge\". The numbers were immediate and uncomfortable. Planned trades: 63% win rate, 2.4 average R. Impulsive trades: 31% win rate, 0.7 average R. Revenge trades: 18% win rate, negative R.",
    application:
      "He did not change his strategy. He changed his process. He added a risk rule to RiskSent: after two consecutive losing trades in a session, an alert fired telling him to wait 30 minutes before taking another position. Not a hard block — a forced pause.\n\nHe tagged every trade for three more months. The impulsive and revenge categories gradually shrank. Not because he became more disciplined in an abstract sense — because the data made the cost visible and specific every Sunday. Bad behavior had a number attached to it.",
    result:
      "After six months of weekly reviews, his impulsive trade count dropped by 70%. His drawdown in the worst month of the period: –4.1%. His best previous drawdown in a bad month: –11.7%. He describes the journal review as \"the only edge improvement that has actually stuck.\"",
    metric: "Monthly max drawdown: –11.7% → –4.1% (6-month comparison)",
    tip: "Tag every trade with at least one label: planned, impulsive, or revenge. Review weekly — 15 minutes is enough. You are looking for the win rate and R-multiple by tag. The category where you lose the most is the behavior that needs a rule. Not more willpower. A rule.",
    tipCtaLabel: "Open my journal",
    tipCtaPath: "/app/journaling",
  },
];

export function getWeeklyInsightIssueNumber(): number {
  // Stable week number based on a fixed epoch (2026-01-05 = Monday)
  const EPOCH = new Date("2026-01-05T00:00:00Z").getTime();
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  return Math.max(1, Math.floor((Date.now() - EPOCH) / WEEK_MS) + 1);
}

export function getStoryForWeek(weekNumber: number): Story {
  return WEEKLY_INSIGHT_STORIES[(weekNumber - 1) % WEEKLY_INSIGHT_STORIES.length]!;
}

function escapeH(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function getWeeklyInsightHtml(
  displayName: string,
  issueNumber: number,
  story: Story
): string {
  const base = emailSiteBase();
  const ctaUrl = `${base}${story.tipCtaPath}`;

  const bodySection = (label: string, text: string, accentColor: string) => {
    const paragraphs = text
      .split("\n\n")
      .map(
        (p) =>
          `<p style="margin:0 0 14px; font-size:15px; color:#cbd5e1; line-height:1.75;">${escapeH(p)}</p>`
      )
      .join("");
    return `
    <div style="margin:0 0 20px;">
      <p style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.12em; color:${accentColor}; margin:0 0 10px;">${escapeH(label)}</p>
      ${paragraphs}
    </div>`;
  };

  const main = `
      <div class="body-pad">
        <div class="hero-section">
          <span class="badge">Weekly Insight · Issue #${issueNumber}</span>
          <h1 class="h1" style="margin-top:16px; font-size:22px;">${escapeH(story.headline)}</h1>
          <p style="margin:8px 0 0; font-size:14px; color:#64748b;">The story of ${escapeH(story.traderName)}</p>
        </div>

        <p style="font-size:14px; color:#94a3b8; margin:4px 0 24px;">Hi ${escapeH(displayName)},</p>

        ${bodySection("The problem", story.problem, "#f87171")}

        <div style="height:1px; background:rgba(255,255,255,0.06); margin:4px 0 20px;"></div>

        ${bodySection("The turning point", story.turning, "#fbbf24")}

        <div style="height:1px; background:rgba(255,255,255,0.06); margin:4px 0 20px;"></div>

        ${bodySection("How RiskSent was applied", story.application, "#a5b4fc")}

        <div style="height:1px; background:rgba(255,255,255,0.06); margin:4px 0 20px;"></div>

        ${bodySection("The result", story.result, "#4ade80")}

        <div style="background:linear-gradient(128deg,rgba(99,102,241,0.08) 0%,#0a0a12 100%); border-radius:12px; padding:20px; border:1px solid rgba(99,102,241,0.2); margin:20px 0;">
          <p style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.12em; color:#64748b; margin:0 0 8px;">Key result</p>
          <p style="font-family:'JetBrains Mono',monospace; font-size:17px; font-weight:800; color:#a5b4fc; margin:0 0 18px;">${escapeH(story.metric)}</p>
          <p style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.12em; color:#64748b; margin:0 0 8px;">This week's actionable tip</p>
          <p style="font-size:15px; color:#cbd5e1; margin:0;">${escapeH(story.tip)}</p>
        </div>

        <div style="text-align:center; margin:24px 0 8px;">${emailCtaButton(ctaUrl, story.tipCtaLabel)}</div>
        <p style="text-align:center; margin:0;">${emailCtaSubLink(`${base}/app/dashboard`, "Back to dashboard →")}</p>

        <p style="font-size:12px; color:#64748b; text-align:center; margin:20px 0 0;">
          Questions? <a href="mailto:support@risksent.com" style="color:#818cf8; text-decoration:none; font-weight:600;">support@risksent.com</a>
        </p>
      </div>`;

  return (
    emailDocumentOpen({
      documentTitle: `Weekly Insight #${issueNumber} — ${story.traderName}'s story`,
      preheader: story.preheader,
      subhead: `Weekly Insight · Every Monday`,
    }) +
    main +
    emailDocumentFooter(
      `You receive this every Monday as a RiskSent subscriber.`,
      `<a href="${base}/app/profile" style="color:#818cf8;text-decoration:none;">Manage email preferences</a>`
    )
  );
}
