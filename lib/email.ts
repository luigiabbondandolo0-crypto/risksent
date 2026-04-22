import { Resend } from "resend";
import {
  emailCtaButton,
  emailCtaSubLink,
  emailDocumentFooter,
  emailDocumentOpen,
  emailSiteBase,
} from "./emailBrandHtml";

/**
 * Sender address used on all transactional emails.
 * Override via `RESEND_FROM_EMAIL` (e.g. `"RiskSent <info@risksent.com>"`).
 * The domain MUST be verified in Resend → Domains.
 */
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "RiskSent <info@risksent.com>";

/**
 * Where replies are routed. Keeps the "from" address brand-friendly while
 * letting user replies land in the support inbox.
 * Override via `RESEND_REPLY_TO`.
 */
const REPLY_TO = process.env.RESEND_REPLY_TO || "support@risksent.com";

function siteUrl(): string {
  return emailSiteBase();
}

export interface WelcomeEmailParams {
  to: string;
  userName?: string;
}

export interface TrialEndingEmailParams {
  to: string;
  userName?: string;
  /** ISO timestamp of trial end. */
  trialEndsAt: string;
  /** Whole days remaining (rounded, min 0). */
  daysLeft: number;
}

/**
 * Sends the "your trial ends soon" reminder.
 * Idempotency must be enforced by the caller (see /api/cron/trial-reminder).
 */
export async function sendTrialEndingEmail({
  to,
  userName,
  trialEndsAt,
  daysLeft,
}: TrialEndingEmailParams): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Email] Provider not configured, skipping trial-ending email");
    return { success: true };
  }

  try {
    const resend = new Resend(apiKey);
    const displayName = userName || to.split("@")[0];
    const subject =
      daysLeft <= 0
        ? "Your RiskSent trial ends today"
        : `Your RiskSent trial ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`;

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      replyTo: REPLY_TO,
      to,
      subject,
      html: getTrialEndingEmailTemplate(displayName, trialEndsAt, daysLeft),
    });

    if (error) {
      console.error("[Email] Failed to send trial-ending email:", error);
      return { success: false, error: error.message || "Failed to send email" };
    }

    console.log("[Email] Trial-ending email sent to", to);
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("[Email] Exception sending trial-ending email:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Sends a welcome email to a new user
 */
export async function sendWelcomeEmail({ to, userName }: WelcomeEmailParams): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Email] Provider not configured, skipping welcome email");
    return { success: true };
  }

  try {
    const resend = new Resend(apiKey);
    const displayName = userName || to.split("@")[0];

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      replyTo: REPLY_TO,
      to,
      subject: "Welcome to RiskSent — your trial is active",
      html: getWelcomeEmailTemplate(displayName),
    });

    if (error) {
      console.error("[Email] Failed to send welcome email:", error);
      return { success: false, error: error.message || "Failed to send email" };
    }

    console.log("[Email] Welcome email sent successfully to", to);
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("[Email] Exception sending welcome email:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

function getWelcomeEmailTemplate(userName: string): string {
  const base = siteUrl();
  const dashboardUrl = `${base}/app/dashboard`;
  const backtestingUrl = `${base}/app/backtesting`;
  const telegramUrl = `${base}/app/risk-manager`;

  const main = `
      <div class="body-pad">
        <div class="hero-section">
          <span class="badge">Trial active</span>
          <h1 class="h1" style="margin-top:20px;">Welcome, ${escapeAttrText(userName)}</h1>
          <p style="margin:0; font-size:14px; color:#94a3b8;">Your 7-day free trial is on. Here&apos;s how to get the most from it.</p>
        </div>

        <p class="steps-label">3 steps to start</p>

        <a href="${dashboardUrl}" class="step" style="display:block">
          <div class="step-inner" style="display:flex">
            <div class="step-num">1</div>
            <div>
              <div class="step-title">Open the dashboard</div>
              <p class="step-desc">See risk exposure, open trades, and account health in one place.</p>
            </div>
          </div>
        </a>

        <a href="${backtestingUrl}" class="step" style="display:block">
          <div class="step-inner" style="display:flex">
            <div class="step-num" style="background:rgba(34,211,238,0.1);color:#22d3ee">2</div>
            <div>
              <div class="step-title">Run a backtest</div>
              <p class="step-desc">Replay history bar-by-bar and measure your edge with no risk.</p>
            </div>
          </div>
        </a>

        <a href="${telegramUrl}" class="step" style="display:block">
          <div class="step-inner" style="display:flex">
            <div class="step-num" style="background:rgba(74,222,128,0.1);color:#4ade80">3</div>
            <div>
              <div class="step-title">Connect Telegram</div>
              <p class="step-desc">Get instant alerts when a risk rule fires.</p>
            </div>
          </div>
        </a>

        <div style="height:1px; background:rgba(255,255,255,0.06); margin:28px 0;"></div>

        <div style="text-align:center; margin:8px 0 0;">
          ${emailCtaButton(dashboardUrl, "Open my dashboard")}
        </div>
        <p style="font-size:12px; color:#64748b; text-align:center; margin:16px 0 0;">
          Questions? Reply to this email or <a href="mailto:support@risksent.com" style="color:#818cf8; text-decoration:none; font-weight:600;">support@risksent.com</a>
        </p>
      </div>
  `;

  return (
    emailDocumentOpen({
      documentTitle: "Welcome to RiskSent",
      preheader: "Your trial is live — set up the dashboard, backtesting, and Telegram.",
      subhead: "Get started",
    }) +
    main +
    emailDocumentFooter("You received this because you created a RiskSent account.")
  );
}

function getTrialEndingEmailTemplate(userName: string, trialEndsAt: string, daysLeft: number): string {
  const base = siteUrl();
  const pricingUrl = `${base}/pricing`;
  const billingUrl = `${base}/app/billing`;

  const endDate = new Date(trialEndsAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const headline =
    daysLeft <= 0
      ? "Your free trial ends today"
      : daysLeft === 1
        ? "Your free trial ends tomorrow"
        : `Your free trial ends in ${daysLeft} days`;

  const sub =
    daysLeft <= 0
      ? "After today, your workspace will switch to demo mode and live trading accounts will be paused."
      : `You still have ${daysLeft} day${daysLeft === 1 ? "" : "s"} of full access. Choose a plan to keep risk rules, live alerts, and AI insights without interruption.`;

  const main = `
      <div class="body-pad">
        <h1 class="h1">${headline}</h1>
        <p style="margin:0 0 20px; font-size:15px; color:#94a3b8;">Hi ${escapeAttrText(userName)},</p>
        <p style="margin:0 0 20px; font-size:15px; color:#cbd5e1;">${sub}</p>

        <div class="countdown">
          <div class="days">${Math.max(0, daysLeft)}</div>
          <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.1em; color:#94a3b8; margin-top:4px;">day${daysLeft === 1 ? "" : "s"} left</div>
          <div class="end">Trial ends on <strong style="color:#e2e8f0;">${endDate}</strong></div>
        </div>

        <p style="text-align:center; margin:24px 0 8px;">${emailCtaButton(pricingUrl, "Choose a plan")}</p>
        <p style="text-align:center; margin:0;">${emailCtaSubLink(billingUrl, "or manage billing →")}</p>

        <div class="plans">
          <h3>What you keep when you upgrade</h3>
          <ul>
            <li>Live risk checks on every connected broker account</li>
            <li>Daily loss, drawdown, and exposure rules with Telegram alerts</li>
            <li>FTMO / Simplified challenge simulator and AI trade insight</li>
            <li>Historical PnL and audit log</li>
          </ul>
        </div>

        <p style="font-size:13px; color:#94a3b8; margin:22px 0 0;">Not ready? No action needed — the workspace goes to read-only demo when the trial ends. You can subscribe anytime from billing.</p>
      </div>
  `;

  return (
    emailDocumentOpen({
      documentTitle: "Your RiskSent trial is ending",
      preheader: `Your trial ends in ${Math.max(0, daysLeft)} day(s). Keep full access with a plan.`,
      subhead: "Plan & billing",
    }) +
    main +
    emailDocumentFooter(
      "You're receiving this because your free trial is ending.",
      "After expiry you won't get further reminders of this type."
    )
  );
}

/** Exposed for /api/send-trial-expired-email and tests */
export function getTrialExpiredEmailTemplate(userName: string): string {
  const base = siteUrl();
  const pricingUrl = `${base}/pricing`;
  const billingUrl = `${base}/app/billing`;

  const main = `
      <div class="body-pad">
        <h1 class="h1">Your free trial has ended</h1>
        <p style="margin:0 0 8px; font-size:14px; color:#94a3b8;">Read-only demo mode is now active</p>

        <p style="margin:20px 0 14px; font-size:15px; color:#cbd5e1;">Hi ${escapeAttrText(userName)},</p>
        <p style="margin:0 0 20px; font-size:15px; color:#94a3b8;">Your 7-day trial of RiskSent has ended. Your data and settings are saved — pick a plan to turn live features back on.</p>

        <div style="height:1px; background:rgba(255,255,255,0.06); margin:20px 0;"></div>

        <p style="font-size:12px; font-weight:800; text-transform:uppercase; letter-spacing:0.1em; color:#64748b; margin:0 0 12px;">Unlocked again when you upgrade</p>
        <p style="margin:0 0 6px; font-size:14px; color:#cbd5e1;">→ Live risk checks on connected accounts</p>
        <p style="margin:0 0 6px; font-size:14px; color:#cbd5e1;">→ Telegram alerts when limits are hit</p>
        <p style="margin:0 0 6px; font-size:14px; color:#cbd5e1;">→ Backtesting and strategy replay</p>
        <p style="margin:0; font-size:14px; color:#cbd5e1;">→ AI Coach and journaling</p>

        <div style="text-align:center; margin:28px 0 8px;">${emailCtaButton(pricingUrl, "Choose a plan")}</div>
        <div style="text-align:center;">${emailCtaSubLink(billingUrl, "or visit billing →")}</div>

        <p style="font-size:12px; color:#64748b; margin:20px 0 0;">Don&apos;t want to upgrade? No action required — you stay in demo; data stays accessible.</p>
      </div>
  `;

  return (
    emailDocumentOpen({
      documentTitle: "Your RiskSent trial has ended",
      preheader: "Your trial ended. Choose a plan to restore live risk checks and alerts.",
      subhead: "Trial ended",
    }) +
    main +
    emailDocumentFooter("You received this because your RiskSent trial expired.")
  );
}

function escapeAttrText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
