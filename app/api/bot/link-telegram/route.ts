import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseServer";
import { getTelegramBotLinkUsername } from "@/lib/telegramAlert";

/**
 * POST /api/bot/link-telegram
 * Crea un token one-time e restituisce il link per collegare la chat Telegram.
 * L'utente apre il link, invia /start, il webhook associa chat_id al user_id.
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

  const { data: row, error } = await supabase
    .from("telegram_link_token")
    .insert({ user_id: user.id })
    .select("token")
    .single();

  if (error || !row?.token) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create link token" },
      { status: 500 }
    );
  }

  const botUsername = getTelegramBotLinkUsername();
  const link = `https://t.me/${botUsername.replace(/^@/, "")}?start=${row.token}`;

  return NextResponse.json({
    token: row.token,
    link,
    message: "Apri il link, invia /start al bot, poi clicca Verifica collegamento."
  });
}
