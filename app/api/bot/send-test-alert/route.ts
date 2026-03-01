import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseServer";
import { sendAlertToTelegram } from "@/lib/telegramAlert";

/**
 * POST /api/bot/send-test-alert
 * Sends a test message to the current user's linked Telegram chat.
 * Auth: required (user must be logged in).
 */
export async function POST() {
  const supabase = createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: row } = await supabase
    .from("app_user")
    .select("telegram_chat_id")
    .eq("id", user.id)
    .single();

  const chatId = row?.telegram_chat_id;
  if (chatId == null || chatId === "") {
    return NextResponse.json(
      { error: "No Telegram linked. Link a chat first, then test." },
      { status: 400 }
    );
  }

  const result = await sendAlertToTelegram({
    user_id: user.id,
    message: "Test alert from RiskSent. If you see this, notifications are working.",
    severity: "medium",
    solution: null
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason ?? "Failed to send test alert" },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, message: "Test alert sent." });
}
