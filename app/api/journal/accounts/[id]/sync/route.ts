import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

/** Placeholder sync — updates last_synced_at; external broker sync when a provider is integrated */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("journal_account")
    .update({ last_synced_at: now })
    .eq("id", id)
    .eq("user_id", user.id)
    .select(
      "id, user_id, nickname, broker_server, account_number, platform, currency, initial_balance, current_balance, status, last_synced_at, created_at"
    )
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    message: "Sync recorded (mock). Broker pull not yet connected.",
    account: data
  });
}
