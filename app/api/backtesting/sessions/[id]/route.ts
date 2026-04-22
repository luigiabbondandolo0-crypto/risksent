import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/security/validation";
import type { Trade } from "@/lib/backtesting/types";
import { calcSessionStats } from "@/lib/backtesting/calcSessionStats";

type Ctx = { params: Promise<{ id: string }> };

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
  return NextResponse.json({ session, trades: tradeList, stats: calcSessionStats(tradeList) });
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
