import { Resend } from "resend";
import {
  emailCtaButton,
  emailCtaSubLink,
  emailDocumentFooter,
  emailDocumentOpen,
  emailSiteBase,
} from "./emailBrandHtml";
import {
  getMarketingDripHtml,
  getMarketingDripSubject,
  MARKETING_DRIP_TOTAL_STEPS,
} from "./emailMarketingDrip";
import {
  getWeeklyInsightHtml,
  getWeeklyInsightIssueNumber,
  getStoryForWeek,
  WEEKLY_INSIGHT_STORIES,
} from "./emailWeeklyInsightStories";

/**
 * Sender address used on all transactional emails.
 * Override via `RESEND_FROM_EMAIL` (e.g. `"RiskSent <info@risksent.com>"`).
 * The domain MUST be verified in Resend → Domains.
 */
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "RiskSent <noreply@risksent.com>";

/**
 * Where replies are routed. Keeps the "from" address brand-friendly while
 * letting user replies land in the support inbox.
 * Override via `RESEND_REPLY_TO`.
 */
const REPLY_TO = process.env.RESEND_REPLY_TO || "noreply@risksent.com";

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

/** After signup — account created; includes verification link if provided. */
export async function sendRegistrationEmail({
  to,
  userName,
  verificationUrl,
}: WelcomeEmailParams & { verificationUrl?: string }): Promise<{ success: boolean; error?: string }> {
  const displayName = userName || to.split("@")[0];
  return deliverEmail({
    to,
    subject: "Confirm your email — RiskSent",
    html: getRegistrationEmailTemplate(displayName, verificationUrl),
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
    replyTo: SUPPORT_INBOX,
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

function getRegistrationEmailTemplate(userName: string, verificationUrl?: string): string {
  const base = siteUrl();
  const loginUrl = `${base}/login`;
  const ctaUrl = verificationUrl ?? loginUrl;
  const main = `
      <div class="body-pad">
        <h1 class="h1">Thanks for signing up, ${escapeAttrText(userName)}</h1>
        <p style="margin:0 0 16px; font-size:15px; color:#94a3b8;">Your RiskSent account is almost ready.</p>
        <p style="margin:0 0 20px; font-size:15px; color:#cbd5e1;">
          Click the button below to <strong>verify your email address</strong> and activate your account.
        </p>
        <div style="text-align:center;">${emailCtaButton(ctaUrl, "Verify my email")}</div>
        <p style="margin:20px 0 0; font-size:13px; color:#64748b; text-align:center;">
          This link expires in 24 hours. If you didn&apos;t create an account, you can ignore this email.
        </p>
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
          Your RiskSent account and authentication have been removed. Active subscriptions were cancelled, broker
          connections were removed from our hosting provider where applicable, and related data is being deleted.
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

// ─── Onboarding mastermail (single email after welcome) ──────────────────────

export async function sendOnboardingMastermailEmail({
  to,
  userName,
}: WelcomeEmailParams): Promise<{ success: boolean; error?: string }> {
  const displayName = userName || to.split("@")[0];
  return deliverEmail({
    to,
    subject: "Everything you need to know about RiskSent — start here",
    html: getOnboardingMastermailTemplate(displayName),
    logLabel: "onboarding-mastermail",
  });
}

// ─── Marketing drip (one feature per day, triggered by cron) ─────────────────

export { MARKETING_DRIP_TOTAL_STEPS };

export async function sendMarketingDripStepEmail({
  to,
  userName,
  step,
}: {
  to: string;
  userName?: string;
  step: number;
}): Promise<{ success: boolean; error?: string }> {
  const displayName = userName || to.split("@")[0];
  return deliverEmail({
    to,
    subject: getMarketingDripSubject(step),
    html: getMarketingDripHtml(step, displayName),
    logLabel: `marketing-drip-${step}`,
  });
}

// ─── Weekly insight auto (cron every Monday) ─────────────────────────────────

export { getWeeklyInsightIssueNumber, getStoryForWeek };

export async function sendWeeklyInsightAutoEmail({
  to,
  userName,
  weekNumber,
}: {
  to: string;
  userName?: string;
  weekNumber: number;
}): Promise<{ success: boolean; error?: string }> {
  const displayName = userName || to.split("@")[0];
  const story = getStoryForWeek(weekNumber);
  return deliverEmail({
    to,
    subject: `Weekly Insight #${weekNumber} — ${story.headline.slice(0, 60)}`,
    html: getWeeklyInsightHtml(displayName, weekNumber, story),
    logLabel: `weekly-insight-auto-${weekNumber}`,
  });
}

// ─── Marketing broadcast ────────────────────────────────────────────────────

export interface MarketingEmailParams {
  to: string;
  userName?: string;
  subject: string;
  headline: string;
  body: string; // plain text / simple HTML fragment
  ctaLabel?: string;
  ctaUrl?: string;
}

export async function sendMarketingEmail(
  params: MarketingEmailParams
): Promise<{ success: boolean; error?: string }> {
  const displayName = params.userName || params.to.split("@")[0];
  return deliverEmail({
    to: params.to,
    subject: params.subject,
    html: getMarketingEmailTemplate({ ...params, displayName }),
    logLabel: "marketing-broadcast",
  });
}

// ─── Promotional ─────────────────────────────────────────────────────────────

export interface PromoEmailParams {
  to: string;
  userName?: string;
  headline: string;
  description: string;
  promoCode?: string;
  discountLabel: string; // e.g. "30% off"
  expiryLabel?: string; // e.g. "Expires May 5"
  ctaLabel?: string;
  ctaUrl?: string;
}

export async function sendPromotionalEmail(
  params: PromoEmailParams
): Promise<{ success: boolean; error?: string }> {
  const displayName = params.userName || params.to.split("@")[0];
  return deliverEmail({
    to: params.to,
    subject: `${params.discountLabel} — ${params.headline}`,
    html: getPromoEmailTemplate({ ...params, displayName }),
    logLabel: "promotional",
  });
}

// ─── Onboarding tips drip ────────────────────────────────────────────────────

export type OnboardingStep = 1 | 2 | 3;

export interface OnboardingTipEmailParams {
  to: string;
  userName?: string;
  step: OnboardingStep;
}

export async function sendOnboardingTipEmail(
  params: OnboardingTipEmailParams
): Promise<{ success: boolean; error?: string }> {
  const displayName = params.userName || params.to.split("@")[0];
  const subjects: Record<OnboardingStep, string> = {
    1: "Set your first risk rule — RiskSent tip",
    2: "Try backtesting your strategy — RiskSent tip",
    3: "Get instant alerts on Telegram — RiskSent tip",
  };
  return deliverEmail({
    to: params.to,
    subject: subjects[params.step],
    html: getOnboardingTipTemplate(displayName, params.step),
    logLabel: `onboarding-tip-${params.step}`,
  });
}

// ─── Weekly insight ───────────────────────────────────────────────────────────

export interface WeeklyInsightEmailParams {
  to: string;
  userName?: string;
  issueNumber: number;
  traderName: string; // anonymised, e.g. "Marco T."
  story: string; // 2-3 sentence narrative
  metric: string; // e.g. "–18% max drawdown reduced to –4%"
  tip: string; // one actionable tip
  tipCtaLabel?: string;
  tipCtaUrl?: string;
}

export async function sendWeeklyInsightEmail(
  params: WeeklyInsightEmailParams
): Promise<{ success: boolean; error?: string }> {
  const displayName = params.userName || params.to.split("@")[0];
  return deliverEmail({
    to: params.to,
    subject: `Weekly Insight #${params.issueNumber} — How a trader used RiskSent`,
    html: getWeeklyInsightTemplate({ ...params, displayName }),
    logLabel: `weekly-insight-${params.issueNumber}`,
  });
}

// ─── Template builders ────────────────────────────────────────────────────────

function getMarketingEmailTemplate(
  p: MarketingEmailParams & { displayName: string }
): string {
  const base = siteUrl();
  const ctaBlock =
    p.ctaLabel && p.ctaUrl
      ? `<div style="text-align:center; margin:24px 0 8px;">${emailCtaButton(p.ctaUrl, p.ctaLabel)}</div>`
      : "";
  const safeBody = p.body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const main = `
      <div class="body-pad">
        <h1 class="h1">${escapeAttrText(p.headline)}</h1>
        <p style="margin:0 0 20px; font-size:15px; color:#94a3b8;">Hi ${escapeAttrText(p.displayName)},</p>
        <div style="font-size:15px; color:#cbd5e1; line-height:1.7; white-space:pre-line;">${safeBody}</div>
        ${ctaBlock}
        <p style="font-size:12px; color:#64748b; text-align:center; margin:20px 0 0;">
          Questions? <a href="mailto:support@risksent.com" style="color:#818cf8; text-decoration:none; font-weight:600;">support@risksent.com</a>
        </p>
      </div>`;
  return (
    emailDocumentOpen({
      documentTitle: p.subject,
      preheader: p.headline,
      subhead: "From RiskSent",
    }) +
    main +
    emailDocumentFooter(`You received this as a RiskSent member. <a href="${base}/app/profile" style="color:#818cf8;text-decoration:none;">Manage preferences</a>`)
  );
}

function getPromoEmailTemplate(
  p: PromoEmailParams & { displayName: string }
): string {
  const base = siteUrl();
  const ctaUrl = p.ctaUrl ?? `${base}/pricing`;
  const ctaLabel = p.ctaLabel ?? "Claim offer";
  const codeBlock = p.promoCode
    ? `<div style="margin:20px 0; padding:18px; border-radius:10px; background:#0a0a12; border:1px dashed rgba(99,102,241,0.4); text-align:center;">
        <p style="margin:0 0 6px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.12em; color:#64748b;">Promo code</p>
        <p style="margin:0; font-family:'JetBrains Mono',monospace; font-size:22px; font-weight:800; color:#a5b4fc; letter-spacing:0.08em;">${escapeAttrText(p.promoCode)}</p>
        ${p.expiryLabel ? `<p style="margin:8px 0 0; font-size:12px; color:#64748b;">${escapeAttrText(p.expiryLabel)}</p>` : ""}
      </div>`
    : "";
  const main = `
      <div class="body-pad">
        <div class="hero-section">
          <span class="badge" style="background:rgba(34,211,238,0.1); border-color:rgba(34,211,238,0.3); color:#22d3ee;">${escapeAttrText(p.discountLabel)}</span>
          <h1 class="h1" style="margin-top:16px;">${escapeAttrText(p.headline)}</h1>
          <p style="margin:0; font-size:14px; color:#94a3b8;">Hi ${escapeAttrText(p.displayName)},</p>
        </div>
        <p style="font-size:15px; color:#cbd5e1;">${escapeAttrText(p.description)}</p>
        ${codeBlock}
        <div style="text-align:center; margin:8px 0;">${emailCtaButton(ctaUrl, ctaLabel)}</div>
        <p style="font-size:12px; color:#64748b; text-align:center; margin:16px 0 0;">
          Questions? <a href="mailto:support@risksent.com" style="color:#818cf8; text-decoration:none; font-weight:600;">support@risksent.com</a>
        </p>
      </div>`;
  return (
    emailDocumentOpen({
      documentTitle: `${p.discountLabel} — ${p.headline}`,
      preheader: `${p.discountLabel}: ${p.description}`,
      subhead: "Special offer",
    }) +
    main +
    emailDocumentFooter(`You received this as a RiskSent member. <a href="${base}/app/profile" style="color:#818cf8;text-decoration:none;">Manage preferences</a>`)
  );
}

const ONBOARDING_TIPS: Record<
  OnboardingStep,
  {
    badge: string;
    headline: string;
    body: string;
    ctaLabel: string;
    ctaPath: string;
    color: string;
    subTips: string[];
  }
> = {
  1: {
    badge: "Day 1 tip",
    headline: "Set your first risk rule",
    body: "Risk rules are the core of RiskSent. Define a daily loss limit, max drawdown, or exposure cap — the platform will alert you (and optionally block trading) the moment a threshold is breached.",
    ctaLabel: "Set a risk rule",
    ctaPath: "/app/risk-manager",
    color: "#a5b4fc",
    subTips: [
      "Start with a daily loss limit equal to 2–3% of your account",
      "Add an overall drawdown cap to protect against streak losses",
      "Enable Telegram alerts so you hear about breaches instantly",
    ],
  },
  2: {
    badge: "Day 3 tip",
    headline: "Backtest your strategy before you risk real money",
    body: "RiskSent's backtesting engine lets you replay historical bars and measure your edge with no capital at risk. Run a session, check your win rate, and see if your rules hold up under real market conditions.",
    ctaLabel: "Open backtesting",
    ctaPath: "/app/backtesting",
    color: "#22d3ee",
    subTips: [
      "Pick a date range covering at least one volatile period",
      "Compare results across multiple instruments to spot your edge",
      "Export the summary and attach it to your trading journal",
    ],
  },
  3: {
    badge: "Day 7 tip",
    headline: "Get real-time alerts on Telegram",
    body: "Connect your Telegram account so RiskSent can notify you the instant a risk rule fires — whether you're at your desk or away from screens. Setup takes under a minute.",
    ctaLabel: "Connect Telegram",
    ctaPath: "/app/risk-manager",
    color: "#4ade80",
    subTips: [
      "Search for @RiskSentBot in Telegram and start a chat",
      "Paste the link code shown in the Risk Manager page",
      "Test it by triggering a rule manually from the dashboard",
    ],
  },
};

function getOnboardingTipTemplate(displayName: string, step: OnboardingStep): string {
  const base = siteUrl();
  const tip = ONBOARDING_TIPS[step];
  const subTipItems = tip.subTips
    .map(
      (t) =>
        `<li style="color:#cbd5e1; padding:6px 0 6px 22px; position:relative; font-size:14px;">
          <span style="position:absolute; left:0; color:${tip.color}; font-weight:bold;">→</span>
          ${escapeAttrText(t)}
        </li>`
    )
    .join("");

  const main = `
      <div class="body-pad">
        <div class="hero-section">
          <span class="badge" style="background:rgba(99,102,241,0.1); border-color:rgba(99,102,241,0.25); color:${tip.color};">${escapeAttrText(tip.badge)}</span>
          <h1 class="h1" style="margin-top:16px;">${escapeAttrText(tip.headline)}</h1>
          <p style="margin:0; font-size:14px; color:#94a3b8;">Hi ${escapeAttrText(displayName)},</p>
        </div>
        <p style="font-size:15px; color:#cbd5e1; margin:16px 0 20px;">${escapeAttrText(tip.body)}</p>
        <div style="background:#0a0a12; border-radius:10px; padding:18px; border:1px solid rgba(255,255,255,0.08); margin-bottom:24px;">
          <p style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.12em; color:#64748b; margin:0 0 10px;">Quick wins</p>
          <ul style="list-style:none; padding:0; margin:0;">${subTipItems}</ul>
        </div>
        <div style="text-align:center;">${emailCtaButton(`${base}${tip.ctaPath}`, tip.ctaLabel)}</div>
        <p style="font-size:12px; color:#64748b; text-align:center; margin:16px 0 0;">
          Reply to this email or write to <a href="mailto:support@risksent.com" style="color:#818cf8; text-decoration:none; font-weight:600;">support@risksent.com</a>
        </p>
      </div>`;
  return (
    emailDocumentOpen({
      documentTitle: tip.headline,
      preheader: tip.body.slice(0, 90),
      subhead: tip.badge,
    }) +
    main +
    emailDocumentFooter("You received this as part of your RiskSent onboarding sequence.")
  );
}

function getWeeklyInsightTemplate(
  p: WeeklyInsightEmailParams & { displayName: string }
): string {
  const base = siteUrl();
  const ctaUrl = p.tipCtaUrl ?? `${base}/app/dashboard`;
  const ctaLabel = p.tipCtaLabel ?? "Open dashboard";
  const main = `
      <div class="body-pad">
        <div class="hero-section">
          <span class="badge">Weekly Insight #${p.issueNumber}</span>
          <h1 class="h1" style="margin-top:16px;">How ${escapeAttrText(p.traderName)} used RiskSent</h1>
          <p style="margin:0; font-size:14px; color:#94a3b8;">Hi ${escapeAttrText(p.displayName)},</p>
        </div>

        <div style="background:linear-gradient(128deg,rgba(99,102,241,0.08) 0%,#0a0a12 100%); border-radius:12px; padding:22px; border:1px solid rgba(99,102,241,0.2); margin:20px 0;">
          <p style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.12em; color:#64748b; margin:0 0 12px;">Trader story</p>
          <p style="font-size:15px; color:#cbd5e1; margin:0; line-height:1.7;">${escapeAttrText(p.story)}</p>
          <div style="margin-top:18px; padding-top:18px; border-top:1px solid rgba(255,255,255,0.06);">
            <p style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.12em; color:#64748b; margin:0 0 6px;">Key result</p>
            <p style="font-family:'JetBrains Mono',monospace; font-size:18px; font-weight:800; color:#a5b4fc; margin:0;">${escapeAttrText(p.metric)}</p>
          </div>
        </div>

        <div style="background:#0a0a12; border-radius:10px; padding:18px; border-left:3px solid #22d3ee; margin:20px 0;">
          <p style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.12em; color:#64748b; margin:0 0 8px;">This week's tip</p>
          <p style="font-size:15px; color:#cbd5e1; margin:0;">${escapeAttrText(p.tip)}</p>
        </div>

        <div style="text-align:center; margin:24px 0 8px;">${emailCtaButton(ctaUrl, ctaLabel)}</div>
        <p style="font-size:12px; color:#64748b; text-align:center; margin:8px 0 0;">
          Questions? <a href="mailto:support@risksent.com" style="color:#818cf8; text-decoration:none; font-weight:600;">support@risksent.com</a>
        </p>
      </div>`;
  return (
    emailDocumentOpen({
      documentTitle: `Weekly Insight #${p.issueNumber} — RiskSent`,
      preheader: `How ${p.traderName} used RiskSent: ${p.metric}`,
      subhead: `Weekly Insight · Issue #${p.issueNumber}`,
    }) +
    main +
    emailDocumentFooter(`You received this as a RiskSent subscriber. <a href="${base}/app/profile" style="color:#818cf8;text-decoration:none;">Manage preferences</a>`)
  );
}

// ─── Preview helper (for /api/admin/email/preview) ───────────────────────────

function getOnboardingMastermailTemplate(displayName: string): string {
  const base = siteUrl();
  const sections = [
    {
      icon: "1",
      color: "#a5b4fc",
      title: "Connect your broker account",
      body: "Go to Accounts and link your MT4 or MT5 account. RiskSent pulls live data from your broker to monitor risk in real time.",
      linkLabel: "Add account →",
      linkPath: "/accounts",
    },
    {
      icon: "2",
      color: "#22d3ee",
      title: "Set your first risk rules",
      body: "In the Risk Manager, define your daily loss limit, maximum drawdown, and position size cap. These are the rules that protect your capital automatically — no manual tracking required.",
      linkLabel: "Set rules →",
      linkPath: "/app/risk-manager",
    },
    {
      icon: "3",
      color: "#4ade80",
      title: "Connect Telegram for instant alerts",
      body: "When a rule fires, you get a Telegram message within seconds. Search for @RiskSentBot, start a chat, and paste the link code from the Risk Manager. Takes under a minute.",
      linkLabel: "Connect Telegram →",
      linkPath: "/app/risk-manager",
    },
    {
      icon: "4",
      color: "#fbbf24",
      title: "Test your strategy with backtesting",
      body: "Before trading live, replay your strategy on real historical data. The backtesting engine shows win rate, profit factor, and maximum drawdown — so you know your edge is real.",
      linkLabel: "Run a backtest →",
      linkPath: "/app/backtesting",
    },
    {
      icon: "5",
      color: "#f472b6",
      title: "Log trades in the journal",
      body: "Once your account is connected, trades import automatically. Add notes and tags. Review weekly — the pattern analysis you get from 30 days of tagged trades is worth more than any course.",
      linkLabel: "Open journal →",
      linkPath: "/app/journaling",
    },
    {
      icon: "6",
      color: "#a5b4fc",
      title: "Ask AI Coach anything",
      body: "After a few weeks of data, ask AI Coach specific questions: \"Why do I lose on Fridays?\" or \"Is my position sizing consistent?\" It reads your actual trade history and answers in plain language.",
      linkLabel: "Ask AI Coach →",
      linkPath: "/app/ai-coach",
    },
    {
      icon: "7",
      color: "#22d3ee",
      title: "Try the prop firm simulator",
      body: "If you're preparing for an FTMO or similar challenge, the simulator lets you test your strategy against those exact rules on historical data. Find where you'd fail — before you pay the fee.",
      linkLabel: "Open simulator →",
      linkPath: "/simulator",
    },
  ];

  const sectionItems = sections
    .map(
      (s) => `
    <div style="display:flex; gap:14px; margin-bottom:20px; align-items:flex-start;">
      <div style="min-width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:800; flex-shrink:0; background:rgba(255,255,255,0.05); color:${s.color}; border:1px solid rgba(255,255,255,0.08);">${s.icon}</div>
      <div>
        <p style="margin:0 0 4px; font-size:14px; font-weight:700; color:#f1f5f9;">${escapeAttrText(s.title)}</p>
        <p style="margin:0 0 6px; font-size:13px; color:#94a3b8; line-height:1.6;">${escapeAttrText(s.body)}</p>
        <a href="${base}${s.linkPath}" style="font-size:12px; font-weight:600; color:${s.color}; text-decoration:none;">${escapeAttrText(s.linkLabel)}</a>
      </div>
    </div>`
    )
    .join("");

  const main = `
      <div class="body-pad">
        <div class="hero-section">
          <span class="badge">Getting started</span>
          <h1 class="h1" style="margin-top:16px;">Your RiskSent setup guide</h1>
          <p style="margin:0; font-size:14px; color:#94a3b8;">Everything you need to know, in one place.</p>
        </div>

        <p style="font-size:14px; color:#94a3b8; margin:4px 0 20px;">Hi ${escapeAttrText(displayName)},</p>
        <p style="font-size:15px; color:#cbd5e1; margin:0 0 24px; line-height:1.7;">
          Welcome to RiskSent. Below is everything you need to set up the platform and start protecting your trading capital. Bookmark this email — it covers all the essentials.
        </p>

        <div style="background:#0a0a12; border-radius:12px; padding:20px 20px 4px; border:1px solid rgba(255,255,255,0.08);">
          ${sectionItems}
        </div>

        <div style="height:1px; background:rgba(255,255,255,0.06); margin:24px 0;"></div>

        <p style="font-size:14px; font-weight:700; color:#f1f5f9; margin:0 0 8px;">Stuck at any point?</p>
        <p style="font-size:14px; color:#94a3b8; margin:0 0 20px; line-height:1.6;">
          Reply to this email or write to <a href="mailto:support@risksent.com" style="color:#818cf8; text-decoration:none; font-weight:600;">support@risksent.com</a>. We respond fast and help you get set up.
        </p>

        <div style="text-align:center; margin:8px 0;">${emailCtaButton(`${base}/app/dashboard`, "Go to my dashboard")}</div>
      </div>`;

  return (
    emailDocumentOpen({
      documentTitle: "Your RiskSent setup guide",
      preheader: "7 steps to set up your risk management system — start here.",
      subhead: "Getting started",
    }) +
    main +
    emailDocumentFooter("You received this after activating your RiskSent free trial.")
  );
}

export type PreviewEmailType =
  | "onboarding-mastermail"
  | "marketing-drip-1"
  | "marketing-drip-6"
  | "marketing-drip-12"
  | "weekly-insight-1"
  | "weekly-insight-2"
  | "weekly-insight-3"
  | "weekly-insight-4"
  | "marketing"
  | "promo"
  | "onboarding-1"
  | "onboarding-2"
  | "onboarding-3"
  | "weekly-insight";

export function getEmailPreviewHtml(type: PreviewEmailType): string {
  const base = siteUrl();
  switch (type) {
    case "onboarding-mastermail":
      return getOnboardingMastermailTemplate("Marco");
    case "marketing-drip-1":
      return getMarketingDripHtml(1, "Marco");
    case "marketing-drip-6":
      return getMarketingDripHtml(6, "Marco");
    case "marketing-drip-12":
      return getMarketingDripHtml(12, "Marco");
    case "weekly-insight-1":
      return getWeeklyInsightHtml("Marco", 1, WEEKLY_INSIGHT_STORIES[0]!);
    case "weekly-insight-2":
      return getWeeklyInsightHtml("Marco", 2, WEEKLY_INSIGHT_STORIES[1]!);
    case "weekly-insight-3":
      return getWeeklyInsightHtml("Marco", 3, WEEKLY_INSIGHT_STORIES[2]!);
    case "weekly-insight-4":
      return getWeeklyInsightHtml("Marco", 4, WEEKLY_INSIGHT_STORIES[3]!);
    case "marketing":
      return getMarketingEmailTemplate({
        to: "demo@risksent.com",
        displayName: "Marco",
        subject: "Big news from RiskSent",
        headline: "Introducing the new AI Coach dashboard",
        body: `We've just shipped a major upgrade to the AI Coach.\n\nYou can now ask follow-up questions about any trade, get personalised rule suggestions based on your PnL history, and export weekly reports in one click.\n\nLog in and check it out — we'd love your feedback.`,
        ctaLabel: "Explore AI Coach",
        ctaUrl: `${base}/app/ai-coach`,
      });
    case "promo":
      return getPromoEmailTemplate({
        to: "demo@risksent.com",
        displayName: "Marco",
        headline: "3 months for the price of 1",
        description:
          "For a limited time, upgrade to any paid plan and get your first 3 months at the price of one. No tricks — just our way of saying thanks for being an early adopter.",
        discountLabel: "67% off",
        promoCode: "EARLY67",
        expiryLabel: "Expires May 15, 2026",
        ctaLabel: "Claim offer",
        ctaUrl: `${base}/pricing`,
      });
    case "onboarding-1":
      return getOnboardingTipTemplate("Marco", 1);
    case "onboarding-2":
      return getOnboardingTipTemplate("Marco", 2);
    case "onboarding-3":
      return getOnboardingTipTemplate("Marco", 3);
    case "weekly-insight":
      return getWeeklyInsightHtml("Marco", 1, WEEKLY_INSIGHT_STORIES[0]!);
  }
}

function escapeAttrText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
