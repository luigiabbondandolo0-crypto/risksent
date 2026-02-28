import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseServer";
import { encrypt } from "@/lib/encrypt";

const METAAPI_BASE = "https://api.metatraderapi.dev";

export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseRouteClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const brokerType = String(body.brokerType ?? "").toUpperCase();
    const server = String(body.server ?? "").trim();
    const accountNumber = String(body.accountNumber ?? "").trim();
    const password = String(body.investorPassword ?? body.password ?? "").trim();
    const name = String(body.name ?? "").trim();

    if (!["MT4", "MT5"].includes(brokerType)) {
      return NextResponse.json(
        { ok: false, message: "Only MT4 and MT5 are supported.", problems: ["Unsupported broker type."] },
        { status: 400 }
      );
    }
    if (!server) {
      return NextResponse.json(
        { ok: false, message: "Server is required.", problems: ["Missing broker server name."] },
        { status: 400 }
      );
    }
    if (!accountNumber) {
      return NextResponse.json(
        { ok: false, message: "Account number is required.", problems: ["Missing account number."] },
        { status: 400 }
      );
    }
    if (!password) {
      return NextResponse.json(
        { ok: false, message: "Password is required.", problems: ["Missing password."] },
        { status: 400 }
      );
    }

    const apiKey = process.env.METATRADERAPI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, message: "Server misconfiguration: API key not set.", problems: ["METATRADERAPI_API_KEY missing."] },
        { status: 500 }
      );
    }

    const typeParam = brokerType === "MT5" ? "Metatrader 5" : "Metatrader 4";
    const params = new URLSearchParams({
      type: typeParam,
      server,
      user: accountNumber,
      password,
      name: name || `${brokerType}-${accountNumber.slice(-4)}`
    });
    const registerUrl = `${METAAPI_BASE}/RegisterAccount?${params.toString()}`;

    const res = await fetch(registerUrl, {
      method: "GET",
      headers: { "x-api-key": apiKey, Accept: "application/json" }
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg = data.error ?? data.message ?? res.statusText;
      return NextResponse.json(
        { ok: false, message: errMsg, problems: [String(errMsg)] },
        { status: 400 }
      );
    }

    const accountId = data.id;
    if (!accountId) {
      return NextResponse.json(
        { ok: false, message: "No account id returned.", problems: ["Invalid response from provider."] },
        { status: 502 }
      );
    }

    // Ensure app_user exists
    await supabase.from("app_user").upsert(
      { id: user.id, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    );

    let encryptedPassword: string;
    try {
      encryptedPassword = encrypt(password);
    } catch (e) {
      return NextResponse.json(
        { ok: false, message: "Encryption not configured.", problems: ["Set ENCRYPTION_KEY (32+ chars) in Vercel."] },
        { status: 500 }
      );
    }

    const { error: insertError } = await supabase.from("trading_account").insert({
      user_id: user.id,
      broker_type: brokerType,
      account_number: accountNumber,
      account_name: name || null,
      investor_password_encrypted: encryptedPassword,
      metaapi_account_id: accountId
    });

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json(
          { ok: false, message: "This account is already added.", problems: ["Duplicate account."] },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { ok: false, message: insertError.message, problems: [insertError.message] },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Account connected and saved.",
      accountId
    });
  } catch (error) {
    console.error("[AddAccount] Error:", error);
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Unexpected error.",
        problems: ["Check server logs."]
      },
      { status: 500 }
    );
  }
}
