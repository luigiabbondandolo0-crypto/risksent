import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getTelegramBotLinkUsername } from "@/lib/telegramAlert";
import type { Plan, SubStatus } from "@/lib/subscription/caps";
import { capsForPlan } from "@/lib/subscription/caps";

const LOG_PREFIX = "[Telegram link]";
const DEBUG = process.env.DEBUG === "1";

/**
 * POST /api/bot/link-telegram
 * Crea un token one-time e restituisce il link per collegare la chat Telegram.
 * L'utente apre il link, invia /start, il webhook associa chat_id al user_id.
 * Insert con admin client per evitare RLS (auth.uid() non sempre disponibile in route handler).
 */
export async function POST() {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: subRow } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end, trial_started_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const caps = capsForPlan(
    ((subRow?.plan as Plan | "free") ?? "user") as Plan | "free",
    (subRow?.status as SubStatus) ?? "active",
    subRow?.current_period_end ?? null,
    Boolean((subRow as { trial_started_at?: string | null } | null)?.trial_started_at)
  );

  if (!caps.canAccessTelegramAlerts) {
    return NextResponse.json(
      { error: "plan_required", message: "Upgrade to Experienced to use Telegram alerts." },
      { status: 403 }
    );
  }

  const botUsername = getTelegramBotLinkUsername();
  const tokenSet = !!process.env.TELEGRAM_BOT_TOKEN;
  if (DEBUG) console.log(LOG_PREFIX, "config", {
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
    if (DEBUG) console.warn(LOG_PREFIX, "create token failed", {
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
  if (DEBUG) console.log(LOG_PREFIX, "link generated", {
    userId: user.id.slice(0, 8) + "...",
    tokenPrefix: row.token.slice(0, 6) + "...",
    link: link.slice(0, 50) + "..."
  });

  return NextResponse.json({
    token: row.token,
    link,
    message: "Open the link, send /start to the bot, then click Verify link."
  });
}
