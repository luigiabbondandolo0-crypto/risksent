import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseServer";

const METAAPI_BASE = "https://api.metatraderapi.dev";

export type TradeRow = {
  ticket: number;
  openTime: string;
  closeTime: string;
  type: string;
  symbol: string;
  lots: number;
  openPrice: number;
  closePrice: number;
  profit: number;
  comment?: string;
};

function parseOrders(raw: unknown): TradeRow[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (o: unknown) =>
        o != null &&
        typeof (o as { closeTime?: string }).closeTime === "string" &&
        typeof (o as { profit?: number }).profit === "number"
    )
    .map((o: Record<string, unknown>) => ({
      ticket: Number(o.ticket) ?? 0,
      openTime: String(o.openTime ?? ""),
      closeTime: String(o.closeTime ?? ""),
      type: String(o.type ?? ""),
      symbol: String(o.symbol ?? ""),
      lots: Number(o.lots) ?? 0,
      openPrice: Number(o.openPrice) ?? 0,
      closePrice: Number(o.closePrice) ?? 0,
      profit: Number(o.profit) ?? 0,
      comment: o.comment != null ? String(o.comment) : undefined
    }));
}

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

  let accountId: string | null = uuid;
  if (!accountId) {
    const { data: accounts } = await supabase
      .from("trading_account")
      .select("metaapi_account_id")
      .eq("user_id", user.id)
      .limit(1);
    accountId = accounts?.[0]?.metaapi_account_id ?? null;
  }

  if (!accountId) {
    return NextResponse.json({
      trades: [],
      currency: "EUR",
      error: "No account selected or linked"
    });
  }

  const apiKey = process.env.METATRADERAPI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "METATRADERAPI_API_KEY not set" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `${METAAPI_BASE}/ClosedOrders?id=${encodeURIComponent(accountId)}`,
      { headers: { "x-api-key": apiKey, Accept: "application/json" } }
    );
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: `MetatraderApi: ${res.status} ${err}`, trades: [] },
        { status: 502 }
      );
    }
    const raw = await res.json();
    const trades = parseOrders(Array.isArray(raw) ? raw : raw?.orders ?? raw ?? []);
    // Sort by close time descending (newest first)
    trades.sort(
      (a, b) => new Date(b.closeTime).getTime() - new Date(a.closeTime).getTime()
    );
    return NextResponse.json({
      trades,
      currency: "EUR"
    });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Failed to fetch trades",
        trades: []
      },
      { status: 502 }
    );
  }
}
