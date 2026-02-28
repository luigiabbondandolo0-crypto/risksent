import { createSupabaseAdmin } from "./supabaseAdmin";

const TELEGRAM_API = "https://api.telegram.org";

export type SendAlertParams = {
  user_id: string;
  message: string;
  severity: string;
  solution?: string | null;
};

/**
 * Invia un alert all'utente su Telegram se ha collegato telegram_chat_id.
 * Usata da POST /api/alerts (dopo insert) e da POST /api/bot/send-alert.
 */
export async function sendAlertToTelegram(params: SendAlertParams): Promise<{ ok: boolean; reason?: string }> {
  const { user_id, message, severity, solution } = params;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return { ok: false, reason: "TELEGRAM_BOT_TOKEN not set" };
  }

  const supabase = createSupabaseAdmin();
  const { data: user, error } = await supabase
    .from("app_user")
    .select("telegram_chat_id")
    .eq("id", user_id)
    .single();

  if (error || !user?.telegram_chat_id) {
    return { ok: false, reason: "No Telegram linked" };
  }

  const severityLabel = severity === "high" ? "HIGH" : "MEDIUM";
  const solutionLine = solution ? `\n\nSoluzione: ${solution}` : "";
  const text = `<b>${severityLabel} ALERT</b>\n\n${message}${solutionLine}`;

  const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: user.telegram_chat_id,
      text,
      parse_mode: "HTML"
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { ok: false, reason: err?.description ?? res.statusText };
  }
  return { ok: true };
}

/** Username del bot per il link (es. RiskSentAlertsBot). Da env o fallback. */
export function getTelegramBotLinkUsername(): string {
  return process.env.TELEGRAM_BOT_USERNAME ?? "RiskSentAlertsBot";
}
