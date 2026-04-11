import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseServer";
import { sendTelegramRiskMessage } from "@/lib/risk/telegramRisk";

export async function POST() {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data } = await supabase.from("risk_notifications").select("telegram_chat_id").eq("user_id", user.id).maybeSingle();

  const chatId = data?.telegram_chat_id?.trim();
  if (!chatId) {
    return NextResponse.json({ error: "Set a Telegram chat ID first" }, { status: 400 });
  }

  const text =
    `✅ <b>RiskSent</b>\n` +
    `Test message — your Risk Manager Telegram alerts are configured correctly.\n` +
    `Time: ${new Date().toISOString().slice(11, 19)} UTC`;

  const res = await sendTelegramRiskMessage(chatId, text);
  if (!res.ok) {
    return NextResponse.json({ error: res.error ?? "Failed to send" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
