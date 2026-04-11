const TELEGRAM_API = "https://api.telegram.org";

export async function sendTelegramRiskMessage(chatId: string, text: string): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return { ok: false, error: "TELEGRAM_BOT_TOKEN not set" };
  }
  const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId.trim(),
      text,
      parse_mode: "HTML"
    })
  });
  const payload = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    description?: string;
  };
  if (payload.ok !== true) {
    return { ok: false, error: payload.description ?? res.statusText };
  }
  return { ok: true };
}

export function formatViolationTelegramMessage(params: {
  ruleLabel: string;
  current: string;
  limit: string;
  /** Display name e.g. journal nickname */
  accountNickname: string;
  brokerServer: string | null;
  timeUtc: string;
}): string {
  const { ruleLabel, current, limit, accountNickname, brokerServer, timeUtc } = params;
  const serverLine = brokerServer?.trim()
    ? `🔢 Server: <code>${escapeHtml(brokerServer.trim())}</code>\n`
    : "";
  return (
    `🚨 <b>RiskSent Alert</b>\n` +
    `━━━━━━━━━━━━━━━\n` +
    `📊 Account: <b>${escapeHtml(accountNickname)}</b>\n` +
    serverLine +
    `\n` +
    `⚠️ Rule violated: ${escapeHtml(ruleLabel)}\n` +
    `📉 Current: ${escapeHtml(current)} | Limit: ${escapeHtml(limit)}\n` +
    `\n` +
    `🕐 Time: ${escapeHtml(timeUtc)} UTC\n` +
    `━━━━━━━━━━━━━━━\n` +
    `Open RiskSent to review → risksent.com/app/risk-manager`
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function ruleTypeToLabel(ruleType: string): string {
  switch (ruleType) {
    case "daily_dd":
      return "Daily DD limit";
    case "exposure":
      return "Max exposure";
    case "revenge":
      return "Revenge trading";
    case "risk_per_trade":
      return "Risk per trade";
    default:
      return ruleType;
  }
}
