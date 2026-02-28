import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

const TELEGRAM_API = "https://api.telegram.org";

type TelegramUpdate = {
  message?: {
    chat: { id: number };
    text?: string;
  };
};

/**
 * POST /api/telegram-webhook
 * Webhook ricevuto da Telegram. Su /start [TOKEN] associa chat_id all'utente e risponde.
 * Impostare su BotFather: setwebhook → https://risksent.com/api/telegram-webhook
 */
const LOG_PREFIX = "[Telegram webhook]";

export async function POST(req: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const channelId = process.env.TELEGRAM_ALERT_CHANNEL_ID?.trim();
  const username = process.env.TELEGRAM_BOT_USERNAME?.trim();

  console.log(LOG_PREFIX, "config check", {
    token: token ? "set" : "missing",
    channelId: channelId ? "set" : "missing",
    botUsername: username || "default"
  });

  if (!token) {
    console.warn(LOG_PREFIX, "webhook rejected: TELEGRAM_BOT_TOKEN not set");
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  let update: TelegramUpdate;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const chatId = update.message?.chat?.id;
  const rawText = (update.message?.text ?? "").trim();
  const text = rawText.toLowerCase();
  console.log(LOG_PREFIX, "[verbose] update", { chatId, rawText: rawText.slice(0, 80), hasMessage: !!update.message });

  if (chatId == null) {
    return NextResponse.json({ ok: true });
  }

  if (text === "/help" || text === "aiuto") {
    await sendTelegramMessage(
      token,
      chatId,
      "RiskSent Alert Bot\n\n" +
        "• /start — Collega questa chat al tuo account (usa il link da RiskSent → Rules)\n" +
        "• /help — Questo messaggio\n\n" +
        "Dopo il collegamento riceverai qui gli alert su rischio, drawdown e revenge trading. Non serve scrivere altri comandi."
    );
    return NextResponse.json({ ok: true });
  }

  if (!text.startsWith("/start")) {
    return NextResponse.json({ ok: true });
  }

  const parts = rawText.split(/\s+/);
  const startParam = parts[1]; // /start TOKEN
  if (!startParam) {
    console.log(LOG_PREFIX, "[verbose] /start without token", { chatId });
    await sendTelegramMessage(
      token,
      chatId,
      "Ciao! Sono il bot RiskSent per gli alert di rischio.\n\n" +
        "Per collegare questa chat al tuo account:\n" +
        "1. Vai su risksent.com → Rules → Collega Telegram\n" +
        "2. Clicca \"Collega ora\" e apri il link che si apre\n" +
        "3. Torna qui e invia di nuovo /start (usando quel link, non scrivere solo /start)\n\n" +
        "Scrivi /help per altri comandi."
    );
    return NextResponse.json({ ok: true });
  }

  console.log(LOG_PREFIX, "[verbose] /start with token", { chatId, tokenPrefix: startParam.slice(0, 6) + "..." });

  const supabase = createSupabaseAdmin();
  const { data: linkRow, error: fetchErr } = await supabase
    .from("telegram_link_token")
    .select("user_id")
    .eq("token", startParam)
    .single();

  if (fetchErr || !linkRow?.user_id) {
    console.log(LOG_PREFIX, "[verbose] link token not found or expired", {
      error: fetchErr?.message,
      code: (fetchErr as { code?: string })?.code,
      chatId,
      tokenPrefix: startParam.slice(0, 6) + "..."
    });
    await sendTelegramMessage(token, chatId, "Link non valido o scaduto. Vai su RiskSent → Rules → Collega Telegram e genera un nuovo link.");
    return NextResponse.json({ ok: true });
  }

  const updatedAt = new Date().toISOString();
  const { data: updatedRow, error: updateErr } = await supabase
    .from("app_user")
    .update({
      telegram_chat_id: String(chatId),
      updated_at: updatedAt
    })
    .eq("id", linkRow.user_id)
    .select("id")
    .single();

  console.log(LOG_PREFIX, "[verbose] app_user update result", {
    updatedRow: !!updatedRow,
    updateError: updateErr?.message,
    updateCode: (updateErr as { code?: string })?.code,
    userId: linkRow.user_id.slice(0, 8) + "...",
    chatId
  });

  if (updateErr && (updateErr as { code?: string }).code !== "PGRST116") {
    console.warn(LOG_PREFIX, "link failed: app_user update error", updateErr.message);
    await sendTelegramMessage(token, chatId, "Errore collegamento. Riprova da RiskSent.");
    return NextResponse.json({ ok: true });
  }

  if (!updatedRow) {
    console.log(LOG_PREFIX, "[verbose] no app_user row, inserting", { userId: linkRow.user_id.slice(0, 8) + "..." });
    const { error: insertErr } = await supabase.from("app_user").insert({
      id: linkRow.user_id,
      role: "customer",
      daily_loss_pct: 5,
      max_risk_per_trade_pct: 1,
      max_exposure_pct: 6,
      revenge_threshold_trades: 3,
      telegram_chat_id: String(chatId),
      updated_at: updatedAt
    });
    if (insertErr) {
      console.warn(LOG_PREFIX, "[verbose] app_user insert failed", { error: insertErr.message, code: (insertErr as { code?: string })?.code });
      await sendTelegramMessage(token, chatId, "Errore collegamento. Riprova da RiskSent.");
      return NextResponse.json({ ok: true });
    }
    console.log(LOG_PREFIX, "[verbose] app_user created and chat linked", { userId: linkRow.user_id.slice(0, 8) + "...", chatId });
  }

  const { error: delErr } = await supabase.from("telegram_link_token").delete().eq("token", startParam);
  console.log(LOG_PREFIX, "[verbose] token consumed, chat linked", {
    userId: linkRow.user_id.slice(0, 8) + "...",
    chatId,
    deleteError: delErr?.message ?? "none"
  });

  await sendTelegramMessage(
    token,
    chatId,
    "✅ Chat collegata!\n\n" +
      "Collegamento unico: non serve fare altro. Riceverai qui gli alert su rischio, drawdown e revenge trading.\n" +
      "Gli stessi alert li vedi anche su RiskSent → Rules → Alerts Center.\n\n" +
      "Scrivi /help per info."
  );

  return NextResponse.json({ ok: true });
}

async function sendTelegramMessage(botToken: string, chatId: number, text: string): Promise<void> {
  try {
    await fetch(`${TELEGRAM_API}/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text })
    });
  } catch {
    // ignore
  }
}
