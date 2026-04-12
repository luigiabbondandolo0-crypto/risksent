import { NextRequest, NextResponse } from "next/server";
import { requireRouteUser } from "@/lib/supabase/requireRouteUser";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: Request) {
  const auth = await requireRouteUser(request);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const admin = createSupabaseAdmin();
  const { data: row, error } = await admin
    .from("app_user")
    .select("daily_loss_pct, max_risk_per_trade_pct, max_exposure_pct, revenge_threshold_trades")
    .eq("id", user.id)
    .single();

  if (error || !row) {
    return NextResponse.json({
      daily_loss_pct: 5,
      max_risk_per_trade_pct: 1,
      max_exposure_pct: 6,
      revenge_threshold_trades: 3
    });
  }

  return NextResponse.json({
    daily_loss_pct: Number(row.daily_loss_pct) ?? 5,
    max_risk_per_trade_pct: Number(row.max_risk_per_trade_pct) ?? 1,
    max_exposure_pct: Number(row.max_exposure_pct) ?? 6,
    revenge_threshold_trades: Number(row.revenge_threshold_trades) ?? 3
  });
}

function parseBody(body: Record<string, unknown>) {
  const daily_loss_pct = body.daily_loss_pct != null ? Number(body.daily_loss_pct) : undefined;
  const max_risk_per_trade_pct = body.max_risk_per_trade_pct != null ? Number(body.max_risk_per_trade_pct) : undefined;
  const max_exposure_pct = body.max_exposure_pct != null ? Number(body.max_exposure_pct) : undefined;
  const revenge_threshold_trades =
    body.revenge_threshold_trades != null ? Number(body.revenge_threshold_trades) : undefined;
  return { daily_loss_pct, max_risk_per_trade_pct, max_exposure_pct, revenge_threshold_trades };
}

export async function POST(req: NextRequest) {
  return upsertRules(req);
}

export async function PATCH(req: NextRequest) {
  return upsertRules(req);
}

async function upsertRules(req: NextRequest) {
  const auth = await requireRouteUser(req);
  if (auth instanceof NextResponse) return auth;
  const { supabase, user } = auth;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const p = parseBody(body);
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (p.daily_loss_pct !== undefined && p.daily_loss_pct >= 0) updates.daily_loss_pct = p.daily_loss_pct;
  if (p.max_risk_per_trade_pct !== undefined && p.max_risk_per_trade_pct >= 0)
    updates.max_risk_per_trade_pct = p.max_risk_per_trade_pct;
  if (p.max_exposure_pct !== undefined && p.max_exposure_pct >= 0) updates.max_exposure_pct = p.max_exposure_pct;
  if (p.revenge_threshold_trades !== undefined && p.revenge_threshold_trades >= 0)
    updates.revenge_threshold_trades = p.revenge_threshold_trades;

  if (Object.keys(updates).length <= 1) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data: updated, error: updateError } = await supabase
    .from("app_user")
    .update(updates)
    .eq("id", user.id)
    .select("daily_loss_pct, max_risk_per_trade_pct, max_exposure_pct, revenge_threshold_trades")
    .single();

  if (!updateError && updated) {
    return NextResponse.json({
      daily_loss_pct: Number(updated.daily_loss_pct) ?? 5,
      max_risk_per_trade_pct: Number(updated.max_risk_per_trade_pct) ?? 1,
      max_exposure_pct: Number(updated.max_exposure_pct) ?? 6,
      revenge_threshold_trades: Number(updated.revenge_threshold_trades) ?? 3
    });
  }

  const insertPayload = {
    id: user.id,
    role: "customer",
    daily_loss_pct: (updates.daily_loss_pct as number) ?? 5,
    max_risk_per_trade_pct: (updates.max_risk_per_trade_pct as number) ?? 1,
    max_exposure_pct: (updates.max_exposure_pct as number) ?? 6,
    revenge_threshold_trades: (updates.revenge_threshold_trades as number) ?? 3,
    updated_at: new Date().toISOString()
  };
  const { data: inserted, error: insertError } = await supabase
    .from("app_user")
    .upsert(insertPayload, { onConflict: "id" })
    .select("daily_loss_pct, max_risk_per_trade_pct, max_exposure_pct, revenge_threshold_trades")
    .single();

  if (insertError || !inserted) {
    return NextResponse.json({ error: insertError?.message ?? "Save failed" }, { status: 500 });
  }

  return NextResponse.json({
    daily_loss_pct: Number(inserted.daily_loss_pct) ?? 5,
    max_risk_per_trade_pct: Number(inserted.max_risk_per_trade_pct) ?? 1,
    max_exposure_pct: Number(inserted.max_exposure_pct) ?? 6,
    revenge_threshold_trades: Number(inserted.revenge_threshold_trades) ?? 3
  });
}
