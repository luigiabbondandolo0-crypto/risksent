const TELEGRAM_API = "https://api.telegram.org";

export async function sendTelegramRiskMessage(chatId: string, text: string): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return { ok: false, error: "TELEGRAM_BOT_TOKEN not set" };
  }
  const id = typeof chatId === "string" && /^-?\d+$/.test(chatId.trim()) ? Number(chatId.trim()) : chatId.trim();
  const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: id,
      text,
      parse_mode: "HTML"
    })
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { description?: string };
    return { ok: false, error: err.description ?? res.statusText };
  }
  return { ok: true };
}

export function formatViolationTelegramMessage(params: {
  ruleLabel: string;
  current: string;
  limit: string;
  account: string;
  timeUtc: string;
}): string {
  const { ruleLabel, current, limit, account, timeUtc } = params;
  return (
    `🚨 <b>RiskSent Alert</b>\n` +
    `Rule violated: ${ruleLabel}\n` +
    `Current: ${current} | Limit: ${limit}\n` +
    `Account: ${account}\n` +
    `Time: ${timeUtc}`
  );
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
