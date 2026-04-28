import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import { runRiskCheckForAccount } from "@/lib/riskCheckRun";
import { accountSelectColumns } from "@/lib/tradingApi";
import { capsForPlan, type Plan, type SubStatus } from "@/lib/subscription/caps";

/**
 * POST /api/alerts/check-risk
 * Legge regole utente e statistiche dell'account (uuid in body),
 * calcola eventuali violazioni/avvicinamenti e crea alert + invio Telegram.
 * Body: { uuid?: string }
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
  if (caps.isDemoMode || !caps.canAccessRiskManager) {
    return NextResponse.json(
      { error: "plan_required", message: "Upgrade your plan to use Risk Manager." },
      { status: 403 }
    );
  }

  let uuid: string | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    uuid = body?.uuid ?? null;
  } catch {
    // no body
  }
  type AccountRow = { metaapi_account_id?: string };
  let accountRow: AccountRow | null = null;
  if (uuid) {
    const { data } = await supabase
      .from("trading_account")
      .select(accountSelectColumns())
      .eq("user_id", user.id)
      .eq("metaapi_account_id", uuid)
      .limit(1)
      .single();
    accountRow = data && typeof data === "object" && "metaapi_account_id" in data ? (data as AccountRow) : null;
  } else {
    const { data: accounts } = await supabase
      .from("trading_account")
      .select(accountSelectColumns())
      .eq("user_id", user.id)
      .limit(1);
    accountRow = (accounts?.[0] as AccountRow) ?? null;
    if (accountRow) uuid = accountRow.metaapi_account_id ?? null;
  }
  if (!uuid) {
    return NextResponse.json(
      { error: "No account selected or linked", findings: [] },
      { status: 200 }
    );
  }

  const result = await runRiskCheckForAccount({
    userId: user.id,
    uuid,
    supabase
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
