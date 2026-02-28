import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseServer";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getTelegramBotLinkUsername } from "@/lib/telegramAlert";

const LOG_PREFIX = "[Telegram link]";

/**
 * POST /api/bot/link-telegram
 * Crea un token one-time e restituisce il link per collegare la chat Telegram.
 * L'utente apre il link, invia /start, il webhook associa chat_id al user_id.
 * Insert con admin client per evitare RLS (auth.uid() non sempre disponibile in route handler).
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

  const botUsername = getTelegramBotLinkUsername();
  console.log(LOG_PREFIX, "config check", {
    token: process.env.TELEGRAM_BOT_TOKEN ? "set" : "missing",
    botUsername
  });

  const admin = createSupabaseAdmin();
  const { data: row, error } = await admin
    .from("telegram_link_token")
    .insert({ user_id: user.id })
    .select("token")
    .single();

  if (error || !row?.token) {
    console.warn(LOG_PREFIX, "create token failed", error?.message);
    return NextResponse.json(
      { error: error?.message ?? "Failed to create link token" },
      { status: 500 }
    );
  }

  const link = `https://t.me/${botUsername.replace(/^@/, "")}?start=${row.token}`;
  console.log(LOG_PREFIX, "link generated", { userId: user.id.slice(0, 8) + "..." });

  return NextResponse.json({
    token: row.token,
    link,
    message: "Apri il link, invia /start al bot, poi clicca Verifica collegamento."
  });
}
