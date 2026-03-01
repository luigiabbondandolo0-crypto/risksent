import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "support@risksent.com";

export interface WelcomeEmailParams {
  to: string;
  userName?: string;
}

/**
 * Sends a welcome email to a new user
 */
export async function sendWelcomeEmail({ to, userName }: WelcomeEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not set, skipping welcome email");
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  try {
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
          
          <p>RiskSent helps you monitor your MT4/MT5 trading accounts, set risk rules, and get real-time alerts to protect your capital.</p>
        </div>

        <div class="features">
          <h3>What you can do:</h3>
          <ul>
            <li>Connect your MetaTrader accounts securely</li>
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
