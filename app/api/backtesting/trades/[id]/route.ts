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

  const { data: trade, error: tradeErr } = await supabase
    .from("bt_trades")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (tradeErr || !trade) return NextResponse.json({ error: "Trade not found" }, { status: 404 });

  const hasExit = body.exit_price != null;
  const hasSL = Object.prototype.hasOwnProperty.call(body, "stop_loss");
  const hasTP = Object.prototype.hasOwnProperty.call(body, "take_profit");

  if (!hasExit && !hasSL && !hasTP) {
    return NextResponse.json({ error: "No updatable field provided" }, { status: 400 });
  }

  // ── SL / TP update (position still open) ──────────────────────────────
  if (!hasExit) {
    if (trade.status !== "open") {
      return NextResponse.json({ error: "Trade is not open" }, { status: 400 });
    }
    const update: Record<string, number | null> = {};
    if (hasSL) {
      const sl = body.stop_loss == null ? null : Number(body.stop_loss);
      if (sl != null && (!Number.isFinite(sl) || sl <= 0)) {
        return NextResponse.json({ error: "Invalid stop_loss" }, { status: 400 });
      }
      update.stop_loss = sl;
    }
    if (hasTP) {
      const tp = body.take_profit == null ? null : Number(body.take_profit);
      if (tp != null && (!Number.isFinite(tp) || tp <= 0)) {
        return NextResponse.json({ error: "Invalid take_profit" }, { status: 400 });
      }
      update.take_profit = tp;
    }

    // Recompute R:R
    const newSL = hasSL ? (update.stop_loss as number | null) : (trade.stop_loss as number | null);
    const newTP = hasTP ? (update.take_profit as number | null) : (trade.take_profit as number | null);
    let riskReward: number | null = null;
    if (newSL != null && newTP != null && newSL !== trade.entry_price) {
      const risk = Math.abs(trade.entry_price - newSL);
      const reward = Math.abs(newTP - trade.entry_price);
      riskReward = risk > 0 ? reward / risk : null;
    }
    (update as Record<string, number | null>).risk_reward = riskReward;

    const { data, error } = await supabase
      .from("bt_trades")
      .update(update)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ trade: data });
  }

  // ── Close trade (exit) ────────────────────────────────────────────────
  const exitPrice = Number(body.exit_price);
  const exitTime = String(body.exit_time ?? "");

  if (!Number.isFinite(exitPrice) || exitPrice <= 0) {
    return NextResponse.json({ error: "Invalid exit_price" }, { status: 400 });
  }
  if (!exitTime) return NextResponse.json({ error: "exit_time required" }, { status: 400 });

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
