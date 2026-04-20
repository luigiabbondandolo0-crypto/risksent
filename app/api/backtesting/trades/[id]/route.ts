import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/security/validation";
import { calcPips, calcPnl } from "@/lib/backtesting/symbolMap";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const supabase = await createSupabaseRouteClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  // Fetch existing trade
  const { data: trade, error: tradeErr } = await supabase
    .from("bt_trades")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (tradeErr || !trade) return NextResponse.json({ error: "Trade not found" }, { status: 404 });

  const exitPrice = Number(body.exit_price);
  const exitTime = String(body.exit_time ?? "");

  if (!Number.isFinite(exitPrice) || exitPrice <= 0) {
    return NextResponse.json({ error: "Invalid exit_price" }, { status: 400 });
  }
  if (!exitTime) return NextResponse.json({ error: "exit_time required" }, { status: 400 });

  // Calculate PnL and pips
  const dirMult = trade.direction === "BUY" ? 1 : -1;
  const priceDiff = (exitPrice - trade.entry_price) * dirMult;
  const pips = calcPips(trade.symbol, priceDiff);
  const pnl = calcPnl(trade.symbol, priceDiff, trade.lot_size);

  const { data, error } = await supabase
    .from("bt_trades")
    .update({
      exit_price: exitPrice,
      exit_time: exitTime,
      status: "closed",
      pnl: Math.round(pnl * 100) / 100,
      pips: Math.round(pips * 10) / 10,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update session balance
  const { data: session } = await supabase
    .from("bt_sessions")
    .select("current_balance")
    .eq("id", trade.session_id)
    .single();

  if (session) {
    const newBalance = (session.current_balance as number) + pnl;
    await supabase
      .from("bt_sessions")
      .update({ current_balance: Math.round(newBalance * 100) / 100, updated_at: new Date().toISOString() })
      .eq("id", trade.session_id);
  }

  return NextResponse.json({ trade: data });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const supabase = await createSupabaseRouteClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("bt_trades")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
