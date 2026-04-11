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
        `👋 Ciao <b>${firstName}</b>!\n\n` +
        `Il tuo <b>Chat ID</b> è:\n\n` +
        `<code>${chatId}</code>\n\n` +
        `📋 Copialo e incollalo nella sezione <b>Telegram Alerts</b> su RiskSent.\n\n` +
        `Una volta salvato riceverai notifiche in tempo reale quando una regola di rischio viene violata.`;

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
