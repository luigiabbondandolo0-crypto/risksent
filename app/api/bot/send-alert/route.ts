import { NextRequest, NextResponse } from "next/server";
import { sendAlertToTelegram } from "@/lib/telegramAlert";

/**
 * POST /api/bot/send-alert
 * Invia un alert su Telegram all'utente indicato.
 * Protetto da BOT_INTERNAL_SECRET (header o body) per chiamate da cron/backend.
 * Body: { user_id, message, severity, solution? } (+ opzionale secret in body o header x-bot-secret)
 */
export async function POST(req: NextRequest) {
  const secret = process.env.BOT_INTERNAL_SECRET;
  if (secret) {
    const headerSecret = req.headers.get("x-bot-secret");
    let bodySecret: string | undefined;
    try {
      const b = await req.clone().json().catch(() => ({}));
      bodySecret = b?.secret;
    } catch {
      // ignore
    }
    if (headerSecret !== secret && bodySecret !== secret) {
      return NextResponse.json({ ok: false, reason: "Unauthorized" }, { status: 401 });
    }
  }

  let body: { user_id?: string; message?: string; severity?: string; solution?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "Invalid JSON" }, { status: 400 });
  }

  const user_id = body.user_id;
  const message = body.message;
  const severity = body.severity ?? "medium";

  if (!user_id || !message) {
    return NextResponse.json(
      { ok: false, reason: "user_id and message required" },
      { status: 400 }
    );
  }

  const result = await sendAlertToTelegram({
    user_id,
    message,
    severity,
    solution: body.solution ?? null
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, reason: result.reason ?? "Send failed" },
      { status: 200 }
    );
  }
  return NextResponse.json({ ok: true });
}
