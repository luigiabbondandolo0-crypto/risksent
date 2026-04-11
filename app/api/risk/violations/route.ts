import { NextRequest, NextResponse } from "next/server";
import { requireRouteUser } from "@/lib/supabase/requireRouteUser";

export async function GET(req: NextRequest) {
  const auth = await requireRouteUser(req);
  if (auth instanceof NextResponse) return auth;
  const { supabase, user } = auth;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("risk_violations")
    .select(
      "id, rule_type, value_at_violation, limit_value, message, notified_telegram, created_at, account_id, account_nickname, broker_server"
    )
    .eq("user_id", user.id)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ violations: data ?? [] });
}
