import { NextResponse } from "next/server";
import { requireRouteUser } from "@/lib/supabase/requireRouteUser";

export async function POST(request: Request) {
  try {
    const auth = await requireRouteUser(request);
    if (auth instanceof NextResponse) return auth;
    const { supabase, user } = auth;

    const { data } = await supabase
      .from("risk_notifications")
      .select("telegram_chat_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const chatId = data?.telegram_chat_id?.trim();
    if (!chatId) {
      return NextResponse.json({ error: "Set a Telegram chat ID first" }, { status: 400 });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
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
          chat_id: /^-?\d+$/.test(chatId) ? Number(chatId) : chatId,
          text,
          parse_mode: "HTML"
        }),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { description?: string };
      return NextResponse.json(
        { error: err.description ?? "Telegram API error" },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}