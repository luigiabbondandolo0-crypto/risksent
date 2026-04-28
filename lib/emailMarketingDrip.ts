/**
 * Marketing drip sequence — one email per feature, one per day from D+1 registration.
 * 12 steps total. Each covers a distinct RiskSent feature/page.
 */

import {
  emailCtaButton,
  emailCtaSubLink,
  emailDocumentFooter,
  emailDocumentOpen,
  emailSiteBase,
} from "./emailBrandHtml";

export const MARKETING_DRIP_TOTAL_STEPS = 12;

interface DripStep {
  subject: string;
  preheader: string;
  badge: string;
  badgeColor: string;
  headline: string;
  subheadline: string;
  body: string;
  bullets: string[];
  ctaLabel: string;
  ctaPath: string;
  secondaryLabel?: string;
  secondaryPath?: string;
}

const STEPS: DripStep[] = [
  // ── Step 1: Dashboard ──────────────────────────────────────────────────────
  {
    subject: "Your risk command center is ready",
    preheader: "One screen. Every number that matters. Always live.",
    badge: "Feature spotlight",
    badgeColor: "#a5b4fc",
    headline: "Everything you need to trade safely — in one screen",
    subheadline: "The Dashboard is your real-time risk overview",
    body: "Most traders manage risk in their head — or not at all. The RiskSent Dashboard shows you live account health, current drawdown exposure, and open position risk the moment you open it.\n\nNo spreadsheets. No manual tracking. Just the numbers that tell you whether today is a day to trade hard or step back.",
    bullets: [
      "Live drawdown gauge — see exactly where you stand vs. your limits",
      "Account health score — combines multiple risk factors into one signal",
      "Open trade exposure — know your real risk before adding another position",
    ],
    ctaLabel: "Open my dashboard",
    ctaPath: "/app/dashboard",
  },
  // ── Step 2: Risk Rules ─────────────────────────────────────────────────────
  {
    subject: "The rules that protect traders from themselves",
    preheader: "Set limits once. RiskSent enforces them automatically.",
    badge: "Feature spotlight",
    badgeColor: "#a5b4fc",
    headline: "Stop breaking your own rules — automate them",
    subheadline: "Risk Manager: define, automate, enforce",
    body: "Every experienced trader has a story about the rule they broke — once. Daily loss limit, max drawdown, position size cap. They knew the rule. They broke it anyway because emotions are loud and logic is quiet.\n\nRisk rules in RiskSent fire before the damage is done. Define your limits. The platform watches every tick. You get an alert — or a hard stop — the moment a threshold is crossed.",
    bullets: [
      "Daily loss, max drawdown, consecutive losses, overtrading — all supported",
      "Telegram alert fires instantly when a rule is breached",
      "Multiple accounts: different rules per account if needed",
    ],
    ctaLabel: "Set my first rule",
    ctaPath: "/app/risk-manager",
  },
  // ── Step 3: Telegram Alerts ────────────────────────────────────────────────
  {
    subject: "Get alerted before the damage is done",
    preheader: "Instant Telegram notifications when a risk rule fires.",
    badge: "Feature spotlight",
    badgeColor: "#22d3ee",
    headline: "Real-time alerts — straight to your phone",
    subheadline: "Connect Telegram in under 60 seconds",
    body: "A rule that fires silently is no rule at all. RiskSent sends you an instant Telegram message the moment a limit is breached — whether you're at your desk, on a run, or asleep.\n\nNo apps to install beyond Telegram. No polling. No delays. The message arrives within seconds of the breach.",
    bullets: [
      "Works with any device — Telegram is everywhere",
      "Rich alert messages: account name, rule type, current vs. limit values",
      "Test the connection with one click from the Risk Manager",
    ],
    ctaLabel: "Connect Telegram",
    ctaPath: "/app/risk-manager",
  },
  // ── Step 4: Backtesting ────────────────────────────────────────────────────
  {
    subject: "Find out if your strategy actually works — without risking a cent",
    preheader: "Replay real historical data and measure your edge.",
    badge: "Feature spotlight",
    badgeColor: "#a5b4fc",
    headline: "Test your strategy on real history — no capital at risk",
    subheadline: "Backtesting: know your edge before you put money on it",
    body: "A strategy that feels right in a live market is not necessarily profitable. Feelings lie. Historical data does not.\n\nRiskSent's backtesting engine pulls real OHLCV data so you can measure your strategy's actual win rate, average R-multiple, and maximum adverse excursion across hundreds of trades — before you risk a single dollar.",
    bullets: [
      "Real market data — not synthetic, not approximated",
      "Automated metrics: win rate, profit factor, max drawdown, Sharpe",
      "Run multiple strategies side by side to compare performance",
    ],
    ctaLabel: "Run a backtest",
    ctaPath: "/app/backtesting",
  },
  // ── Step 5: Bar-by-bar Replay ──────────────────────────────────────────────
  {
    subject: "Replay any session — bar by bar",
    preheader: "Simulate live trading conditions on historical data.",
    badge: "Feature spotlight",
    badgeColor: "#22d3ee",
    headline: "Train like a pilot — replay every session in a simulator",
    subheadline: "Bar-by-bar replay: deliberate practice without the downside",
    body: "Watching a chart in hindsight is not the same as trading it in real time. Bar-by-bar replay forces you to make decisions before you see what happens next — exactly like a live session, but with historical data.\n\nUse it to drill your entry criteria, practice your exit discipline, and build pattern recognition without touching your real account.",
    bullets: [
      "Pause, mark entries and exits, then review your decisions",
      "Replay at any speed — fast for scanning, slow for analysis",
      "Results feed directly into your performance metrics",
    ],
    ctaLabel: "Start a replay session",
    ctaPath: "/app/backtesting",
  },
  // ── Step 6: AI Coach ───────────────────────────────────────────────────────
  {
    subject: "Your personal trading analyst — available 24/7",
    preheader: "Ask anything about your trades. Get real answers.",
    badge: "Feature spotlight",
    badgeColor: "#f472b6",
    headline: "The analyst that never sleeps",
    subheadline: "AI Coach: trade analysis on demand",
    body: "Most traders have questions after every session. Why did this setup fail? Is my position sizing consistent? Am I overtrading on Fridays? Finding those answers usually means hours of manual analysis.\n\nAI Coach reads your trade history and answers in plain language. Ask a specific question or let it surface patterns you haven't noticed. It gets sharper the more you trade.",
    bullets: [
      "Ask in plain language: \"Why do I lose more on Mondays?\"",
      "Detects patterns across hundreds of trades automatically",
      "Responds based on your actual data — not generic advice",
    ],
    ctaLabel: "Ask AI Coach",
    ctaPath: "/app/ai-coach",
  },
  // ── Step 7: Trade Journal ──────────────────────────────────────────────────
  {
    subject: "The habit that separates professionals from amateurs",
    preheader: "Consistent journaling is the highest-ROI thing you can do as a trader.",
    badge: "Feature spotlight",
    badgeColor: "#4ade80",
    headline: "If you don't write it down, it didn't happen",
    subheadline: "Trade Journal: the foundation of deliberate improvement",
    body: "Every elite trader journals. Not because it is fun, but because memory is unreliable and patterns are invisible until you track them. The traders who improve fastest are the ones who review their mistakes systematically — not occasionally.\n\nRiskSent's journal captures every trade automatically from your connected accounts. Add notes, tags, screenshots. Review weekly. Watch your edge sharpen.",
    bullets: [
      "Auto-import from connected broker accounts — no manual entry",
      "Tag trades by setup, session, or emotion for pattern analysis",
      "Weekly review mode: see your biggest wins and losses side by side",
    ],
    ctaLabel: "Open my journal",
    ctaPath: "/app/journaling",
  },
  // ── Step 8: AI Trade Review ────────────────────────────────────────────────
  {
    subject: "Get an objective review of every trade you take",
    preheader: "AI analysis that tells you what actually happened — not what you felt happened.",
    badge: "Feature spotlight",
    badgeColor: "#f472b6",
    headline: "What actually happened in that trade?",
    subheadline: "AI Trade Review: objective analysis, no ego",
    body: "Most post-trade reviews are biased. If the trade was a winner, we say it was skill. If it was a loser, we blame bad luck. AI Trade Review cuts through that.\n\nFor every trade in your journal, request a detailed AI analysis: entry quality, exit timing, risk-to-reward vs. your historical average, and what specifically could have been better. Consistent, objective, honest.",
    bullets: [
      "Entry and exit quality scored against your own historical baseline",
      "Specific improvement suggestions — not generic feedback",
      "Accessible per-trade from inside the journal",
    ],
    ctaLabel: "Review a trade",
    ctaPath: "/app/journaling",
  },
  // ── Step 9: FTMO / Challenge Simulator ────────────────────────────────────
  {
    subject: "Pass the prop firm challenge — virtually first",
    preheader: "Simulate FTMO and other challenge rules before you risk the fee.",
    badge: "Feature spotlight",
    badgeColor: "#fbbf24",
    headline: "Don't pay for a failed challenge you could have simulated",
    subheadline: "Simulator: practice prop firm rules risk-free",
    body: "Prop firm challenges fail not because of strategy — they fail because of risk management. Traders blow the daily loss limit on day three, or hit the max drawdown with one bad session.\n\nRiskSent's simulator lets you run your strategy against FTMO-style rules on historical data. See exactly where you would have blown the challenge — before you pay the fee.",
    bullets: [
      "FTMO-compatible rules: daily loss, max drawdown, profit target",
      "Simulates evaluation and funded account phases",
      "What-if sliders: adjust rules and see how results change",
    ],
    ctaLabel: "Open simulator",
    ctaPath: "/simulator",
  },
  // ── Step 10: Live Alerts Feed ──────────────────────────────────────────────
  {
    subject: "Your real-time risk radar",
    preheader: "Every rule breach, every account — one live feed.",
    badge: "Feature spotlight",
    badgeColor: "#22d3ee",
    headline: "See every breach the moment it happens",
    subheadline: "Live Alerts: your risk feed in real time",
    body: "Telegram gets the alert to your phone. Live Alerts shows you the full history — every rule breach, every account, timestamped and sortable. When something happens, you can trace exactly what triggered it and when.\n\nFilter by account, by rule type, or by date. Dismiss resolved alerts. Keep track of recurring issues before they become expensive habits.",
    bullets: [
      "Full breach history — nothing is ever silently discarded",
      "Filter and search across all accounts and rule types",
      "Dismiss, mark resolved, or escalate from the feed",
    ],
    ctaLabel: "See live alerts",
    ctaPath: "/live-alerts",
  },
  // ── Step 11: Accounts Manager ─────────────────────────────────────────────
  {
    subject: "All your brokers. One place.",
    preheader: "Connect multiple accounts and manage them without switching platforms.",
    badge: "Feature spotlight",
    badgeColor: "#a5b4fc",
    headline: "Stop switching between platforms to check your positions",
    subheadline: "Accounts Manager: centralize all your broker connections",
    body: "Running two MT4 accounts, a funded account, and a personal account across different brokers is a recipe for missed risk. Something always slips through.\n\nRiskSent connects all your accounts in one place. Risk rules, alerts, journal entries, and performance data unified across every account you trade — regardless of broker.",
    bullets: [
      "Connect multiple MT4/MT5 accounts from any broker",
      "Separate risk rules per account or apply global limits",
      "Unified performance metrics across all connected accounts",
    ],
    ctaLabel: "Manage accounts",
    ctaPath: "/accounts",
  },
  // ── Step 12: Affiliate Program ────────────────────────────────────────────
  {
    subject: "Earn while you trade",
    preheader: "Refer other traders. Earn recurring commission. Simple.",
    badge: "Earn with RiskSent",
    badgeColor: "#4ade80",
    headline: "Turn your network into passive income",
    subheadline: "Affiliate Program: earn recurring commission on every referral",
    body: "If you trade in communities, follow other traders, or just know people who struggle with risk management — the affiliate program turns those relationships into income.\n\nShare your referral link. Every trader who signs up through it earns you a recurring commission for as long as they stay subscribed. No cap. No expiry. Just a percentage of every payment they make.",
    bullets: [
      "Recurring commission — not a one-time payout",
      "Real-time dashboard showing clicks, signups, and earnings",
      "Instant payout when thresholds are met",
    ],
    ctaLabel: "Join affiliate program",
    ctaPath: "/app/affiliate",
  },
];

function escapeH(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function getMarketingDripHtml(step: number, displayName: string): string {
  const idx = Math.max(0, Math.min(step - 1, STEPS.length - 1));
  const s = STEPS[idx]!;
  const base = emailSiteBase();
  const ctaUrl = `${base}${s.ctaPath}`;
  const secondaryUrl = s.secondaryPath ? `${base}${s.secondaryPath}` : null;

  const bulletItems = s.bullets
    .map(
      (b) => `
      <li style="color:#cbd5e1; padding:6px 0 6px 22px; position:relative; font-size:14px; line-height:1.5;">
        <span style="position:absolute; left:0; color:${s.badgeColor}; font-weight:800;">→</span>
        ${escapeH(b)}
      </li>`
    )
    .join("");

  const bodyLines = s.body
    .split("\n\n")
    .map(
      (p) =>
        `<p style="margin:0 0 16px; font-size:15px; color:#cbd5e1; line-height:1.7;">${escapeH(p)}</p>`
    )
    .join("");

  const stepIndicator = `
    <p style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.12em; color:#475569; text-align:center; margin:0 0 4px;">
      Tip ${step} of ${MARKETING_DRIP_TOTAL_STEPS}
    </p>`;

  const progressBar = `
    <div style="background:rgba(255,255,255,0.06); border-radius:999px; height:3px; margin:0 0 28px; overflow:hidden;">
      <div style="background:${s.badgeColor}; height:3px; width:${Math.round((step / MARKETING_DRIP_TOTAL_STEPS) * 100)}%; border-radius:999px;"></div>
    </div>`;

  const main = `
      <div class="body-pad">
        ${stepIndicator}
        ${progressBar}
        <div class="hero-section">
          <span class="badge" style="background:rgba(99,102,241,0.1); border-color:rgba(99,102,241,0.25); color:${s.badgeColor};">${escapeH(s.badge)}</span>
          <h1 class="h1" style="margin-top:16px;">${escapeH(s.headline)}</h1>
          <p style="margin:0; font-size:13px; font-weight:600; text-transform:uppercase; letter-spacing:0.08em; color:#64748b;">${escapeH(s.subheadline)}</p>
        </div>

        <p style="font-size:14px; color:#94a3b8; margin:4px 0 20px;">Hi ${escapeH(displayName)},</p>

        ${bodyLines}

        <div style="background:#0a0a12; border-radius:10px; padding:18px; border:1px solid rgba(255,255,255,0.08); margin:0 0 24px;">
          <p style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.12em; color:#64748b; margin:0 0 10px;">Why it matters</p>
          <ul style="list-style:none; padding:0; margin:0;">${bulletItems}</ul>
        </div>

        <div style="text-align:center;">${emailCtaButton(ctaUrl, s.ctaLabel)}</div>
        ${secondaryUrl ? `<p style="text-align:center; margin:8px 0 0;">${emailCtaSubLink(secondaryUrl, s.secondaryLabel ?? "Learn more →")}</p>` : ""}

        <p style="font-size:12px; color:#64748b; text-align:center; margin:20px 0 0;">
          Questions? <a href="mailto:support@risksent.com" style="color:#818cf8; text-decoration:none; font-weight:600;">support@risksent.com</a>
        </p>
      </div>`;

  return (
    emailDocumentOpen({
      documentTitle: s.subject,
      preheader: s.preheader,
      subhead: `Day ${step} — Getting started`,
    }) +
    main +
    emailDocumentFooter(
      `You're receiving this as part of your RiskSent getting-started series.`,
      `You'll receive one tip per day for ${MARKETING_DRIP_TOTAL_STEPS} days. <a href="${base}/app/profile" style="color:#818cf8;text-decoration:none;">Manage email preferences</a>`
    )
  );
}

export function getMarketingDripSubject(step: number): string {
  const idx = Math.max(0, Math.min(step - 1, STEPS.length - 1));
  return STEPS[idx]!.subject;
}
