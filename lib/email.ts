import { Resend } from "resend";

const FROM_EMAIL = "support@risksent.com";

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
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
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
  const logoUrl = process.env.NEXT_PUBLIC_SITE_URL 
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`
    : "https://risksent.com/logo.png";
  
  const dashboardUrl = process.env.NEXT_PUBLIC_SITE_URL 
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`
    : "https://risksent.com/dashboard";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Welcome to RiskSent</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #e2e8f0;
      background-color: #0f172a;
      padding: 0;
      margin: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #1e293b;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    }
    .email-header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .logo {
      max-width: 120px;
      height: auto;
      margin-bottom: 20px;
      border-radius: 8px;
    }
    .email-header h1 {
      color: #ffffff;
      font-size: 28px;
      font-weight: 700;
      margin: 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    .email-body {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 20px;
      color: #f1f5f9;
      margin-bottom: 20px;
      font-weight: 600;
    }
    .content {
      color: #cbd5e1;
      font-size: 16px;
      margin-bottom: 30px;
    }
    .content p {
      margin-bottom: 15px;
    }
    .features {
      background-color: #0f172a;
      border-radius: 8px;
      padding: 25px;
      margin: 30px 0;
      border-left: 4px solid #10b981;
    }
    .features h3 {
      color: #10b981;
      font-size: 18px;
      margin-bottom: 15px;
      font-weight: 600;
    }
    .features ul {
      list-style: none;
      padding: 0;
    }
    .features li {
      color: #cbd5e1;
      padding: 8px 0;
      padding-left: 25px;
      position: relative;
      font-size: 15px;
    }
    .features li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: bold;
      font-size: 18px;
    }
    .cta-button {
      display: inline-block;
      background-color: #10b981;
      color: #0f172a !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      margin: 20px 0;
      transition: background-color 0.3s ease;
    }
    .cta-button:hover {
      background-color: #059669;
    }
    .email-footer {
      background-color: #0f172a;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #1e293b;
    }
    .email-footer p {
      color: #64748b;
      font-size: 14px;
      margin: 5px 0;
    }
    .email-footer a {
      color: #10b981;
      text-decoration: none;
    }
    .email-footer a:hover {
      text-decoration: underline;
    }
    .divider {
      height: 1px;
      background-color: #334155;
      margin: 30px 0;
    }
    @media only screen and (max-width: 600px) {
      .email-container {
        margin: 0;
        border-radius: 0;
      }
      .email-header {
        padding: 30px 20px;
      }
      .email-header h1 {
        font-size: 24px;
      }
      .email-body {
        padding: 30px 20px;
      }
      .greeting {
        font-size: 18px;
      }
      .content {
        font-size: 15px;
      }
      .features {
        padding: 20px;
      }
      .cta-button {
        display: block;
        width: 100%;
        padding: 16px;
      }
    }
  </style>
</head>
<body>
  <div style="padding: 20px; background-color: #0f172a;">
    <div class="email-container">
      <div class="email-header">
        <img src="${logoUrl}" alt="RiskSent Logo" class="logo" />
        <h1>Welcome to RiskSent!</h1>
      </div>
      
      <div class="email-body">
        <div class="greeting">Hi ${userName},</div>
        
        <div class="content">
          <p>We're thrilled to have you join RiskSent, your trusted trading risk management dashboard.</p>
          
          <p>RiskSent helps you monitor your trading accounts, set risk rules, and get real-time alerts to protect your capital.</p>
        </div>

        <div class="features">
          <h3>What you can do:</h3>
          <ul>
            <li>Connect your trading accounts securely (when broker linking is enabled)</li>
            <li>Set custom risk rules and daily loss limits</li>
            <li>Monitor trades and account performance in real-time</li>
            <li>Receive instant alerts via Telegram</li>
            <li>Simulate trading challenges (FTMO/Simplified)</li>
            <li>Get AI-powered insights on your trading</li>
          </ul>
        </div>

        <div style="text-align: center;">
          <a href="${dashboardUrl}" class="cta-button">Go to Dashboard</a>
        </div>

        <div class="divider"></div>

        <div class="content">
          <p style="font-size: 14px; color: #94a3b8;">
            <strong>Need help?</strong> Our support team is here for you. Just reply to this email or contact us at support@risksent.com
          </p>
        </div>
      </div>
      
      <div class="email-footer">
        <p><strong>RiskSent</strong> – Trading Risk Dashboard</p>
        <p>Privacy first: Your investor passwords are encrypted at rest.</p>
        <p>
          <a href="${dashboardUrl}">Dashboard</a> • 
          <a href="https://risksent.com">Website</a>
        </p>
        <p style="margin-top: 20px; font-size: 12px; color: #475569;">
          This email was sent to you because you created an account on RiskSent.
        </p>
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
