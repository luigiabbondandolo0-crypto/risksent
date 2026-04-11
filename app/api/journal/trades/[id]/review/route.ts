import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("journal_trade_review")
    .select("*")
    .eq("trade_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ review: data });
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify trade ownership
  const { data: trade, error: tradeErr } = await supabase
    .from("journal_trade")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (tradeErr || !trade) {
    return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  }

  let body: {
    strategy_id?: string | null;
    checklist_results?: Record<string, boolean>;
    rules_followed?: Record<string, boolean>;
    emotion?: string | null;
    rating?: number | null;
    notes?: string | null;
    images?: string[] | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validEmotions = ["Calm", "Confident", "Anxious", "FOMO", "Revenge"];

  const row: Record<string, unknown> = {
    user_id: user.id,
    trade_id: id,
    updated_at: new Date().toISOString(),
  };

  if (body.strategy_id !== undefined) {
    row.strategy_id = body.strategy_id;
  }
  if (body.checklist_results !== undefined) {
    row.checklist_results =
      body.checklist_results &&
      typeof body.checklist_results === "object" &&
      !Array.isArray(body.checklist_results)
        ? body.checklist_results
        : {};
  }
  if (body.rules_followed !== undefined) {
    row.rules_followed =
      body.rules_followed &&
      typeof body.rules_followed === "object" &&
      !Array.isArray(body.rules_followed)
        ? body.rules_followed
        : {};
  }
  if (body.emotion !== undefined) {
    row.emotion =
      body.emotion && validEmotions.includes(body.emotion)
        ? body.emotion
        : null;
  }
  if (body.rating !== undefined) {
    row.rating =
      body.rating != null &&
      Number.isInteger(body.rating) &&
      body.rating >= 1 &&
      body.rating <= 5
        ? body.rating
        : null;
  }
  if (body.notes !== undefined) {
    row.notes = body.notes;
  }
  if (body.images !== undefined) {
    row.images = Array.isArray(body.images) ? body.images : null;
  }

  const { data, error } = await supabase
    .from("journal_trade_review")
    .upsert(row, { onConflict: "trade_id" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ review: data });
}
