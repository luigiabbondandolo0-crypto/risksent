import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import type { BtTimeframe } from "@/lib/backtesting/btTypes";

const DEFAULT_TIMEFRAME: BtTimeframe = "H1";

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const strategyId = req.nextUrl.searchParams.get("strategy_id");

  let q = supabase
    .from("bt_session")
    .select(
      "id, user_id, strategy_id, name, symbol, timeframe, date_from, date_to, initial_balance, current_balance, status, created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (strategyId) {
    q = q.eq("strategy_id", strategyId);
  }

  const { data, error } = await q;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sessions: data ?? [] });
}

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
    strategy_id?: string;
    name?: string;
    symbol?: string;
    date_from?: string;
    date_to?: string;
    initial_balance?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const strategyId = String(body.strategy_id ?? "").trim();
  const name = String(body.name ?? "").trim() || "Session";
  const symbol = String(body.symbol ?? "").trim().toUpperCase();
  const dateFrom = String(body.date_from ?? "").trim();
  const dateTo = String(body.date_to ?? "").trim();
  const initial =
    typeof body.initial_balance === "number" && Number.isFinite(body.initial_balance)
      ? body.initial_balance
      : Number(body.initial_balance);

  if (!strategyId) {
    return NextResponse.json({ error: "strategy_id is required" }, { status: 400 });
  }
  if (!symbol) {
    return NextResponse.json({ error: "symbol is required" }, { status: 400 });
  }
  if (!dateFrom || !dateTo) {
    return NextResponse.json({ error: "date_from and date_to are required" }, { status: 400 });
  }
  if (!Number.isFinite(initial) || initial < 0) {
    return NextResponse.json({ error: "invalid initial_balance" }, { status: 400 });
  }

  const { data: strat, error: stratErr } = await supabase
    .from("bt_strategy")
    .select("id")
    .eq("id", strategyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (stratErr || !strat) {
    return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("bt_session")
    .insert({
      user_id: user.id,
      strategy_id: strategyId,
      name,
      symbol,
      timeframe: DEFAULT_TIMEFRAME,
      date_from: dateFrom,
      date_to: dateTo,
      initial_balance: initial,
      current_balance: initial,
      status: "active"
    })
    .select(
      "id, user_id, strategy_id, name, symbol, timeframe, date_from, date_to, initial_balance, current_balance, status, created_at"
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ session: data });
}
