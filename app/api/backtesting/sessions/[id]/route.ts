import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: session, error: sErr } = await supabase
    .from("bt_session")
    .select(
      "id, user_id, strategy_id, name, symbol, timeframe, date_from, date_to, initial_balance, current_balance, status, created_at"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (sErr) {
    return NextResponse.json({ error: sErr.message }, { status: 500 });
  }
  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: strategy } = await supabase
    .from("bt_strategy")
    .select("id, name, description")
    .eq("id", session.strategy_id)
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: trades } = await supabase
    .from("bt_trade")
    .select(
      "id, session_id, symbol, direction, entry_price, exit_price, stop_loss, take_profit, lot_size, pl, pl_pct, risk_reward, entry_time, exit_time, status, notes"
    )
    .eq("session_id", id)
    .eq("user_id", user.id)
    .order("entry_time", { ascending: true });

  return NextResponse.json({
    session,
    strategy: strategy ?? null,
    trades: trades ?? []
  });
}
