import { NextRequest, NextResponse } from "next/server";
import { requireRouteUser } from "@/lib/supabase/requireRouteUser";

const DEFAULTS = {
  telegram_chat_id: null as string | null,
  telegram_enabled: false,
  notify_daily_dd: true,
  notify_exposure: true,
  notify_revenge: true,
  notify_risk_per_trade: true
};

export async function GET(request: Request) {
  const auth = await requireRouteUser(request);
  if (auth instanceof NextResponse) return auth;
  const { supabase, user } = auth;

  const { data } = await supabase.from("risk_notifications").select("*").eq("user_id", user.id).maybeSingle();

  if (!data) {
    return NextResponse.json({ ...DEFAULTS, user_id: user.id });
  }

  return NextResponse.json({
    telegram_chat_id: data.telegram_chat_id ?? null,
    telegram_enabled: !!data.telegram_enabled,
    notify_daily_dd: data.notify_daily_dd !== false,
    notify_exposure: data.notify_exposure !== false,
    notify_revenge: data.notify_revenge !== false,
    notify_risk_per_trade: data.notify_risk_per_trade !== false
  });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireRouteUser(req);
  if (auth instanceof NextResponse) return auth;
  const { supabase, user } = auth;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {
    user_id: user.id,
    updated_at: new Date().toISOString()
  };

  if (body.telegram_chat_id !== undefined) {
    patch.telegram_chat_id =
      body.telegram_chat_id === null || body.telegram_chat_id === ""
        ? null
        : String(body.telegram_chat_id);
  }
  if (body.telegram_enabled !== undefined) patch.telegram_enabled = Boolean(body.telegram_enabled);
  if (body.notify_daily_dd !== undefined) patch.notify_daily_dd = Boolean(body.notify_daily_dd);
  if (body.notify_exposure !== undefined) patch.notify_exposure = Boolean(body.notify_exposure);
  if (body.notify_revenge !== undefined) patch.notify_revenge = Boolean(body.notify_revenge);
  if (body.notify_risk_per_trade !== undefined) patch.notify_risk_per_trade = Boolean(body.notify_risk_per_trade);

  const { data, error } = await supabase
    .from("risk_notifications")
    .upsert(patch, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    telegram_chat_id: data.telegram_chat_id ?? null,
    telegram_enabled: !!data.telegram_enabled,
    notify_daily_dd: data.notify_daily_dd !== false,
    notify_exposure: data.notify_exposure !== false,
    notify_revenge: data.notify_revenge !== false,
    notify_risk_per_trade: data.notify_risk_per_trade !== false
  });
}
