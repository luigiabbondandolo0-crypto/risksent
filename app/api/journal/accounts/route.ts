import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/encrypt";
import {
  deleteProvisionedMetaTraderAccount,
  provisionAndDeployMetaTraderAccount
} from "@/lib/metaapiProvisioning";
import { normalizeMetaApiToken } from "@/lib/metaapiTokenNormalize";
import {
  METAAPI_INVALID_ACCOUNT_MESSAGE,
  verifyProvisionedMetaApiAccount
} from "@/lib/metaapiVerifyProvisionedAccount";
import type { JournalPlatform } from "@/lib/journal/journalTypes";

export const maxDuration = 120;

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
      "id, user_id, nickname, broker_server, account_number, platform, currency, initial_balance, current_balance, status, metaapi_account_id, last_synced_at, created_at"
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

  if (subRow.plan === "new_trader") {
    const { count } = await supabase
      .from("journal_account")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    if ((count ?? 0) >= 1) {
      return NextResponse.json(
        {
          error: "limit_reached",
          message: "New Trader plan allows 1 broker account. Upgrade to Experienced for unlimited."
        },
        { status: 403 }
      );
    }
  }

  if (!normalizeMetaApiToken(process.env.METAAPI_TOKEN)) {
    return NextResponse.json(
      { error: "METAAPI_TOKEN is not configured on the server." },
      { status: 503 }
    );
  }

  const { error: appUserErr } = await supabase.from("app_user").upsert({ id: user.id }, { onConflict: "id" });
  if (appUserErr) {
    return NextResponse.json(
      { error: `Could not ensure user profile row: ${appUserErr.message}` },
      { status: 500 }
    );
  }

  let body: {
    nickname?: string;
    broker_server?: string;
    account_number?: string;
    account_password?: string;
    platform?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const nickname = String(body.nickname ?? "").trim();
  const broker_server = String(body.broker_server ?? "").trim();
  const account_number_raw = String(body.account_number ?? "").trim();
  const account_password = String(body.account_password ?? "");
  const platform = (body.platform === "MT4" ? "MT4" : "MT5") as JournalPlatform;

  if (!nickname || !broker_server || !account_number_raw || !account_password) {
    return NextResponse.json(
      { error: "nickname, broker_server, account_number, account_password required" },
      { status: 400 }
    );
  }

  const loginDigits = account_number_raw.replace(/\D/g, "");
  if (!loginDigits) {
    return NextResponse.json({ error: "account_number must include digits" }, { status: 400 });
  }

  let passwordEncrypted: string;
  try {
    passwordEncrypted = encrypt(account_password);
  } catch {
    return NextResponse.json(
      {
        error:
          "ENCRYPTION_KEY is not configured (32+ characters). Required to store credentials securely."
      },
      { status: 503 }
    );
  }

  const { data: existingTrading } = await supabase
    .from("trading_account")
    .select("id")
    .eq("user_id", user.id)
    .eq("broker_type", platform)
    .eq("account_number", loginDigits)
    .maybeSingle();

  if (existingTrading) {
    return NextResponse.json(
      { error: "This broker account is already linked. Use the existing account or remove it first." },
      { status: 409 }
    );
  }

  const provisioned = await provisionAndDeployMetaTraderAccount({
    name: nickname,
    login: loginDigits,
    password: account_password,
    server: broker_server,
    platform: platform === "MT4" ? "mt4" : "mt5",
    manualTrades: true,
    magic: 0
  });

  if (!provisioned.ok) {
    return NextResponse.json(
      { error: provisioned.message, details: provisioned.details },
      { status: provisioned.status >= 400 && provisioned.status < 600 ? provisioned.status : 502 }
    );
  }

  const verified = await verifyProvisionedMetaApiAccount(provisioned.accountId);
  if (!verified.ok) {
    await deleteProvisionedMetaTraderAccount(provisioned.accountId);
    return NextResponse.json({ error: METAAPI_INVALID_ACCOUNT_MESSAGE }, { status: 400 });
  }

  const info = verified.info;
  const currency = String(info.currency ?? "USD")
    .trim()
    .toUpperCase()
    .slice(0, 8);
  const balance = Number(info.balance);
  const equity = Number(info.equity);
  const initial_balance = Number.isFinite(balance) ? balance : 0;
  const current_balance = Number.isFinite(equity) ? equity : initial_balance;

  const tradingInsert: Record<string, unknown> = {
    user_id: user.id,
    broker_type: platform,
    account_number: loginDigits,
    investor_password_encrypted: passwordEncrypted,
    metaapi_account_id: provisioned.accountId,
    broker_host: broker_server,
    account_name: nickname
  };

  const { error: tradingErr } = await supabase.from("trading_account").insert(tradingInsert);
  if (tradingErr) {
    const msg = tradingErr.message ?? String(tradingErr);
    if (msg.includes("duplicate") || tradingErr.code === "23505") {
      return NextResponse.json(
        { error: "This broker account is already linked.", metaapi_account_id: provisioned.accountId },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: msg, metaapi_account_id: provisioned.accountId }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("journal_account")
    .insert({
      user_id: user.id,
      nickname,
      broker_server,
      account_number: loginDigits,
      account_password: passwordEncrypted,
      platform,
      currency: currency || "USD",
      initial_balance,
      current_balance,
      status: "active",
      metaapi_account_id: provisioned.accountId
    })
    .select(
      "id, user_id, nickname, broker_server, account_number, platform, currency, initial_balance, current_balance, status, metaapi_account_id, last_synced_at, created_at"
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message, metaapi_account_id: provisioned.accountId }, { status: 500 });
  }

  return NextResponse.json({ account: data, metaapi_sync_pending: false });
}
