import { NextRequest, NextResponse } from "next/server";
const DEBUG = process.env.DEBUG === "1";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import { sendAlertToTelegram } from "@/lib/telegramAlert";
import type { PostgrestError } from "@supabase/supabase-js";

const ALERT_SELECT_FULL =
  "id, message, severity, solution, alert_date, read, rule_type, dismissed, acknowledged_at, acknowledged_note, account_id, account_nickname";

const ALERT_SELECT_LEGACY =
  "id, message, severity, solution, alert_date, read, rule_type, dismissed, acknowledged_at, acknowledged_note";

function isMissingAlertScopeColumns(err: PostgrestError | null): boolean {
  if (!err?.message) return false;
  const m = err.message.toLowerCase();
  return m.includes("account_id") || m.includes("account_nickname");
}

export async function GET() {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const full = await supabase
    .from("alert")
    .select(ALERT_SELECT_FULL)
    .eq("user_id", user.id)
    .order("alert_date", { ascending: false })
    .limit(50);

  if (full.error && isMissingAlertScopeColumns(full.error)) {
    const legacy = await supabase
      .from("alert")
      .select(ALERT_SELECT_LEGACY)
      .eq("user_id", user.id)
      .order("alert_date", { ascending: false })
      .limit(50);
    if (legacy.error) {
      return NextResponse.json(
        { error: legacy.error.message, alerts: [] },
        { status: 500 }
      );
    }
    return NextResponse.json({ alerts: legacy.data ?? [] });
  }

  if (full.error) {
    return NextResponse.json(
      { error: full.error.message, alerts: [] },
      { status: 500 }
    );
  }

  return NextResponse.json({ alerts: full.data ?? [] });
}

/**
 * POST /api/alerts
 * Crea un alert per l'utente corrente e lo invia su Telegram se collegato.
 * Body: { message: string, severity?: 'medium' | 'high', solution?: string }
 */
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { message?: string; severity?: string; solution?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  const severity = body.severity === "high" ? "high" : "medium";
  const solution = typeof body.solution === "string" ? body.solution.trim() : null;

  if (!message) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  const { data: alert, error } = await supabase
    .from("alert")
    .insert({
      user_id: user.id,
      message,
      severity,
      solution
    })
    .select("id, message, severity, alert_date")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (DEBUG) console.log("[Alerts POST] sending to Telegram", {
    userId: user.id.slice(0, 8) + "...",
    alertId: alert?.id,
    messageLen: message.length
  });
  await sendAlertToTelegram({
    user_id: user.id,
    message,
    severity,
    solution
  });
  if (DEBUG) console.log("[Alerts POST] sendAlertToTelegram done");

  return NextResponse.json({ alert });
}
