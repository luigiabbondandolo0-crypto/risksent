import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseServer";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

const TELEGRAM_API = "https://api.telegram.org";
const LOG_PREFIX = "[Telegram connection-check]";

type CheckStatus = "ok" | "fail" | "warn";

type CheckItem = {
  id: string;
  name: string;
  status: CheckStatus;
  message: string;
  detail?: string;
};

/**
 * GET /api/bot/connection-check
 * Verifica tutti i collegamenti e dati necessari per il bot Telegram (auth richiesta).
 * Usato dalla card "Controllo collegamento" nella pagina Rules.
 */
export async function GET() {
  const checks: CheckItem[] = [];
  const supabase = createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.log(LOG_PREFIX, "[verbose] unauthorized", { error: authError?.message });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;
  console.log(LOG_PREFIX, "[verbose] running checks for", { userId: userId.slice(0, 8) + "..." });

  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const username = process.env.TELEGRAM_BOT_USERNAME?.trim();
  const channelId = process.env.TELEGRAM_ALERT_CHANNEL_ID?.trim();

  if (token) {
    checks.push({ id: "env_token", name: "Token bot Telegram", status: "ok", message: "TELEGRAM_BOT_TOKEN impostato" });
  } else {
    checks.push({ id: "env_token", name: "Token bot Telegram", status: "fail", message: "TELEGRAM_BOT_TOKEN mancante", detail: "Imposta la variabile in Supabase / env" });
  }

  if (username) {
    checks.push({ id: "env_username", name: "Username bot", status: "ok", message: `TELEGRAM_BOT_USERNAME = ${username}` });
  } else {
    checks.push({ id: "env_username", name: "Username bot", status: "warn", message: "TELEGRAM_BOT_USERNAME non impostato", detail: "Il link Collega ora potrebbe usare un fallback" });
  }

  if (channelId) {
    checks.push({ id: "env_channel", name: "Canale alert", status: "ok", message: "TELEGRAM_ALERT_CHANNEL_ID impostato (alert aggregati)" });
  } else {
    checks.push({ id: "env_channel", name: "Canale alert", status: "warn", message: "TELEGRAM_ALERT_CHANNEL_ID non impostato", detail: "Solo alert in chat utente, nessun canale" });
  }

  const admin = createSupabaseAdmin();
  const { data: appUser, error: userError } = await admin
    .from("app_user")
    .select("id, telegram_chat_id")
    .eq("id", userId)
    .single();

  console.log(LOG_PREFIX, "[verbose] app_user lookup", {
    userId: userId.slice(0, 8) + "...",
    hasRow: !!appUser,
    error: userError?.message,
    telegram_chat_id: appUser?.telegram_chat_id ? "set" : "null"
  });

  if (userError && (userError as { code?: string }).code === "PGRST116") {
    checks.push({
      id: "db_app_user",
      name: "Riga app_user",
      status: "fail",
      message: "Nessuna riga app_user per questo utente",
      detail: "Salva le regole una volta o collega Telegram (il webhook crea la riga)"
    });
  } else if (userError) {
    checks.push({
      id: "db_app_user",
      name: "Riga app_user",
      status: "fail",
      message: "Errore lettura app_user",
      detail: userError.message
    });
  } else {
    checks.push({ id: "db_app_user", name: "Riga app_user", status: "ok", message: "Riga app_user presente" });
  }

  const hasChatId = !!(appUser?.telegram_chat_id != null && String(appUser.telegram_chat_id).trim() !== "");
  if (hasChatId) {
    checks.push({
      id: "db_telegram_chat_id",
      name: "Chat Telegram collegata",
      status: "ok",
      message: "telegram_chat_id salvato in app_user",
      detail: `lunghezza: ${String(appUser!.telegram_chat_id).length}`
    });
  } else {
    checks.push({
      id: "db_telegram_chat_id",
      name: "Chat Telegram collegata",
      status: "fail",
      message: "Nessun telegram_chat_id in app_user",
      detail: "Usa Collega ora, apri il link e invia /start al bot"
    });
  }

  if (token) {
    try {
      const res = await fetch(`${TELEGRAM_API}/bot${token}/getMe`);
      const data = await res.json().catch(() => ({}));
      if (data?.ok && data?.result?.username) {
        checks.push({
          id: "telegram_getme",
          name: "API Telegram (getMe)",
          status: "ok",
          message: `Bot riconosciuto: @${data.result.username}`
        });
      } else {
        checks.push({
          id: "telegram_getme",
          name: "API Telegram (getMe)",
          status: "fail",
          message: "Token non valido o bot non raggiungibile",
          detail: (data as { description?: string })?.description ?? res.statusText
        });
      }
    } catch (e) {
      checks.push({
        id: "telegram_getme",
        name: "API Telegram (getMe)",
        status: "fail",
        message: "Errore di rete verso Telegram",
        detail: e instanceof Error ? e.message : String(e)
      });
    }
  }

  const failCount = checks.filter((c) => c.status === "fail").length;
  const warnCount = checks.filter((c) => c.status === "warn").length;
  const summary = failCount > 0 ? "fail" : warnCount > 0 ? "partial" : "ok";

  console.log(LOG_PREFIX, "[verbose] result", { summary, failCount, warnCount, checks: checks.map((c) => `${c.id}:${c.status}`) });

  return NextResponse.json({
    summary,
    checks,
    userId: userId.slice(0, 8) + "..."
  });
}
