import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseServer";
import {
  getAccountSummary,
  getOpenPositions,
  accountSelectColumns,
  type TradingAccountRow
} from "@/lib/tradingApi";

export type PositionRow = {
  ticket: number;
  symbol: string;
  type: string;
  volume: number;
  openPrice: number;
  profit: number;
  stopLoss: number | null;
  takeProfit: number | null;
  openTime?: string;
};

function normalizeType(o: Record<string, unknown>): string {
  const type = String(o.type ?? o.orderType ?? "").toLowerCase();
  const cmd = Number(o.cmd ?? (o.ex as Record<string, unknown>)?.cmd ?? NaN);
  if (type.includes("sell") || cmd === 1) return "Sell";
  if (type.includes("buy") || cmd === 0) return "Buy";
  return type || "Buy";
}

function parsePositions(raw: unknown[]): PositionRow[] {
  return raw
    .filter((o): o is Record<string, unknown> => o != null && typeof o === "object")
    .map((o) => {
      const ex = (o.ex as Record<string, unknown>) ?? {};
      const volume = Number(o.volume ?? o.lots ?? ex.volume) || 0;
      const openPrice = Number(o.openPrice ?? o.price ?? ex.open_price ?? ex.price) || 0;
      const profit = Number(o.profit ?? ex.profit) || 0;
      const sl = o.stopLoss ?? o.sl ?? ex.stop_loss;
      const tp = o.takeProfit ?? o.tp ?? ex.take_profit;
      return {
        ticket: Number(o.ticket ?? o.order ?? 0) || 0,
        symbol: String(o.symbol ?? o.instrument ?? "").trim(),
        type: normalizeType(o),
        volume,
        openPrice,
        profit,
        stopLoss: sl != null && Number.isFinite(Number(sl)) ? Number(sl) : null,
        takeProfit: tp != null && Number.isFinite(Number(tp)) ? Number(tp) : null,
        openTime: typeof o.openTime === "string" ? o.openTime : undefined
      };
    })
    .filter((p) => p.symbol && p.volume > 0);
}

/**
 * GET /api/orders/overview?uuid=metaapi_account_id
 * Returns account summary (balance, equity, currency) and open positions for the given account.
 */
export async function GET(req: NextRequest) {
  const supabase = createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const uuid = req.nextUrl.searchParams.get("uuid")?.trim() ?? undefined;

  let accountRow: TradingAccountRow | null = null;
  if (uuid) {
    const { data } = await supabase
      .from("trading_account")
      .select(accountSelectColumns())
      .eq("user_id", user.id)
      .eq("metaapi_account_id", uuid)
      .limit(1)
      .single();
    accountRow = data && typeof data === "object" && "metaapi_account_id" in data ? (data as unknown as TradingAccountRow) : null;
  }
  if (!accountRow) {
    const { data: accounts } = await supabase
      .from("trading_account")
      .select(accountSelectColumns())
      .eq("user_id", user.id)
      .not("metaapi_account_id", "is", null)
      .limit(1);
    accountRow = (accounts?.[0] as unknown as TradingAccountRow) ?? null;
  }

  if (!accountRow?.metaapi_account_id) {
    return NextResponse.json({ summary: null, positions: [], error: "No account found" }, { status: 200 });
  }

  const [summaryResult, positionsResult] = await Promise.all([
    getAccountSummary(accountRow),
    getOpenPositions(accountRow)
  ]);

  const summary = summaryResult.ok ? summaryResult.summary : null;
  const rawPositions = positionsResult.ok ? (positionsResult.positions as unknown[]) : [];
  const positions = parsePositions(rawPositions);

  return NextResponse.json({
    summary: summary ? { balance: summary.balance, equity: summary.equity, currency: summary.currency } : null,
    positions,
    error: !summaryResult.ok ? summaryResult.error : !positionsResult.ok ? positionsResult.error : undefined
  });
}
