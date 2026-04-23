import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/encrypt";
import { deleteProvisionedMetaTraderAccount } from "@/lib/metaapiProvisioning";
import { normalizeMetaApiToken } from "@/lib/metaapiTokenNormalize";
import type { JournalPlatform } from "@/lib/journal/journalTypes";

const SELECT_PUBLIC =
  "id, user_id, nickname, broker_server, account_number, platform, currency, initial_balance, current_balance, status, metaapi_account_id, last_synced_at, created_at";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("journal_account")
    .select(SELECT_PUBLIC)
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ account: data });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseRouteClient();
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

  const patch: Record<string, unknown> = {};
  if (typeof body.nickname === "string") patch.nickname = body.nickname.trim();
  if (typeof body.broker_server === "string") patch.broker_server = body.broker_server.trim();
  if (typeof body.account_number === "string") patch.account_number = body.account_number.trim();
  if (typeof body.account_password === "string" && body.account_password.length > 0) {
    try {
      patch.account_password = encrypt(body.account_password);
    } catch {
      return NextResponse.json(
        { error: "ENCRYPTION_KEY is not configured; cannot store password." },
        { status: 503 }
      );
    }
  }
  if (body.platform === "MT4" || body.platform === "MT5") patch.platform = body.platform as JournalPlatform;
  if (typeof body.currency === "string") patch.currency = body.currency.trim().toUpperCase();
  if (body.initial_balance != null && Number.isFinite(Number(body.initial_balance))) {
    patch.initial_balance = Number(body.initial_balance);
  }
  if (body.current_balance != null && Number.isFinite(Number(body.current_balance))) {
    patch.current_balance = Number(body.current_balance);
  }
  if (body.status === "active" || body.status === "disconnected") patch.status = body.status;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("journal_account")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id)
    .select(SELECT_PUBLIC)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ account: data });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: row, error: fetchErr } = await supabase
    .from("journal_account")
    .select("id, metaapi_account_id, account_number, platform")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const metaId = row.metaapi_account_id?.trim() ?? "";
  if (normalizeMetaApiToken(process.env.METAAPI_TOKEN) && metaId) {
    try {
      await deleteProvisionedMetaTraderAccount(metaId);
    } catch (e) {
      console.warn("[journal/accounts DELETE] MetaApi cleanup:", e);
    }
  }

  const { error: jErr } = await supabase.from("journal_account").delete().eq("id", id).eq("user_id", user.id);
  if (jErr) {
    return NextResponse.json({ error: jErr.message }, { status: 500 });
  }

  if (metaId) {
    const { error: tDel } = await supabase
      .from("trading_account")
      .delete()
      .eq("user_id", user.id)
      .eq("metaapi_account_id", metaId);
    if (tDel) {
      return NextResponse.json({ error: tDel.message }, { status: 500 });
    }
  } else {
    const { error: tDel } = await supabase
      .from("trading_account")
      .delete()
      .eq("user_id", user.id)
      .eq("account_number", row.account_number)
      .eq("broker_type", row.platform);
    if (tDel) {
      return NextResponse.json({ error: tDel.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
