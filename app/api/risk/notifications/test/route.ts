import { NextResponse } from "next/server";
import { requireRouteUser } from "@/lib/supabase/requireRouteUser";
import { sendSmartTelegramAlert } from "@/lib/telegram/sendSmartTelegramAlert";
import { effectiveNotifySettings, notifyFlagForRule, type NotifySettingsLike } from "@/lib/risk/violationEngine";

const CONNECTED_MESSAGE =
  "✅ RiskSent Alerts — Connected!\n\nYour Telegram is now linked to RiskSent. You'll receive real-time alerts when your risk rules are triggered.\n\nStay disciplined. 🎯";

export async function POST(request: Request) {
  try {
    const auth = await requireRouteUser(request);
    if (auth instanceof NextResponse) return auth;
    const { supabase, user } = auth;

    const { data, error: dbError } = await supabase
      .from("risk_notifications")
      .select("*")
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

    // Parse optional body — if alertType provided, use AI alert; otherwise static confirmation
    let body: { alertType?: string; data?: Record<string, unknown> } = {};
    try {
      const text = await request.text();
      if (text) body = JSON.parse(text);
    } catch {
      // empty or non-JSON body → use static message
    }

    if (body.alertType && body.data) {
      const effective = effectiveNotifySettings((data ?? null) as NotifySettingsLike | null);
      if (!notifyFlagForRule(String(body.alertType), effective)) {
        return NextResponse.json(
          {
            error:
              "This rule is turned off in Telegram alerts (Risk Manager). Enable it to run a test, or use a different alert type."
          },
          { status: 403 }
        );
      }

      const result = await sendSmartTelegramAlert({
        chatId,
        alertType: body.alertType,
        data: body.data,
        fallbackMessage: `⚠️ Test alert [${body.alertType}] from RiskSent.`,
        supabase,
        userId: user.id,
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
    }

    // Static connection confirmation
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: CONNECTED_MESSAGE }),
    });

    const result = (await res.json().catch(() => ({}))) as { ok: boolean; description?: string };
    if (!result.ok) {
      const desc = result.description ?? "Telegram request failed";
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
