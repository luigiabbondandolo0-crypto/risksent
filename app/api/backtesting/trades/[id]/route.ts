import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import { calcPl, calcPlPct } from "@/lib/backtesting/forex";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    exit_price?: number;
    exit_time?: string;
    status?: "closed";
    notes?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const exitPrice = Number(body.exit_price);
  const exitTime = String(body.exit_time ?? "").trim();
  if (!Number.isFinite(exitPrice) || !exitTime) {
    return NextResponse.json({ error: "exit_price and exit_time required" }, { status: 400 });
  }

  const { data: trade, error: tErr } = await supabase
    .from("bt_trade")
    .select(
      "id, session_id, user_id, direction, entry_price, lot_size, status, risk_reward"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (tErr || !trade) {
    return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  }
  if (trade.status !== "open") {
    return NextResponse.json({ error: "Trade already closed" }, { status: 409 });
  }

  const pl = calcPl(trade.entry_price, exitPrice, trade.lot_size, trade.direction);
  const { data: session } = await supabase
    .from("bt_session")
    .select("id, current_balance, initial_balance")
    .eq("id", trade.session_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const plPct = calcPlPct(session.current_balance, pl);
  const newBalance = session.current_balance + pl;

  const { data: updated, error: uErr } = await supabase
    .from("bt_trade")
    .update({
      exit_price: exitPrice,
      exit_time: exitTime,
      pl,
      pl_pct: plPct,
      status: "closed",
      ...(body.notes !== undefined ? { notes: body.notes } : {})
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (uErr) {
    return NextResponse.json({ error: uErr.message }, { status: 500 });
  }

  await supabase
    .from("bt_session")
    .update({ current_balance: newBalance })
    .eq("id", trade.session_id)
    .eq("user_id", user.id);

  return NextResponse.json({ trade: updated, session_balance: newBalance });
}
