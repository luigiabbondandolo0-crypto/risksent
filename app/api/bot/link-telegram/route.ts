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
  const tokenSet = !!process.env.TELEGRAM_BOT_TOKEN;
  console.log(LOG_PREFIX, "[verbose] config", {
    token: tokenSet ? "set" : "missing",
    botUsername,
    userId: user.id.slice(0, 8) + "...",
    userEmail: (user as { email?: string }).email ?? "n/a"
  });

  const admin = createSupabaseAdmin();
  const { data: row, error } = await admin
    .from("telegram_link_token")
    .insert({ user_id: user.id })
    .select("token")
    .single();

  if (error || !row?.token) {
    console.warn(LOG_PREFIX, "[verbose] create token failed", {
      error: error?.message,
      code: (error as { code?: string })?.code,
      userId: user.id.slice(0, 8) + "..."
    });
    return NextResponse.json(
      { error: error?.message ?? "Failed to create link token" },
      { status: 500 }
    );
  }

  const link = `https://t.me/${botUsername.replace(/^@/, "")}?start=${row.token}`;
  console.log(LOG_PREFIX, "[verbose] link generated", {
    userId: user.id.slice(0, 8) + "...",
    tokenPrefix: row.token.slice(0, 6) + "...",
    link: link.slice(0, 50) + "..."
  });

  return NextResponse.json({
    token: row.token,
    link,
    message: "Apri il link, invia /start al bot, poi clicca Verifica collegamento."
  });
}
