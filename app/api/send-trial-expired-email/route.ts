import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "RiskSent <info@risksent.com>";
const REPLY_TO = process.env.RESEND_REPLY_TO || "support@risksent.com";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://risksent.com";
}

function getTrialExpiredTemplate(userName: string): string {
  const base = siteUrl();
  const pricingUrl = `${base}/pricing`;
  const billingUrl = `${base}/app/billing`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your RiskSent trial has ended</title>
  <style>
    body { margin:0; padding:0; background:#080809; color:#e2e8f0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; line-height:1.6; }
    .wrap { padding:20px; background:#080809; }
    .card { max-width:600px; margin:0 auto; background:#0e0e12; border-radius:14px; overflow:hidden; border:1px solid rgba(255,255,255,0.07); }
    .hero { padding:40px 32px 32px; text-align:center; border-bottom:1px solid rgba(255,255,255,0.06); }
    .wordmark { font-size:22px; font-weight:900; letter-spacing:-0.02em; color:#fff; margin-bottom:24px; display:block; }
    .hero h1 { color:#fff; font-size:26px; font-weight:800; margin:0 0 10px; letter-spacing:-0.02em; }
    .hero p { color:#64748b; font-size:14px; margin:0; }
    .body { padding:32px; }
    .greeting { font-size:16px; font-weight:600; color:#f1f5f9; margin-bottom:14px; }
    .content { color:#94a3b8; font-size:14px; }
    .content p { margin:0 0 14px; }
    .divider { height:1px; background:rgba(255,255,255,0.06); margin:24px 0; }
    .feature-grid { display:table; width:100%; margin:20px 0; }
    .feature-row { display:table-row; }
    .feature-icon { display:table-cell; padding:8px 12px 8px 0; width:28px; color:#ff8c00; font-size:16px; vertical-align:top; }
    .feature-text { display:table-cell; padding:8px 0; font-size:13px; color:#cbd5e1; vertical-align:top; }
    .cta-wrap { text-align:center; margin:28px 0; }
    .cta { display:inline-block; background:linear-gradient(135deg,#ff3c3c,#ff8c00); color:#000!important; text-decoration:none; padding:14px 32px; border-radius:10px; font-weight:800; font-size:15px; letter-spacing:-0.01em; }
    .secondary { display:block; color:#475569!important; text-decoration:none; font-size:12px; margin-top:12px; }
    .footer { padding:20px 32px; text-align:center; border-top:1px solid rgba(255,255,255,0.06); }
    .footer p { color:#334155; font-size:12px; margin:4px 0; }
    .footer a { color:#475569; text-decoration:none; }
    @media (max-width:600px){ .hero{padding:28px 20px} .body{padding:24px 20px} .footer{padding:16px 20px} }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="hero">
        <span class="wordmark">RiskSent</span>
        <h1>Your free trial has ended</h1>
        <p>Your workspace is now in read-only demo mode</p>
      </div>
      <div class="body">
        <div class="greeting">Hi ${userName},</div>
        <div class="content">
          <p>Your 7-day free trial of RiskSent has expired. Your data is safe and your settings are preserved — you just need to pick a plan to re-activate live features.</p>

          <div class="divider"></div>

          <p style="font-size:13px; font-weight:600; color:#cbd5e1; margin-bottom:12px;">What you&apos;ll get back immediately:</p>
          <div class="feature-grid">
            <div class="feature-row">
              <div class="feature-icon">→</div>
              <div class="feature-text">Live risk checks and daily-loss rules on all connected accounts</div>
            </div>
            <div class="feature-row">
              <div class="feature-icon">→</div>
              <div class="feature-text">Instant Telegram alerts when limits are hit</div>
            </div>
            <div class="feature-row">
              <div class="feature-icon">→</div>
              <div class="feature-text">Backtesting sessions and strategy replay</div>
            </div>
            <div class="feature-row">
              <div class="feature-icon">→</div>
              <div class="feature-text">AI Coach trade analysis and journaling</div>
            </div>
          </div>

          <div class="divider"></div>

          <div class="cta-wrap">
            <a href="${pricingUrl}" class="cta">Choose a plan</a>
            <a href="${billingUrl}" class="secondary">or visit billing page →</a>
          </div>

          <p style="font-size:12px; color:#334155; margin-top:8px;">
            No action needed if you don&apos;t want to upgrade. Your account stays in demo mode and your data remains accessible.
          </p>
        </div>
      </div>
      <div class="footer">
        <p>
          <a href="${pricingUrl}">Pricing</a> &nbsp;•&nbsp;
          <a href="${billingUrl}">Billing</a> &nbsp;•&nbsp;
          <a href="mailto:support@risksent.com">support@risksent.com</a>
        </p>
        <p style="margin-top:10px;">You received this because your RiskSent trial expired.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, userName } = body as { to?: string; userName?: string };

    if (!to || typeof to !== "string") {
      return NextResponse.json({ error: "Missing `to` email address" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("[Email] RESEND_API_KEY not set — skipping trial-expired email");
      return NextResponse.json({ success: true, skipped: true });
    }

    const resend = new Resend(apiKey);
    const displayName = userName || to.split("@")[0];

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      replyTo: REPLY_TO,
      to,
      subject: "Your RiskSent trial has ended — choose a plan to continue",
      html: getTrialExpiredTemplate(displayName),
    });

    if (error) {
      console.error("[Email] Failed to send trial-expired email:", error);
      return NextResponse.json({ error: error.message || "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
