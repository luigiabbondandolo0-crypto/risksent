import { Resend } from "resend";

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
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://risksent.com";
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
      subject: "Welcome to RiskSent! 🎉",
      html: getWelcomeEmailTemplate(displayName)
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

/**
 * Modern, responsive welcome email template
 */
function getWelcomeEmailTemplate(userName: string): string {
  const base = siteUrl();
  const dashboardUrl = `${base}/app/dashboard`;
  const backtestingUrl = `${base}/app/backtesting`;
  const telegramUrl = `${base}/app/risk-manager`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to RiskSent</title>
  <style>
    body { margin:0; padding:0; background:#080809; color:#e2e8f0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; line-height:1.6; }
    .wrap { padding:20px; background:#080809; }
    .card { max-width:600px; margin:0 auto; background:#0e0e12; border-radius:14px; overflow:hidden; border:1px solid rgba(255,255,255,0.07); }
    .hero { padding:40px 32px 32px; text-align:center; border-bottom:1px solid rgba(255,255,255,0.06); }
    .wordmark { font-size:24px; font-weight:900; letter-spacing:-0.02em; color:#fff; margin-bottom:20px; display:block; }
    .hero-badge { display:inline-block; padding:5px 14px; border-radius:99px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:#ff8c00; background:rgba(255,140,0,0.1); border:1px solid rgba(255,140,0,0.25); margin-bottom:16px; }
    .hero h1 { color:#fff; font-size:28px; font-weight:900; margin:0 0 10px; letter-spacing:-0.025em; }
    .hero p { color:#64748b; font-size:14px; margin:0; }
    .body { padding:32px; }
    .greeting { font-size:16px; font-weight:600; color:#f1f5f9; margin-bottom:12px; }
    .intro { color:#94a3b8; font-size:14px; margin-bottom:28px; }
    .steps-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:#334155; margin-bottom:14px; }
    .step { display:flex; align-items:flex-start; gap:14px; margin-bottom:14px; padding:16px; border-radius:10px; border:1px solid rgba(255,255,255,0.06); background:rgba(255,255,255,0.02); text-decoration:none; color:inherit; }
    .step-num { min-width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; flex-shrink:0; }
    .step-body { flex:1; }
    .step-title { font-size:13px; font-weight:700; color:#f1f5f9; margin-bottom:3px; }
    .step-desc { font-size:12px; color:#64748b; margin:0; }
    .divider { height:1px; background:rgba(255,255,255,0.06); margin:24px 0; }
    .cta-wrap { text-align:center; margin:24px 0 0; }
    .cta { display:inline-block; background:linear-gradient(135deg,#ff3c3c,#ff8c00); color:#000!important; text-decoration:none; padding:14px 32px; border-radius:10px; font-weight:800; font-size:15px; letter-spacing:-0.01em; }
    .footer { padding:20px 32px; text-align:center; border-top:1px solid rgba(255,255,255,0.06); }
    .footer p { color:#334155; font-size:12px; margin:4px 0; }
    .footer a { color:#475569; text-decoration:none; }
    @media (max-width:600px){ .hero{padding:28px 20px 24px} .body{padding:24px 20px} .footer{padding:16px 20px} .hero h1{font-size:24px} }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="hero">
        <span class="wordmark">RiskSent</span>
        <div class="hero-badge">Trial activated</div>
        <h1>Welcome, ${userName}</h1>
        <p>Your 7-day free trial is now active. Let&apos;s get you set up.</p>
      </div>
      <div class="body">
        <div class="greeting">Here&apos;s how to get the most from your trial:</div>

        <p class="steps-label">3 steps to start</p>

        <a href="${dashboardUrl}" class="step" style="display:flex">
          <div class="step-num" style="background:rgba(255,60,60,0.12);color:#ff3c3c;">1</div>
          <div class="step-body">
            <div class="step-title">Start your trial &amp; explore the dashboard</div>
            <p class="step-desc">Get a full overview of your risk exposure, open trades, and account health at a glance.</p>
          </div>
        </a>

        <a href="${backtestingUrl}" class="step" style="display:flex">
          <div class="step-num" style="background:rgba(99,102,241,0.12);color:#6366f1;">2</div>
          <div class="step-body">
            <div class="step-title">Try backtesting a strategy</div>
            <p class="step-desc">Replay historical candles bar-by-bar, place trades, and measure your edge — no capital at risk.</p>
          </div>
        </a>

        <a href="${telegramUrl}" class="step" style="display:flex">
          <div class="step-num" style="background:rgba(0,230,118,0.1);color:#00e676;">3</div>
          <div class="step-body">
            <div class="step-title">Connect Telegram alerts</div>
            <p class="step-desc">Get instant notifications when a risk rule is triggered — wherever you are.</p>
          </div>
        </a>

        <div class="divider"></div>

        <div class="cta-wrap">
          <a href="${dashboardUrl}" class="cta">Open my dashboard</a>
        </div>

        <p style="font-size:12px;color:#334155;text-align:center;margin-top:16px;">
          Questions? Reply to this email or write to <a href="mailto:support@risksent.com" style="color:#475569;">support@risksent.com</a>
        </p>
      </div>
      <div class="footer">
        <p>
          <a href="${dashboardUrl}">Dashboard</a> &nbsp;•&nbsp;
          <a href="${base}/pricing">Pricing</a> &nbsp;•&nbsp;
          <a href="mailto:support@risksent.com">Support</a>
        </p>
        <p style="margin-top:10px;">You received this because you created a RiskSent account.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * "Trial ends soon" reminder template.
 * Re-uses the same visual language as the welcome email for brand consistency.
 */
function getTrialEndingEmailTemplate(
  userName: string,
  trialEndsAt: string,
  daysLeft: number
): string {
  const base = siteUrl();
  const logoUrl = `${base}/logo.png`;
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
      : `You still have ${daysLeft} day${daysLeft === 1 ? "" : "s"} of full access. Pick a plan now to keep your risk rules, live alerts and AI insights running without interruption.`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your RiskSent trial is ending</title>
  <style>
    body { margin:0; padding:0; background:#0f172a; color:#e2e8f0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; line-height:1.6; }
    .wrap { padding:20px; background:#0f172a; }
    .card { max-width:600px; margin:0 auto; background:#1e293b; border-radius:12px; overflow:hidden; box-shadow:0 10px 25px rgba(0,0,0,.5); }
    .hero { background:linear-gradient(135deg,#ff3c3c 0%,#ff8c00 100%); padding:36px 30px; text-align:center; }
    .logo { max-width:110px; border-radius:8px; margin-bottom:16px; }
    .hero h1 { color:#0f172a; font-size:26px; font-weight:800; margin:0; letter-spacing:-0.01em; }
    .body { padding:36px 30px; }
    .greeting { font-size:18px; font-weight:600; color:#f1f5f9; margin-bottom:14px; }
    .content { color:#cbd5e1; font-size:15px; }
    .content p { margin:0 0 14px; }
    .countdown { margin:28px 0; padding:22px; border-radius:10px; background:#0f172a; border-left:4px solid #ff8c00; }
    .countdown .days { font-size:36px; font-weight:800; color:#ff8c00; letter-spacing:-0.02em; }
    .countdown .label { font-size:13px; color:#94a3b8; text-transform:uppercase; letter-spacing:.08em; margin-top:4px; }
    .countdown .end { font-size:13px; color:#64748b; margin-top:10px; }
    .cta { display:inline-block; background:linear-gradient(135deg,#ff3c3c,#ff8c00); color:#0f172a!important; text-decoration:none; padding:14px 30px; border-radius:8px; font-weight:700; font-size:15px; }
    .cta-secondary { display:inline-block; color:#94a3b8!important; text-decoration:none; padding:14px 20px; font-size:13px; font-weight:600; }
    .plans { background:#0f172a; border-radius:10px; padding:20px; margin-top:22px; border:1px solid #334155; }
    .plans h3 { color:#f1f5f9; font-size:15px; margin:0 0 12px; font-weight:600; }
    .plans ul { list-style:none; padding:0; margin:0; }
    .plans li { color:#cbd5e1; padding:6px 0 6px 22px; position:relative; font-size:14px; }
    .plans li:before { content:"→"; position:absolute; left:0; color:#ff8c00; font-weight:bold; }
    .footer { background:#0f172a; padding:24px; text-align:center; border-top:1px solid #1e293b; }
    .footer p { color:#64748b; font-size:13px; margin:4px 0; }
    .footer a { color:#ff8c00; text-decoration:none; }
    @media (max-width:600px){ .hero{padding:28px 20px} .body{padding:28px 20px} .cta,.cta-secondary{display:block;width:100%;text-align:center;padding:14px;margin:6px 0} }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="hero">
        <img src="${logoUrl}" alt="RiskSent" class="logo" />
        <h1>${headline}</h1>
      </div>
      <div class="body">
        <div class="greeting">Hi ${userName},</div>
        <div class="content">
          <p>${sub}</p>

          <div class="countdown">
            <div class="days">${Math.max(0, daysLeft)}</div>
            <div class="label">day${daysLeft === 1 ? "" : "s"} left</div>
            <div class="end">Trial ends on <strong>${endDate}</strong></div>
          </div>

          <p style="text-align:center; margin:24px 0;">
            <a href="${pricingUrl}" class="cta">Choose a plan</a>
            <br/>
            <a href="${billingUrl}" class="cta-secondary">or manage your billing →</a>
          </p>

          <div class="plans">
            <h3>What you keep when you upgrade</h3>
            <ul>
              <li>Live risk checks on every connected broker account</li>
              <li>Daily-loss, drawdown and exposure rules with instant Telegram alerts</li>
              <li>FTMO / Simplified challenge simulator and AI trade insights</li>
              <li>Historical PnL and audit log for every action</li>
            </ul>
          </div>

          <p style="font-size:13px; color:#94a3b8; margin-top:22px;">
            Not ready to upgrade? No action needed — your workspace simply switches to read-only demo mode when the trial ends. You can subscribe any time from the billing page.
          </p>
        </div>
      </div>
      <div class="footer">
        <p><strong>RiskSent</strong> — Trading Risk Dashboard</p>
        <p>
          <a href="${pricingUrl}">Pricing</a> •
          <a href="${billingUrl}">Billing</a> •
          <a href="mailto:support@risksent.com">support@risksent.com</a>
        </p>
        <p style="margin-top:14px; font-size:11px; color:#475569;">
          You're receiving this because your free trial is about to end. Once the trial expires you will not receive further reminders of this kind.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
