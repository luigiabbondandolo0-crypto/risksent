import { NextResponse } from "next/server";
import { requireRouteUser } from "@/lib/supabase/requireRouteUser";

type TelegramApiResult = {
  ok?: boolean;
  description?: string;
  error_code?: number;
};

export async function POST(request: Request) {
  try {
    const auth = await requireRouteUser(request);
    if (auth instanceof NextResponse) return auth;
    const { supabase, user } = auth;

    const { data, error: dbError } = await supabase
      .from("risk_notifications")
      .select("telegram_chat_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    const chatId = data?.telegram_chat_id?.trim();
    if (!chatId) {
      return NextResponse.json({ error: "Set a Telegram chat ID first" }, { status: 400 });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
    if (!token) {
      return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not configured" }, { status: 500 });
    }

    const text =
      `✅ <b>RiskSent</b>\n` +
      `Test message — Telegram alerts configured correctly.\n` +
      `Time: ${new Date().toISOString().slice(11, 19)} UTC`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let res: Response;
    try {
      res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML"
        }),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }

    const payload = (await res.json().catch(() => ({}))) as TelegramApiResult;

    const telegramFailed = payload.ok !== true;
    if (telegramFailed || !res.ok) {
      const desc = payload.description ?? res.statusText ?? "Telegram request failed";
      const code = payload.error_code;

      let hint = desc;
      if (code === 401 || /Unauthorized/i.test(desc)) {
        hint =
          "Telegram rejected the bot token (wrong or revoked). Check TELEGRAM_BOT_TOKEN on the server.";
      } else if (code === 403 || /bot was blocked|have no rights|not enough rights|Forbidden/i.test(desc)) {
        hint =
          "Open your bot in Telegram and send /start, or unblock the bot — Telegram is blocking delivery to this chat.";
      } else if (
        code === 400 &&
        /chat not found|chat_id is empty|PEER_ID_INVALID|user not found/i.test(desc)
      ) {
        hint =
          "Chat ID is wrong or you have not started the bot: open Telegram, find your bot, send /start, then copy your chat ID again.";
      }

      const status =
        code === 401 ? 500 : code === 400 || code === 403 || code === 404 ? 400 : !res.ok && res.status >= 400 && res.status < 500 ? 400 : 502;

      return NextResponse.json(
        { error: hint, telegramDescription: desc, telegramErrorCode: code },
        { status }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "The operation was aborted." || message.includes("abort")) {
      return NextResponse.json({ error: "Telegram request timed out — try again." }, { status: 504 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
