import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/security/validation";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseRouteClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const sessionId = String(body.session_id ?? "");
  if (!isUuid(sessionId)) return NextResponse.json({ error: "Invalid session_id" }, { status: 400 });

  const direction = String(body.direction ?? "");
  if (!["BUY", "SELL"].includes(direction)) {
    return NextResponse.json({ error: "direction must be BUY or SELL" }, { status: 400 });
  }

  const entryPrice = Number(body.entry_price);
  const lotSize = Number(body.lot_size ?? 0.1);
  if (!Number.isFinite(entryPrice) || entryPrice <= 0) {
    return NextResponse.json({ error: "Invalid entry_price" }, { status: 400 });
  }
  if (!Number.isFinite(lotSize) || lotSize < 0.01 || lotSize > 100) {
    return NextResponse.json({ error: "lot_size must be 0.01–100" }, { status: 400 });
  }

  const stopLoss = body.stop_loss != null ? Number(body.stop_loss) : null;
  const takeProfit = body.take_profit != null ? Number(body.take_profit) : null;

  const entryTime = String(body.entry_time ?? "");
  if (!entryTime) return NextResponse.json({ error: "entry_time required" }, { status: 400 });

  // Verify session belongs to user
  const { data: session, error: sessErr } = await supabase
    .from("bt_sessions")
    .select("id, symbol")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();
  if (sessErr || !session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  // Compute risk_reward
  let riskReward: number | null = null;
  if (stopLoss != null && takeProfit != null && stopLoss !== entryPrice) {
    const risk = Math.abs(entryPrice - stopLoss);
    const reward = Math.abs(takeProfit - entryPrice);
    riskReward = risk > 0 ? reward / risk : null;
  }

  const { data, error } = await supabase
    .from("bt_trades")
    .insert({
      session_id: sessionId,
      user_id: user.id,
      symbol: session.symbol,
      direction,
      entry_price: entryPrice,
      exit_price: null,
      stop_loss: stopLoss,
      take_profit: takeProfit,
      lot_size: lotSize,
      pnl: null,
      pips: null,
      risk_reward: riskReward,
      entry_time: entryTime,
      exit_time: null,
      status: "open",
      notes: null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ trade: data }, { status: 201 });
}
