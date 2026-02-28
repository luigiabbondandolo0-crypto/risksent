import { createSupabaseAdmin } from "./supabaseAdmin";

const TELEGRAM_API = "https://api.telegram.org";

export type SendAlertParams = {
  user_id: string;
  message: string;
  severity: string;
  solution?: string | null;
};

const LOG_PREFIX = "[Telegram]";

/**
 * Invia un alert: all'utente su Telegram (se ha telegram_chat_id) e al canale gestore (se TELEGRAM_ALERT_CHANNEL_ID).
 * Usata da POST /api/alerts (dopo insert) e da POST /api/bot/send-alert.
 */
export async function sendAlertToTelegram(params: SendAlertParams): Promise<{ ok: boolean; reason?: string }> {
  const { user_id, message, severity, solution } = params;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const channelId = process.env.TELEGRAM_ALERT_CHANNEL_ID?.trim();
  const username = process.env.TELEGRAM_BOT_USERNAME?.trim();

  console.log(LOG_PREFIX, "config check", {
    token: token ? "set" : "missing",
    channelId: channelId ? "set" : "missing",
    botUsername: username || "default"
  });

  if (!token) {
    console.warn(LOG_PREFIX, "send skipped: TELEGRAM_BOT_TOKEN not set");
    return { ok: false, reason: "TELEGRAM_BOT_TOKEN not set" };
  }

  const severityLabel = severity === "high" ? "HIGH" : "MEDIUM";
  const solutionLine = solution ? `\n\nSoluzione: ${solution}` : "";
  const text = `<b>${severityLabel} ALERT</b>\n\n${message}${solutionLine}`;

  const supabase = createSupabaseAdmin();
  const { data: user } = await supabase
    .from("app_user")
    .select("telegram_chat_id")
    .eq("id", user_id)
    .single();

  const userLinked = !!user?.telegram_chat_id;
  const chatIdLen = user?.telegram_chat_id ? String(user.telegram_chat_id).length : 0;
  console.log(LOG_PREFIX, "[verbose] alert target", {
    user_id: user_id.slice(0, 8) + "...",
    userLinked,
    telegram_chat_id: user?.telegram_chat_id ? `set(len=${chatIdLen})` : "null",
    dbError: (user as unknown as { error?: string })?.error
  });

  if (user?.telegram_chat_id) {
    const res = await sendTelegramMessage(token, user.telegram_chat_id, text);
    console.log(LOG_PREFIX, "[verbose] send to user", {
      ok: res.ok,
      reason: res.reason,
      chatIdLen
    });
  }

  if (channelId) {
    const channelText = `[Alert utente]\n${text}`;
    const res = await sendTelegramMessage(token, channelId, channelText);
    if (res.ok) {
      console.log(LOG_PREFIX, "send to channel ok");
    } else {
      console.warn(LOG_PREFIX, "channel send failed:", res.reason, "(add bot as admin to channel?)");
    }
  }

  return { ok: true };
}

async function sendTelegramMessage(
  token: string,
  chatId: string | number,
  text: string
): Promise<{ ok: boolean; reason?: string }> {
  const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML"
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { ok: false, reason: (err as { description?: string })?.description ?? res.statusText };
  }
  return { ok: true };
}

/** Username del bot per il link (es. RiskSentAlertsBot). Da env o fallback. */
export function getTelegramBotLinkUsername(): string {
  return process.env.TELEGRAM_BOT_USERNAME ?? "RiskSentAlertsBot";
}
