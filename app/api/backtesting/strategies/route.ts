import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseServer";
import type { StrategyWithStats } from "@/lib/backtesting/btTypes";

export async function GET() {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: strategies, error: sErr } = await supabase
    .from("bt_strategy")
    .select("id, user_id, name, description, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (sErr) {
    return NextResponse.json({ error: sErr.message }, { status: 500 });
  }

  const strategyList = strategies ?? [];
  const strategyIds = strategyList.map((s) => s.id);
  if (strategyIds.length === 0) {
    return NextResponse.json({ strategies: [] as StrategyWithStats[] });
  }

  const { data: sessions } = await supabase
    .from("bt_session")
    .select("id, strategy_id, status")
    .eq("user_id", user.id)
    .in("strategy_id", strategyIds);

  const sessionRows = sessions ?? [];
  const sessionIds = sessionRows.map((s) => s.id);

  const { data: trades } =
    sessionIds.length > 0
      ? await supabase
          .from("bt_trade")
          .select("session_id, pl, risk_reward, status")
          .eq("user_id", user.id)
          .in("session_id", sessionIds)
      : { data: [] as { session_id: string; pl: number | null; risk_reward: number | null; status: string }[] };

  const tradeRows = trades ?? [];

  const sessionByStrategy = new Map<string, typeof sessionRows>();
  for (const sid of strategyIds) sessionByStrategy.set(sid, []);
  for (const se of sessionRows) {
    const arr = sessionByStrategy.get(se.strategy_id);
    if (arr) arr.push(se);
  }

  const tradesBySession = new Map<string, typeof tradeRows>();
  for (const t of tradeRows) {
    const arr = tradesBySession.get(t.session_id) ?? [];
    arr.push(t);
    tradesBySession.set(t.session_id, arr);
  }

  const sessionToStrategy = new Map(sessionRows.map((s) => [s.id, s.strategy_id] as const));

  const withStats: StrategyWithStats[] = strategyList.map((st) => {
    const sess = sessionByStrategy.get(st.id) ?? [];
    const completed = sess.filter((x) => x.status === "completed" || x.status === "done");
    let wins = 0;
    let losses = 0;
    let rrSum = 0;
    let rrN = 0;
    let totalPl = 0;
    let closed = 0;
    for (const se of sess) {
      const ts = tradesBySession.get(se.id) ?? [];
      for (const tr of ts) {
        if (tr.status !== "closed" || tr.pl == null) continue;
        closed++;
        totalPl += tr.pl;
        if (tr.pl > 0) wins++;
        else if (tr.pl < 0) losses++;
        if (tr.risk_reward != null && Number.isFinite(tr.risk_reward)) {
          rrSum += tr.risk_reward;
          rrN += 1;
        }
      }
    }
    const decided = wins + losses;
    const winRate = decided > 0 ? (wins / decided) * 100 : null;

    return {
      ...st,
      session_count: sess.length,
      completed_session_count: completed.length,
      win_rate_pct: winRate,
      avg_rr: rrN > 0 ? rrSum / rrN : null,
      total_pl: totalPl,
      total_trades: closed
    };
  });

  return NextResponse.json({ strategies: withStats });
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

  let body: { name?: string; description?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const description = body.description != null ? String(body.description).trim() : "";

  const { data, error } = await supabase
    .from("bt_strategy")
    .insert({
      user_id: user.id,
      name,
      description: description || null
    })
    .select("id, user_id, name, description, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ strategy: data });
}
