import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/encrypt";
import {
  deleteProvisionedMetaTraderAccount,
  provisionAndDeployMetaTraderAccount
} from "@/lib/metaapiProvisioning";
import { mapMetaApiErrorToAddAccountMessage } from "@/lib/metaapiAddAccountUserMessages";
import { finalizeJournalAccountAfterProvision } from "@/lib/journal/finalizeJournalAccountMetaApi";
import { normalizeMetaApiToken } from "@/lib/metaapiTokenNormalize";
import type { JournalPlatform } from "@/lib/journal/journalTypes";
import type { Plan, SubStatus } from "@/lib/subscription/caps";
import { capsForPlan } from "@/lib/subscription/caps";

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
    .select("plan, status, current_period_end, trial_started_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const caps = capsForPlan(
    ((subRow?.plan as Plan | "free") ?? "user") as Plan | "free",
    (subRow?.status as SubStatus) ?? "active",
    subRow?.current_period_end ?? null,
    Boolean((subRow as { trial_started_at?: string | null } | null)?.trial_started_at)
  );
  if (caps.isDemoMode) {
    return NextResponse.json(
      { error: "demo_mode", message: "Start your trial to use this feature" },
      { status: 403 }
    );
  }

  const maxAccounts = caps.maxBrokerAccounts;
  if (maxAccounts !== null && maxAccounts > 0) {
    const { count } = await supabase
      .from("journal_account")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    if ((count ?? 0) >= maxAccounts) {
      return NextResponse.json(
        {
          error: "limit_reached",
          message: `Your plan allows ${maxAccounts} broker account${maxAccounts > 1 ? "s" : ""}. Upgrade to add more.`
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

  const { data: existingJournal } = await supabase
    .from("journal_account")
    .select("id")
    .eq("user_id", user.id)
    .eq("platform", platform)
    .eq("account_number", loginDigits)
    .maybeSingle();

  if (existingJournal) {
    return NextResponse.json(
      { error: "This broker account is already linked. Use the existing account or remove it first." },
      { status: 409 }
    );
  }

  /** Stale trading_account rows without a journal (e.g. partial delete) would block re-add. */
  const { error: orphanDelErr } = await supabase
    .from("trading_account")
    .delete()
    .eq("user_id", user.id)
    .eq("broker_type", platform)
    .eq("account_number", loginDigits);

  if (orphanDelErr) {
    return NextResponse.json({ error: orphanDelErr.message }, { status: 500 });
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
    const userMsg = mapMetaApiErrorToAddAccountMessage(provisioned.message);
    return NextResponse.json(
      { error: userMsg },
      { status: provisioned.status >= 400 && provisioned.status < 600 ? provisioned.status : 502 }
    );
  }

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
      currency: "USD",
      initial_balance: 0,
      current_balance: 0,
      status: "active",
      metaapi_account_id: provisioned.accountId
    })
    .select(
      "id, user_id, nickname, broker_server, account_number, platform, currency, initial_balance, current_balance, status, metaapi_account_id, last_synced_at, created_at"
    )
    .single();

  if (error) {
    await deleteProvisionedMetaTraderAccount(provisioned.accountId);
    await supabase
      .from("trading_account")
      .delete()
      .eq("user_id", user.id)
      .eq("metaapi_account_id", provisioned.accountId);
    return NextResponse.json({ error: error.message, metaapi_account_id: provisioned.accountId }, { status: 500 });
  }

  const journalId = data.id;
  const metaId = provisioned.accountId;
  after(() => {
    void finalizeJournalAccountAfterProvision({
      userId: user.id,
      journalAccountId: journalId,
      metaapiAccountId: metaId
    }).catch((e) => console.error("[journal/accounts POST] finalize:", e));
  });

  return NextResponse.json({ account: data, metaapi_sync_pending: true });
}
