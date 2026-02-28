import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseServer";
import { sendAlertToTelegram } from "@/lib/telegramAlert";

export async function GET() {
  const supabase = createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: alerts, error } = await supabase
    .from("alert")
    .select("id, message, severity, solution, alert_date, read, rule_type")
    .eq("user_id", user.id)
    .order("alert_date", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message, alerts: [] }, { status: 500 });
  }

  return NextResponse.json({ alerts: alerts ?? [] });
}

/**
 * POST /api/alerts
 * Crea un alert per l'utente corrente e lo invia su Telegram se collegato.
 * Body: { message: string, severity?: 'medium' | 'high', solution?: string }
 */
export async function POST(req: NextRequest) {
  const supabase = createSupabaseRouteClient();
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

  console.log("[Alerts POST] [verbose] sending to Telegram", {
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
  console.log("[Alerts POST] [verbose] sendAlertToTelegram done");

  return NextResponse.json({ alert });
}
