import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import { sanitizeText, isUuid, isIsoDate } from "@/lib/security/validation";
import { TIMEFRAMES } from "@/lib/backtesting/symbolMap";
import { ALL_SYMBOLS } from "@/lib/backtesting/symbolMap";
import type { BtTimeframe } from "@/lib/backtesting/types";

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseRouteClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const strategyId = req.nextUrl.searchParams.get("strategy_id");
  let query = supabase
    .from("bt_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (strategyId && isUuid(strategyId)) {
    query = query.eq("strategy_id", strategyId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sessions: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseRouteClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  // Validate required fields
  const strategyId = String(body.strategy_id ?? "");
  if (!isUuid(strategyId)) return NextResponse.json({ error: "Invalid strategy_id" }, { status: 400 });

  const name = sanitizeText(String(body.name ?? ""), 100);
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const symbol = String(body.symbol ?? "").toUpperCase().trim();
  if (!ALL_SYMBOLS.includes(symbol)) return NextResponse.json({ error: "Invalid symbol" }, { status: 400 });

  const timeframeRaw = String(body.timeframe ?? "H1").toUpperCase().trim();
  const timeframe = (TIMEFRAMES as readonly string[]).includes(timeframeRaw) ? timeframeRaw : "H1";

  const from = String(body.date_from ?? "").trim();
  const to = String(body.date_to ?? "").trim();
  if (!isIsoDate(from) || !isIsoDate(to)) {
    return NextResponse.json({ error: "date_from and date_to must be YYYY-MM-DD" }, { status: 400 });
  }
  if (from >= to) return NextResponse.json({ error: "date_from must be before date_to" }, { status: 400 });

  const initialBalance = Number(body.initial_balance ?? 10000);
  if (!Number.isFinite(initialBalance) || initialBalance < 100 || initialBalance > 10_000_000) {
    return NextResponse.json({ error: "Invalid initial_balance" }, { status: 400 });
  }

  // Verify strategy belongs to user
  const { data: strategy, error: stratErr } = await supabase
    .from("bt_strategies")
    .select("id")
    .eq("id", strategyId)
    .eq("user_id", user.id)
    .single();
  if (stratErr || !strategy) return NextResponse.json({ error: "Strategy not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("bt_sessions")
    .insert({
      user_id: user.id,
      strategy_id: strategyId,
      name,
      symbol,
      timeframe: timeframe as BtTimeframe,
      date_from: from,
      date_to: to,
      initial_balance: initialBalance,
      current_balance: initialBalance,
      status: "active",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ session: data }, { status: 201 });
}
