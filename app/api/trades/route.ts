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

function normalizeOrderType(o: Record<string, unknown>): string {
  const ex = (o.ex as Record<string, unknown> | undefined) ?? {};
  const type = String(o.type ?? o.orderType ?? o.dealType ?? "").toLowerCase();
  const cmd = Number(o.cmd ?? ex.cmd ?? NaN);
  if (type.includes("sell") || type === "dealsell" || cmd === 1) return "Sell";
  if (type.includes("buy") || type === "dealbuy" || cmd === 0) return "Buy";
  return type || "Buy";
}

function getLots(o: Record<string, unknown>): number {
  const diIn = o.dealInternalIn as Record<string, unknown> | undefined;
  const diOut = o.dealInternalOut as Record<string, unknown> | undefined;
  const closeLots = Number(o.closeLots);
  if (Number.isFinite(closeLots) && closeLots > 0) return closeLots;
  const inLots = diIn != null ? Number(diIn.lots) : NaN;
  if (Number.isFinite(inLots) && inLots > 0) return inLots;
  const outLots = diOut != null ? Number(diOut.lots) : NaN;
  if (Number.isFinite(outLots) && outLots > 0) return outLots;
  const top = Number(o.lots ?? (o.ex as Record<string, unknown>)?.volume);
  return Number.isFinite(top) ? top : 0;
}

function parseOrders(raw: unknown): TradeRow[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (o: unknown) =>
        o != null &&
        typeof (o as { closeTime?: string }).closeTime === "string" &&
        typeof (o as { profit?: number }).profit === "number"
    )
    .map((o: Record<string, unknown>) => {
      const ex = (o.ex as Record<string, unknown>) ?? {};
      return {
        ticket: Number(o.ticket) ?? 0,
        openTime: String(o.openTime ?? ""),
        closeTime: String(o.closeTime ?? ""),
        type: normalizeOrderType(o),
        symbol: String(o.symbol ?? ""),
        lots: getLots(o),
        openPrice: Number(o.openPrice ?? ex.open_price) ?? 0,
        closePrice: Number(o.closePrice ?? ex.close_price) ?? 0,
        profit: Number(o.profit ?? ex.profit) ?? 0,
        comment: o.comment != null ? String(o.comment) : undefined
      };
    });
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
    const [closedRes, summaryRes] = await Promise.all([
      fetch(
        `${METAAPI_BASE}/ClosedOrders?id=${encodeURIComponent(accountId)}`,
        { headers: { "x-api-key": apiKey, Accept: "application/json" } }
      ),
      fetch(
        `${METAAPI_BASE}/AccountSummary?id=${encodeURIComponent(accountId)}`,
        { headers: { "x-api-key": apiKey, Accept: "application/json" } }
      )
    ]);
    if (!closedRes.ok) {
      const err = await closedRes.text();
      return NextResponse.json(
        { error: `MetatraderApi: ${closedRes.status} ${err}`, trades: [] },
        { status: 502 }
      );
    }
    const raw = await closedRes.json();
    const rawArray = Array.isArray(raw) ? raw : raw?.orders ?? raw ?? [];
    console.log("[api/trades] ClosedOrders raw:", JSON.stringify(rawArray.length ? rawArray.slice(0, 3) : rawArray, null, 2));
    const trades = parseOrders(rawArray);
    trades.sort(
      (a, b) => new Date(b.closeTime).getTime() - new Date(a.closeTime).getTime()
    );
    let currency = "EUR";
    let balance = 0;
    if (summaryRes.ok) {
      const summary = await summaryRes.json();
      if (summary?.currency) currency = String(summary.currency);
      if (Number.isFinite(summary?.balance)) balance = Number(summary.balance);
    }
    return NextResponse.json({
      trades,
      currency,
      balance
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
