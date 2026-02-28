import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseServer";
import { runRiskCheckForAccount } from "@/lib/riskCheckRun";

/**
 * POST /api/alerts/check-risk
 * Legge regole utente e statistiche dell'account (uuid in body),
 * calcola eventuali violazioni/avvicinamenti e crea alert + invio Telegram.
 * Body: { uuid?: string }
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

  let uuid: string | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    uuid = body?.uuid ?? null;
  } catch {
    // no body
  }
  if (!uuid) {
    const { data: accounts } = await supabase
      .from("trading_account")
      .select("metaapi_account_id")
      .eq("user_id", user.id)
      .limit(1);
    uuid = accounts?.[0]?.metaapi_account_id ?? null;
  }
  if (!uuid) {
    return NextResponse.json(
      { error: "No account selected or linked", findings: [] },
      { status: 200 }
    );
  }

  const apiKey = process.env.METATRADERAPI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "METATRADERAPI_API_KEY not set", findings: [] },
      { status: 500 }
    );
  }

  const result = await runRiskCheckForAccount({
    userId: user.id,
    uuid,
    supabase,
    apiKey
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Check failed", findings: [] },
      { status: 502 }
    );
  }

  return NextResponse.json({
    findings: result.findings.map((f) => ({
      type: f.type,
      level: f.level,
      message: f.message,
      advice: f.advice
    }))
  });
}
