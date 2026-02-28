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
export async function POST(req: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  let update: TelegramUpdate;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const chatId = update.message?.chat?.id;
  const text = update.message?.text?.trim();
  if (chatId == null || !text) {
    return NextResponse.json({ ok: true });
  }

  if (!text.startsWith("/start")) {
    return NextResponse.json({ ok: true });
  }

  const parts = text.split(/\s+/);
  const startParam = parts[1]; // /start TOKEN
  if (!startParam) {
    await sendTelegramMessage(token, chatId, "Ciao! Per collegare il tuo account RiskSent:\n1. Vai su RiskSent → Rules → Collega Telegram\n2. Clicca \"Collega ora\" e apri il link\n3. Torna qui e invia di nuovo /start dal link ricevuto.");
    return NextResponse.json({ ok: true });
  }

  const supabase = createSupabaseAdmin();
  const { data: linkRow, error: fetchErr } = await supabase
    .from("telegram_link_token")
    .select("user_id")
    .eq("token", startParam)
    .single();

  if (fetchErr || !linkRow?.user_id) {
    await sendTelegramMessage(token, chatId, "Link non valido o scaduto. Vai su RiskSent → Rules → Collega Telegram e genera un nuovo link.");
    return NextResponse.json({ ok: true });
  }

  const { error: updateErr } = await supabase
    .from("app_user")
    .update({
      telegram_chat_id: String(chatId),
      updated_at: new Date().toISOString()
    })
    .eq("id", linkRow.user_id);

  if (updateErr) {
    await sendTelegramMessage(token, chatId, "Errore collegamento. Riprova da RiskSent.");
    return NextResponse.json({ ok: true });
  }

  await supabase.from("telegram_link_token").delete().eq("token", startParam);

  await sendTelegramMessage(
    token,
    chatId,
    "✅ Chat collegata! Da ora riceverai gli alert RiskSent qui. Torna sull'app e clicca \"Verifica collegamento\" se necessario."
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
