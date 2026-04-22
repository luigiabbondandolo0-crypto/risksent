const TELEGRAM_API = "https://api.telegram.org";

const GPT_ALERT_MODEL = "gpt-4o-mini";
const TELEGRAM_ALERT_FOOTER =
  "\n\n━━━━━━━━━━━━━━━\n🔗 <a href=\"https://risksent.com/app/risk-manager\">Open Risk Manager</a>";

const ALERT_SYSTEM_PROMPT = `You are a strict risk management assistant for traders.
Generate a professional Telegram alert message in HTML format.
Use Telegram HTML formatting: <b>bold</b>, <i>italic</i>, <code>monospace</code>.
The message must be concise, impactful, and actionable.
Use relevant emojis to make it scannable.
Always include: what happened, how serious it is, what the trader must do now.
Never exceed 300 words. Always respond in English.`;

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

async function generateAlertMessage(params: {
  ruleType: string;
  ruleLabel: string;
  current: string;
  limit: string;
  accountNickname: string;
  brokerServer: string;
  timeUtc: string;
  todayTrades: number;
  todayPl: number;
  consecutiveLosses?: number;
  currency: string;
}): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY not set");
  }

  const lossesLine =
    params.consecutiveLosses !== undefined && params.consecutiveLosses > 0
      ? `- Consecutive losses: ${params.consecutiveLosses}\n`
      : "";

  const userContent =
    `Generate a risk alert for this situation:\n` +
    `- Rule type: ${params.ruleType}\n` +
    `- Rule violated: ${params.ruleLabel}\n` +
    `- Current value: ${params.current} (limit: ${params.limit})\n` +
    `- Account: ${params.accountNickname} on ${params.brokerServer}\n` +
    `- Today's trades: ${params.todayTrades}\n` +
    `- Today's P&L: ${params.todayPl} ${params.currency}\n` +
    `- Time: ${params.timeUtc} UTC\n` +
    lossesLine +
    `\n` +
    `Make it feel urgent but professional. Include what action the trader must take immediately.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`
    },
    body: JSON.stringify({
      model: GPT_ALERT_MODEL,
      max_tokens: 400,
      temperature: 0.4,
      messages: [
        { role: "system", content: ALERT_SYSTEM_PROMPT },
        { role: "user", content: userContent }
      ]
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error: ${err}`);
  }

  const j = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = j.choices?.[0]?.message?.content?.trim() ?? "";
  if (!raw) {
    throw new Error("Empty OpenAI response");
  }

  return stripOuterCodeFence(raw);
}

function stripOuterCodeFence(s: string): string {
  let t = s.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```[a-zA-Z]*\s*\n?/, "").replace(/\n?```\s*$/, "");
  }
  return t.trim();
}

export async function sendSmartTelegramAlert(params: {
  chatId: string;
  ruleType: string;
  ruleLabel: string;
  current: string;
  limit: string;
  accountNickname: string;
  brokerServer: string;
  currency: string;
  todayTrades?: number;
  todayPl?: number;
  consecutiveLosses?: number;
}): Promise<{ ok: boolean; error?: string }> {
  const timeUtc = new Date().toISOString().slice(11, 16);
  const broker = params.brokerServer.trim() || "—";
  const todayTrades = params.todayTrades ?? 0;
  const todayPl = params.todayPl ?? 0;

  let body: string;
  try {
    body = await generateAlertMessage({
      ruleType: params.ruleType,
      ruleLabel: params.ruleLabel,
      current: params.current,
      limit: params.limit,
      accountNickname: params.accountNickname,
      brokerServer: broker,
      timeUtc,
      todayTrades,
      todayPl,
      consecutiveLosses: params.consecutiveLosses,
      currency: params.currency
    });
  } catch {
    body = formatViolationTelegramMessage({
      ruleLabel: params.ruleLabel,
      current: params.current,
      limit: params.limit,
      accountNickname: params.accountNickname,
      brokerServer: params.brokerServer.trim() ? params.brokerServer : null,
      timeUtc
    });
  }

  const fullMessage = `${body}${TELEGRAM_ALERT_FOOTER}`;
  return sendTelegramRiskMessage(params.chatId, fullMessage);
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
    case "revenge_trading":
      return "Revenge trading";
    case "risk_per_trade":
      return "Risk per trade";
    case "consecutive_losses":
      return "Consecutive losses";
    case "overtrading":
      return "Overtrading";
    default:
      return ruleType;
  }
}
