import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/security/validation";
import type { Trade, SessionStats } from "@/lib/backtesting/types";

type Ctx = { params: Promise<{ id: string }> };

function calcStats(trades: Trade[]): SessionStats {
  const closed = trades.filter((t) => t.status === "closed");
  const wins = closed.filter((t) => (t.pnl ?? 0) > 0);
  const losses = closed.filter((t) => (t.pnl ?? 0) <= 0);
  const totalPnl = closed.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const gross_profit = wins.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const gross_loss = Math.abs(losses.reduce((s, t) => s + (t.pnl ?? 0), 0));
  const pnls = closed.map((t) => t.pnl ?? 0);

  // Max drawdown: peak-to-trough on running equity
  let peak = 0, runningPnl = 0, maxDd = 0;
  for (const p of pnls) {
    runningPnl += p;
    if (runningPnl > peak) peak = runningPnl;
    const dd = peak - runningPnl;
    if (dd > maxDd) maxDd = dd;
  }

  const validRR = closed.filter((t) => t.risk_reward != null).map((t) => t.risk_reward!);
  const avgRR = validRR.length > 0 ? validRR.reduce((a, b) => a + b, 0) / validRR.length : 0;

  return {
    totalTrades: closed.length,
    openTrades: trades.filter((t) => t.status === "open").length,
    wins: wins.length,
    losses: losses.length,
    winRate: closed.length > 0 ? (wins.length / closed.length) * 100 : 0,
    totalPnl,
    avgRR,
    profitFactor: gross_loss > 0 ? gross_profit / gross_loss : gross_profit > 0 ? Infinity : 0,
    maxDrawdown: maxDd,
    bestTrade: pnls.length > 0 ? Math.max(...pnls) : 0,
    worstTrade: pnls.length > 0 ? Math.min(...pnls) : 0,
  };
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const supabase = await createSupabaseRouteClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: session, error: sessErr }, { data: trades, error: tradesErr }] = await Promise.all([
    supabase.from("bt_sessions").select("*").eq("id", id).eq("user_id", user.id).single(),
    supabase.from("bt_trades").select("*").eq("session_id", id).eq("user_id", user.id).order("created_at", { ascending: true }),
  ]);

  if (sessErr || !session) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (tradesErr) return NextResponse.json({ error: tradesErr.message }, { status: 500 });

  const tradeList = (trades ?? []) as Trade[];
  return NextResponse.json({ session, trades: tradeList, stats: calcStats(tradeList) });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const supabase = await createSupabaseRouteClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof body.current_balance === "number" && Number.isFinite(body.current_balance)) {
    updates.current_balance = body.current_balance;
  }
  if (["active", "completed", "paused"].includes(body.status)) {
    updates.status = body.status;
  }

  const { data, error } = await supabase
    .from("bt_sessions")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ session: data });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const supabase = await createSupabaseRouteClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("bt_sessions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
