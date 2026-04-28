import { NextRequest, NextResponse } from "next/server";
import { requireRouteUser } from "@/lib/supabase/requireRouteUser";
import { capsForPlan, type Plan, type SubStatus } from "@/lib/subscription/caps";

export async function GET(req: NextRequest) {
  const auth = await requireRouteUser(req);
  if (auth instanceof NextResponse) return auth;
  const { supabase, user } = auth;

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

  const { searchParams } = new URL(req.url);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
  const accountId = searchParams.get("account_id");
  const filterByAccount = accountId && accountId !== "all";

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from("risk_violations")
    .select(
      "id, rule_type, value_at_violation, limit_value, message, notified_telegram, created_at, account_id, account_nickname, broker_server"
    )
    .eq("user_id", user.id)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filterByAccount) {
    query = query.eq("account_id", accountId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ violations: data ?? [] });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireRouteUser(req);
  if (auth instanceof NextResponse) return auth;
  const { supabase, user } = auth;

  let accountId: string | null = null;
  try {
    const body = (await req.json().catch(() => ({}))) as { account_id?: string };
    accountId = body.account_id && body.account_id !== "all" ? body.account_id : null;
  } catch {}

  // Mirror rows in `alert` are used for Telegram dedupe — clear both together.
  // When account_id is provided, scope deletion to that account only.
  let vQuery = supabase.from("risk_violations").delete().eq("user_id", user.id);
  let aQuery = supabase.from("alert").delete().eq("user_id", user.id);
  if (accountId) {
    vQuery = vQuery.eq("account_id", accountId);
    aQuery = aQuery.eq("account_id", accountId);
  }

  const { error: violErr } = await vQuery;
  if (violErr) {
    return NextResponse.json({ error: violErr.message }, { status: 500 });
  }

  const { error: alertErr } = await aQuery;
  if (alertErr) {
    return NextResponse.json({ error: alertErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
