import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseServer";
import type { BtTradeDirection } from "@/lib/backtesting/btTypes";
import { plannedRiskReward } from "@/lib/backtesting/forex";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    session_id?: string;
    symbol?: string;
    direction?: BtTradeDirection;
    entry_price?: number;
    stop_loss?: number;
    take_profit?: number;
    lot_size?: number;
    entry_time?: string;
    notes?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sessionId = String(body.session_id ?? "").trim();
  const symbol = String(body.symbol ?? "").trim().toUpperCase();
  const direction = body.direction;
  const entryPrice = Number(body.entry_price);
  const sl = Number(body.stop_loss);
  const tp = Number(body.take_profit);
  const lot = Number(body.lot_size);
  const entryTime = String(body.entry_time ?? "").trim();

  if (!sessionId || !symbol || !entryTime) {
    return NextResponse.json({ error: "session_id, symbol, entry_time required" }, { status: 400 });
  }
  if (direction !== "BUY" && direction !== "SELL") {
    return NextResponse.json({ error: "invalid direction" }, { status: 400 });
  }
  if (![entryPrice, sl, tp, lot].every((n) => Number.isFinite(n))) {
    return NextResponse.json({ error: "invalid prices or lot" }, { status: 400 });
  }

  const { data: session, error: seErr } = await supabase
    .from("bt_session")
    .select("id, current_balance, user_id")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (seErr || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const { count: openTrades } = await supabase
    .from("bt_trade")
    .select("*", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .eq("status", "open");

  if ((openTrades ?? 0) > 0) {
    return NextResponse.json({ error: "Close the open trade before opening a new one" }, { status: 409 });
  }

  const rr = plannedRiskReward(entryPrice, sl, tp, direction);

  const { data: trade, error } = await supabase
    .from("bt_trade")
    .insert({
      session_id: sessionId,
      user_id: user.id,
      symbol,
      direction,
      entry_price: entryPrice,
      exit_price: null,
      stop_loss: sl,
      take_profit: tp,
      lot_size: lot,
      pl: null,
      pl_pct: null,
      risk_reward: rr,
      entry_time: entryTime,
      exit_time: null,
      status: "open",
      notes: body.notes ?? null
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("bt_session").update({ status: "replaying" }).eq("id", sessionId).eq("user_id", user.id);

  return NextResponse.json({ trade });
}
