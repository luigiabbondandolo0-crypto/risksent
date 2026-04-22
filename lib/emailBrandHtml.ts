/**
 * Markup e stili condivisi per le email transazionali, allineati a palette e wordmark in-app
 * (globals: --rs-bg, --rs-surface, indigo / cyan, JetBrains per RISK/SENT).
 */

export function emailSiteBase(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://risksent.com";
}

export function emailLogoRUrl(): string {
  return `${emailSiteBase()}/brand/risk-sent-r.png`;
}

/** CTA coerente con UI (indigo → cyan) */
function ctaGradient(): string {
  return "linear-gradient(135deg, #6366f1 0%, #4f46e5 45%, #22d3ee 100%)";
}

/** Stile base card / tipografia: Outfit-like stack per body, JetBrains per lockup */
function emailSharedStyles(): string {
  return `
    body { margin:0; padding:0; background:#070710; color:#e2e8f0; font-family:Outfit,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif; line-height:1.55; -webkit-font-smoothing:antialiased; }
    .wrap { padding:24px 16px; background:#070710; }
    .preheader { display:none!important; max-height:0; overflow:hidden; mso-hide:all; opacity:0; color:transparent; font-size:1px; line-height:0; }
    .card { max-width:600px; margin:0 auto; background:linear-gradient(128deg, rgba(99,102,241,0.1) 0%, #0D0D18 42%, #13131E 100%); border-radius:14px; overflow:hidden; border:1px solid rgba(255,255,255,0.08); }
    .brand-bar { padding:28px 28px 20px; text-align:center; border-bottom:1px solid rgba(255,255,255,0.06); }
    .brand-table { margin:0 auto; border-collapse:collapse; }
    .logo-cell { padding:0 12px 0 0; vertical-align:middle; }
    .logo-img { display:block; width:48px; height:48px; border:0; }
    .wm { font-family:'JetBrains Mono',ui-monospace,Consolas,monospace; font-size:17px; font-weight:700; letter-spacing:0.14em; line-height:1.2; }
    .wm-risk { color:#f8fafc; }
    .wm-slash { color:#ff3c3c; padding:0 0.12em; }
    .wm-sent { color:#f8fafc; }
    .body-pad { padding:32px 28px; }
    .h1 { color:#f8fafc; font-size:24px; font-weight:800; margin:0 0 8px; letter-spacing:-0.02em; }
    .hero-section { text-align:center; margin-bottom:24px; }
    .badge { display:inline-block; padding:5px 14px; border-radius:999px; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.12em; color:#a5b4fc; background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.25); }
    .steps-label { font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.12em; color:#64748b; margin:0 0 14px; }
    .step { display:block; text-decoration:none; color:inherit; margin-bottom:12px; padding:16px; border-radius:10px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.02); }
    .step-inner { display:flex; align-items:flex-start; gap:14px; }
    .step-num { min-width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; flex-shrink:0; background:rgba(99,102,241,0.12); color:#a5b4fc; }
    .step-title { font-size:14px; font-weight:700; color:#f1f5f9; margin:0 0 4px; }
    .step-desc { font-size:13px; color:#94a3b8; margin:0; }
    .countdown { margin:20px 0; padding:20px; border-radius:10px; background:#0a0a12; border-left:3px solid #6366f1; }
    .countdown .days { font-size:36px; font-weight:800; color:#a5b4fc; letter-spacing:-0.02em; }
    .countdown .end { font-size:13px; color:#94a3b8; margin-top:8px; }
    .plans { background:#0a0a12; border-radius:10px; padding:20px; margin-top:20px; border:1px solid rgba(99,102,241,0.2); }
    .plans h3 { color:#f1f5f9; font-size:15px; margin:0 0 12px; font-weight:700; }
    .plans ul { list-style:none; padding:0; margin:0; }
    .plans li { color:#cbd5e1; padding:6px 0 6px 22px; position:relative; font-size:14px; }
    .plans li:before { content:"→"; position:absolute; left:0; color:#22d3ee; font-weight:bold; }
    @media (max-width:600px) {
      .body-pad { padding:24px 18px; }
      .logo-img { width:44px; height:44px; }
      .h1 { font-size:20px; }
    }
  `;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Inizio documento: preheader, card, brand (logo R + RISK/SENT) e sottotitolo opzionale in maiuscoletto.
 * Chiudere con `emailDocumentFooter`.
 */
export function emailDocumentOpen(opts: { documentTitle: string; preheader: string; subhead?: string }): string {
  const { documentTitle, preheader, subhead } = opts;
  const logo = emailLogoRUrl();
  const subBlock = subhead
    ? `<p style="margin:16px 0 0; font-size:12px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:#94a3b8;">${escapeHtml(subhead)}</p>`
    : "";
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(documentTitle)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@600;700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>${emailSharedStyles()}</style>
</head>
<body>
  <div class="preheader">${escapeHtml(preheader)}</div>
  <div class="wrap">
    <div class="card">
      <div class="brand-bar" role="banner">
        <table class="brand-table" role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
          <tr>
            <td class="logo-cell">
              <img class="logo-img" src="${logo}" width="48" height="48" alt="RiskSent" style="width:48px;height:48px;display:block;"/>
            </td>
            <td class="logo-cell" style="padding-right:0;">
              <div class="wm"><span class="wm-risk">RISK</span><span class="wm-slash">/</span><span class="wm-sent">SENT</span></div>
            </td>
          </tr>
        </table>
        ${subBlock}
      </div>
  `.trim();
}

/**
 * Chiusura: footer con link, testo legale, chiusure div/body/html.
 */
export function emailDocumentFooter(footerNote: string, extraLine?: string): string {
  const base = emailSiteBase();
  const safeNote = escapeHtml(footerNote);
  const extra = extraLine
    ? `<p style="margin:14px 0 0; font-size:11px; color:#475569; max-width:480px; margin-left:auto; margin-right:auto;">${escapeHtml(extraLine)}</p>`
    : "";
  return `
      <div class="body-pad" style="padding-top:0; padding-bottom:0;">
        <div style="height:1px; background:rgba(255,255,255,0.06); margin:0 0 20px;"></div>
        <p style="text-align:center; margin:0 0 8px; font-size:12px; color:#64748b;">
          <a href="${base}/app/dashboard" style="color:#818cf8; text-decoration:none; font-weight:600;">Dashboard</a>
          <span style="color:#334155; padding:0 8px;">·</span>
          <a href="${base}/pricing" style="color:#818cf8; text-decoration:none; font-weight:600;">Pricing</a>
          <span style="color:#334155; padding:0 8px;">·</span>
          <a href="mailto:support@risksent.com" style="color:#818cf8; text-decoration:none; font-weight:600;">Support</a>
        </p>
        <p style="text-align:center; margin:0; font-size:12px; color:#475569;">${safeNote}</p>
        ${extra}
        <p style="text-align:center; margin:16px 0 0; font-size:11px; color:#334155;">© RiskSent</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function emailCtaButton(href: string, label: string): string {
  return `
  <a href="${href}" target="_blank" rel="noopener noreferrer" style="display:inline-block; background:${ctaGradient()}; color:#f8fafc !important; text-decoration:none; padding:14px 32px; border-radius:10px; font-weight:800; font-size:15px; letter-spacing:0.01em; text-align:center;">${escapeHtml(label)}</a>
  `.trim();
}

export function emailCtaSubLink(href: string, label: string): string {
  return `
  <a href="${href}" style="display:inline-block; margin-top:12px; color:#94a3b8 !important; text-decoration:none; font-size:13px; font-weight:600;">${escapeHtml(label)}</a>
  `.trim();
}
