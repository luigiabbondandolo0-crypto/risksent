import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/encrypt";
import {
  deleteProvisionedMetaTraderAccount,
  provisionAndDeployMetaTraderAccount
} from "@/lib/metaapiProvisioning";
import { mapMetaApiErrorToAddAccountMessage } from "@/lib/metaapiAddAccountUserMessages";
import { normalizeMetaApiToken } from "@/lib/metaapiTokenNormalize";
import { verifyProvisionedMetaApiAccount } from "@/lib/metaapiVerifyProvisionedAccount";

export const maxDuration = 120;

/**
 * POST /api/add-account
 * Body: { account_name, platform: "MT4"|"MT5", server, account_number, password }
 * Creates the account on MetaApi.cloud, deploys it, stores row in trading_account.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseRouteClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!normalizeMetaApiToken(process.env.METAAPI_TOKEN)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Server is missing METAAPI_TOKEN.",
          problems: ["METAAPI_TOKEN not set"]
        },
        { status: 503 }
      );
    }

    let body: {
      account_name?: string;
      platform?: string;
      server?: string;
      account_number?: string;
      password?: string;
    };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const account_name = typeof body.account_name === "string" ? body.account_name.trim() : "";
    const platformRaw = typeof body.platform === "string" ? body.platform.trim().toUpperCase() : "";
    const server = typeof body.server === "string" ? body.server.trim() : "";
    const account_number_raw = typeof body.account_number === "string" ? body.account_number.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!account_name) {
      return NextResponse.json({ error: "account_name is required" }, { status: 400 });
    }
    if (platformRaw !== "MT4" && platformRaw !== "MT5") {
      return NextResponse.json({ error: "platform must be MT4 or MT5" }, { status: 400 });
    }
    if (!server) {
      return NextResponse.json({ error: "server is required (broker server name, e.g. ICMarketsSC-Demo)" }, { status: 400 });
    }
    if (!account_number_raw) {
      return NextResponse.json({ error: "account_number is required" }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json({ error: "password is required" }, { status: 400 });
    }

    const loginDigits = account_number_raw.replace(/\D/g, "");
    if (!loginDigits) {
      return NextResponse.json({ error: "account_number must include digits" }, { status: 400 });
    }

    let investor_password_encrypted: string;
    try {
      investor_password_encrypted = encrypt(password);
    } catch {
      return NextResponse.json(
        {
          error:
            "Password storage is not configured. Set ENCRYPTION_KEY (32+ chars) in server environment to add accounts."
        },
        { status: 503 }
      );
    }

    const provisioned = await provisionAndDeployMetaTraderAccount({
      name: account_name,
      login: loginDigits,
      password,
      server,
      platform: platformRaw === "MT4" ? "mt4" : "mt5",
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

    const verified = await verifyProvisionedMetaApiAccount(provisioned.accountId);
    if (!verified.ok) {
      await deleteProvisionedMetaTraderAccount(provisioned.accountId);
      return NextResponse.json(
        { error: mapMetaApiErrorToAddAccountMessage(verified.error || "") },
        { status: 400 }
      );
    }

    const insertRow: Record<string, unknown> = {
      user_id: user.id,
      broker_type: platformRaw,
      account_number: loginDigits,
      investor_password_encrypted,
      metaapi_account_id: provisioned.accountId,
      broker_host: server,
      account_name
    };

    const { data: inserted, error: insertError } = await supabase
      .from("trading_account")
      .insert(insertRow)
      .select("id, broker_type, account_number, account_name, metaapi_account_id, created_at")
      .single();

    if (insertError) {
      const msg = insertError.message ?? String(insertError);
      if (msg.includes("duplicate") || insertError.code === "23505") {
        return NextResponse.json(
          {
            error:
              "This account is already linked in RiskSent. The MetaApi account was created; remove the duplicate from MetaApi dashboard if needed.",
            metaapi_account_id: provisioned.accountId
          },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: msg, metaapi_account_id: provisioned.accountId }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      account: inserted,
      message: "Account linked. Your live balance and stats should appear on the dashboard."
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Failed to add account" },
      { status: 500 }
    );
  }
}
