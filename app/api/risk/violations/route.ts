import { NextRequest, NextResponse } from "next/server";
import { requireRouteUser } from "@/lib/supabase/requireRouteUser";

export async function GET(req: NextRequest) {
  const auth = await requireRouteUser(req);
  if (auth instanceof NextResponse) return auth;
  const { supabase, user } = auth;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
  const accountIdParam = searchParams.get("account_id")?.trim();

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  let q = supabase
    .from("risk_violations")
    .select(
      "id, rule_type, value_at_violation, limit_value, message, notified_telegram, created_at, account_id, account_nickname, broker_server"
    )
    .eq("user_id", user.id)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (accountIdParam && accountIdParam !== "all") {
    q = q.eq("account_id", accountIdParam);
  }

  const { data, error } = await q;

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
  const body = (await req.json().catch(() => ({}))) as { account_id?: string };
  if (body?.account_id && body.account_id !== "all") {
    accountId = String(body.account_id).trim() || null;
  }

  let del = supabase.from("risk_violations").delete().eq("user_id", user.id);
  if (accountId) {
    del = del.eq("account_id", accountId);
  }
  const { error } = await del;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
