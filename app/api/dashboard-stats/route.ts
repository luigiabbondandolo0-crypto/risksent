import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseServer";

const METAAPI_BASE = "https://api.metatraderapi.dev";

export async function GET(req: NextRequest) {
  const supabase = createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const uuid = searchParams.get("uuid");

  let accountId = uuid;
  if (!accountId) {
    const apiKey = process.env.METATRADERAPI_API_KEY;
    accountId = process.env.METATRADERAPI_UUID ?? undefined;
    if (!apiKey || !accountId) {
      const { data: accounts } = await supabase
        .from("trading_account")
        .select("metaapi_account_id")
        .eq("user_id", user.id)
        .limit(1);
      accountId = accounts?.[0]?.metaapi_account_id ?? undefined;
    }
  }

  if (!accountId) {
    return NextResponse.json({
      balance: 0,
      equity: 0,
      winRate: null,
      maxDd: null,
      equityCurve: [],
      error: "No account selected or linked"
    });
  }

  const apiKey = process.env.METATRADERAPI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "METATRADERAPI_API_KEY not set" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `${METAAPI_BASE}/AccountSummary?id=${encodeURIComponent(accountId)}`,
      {
        headers: { "x-api-key": apiKey, Accept: "application/json" }
      }
    );
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: `MetatraderApi: ${res.status} ${err}` },
        { status: 502 }
      );
    }
    const summary = await res.json();
    const balance = Number(summary.balance) ?? 0;
    const equity = Number(summary.equity) ?? 0;

    // Mock win rate and max DD until we have trades
    const winRate = 54;
    const maxDd = -4.2;
    const equityCurve = [
      { t: 0, v: balance * 0.96 },
      { t: 1, v: balance * 0.98 },
      { t: 2, v: balance * 0.97 },
      { t: 3, v: balance * 1.0 },
      { t: 4, v: equity }
    ];

    return NextResponse.json({
      balance,
      equity,
      winRate,
      maxDd,
      equityCurve,
      currency: summary.currency ?? "EUR"
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch account" },
      { status: 502 }
    );
  }
}
