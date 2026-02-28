import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseServer";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const supabase = createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.log("[Rules GET] [verbose] unauthorized", { authError: authError?.message });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdmin();
  const { data: row, error } = await admin
    .from("app_user")
    .select("daily_loss_pct, max_risk_per_trade_pct, max_exposure_pct, revenge_threshold_trades, telegram_chat_id")
    .eq("id", user.id)
    .single();

  console.log("[Rules GET] [verbose]", {
    userId: user.id.slice(0, 8) + "...",
    hasRow: !!row,
    error: error?.message,
    telegram_chat_id: row ? (row.telegram_chat_id ? "set(" + String(row.telegram_chat_id).length + ")" : "null") : "n/a"
  });

  if (error || !row) {
    return NextResponse.json({
      daily_loss_pct: 2,
      max_risk_per_trade_pct: 1,
      max_exposure_pct: 15,
      revenge_threshold_trades: 2,
      telegram_chat_id: null
    });
  }

  const chatId = row.telegram_chat_id;
  return NextResponse.json({
    daily_loss_pct: Number(row.daily_loss_pct) ?? 2,
    max_risk_per_trade_pct: Number(row.max_risk_per_trade_pct) ?? 1,
    max_exposure_pct: Number(row.max_exposure_pct) ?? 15,
    revenge_threshold_trades: Number(row.revenge_threshold_trades) ?? 2,
    telegram_chat_id: chatId != null && chatId !== "" ? String(chatId) : null
  });
}

export async function PATCH(req: NextRequest) {
  const supabase = createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const daily_loss_pct = body.daily_loss_pct != null ? Number(body.daily_loss_pct) : undefined;
  const max_risk_per_trade_pct = body.max_risk_per_trade_pct != null ? Number(body.max_risk_per_trade_pct) : undefined;
  const max_exposure_pct = body.max_exposure_pct != null ? Number(body.max_exposure_pct) : undefined;
  const revenge_threshold_trades = body.revenge_threshold_trades != null ? Number(body.revenge_threshold_trades) : undefined;
  const telegram_chat_id = body.telegram_chat_id !== undefined ? (body.telegram_chat_id === null || body.telegram_chat_id === "" ? null : String(body.telegram_chat_id)) : undefined;

  const updates: Record<string, unknown> = {};
  if (daily_loss_pct !== undefined && daily_loss_pct >= 0) updates.daily_loss_pct = daily_loss_pct;
  if (max_risk_per_trade_pct !== undefined && max_risk_per_trade_pct >= 0) updates.max_risk_per_trade_pct = max_risk_per_trade_pct;
  if (max_exposure_pct !== undefined && max_exposure_pct >= 0) updates.max_exposure_pct = max_exposure_pct;
  if (revenge_threshold_trades !== undefined && revenge_threshold_trades >= 0) updates.revenge_threshold_trades = revenge_threshold_trades;
  if (telegram_chat_id !== undefined) updates.telegram_chat_id = telegram_chat_id;
  updates.updated_at = new Date().toISOString();

  if (Object.keys(updates).length <= 1) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data: updated, error: updateError } = await supabase
    .from("app_user")
    .update(updates)
    .eq("id", user.id)
    .select("daily_loss_pct, max_risk_per_trade_pct, max_exposure_pct, revenge_threshold_trades, telegram_chat_id")
    .single();

  if (updateError || !updated) {
    const insertPayload = {
      id: user.id,
      role: "customer",
      daily_loss_pct: (updates.daily_loss_pct as number) ?? 2,
      max_risk_per_trade_pct: (updates.max_risk_per_trade_pct as number) ?? 1,
      max_exposure_pct: (updates.max_exposure_pct as number) ?? 15,
      revenge_threshold_trades: (updates.revenge_threshold_trades as number) ?? 2,
      telegram_chat_id: updates.telegram_chat_id ?? null,
      updated_at: new Date().toISOString()
    };
    const { data: inserted, error: insertError } = await supabase
      .from("app_user")
      .upsert(insertPayload, { onConflict: "id" })
      .select("daily_loss_pct, max_risk_per_trade_pct, max_exposure_pct, revenge_threshold_trades, telegram_chat_id")
      .single();
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
    return NextResponse.json({
      daily_loss_pct: Number(inserted?.daily_loss_pct) ?? 2,
      max_risk_per_trade_pct: Number(inserted?.max_risk_per_trade_pct) ?? 1,
      max_exposure_pct: Number(inserted?.max_exposure_pct) ?? 15,
      revenge_threshold_trades: Number(inserted?.revenge_threshold_trades) ?? 2,
      telegram_chat_id: inserted?.telegram_chat_id ?? null
    });
  }

  return NextResponse.json({
    daily_loss_pct: Number(updated?.daily_loss_pct) ?? 5,
    max_risk_per_trade_pct: Number(updated?.max_risk_per_trade_pct) ?? 1,
    max_exposure_pct: Number(updated?.max_exposure_pct) ?? 6,
    revenge_threshold_trades: Number(updated?.revenge_threshold_trades) ?? 3,
    telegram_chat_id: updated?.telegram_chat_id ?? null
  });
}
