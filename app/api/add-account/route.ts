import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseServer";
import { encrypt } from "@/lib/encrypt";

const LOG = "[AddAccount]";

function getMtapiBase(): string {
  const base = process.env.MTAPI_BASE_URL?.trim();
  if (base) return base.replace(/\/$/, "");
  return "https://mt5.mtapi.io";
}

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
    const brokerHost = String(body.brokerHost ?? "").trim();
    const brokerPort = String(body.brokerPort ?? "").trim();
    const accountNumber = String(body.accountNumber ?? "").trim();
    const password = String(body.investorPassword ?? body.password ?? "").trim();
    const name = String(body.name ?? "").trim();

    console.log(LOG, "request", {
      brokerType,
      host: brokerHost,
      port: brokerPort,
      accountNumberLen: accountNumber.length
    });

    if (!["MT4", "MT5"].includes(brokerType)) {
      return NextResponse.json(
        { ok: false, message: "Only MT4 and MT5 are supported.", problems: ["Unsupported broker type."] },
        { status: 400 }
      );
    }
    if (!brokerHost || !brokerPort) {
      return NextResponse.json(
        { ok: false, message: "Broker host and port are required (mtapi.io).", problems: ["Missing brokerHost or brokerPort."] },
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

    const base = getMtapiBase();
    const params = new URLSearchParams({
      user: accountNumber,
      password,
      host: brokerHost,
      port: brokerPort
    });
    const connectUrl = `${base}/Connect?${params.toString()}`;
    console.log(LOG, "mtapi Connect", { base, host: brokerHost, port: brokerPort, user: accountNumber });
    const res = await fetch(connectUrl, { headers: { Accept: "application/json" } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errMsg = (data as { error?: string }).error ?? (data as { message?: string }).message ?? res.statusText;
      console.error(LOG, "mtapi Connect failed", { status: res.status, body: JSON.stringify(data).slice(0, 200) });
      return NextResponse.json(
        { ok: false, message: errMsg, problems: [String(errMsg)] },
        { status: 400 }
      );
    }
    const accountId =
      (data as { id?: string }).id ??
      (data as { token?: string }).token ??
      (data as Record<string, unknown>).token as string;
    if (!accountId || typeof accountId !== "string") {
      console.error(LOG, "mtapi Connect no token", { data: JSON.stringify(data).slice(0, 300) });
      return NextResponse.json(
        { ok: false, message: "No token returned from mtapi Connect.", problems: ["Invalid response from provider."] },
        { status: 502 }
      );
    }
    console.log(LOG, "mtapi Connect ok", { tokenLen: accountId.length });

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
      metaapi_account_id: accountId,
      provider: "mtapi",
      broker_host: brokerHost,
      broker_port: brokerPort
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
    console.error(LOG, "Error:", error);
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
