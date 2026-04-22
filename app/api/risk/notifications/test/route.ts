import { NextResponse } from "next/server";
import { requireRouteUser } from "@/lib/supabase/requireRouteUser";
import { sendSmartTelegramAlert } from "@/lib/telegram/sendSmartTelegramAlert";

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

    if (!process.env.TELEGRAM_BOT_TOKEN?.trim()) {
      return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not configured" }, { status: 500 });
    }

    const result = await sendSmartTelegramAlert({
      chatId,
      alertType: "daily_drawdown",
      data: {
        currentDD: 1.8,
        limitDD: 2.0,
        balance: 10000,
      },
      fallbackMessage: "⚠️ Test alert from RiskSent — Telegram configured correctly.",
    });

    if (!result.ok) {
      const desc = result.reason ?? "Telegram request failed";
      let hint = desc;
      if (/Unauthorized/i.test(desc)) {
        hint = "Telegram rejected the bot token (wrong or revoked). Check TELEGRAM_BOT_TOKEN on the server.";
      } else if (/bot was blocked|have no rights|not enough rights|Forbidden/i.test(desc)) {
        hint = "Open your bot in Telegram and send /start, or unblock the bot — Telegram is blocking delivery to this chat.";
      } else if (/chat not found|chat_id is empty|PEER_ID_INVALID|user not found/i.test(desc)) {
        hint = "Chat ID is wrong or you have not started the bot: open Telegram, find your bot, send /start, then copy your chat ID again.";
      }
      return NextResponse.json({ error: hint, telegramDescription: desc }, { status: 400 });
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
