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

/** Inbox where contact-form inquiries are delivered (Resend → your support queue). */
const SUPPORT_INBOX = process.env.SUPPORT_INBOX_EMAIL || "support@risksent.com";

function siteUrl(): string {
  return emailSiteBase();
}

async function deliverEmail(opts: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  logLabel: string;
}): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[Email] Provider not configured, skipping ${opts.logLabel}`);
    return { success: true };
  }
  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      replyTo: opts.replyTo ?? REPLY_TO,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    if (error) {
      console.error(`[Email] Failed ${opts.logLabel}:`, error);
      return { success: false, error: error.message || "Failed to send email" };
    }
    console.log(`[Email] ${opts.logLabel} sent to`, opts.to);
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`[Email] Exception ${opts.logLabel}:`, errorMessage);
    return { success: false, error: errorMessage };
  }
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
  const displayName = userName || to.split("@")[0];
  const subject =
    daysLeft <= 0
      ? "Your RiskSent trial ends today"
      : `Your RiskSent trial ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`;
  return deliverEmail({
    to,
    subject,
    html: getTrialEndingEmailTemplate(displayName, trialEndsAt, daysLeft),
    logLabel: "trial-ending",
  });
}

/** After signup — account created; user must still verify email (separate Supabase message). */
export async function sendRegistrationEmail({
  to,
  userName,
}: WelcomeEmailParams): Promise<{ success: boolean; error?: string }> {
  const displayName = userName || to.split("@")[0];
  return deliverEmail({
    to,
    subject: "You’re registered — confirm your email for RiskSent",
    html: getRegistrationEmailTemplate(displayName),
    logLabel: "registration",
  });
}

/** 7-day trial just started (pricing / start-trial). */
export async function sendTrialActivatedEmail({
  to,
  userName,
}: WelcomeEmailParams): Promise<{ success: boolean; error?: string }> {
  const displayName = userName || to.split("@")[0];
  return deliverEmail({
    to,
    subject: "Your RiskSent free trial is active",
    html: getTrialActivatedEmailTemplate(displayName),
    logLabel: "trial-activated",
  });
}

/**
 * @deprecated Prefer sendTrialActivatedEmail. Kept for /api/send-welcome-email compatibility.
 */
export async function sendWelcomeEmail(params: WelcomeEmailParams): Promise<{ success: boolean; error?: string }> {
  return sendTrialActivatedEmail(params);
}

export async function sendPlanPurchasedEmail({
  to,
  userName,
  planKey,
}: {
  to: string;
  userName?: string;
  planKey: string;
}): Promise<{ success: boolean; error?: string }> {
  const displayName = userName || to.split("@")[0];
  const planLabel = planKey === "new_trader" ? "New Trader" : planKey === "experienced" ? "Experienced" : planKey;
  return deliverEmail({
    to,
    subject: `You’re subscribed — ${planLabel} plan active on RiskSent`,
    html: getPlanPurchasedEmailTemplate(displayName, planLabel),
    logLabel: "plan-purchased",
  });
}

export async function sendPasswordResetEmail({
  to,
  userName,
  resetLink,
}: {
  to: string;
  userName?: string;
  resetLink: string;
}): Promise<{ success: boolean; error?: string }> {
  const displayName = userName || to.split("@")[0];
  return deliverEmail({
    to,
    subject: "Reset your RiskSent password",
    html: getPasswordResetEmailTemplate(displayName, resetLink),
    logLabel: "password-reset",
  });
}

export async function sendPasswordChangedEmail({
  to,
  userName,
}: WelcomeEmailParams): Promise<{ success: boolean; error?: string }> {
  const displayName = userName || to.split("@")[0];
  return deliverEmail({
    to,
    subject: "Your RiskSent password was changed",
    html: getPasswordChangedEmailTemplate(displayName),
    logLabel: "password-changed",
  });
}

export async function sendAccountDeletedEmail({
  to,
  userName,
}: WelcomeEmailParams): Promise<{ success: boolean; error?: string }> {
  const displayName = userName || to.split("@")[0];
  return deliverEmail({
    to,
    subject: "Your RiskSent account has been deleted",
    html: getAccountDeletedEmailTemplate(displayName),
    logLabel: "account-deleted",
  });
}

/** Copy to the user after the contact form is submitted successfully. */
export async function sendSupportContactConfirmationEmail({
  to,
  userName,
  topicLabel,
}: {
  to: string;
  userName?: string;
  topicLabel: string;
}): Promise<{ success: boolean; error?: string }> {
  const displayName = userName || to.split("@")[0];
  return deliverEmail({
    to,
    subject: "We received your message — RiskSent support",
    html: getSupportUserConfirmationTemplate(displayName, topicLabel),
    logLabel: "support-user-confirmation",
  });
}

/** Delivers the inquiry to the support inbox; Reply-To is the visitor’s email. */
export async function sendSupportInquiryToTeam({
  fromEmail,
  fromName,
  topicLabel,
  message,
}: {
  fromEmail: string;
  fromName: string;
  topicLabel: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  const subject = `[RiskSent contact] ${topicLabel} — ${fromName || fromEmail}`;
  const safeMsg = escapeAttrText(message);
  const safeName = escapeAttrText(fromName);
  const safeEmail = escapeAttrText(fromEmail);
  const main = `
      <div class="body-pad">
        <h1 class="h1">New contact form message</h1>
        <p style="margin:0 0 8px; font-size:14px; color:#94a3b8;"><strong>From:</strong> ${safeName} &lt;${safeEmail}&gt;</p>
        <p style="margin:0 0 16px; font-size:14px; color:#94a3b8;"><strong>Topic:</strong> ${escapeAttrText(topicLabel)}</p>
        <div style="background:#0a0a12; border-radius:10px; padding:16px; border:1px solid rgba(255,255,255,0.08);">
          <pre style="margin:0; font-family:ui-monospace,monospace; font-size:13px; color:#e2e8f0; white-space:pre-wrap; word-break:break-word;">${safeMsg}</pre>
        </div>
      </div>`;
  const html =
    emailDocumentOpen({
      documentTitle: "Support inquiry",
      preheader: `Message from ${fromEmail}`,
      subhead: "Contact form",
    }) +
    main +
    emailDocumentFooter("Internal — sent from risksent.com/contact");

  return deliverEmail({
    to: SUPPORT_INBOX,
    subject,
    html,
    replyTo: fromEmail,
    logLabel: "support-inbox",
  });
}

function getRegistrationEmailTemplate(userName: string): string {
  const base = siteUrl();
  const loginUrl = `${base}/login`;
  const main = `
      <div class="body-pad">
        <h1 class="h1">Thanks for signing up, ${escapeAttrText(userName)}</h1>
        <p style="margin:0 0 16px; font-size:15px; color:#94a3b8;">Your RiskSent account is almost ready.</p>
        <p style="margin:0 0 20px; font-size:15px; color:#cbd5e1;">
          We&apos;ve sent a <strong>separate email with a verification link</strong>. Open it to confirm your address, then sign in.
        </p>
        <p style="margin:0 0 24px; font-size:14px; color:#94a3b8;">
          Didn&apos;t get it? Check spam or promotions. You can request a new link from the login page.
        </p>
        <div style="text-align:center;">${emailCtaButton(loginUrl, "Go to sign in")}</div>
      </div>`;
  return (
    emailDocumentOpen({
      documentTitle: "Confirm your email",
      preheader: "Verify your email to activate your RiskSent account.",
      subhead: "Registration",
    }) +
    main +
    emailDocumentFooter("You received this because you registered at RiskSent.")
  );
}

function getTrialActivatedEmailTemplate(userName: string): string {
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
      documentTitle: "RiskSent trial active",
      preheader: "Your 7-day trial is live — set up the dashboard, backtesting, and Telegram.",
      subhead: "Free trial",
    }) +
    main +
    emailDocumentFooter("You received this because you activated a RiskSent free trial.")
  );
}

function getPlanPurchasedEmailTemplate(userName: string, planLabel: string): string {
  const base = siteUrl();
  const dashboardUrl = `${base}/app/dashboard`;
  const billingUrl = `${base}/app/billing`;
  const main = `
      <div class="body-pad">
        <span class="badge">Subscription active</span>
        <h1 class="h1" style="margin-top:20px;">Thank you, ${escapeAttrText(userName)}</h1>
        <p style="margin:0 0 20px; font-size:15px; color:#cbd5e1;">
          Your <strong>${escapeAttrText(planLabel)}</strong> plan is now active. You have full access to live risk rules, alerts, journaling, and AI Coach according to your plan.
        </p>
        <div style="text-align:center; margin:8px 0 0;">
          ${emailCtaButton(dashboardUrl, "Open dashboard")}
        </div>
        <p style="text-align:center; margin:16px 0 0;">${emailCtaSubLink(billingUrl, "Manage billing →")}</p>
      </div>`;
  return (
    emailDocumentOpen({
      documentTitle: "Subscription confirmed",
      preheader: `Your ${planLabel} subscription is active.`,
      subhead: "Billing",
    }) +
    main +
    emailDocumentFooter("You received this because you purchased a RiskSent plan.")
  );
}

function getPasswordResetEmailTemplate(userName: string, resetLink: string): string {
  const main = `
      <div class="body-pad">
        <h1 class="h1">Password reset</h1>
        <p style="margin:0 0 16px; font-size:15px; color:#cbd5e1;">Hi ${escapeAttrText(userName)},</p>
        <p style="margin:0 0 24px; font-size:15px; color:#94a3b8;">
          We received a request to reset your RiskSent password. Click the button below to choose a new one. This link expires after a short time.
        </p>
        <div style="text-align:center; margin:8px 0 16px;">${emailCtaButton(resetLink, "Reset password")}</div>
        <p style="margin:0; font-size:13px; color:#64748b;">
          If you didn&apos;t ask for this, you can ignore this email — your password will stay the same.
        </p>
      </div>`;
  return (
    emailDocumentOpen({
      documentTitle: "Reset password",
      preheader: "Use the link to set a new RiskSent password.",
      subhead: "Security",
    }) +
    main +
    emailDocumentFooter("You received this because someone requested a password reset for your account.")
  );
}

function getPasswordChangedEmailTemplate(userName: string): string {
  const base = siteUrl();
  const loginUrl = `${base}/login`;
  const main = `
      <div class="body-pad">
        <h1 class="h1">Password updated</h1>
        <p style="margin:0 0 16px; font-size:15px; color:#cbd5e1;">Hi ${escapeAttrText(userName)},</p>
        <p style="margin:0 0 24px; font-size:15px; color:#94a3b8;">
          Your RiskSent password was changed successfully. If this was you, no further action is needed.
        </p>
        <p style="margin:0 0 20px; font-size:14px; color:#f87171;">
          If you didn&apos;t make this change, contact us immediately at
          <a href="mailto:support@risksent.com" style="color:#818cf8;">support@risksent.com</a>.
        </p>
        <div style="text-align:center;">${emailCtaButton(loginUrl, "Sign in")}</div>
      </div>`;
  return (
    emailDocumentOpen({
      documentTitle: "Password changed",
      preheader: "Your RiskSent password was updated.",
      subhead: "Security",
    }) +
    main +
    emailDocumentFooter("You received this because your RiskSent password changed.")
  );
}

function getAccountDeletedEmailTemplate(userName: string): string {
  const main = `
      <div class="body-pad">
        <h1 class="h1">Account deleted</h1>
        <p style="margin:0 0 16px; font-size:15px; color:#cbd5e1;">Hi ${escapeAttrText(userName)},</p>
        <p style="margin:0 0 20px; font-size:15px; color:#94a3b8;">
          Your RiskSent account and authentication have been removed. Broker credentials and personal data tied to this account are being deleted as part of this process.
        </p>
        <p style="margin:0; font-size:14px; color:#64748b;">
          If you didn&apos;t request deletion, contact
          <a href="mailto:support@risksent.com" style="color:#818cf8;">support@risksent.com</a>
          right away.
        </p>
      </div>`;
  return (
    emailDocumentOpen({
      documentTitle: "Account removed",
      preheader: "Your RiskSent account has been deleted.",
      subhead: "Goodbye",
    }) +
    main +
    emailDocumentFooter("You received this because your RiskSent account was deleted.")
  );
}

function getSupportUserConfirmationTemplate(userName: string, topicLabel: string): string {
  const main = `
      <div class="body-pad">
        <h1 class="h1">We got your message</h1>
        <p style="margin:0 0 16px; font-size:15px; color:#cbd5e1;">Hi ${escapeAttrText(userName)},</p>
        <p style="margin:0 0 20px; font-size:15px; color:#94a3b8;">
          Thanks for reaching out about <strong>${escapeAttrText(topicLabel)}</strong>. Our team has received your note and will reply as soon as we can — usually within one business day.
        </p>
        <p style="margin:0; font-size:14px; color:#64748b;">
          Need anything else? Reply to this email or write to
          <a href="mailto:support@risksent.com" style="color:#818cf8;">support@risksent.com</a>.
        </p>
      </div>`;
  return (
    emailDocumentOpen({
      documentTitle: "Support message received",
      preheader: "We’ll get back to you shortly.",
      subhead: "Contact",
    }) +
    main +
    emailDocumentFooter("You received this after submitting the form at risksent.com/contact.")
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
