import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body?.message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId = message.chat?.id;
    const text = message.text ?? "";
    const firstName = message.from?.first_name ?? "trader";

    if (!chatId) return NextResponse.json({ ok: true });

    if (text.startsWith("/start")) {
      const token = process.env.TELEGRAM_CONNECT_BOT_TOKEN;
      if (!token) return NextResponse.json({ ok: true });

      const replyText =
        `👋 Hey <b>${firstName}</b>!\n\n` +
        `Your <b>Chat ID</b> is:\n\n` +
        `<code>${chatId}</code>\n\n` +
        `📋 Copy it and paste it in the <b>Telegram Alerts</b> section on RiskSent.\n\n` +
        `Once saved, you'll receive real-time notifications whenever a risk rule is violated.`;

      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: replyText,
          parse_mode: "HTML"
        })
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
