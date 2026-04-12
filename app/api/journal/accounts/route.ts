import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import type { JournalPlatform } from "@/lib/journal/journalTypes";

export async function GET() {
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
    .select(
      "id, user_id, nickname, broker_server, account_number, platform, currency, initial_balance, current_balance, status, last_synced_at, created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ accounts: data ?? [] });
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

  // Demo mode guard — plan 'user' cannot create real data
  const { data: subRow } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .single();
  if (!subRow || subRow.plan === "user") {
    return NextResponse.json(
      { error: "demo_mode", message: "Start your trial to use this feature" },
      { status: 403 }
    );
  }

  // new_trader limit: max 1 broker account
  if (subRow.plan === "new_trader") {
    const { count } = await supabase
      .from("journal_account")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    if ((count ?? 0) >= 1) {
      return NextResponse.json(
        { error: "limit_reached", message: "New Trader plan allows 1 broker account. Upgrade to Experienced for unlimited." },
        { status: 403 }
      );
    }
  }

  let body: {
    nickname?: string;
    broker_server?: string;
    account_number?: string;
    account_password?: string;
    platform?: string;
    currency?: string;
    initial_balance?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const nickname = String(body.nickname ?? "").trim();
  const broker_server = String(body.broker_server ?? "").trim();
  const account_number = String(body.account_number ?? "").trim();
  const account_password = String(body.account_password ?? "");
  const platform = (body.platform === "MT4" ? "MT4" : "MT5") as JournalPlatform;
  const currency = String(body.currency ?? "USD").trim().toUpperCase() || "USD";
  const initial_balance = Number(body.initial_balance ?? 0);

  if (!nickname || !broker_server || !account_number || !account_password) {
    return NextResponse.json(
      { error: "nickname, broker_server, account_number, account_password required" },
      { status: 400 }
    );
  }
  if (!Number.isFinite(initial_balance)) {
    return NextResponse.json({ error: "invalid initial_balance" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("journal_account")
    .insert({
      user_id: user.id,
      nickname,
      broker_server,
      account_number,
      account_password,
      platform,
      currency,
      initial_balance,
      current_balance: initial_balance,
      status: "active"
    })
    .select(
      "id, user_id, nickname, broker_server, account_number, platform, currency, initial_balance, current_balance, status, last_synced_at, created_at"
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ account: data });
}
