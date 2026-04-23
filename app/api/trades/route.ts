import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import {
  getAccountSummary,
  getClosedOrders,
  accountSelectColumns,
  type TradingAccountRow
} from "@/lib/tradingApi";

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
  stopLoss?: number | null;
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
      const sl = o.stopLoss ?? ex.stop_loss ?? o.sl;
      const stopLossVal = sl != null && Number.isFinite(Number(sl)) ? Number(sl) : null;
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
        comment: o.comment != null ? String(o.comment) : undefined,
        stopLoss: stopLossVal
      };
    });
}

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const uuid = searchParams.get("uuid");

  let accountRow: TradingAccountRow | null = null;
  if (uuid) {
    const { data: tradingByMeta } = await supabase
      .from("trading_account")
      .select(accountSelectColumns())
      .eq("user_id", user.id)
      .eq("metaapi_account_id", uuid)
      .maybeSingle();
    if (
      tradingByMeta &&
      typeof tradingByMeta === "object" &&
      "metaapi_account_id" in tradingByMeta &&
      String((tradingByMeta as { metaapi_account_id?: string }).metaapi_account_id ?? "").trim()
    ) {
      accountRow = tradingByMeta as unknown as TradingAccountRow;
    } else {
      const { data: journalRow } = await supabase
        .from("journal_account")
        .select("account_number, platform, broker_server, metaapi_account_id")
        .eq("user_id", user.id)
        .eq("metaapi_account_id", uuid)
        .maybeSingle();
      if (journalRow?.metaapi_account_id) {
        accountRow = {
          metaapi_account_id: String(journalRow.metaapi_account_id),
          account_number: String(journalRow.account_number ?? ""),
          broker_type: journalRow.platform === "MT4" ? "MT4" : "MT5",
          broker_host: journalRow.broker_server != null ? String(journalRow.broker_server) : null,
          broker_port: null
        };
      }
    }
  }
  if (!accountRow) {
    const { data: tradingFirst } = await supabase
      .from("trading_account")
      .select(accountSelectColumns())
      .eq("user_id", user.id)
      .not("metaapi_account_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (
      tradingFirst &&
      typeof tradingFirst === "object" &&
      "metaapi_account_id" in tradingFirst &&
      String((tradingFirst as { metaapi_account_id?: string }).metaapi_account_id ?? "").trim()
    ) {
      accountRow = tradingFirst as unknown as TradingAccountRow;
    } else {
      const { data: journalFirst } = await supabase
        .from("journal_account")
        .select("account_number, platform, broker_server, metaapi_account_id")
        .eq("user_id", user.id)
        .not("metaapi_account_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (journalFirst?.metaapi_account_id) {
        accountRow = {
          metaapi_account_id: String(journalFirst.metaapi_account_id),
          account_number: String(journalFirst.account_number ?? ""),
          broker_type: journalFirst.platform === "MT4" ? "MT4" : "MT5",
          broker_host: journalFirst.broker_server != null ? String(journalFirst.broker_server) : null,
          broker_port: null
        };
      }
    }
  }

  if (!accountRow?.metaapi_account_id) {
    return NextResponse.json({
      trades: [],
      currency: "EUR",
      error: "No account selected or linked"
    });
  }

  const account = accountRow as TradingAccountRow;

  try {
    console.log("[api/trades] fetch", { accountIdLen: account.metaapi_account_id?.length });
    const [closedResult, summaryResult] = await Promise.all([
      getClosedOrders(account),
      getAccountSummary(account)
    ]);
    if (!closedResult.ok) {
      console.error("[api/trades] getClosedOrders failed", { error: closedResult.error });
      return NextResponse.json(
        { error: `Trading API: ${closedResult.error ?? "ClosedOrders failed"}`, trades: [] },
        { status: 502 }
      );
    }
    const rawArray = closedResult.orders;
    console.log("[api/trades] ClosedOrders raw count", rawArray.length, "sample:", JSON.stringify(rawArray.slice(0, 2)));
    const trades = parseOrders(rawArray);
    trades.sort(
      (a, b) => new Date(b.closeTime).getTime() - new Date(a.closeTime).getTime()
    );
    let currency = "EUR";
    let balance = 0;
    if (summaryResult.ok && summaryResult.summary) {
      currency = summaryResult.summary.currency;
      balance = summaryResult.summary.balance;
    }
    const { data: appUser } = await supabase
      .from("app_user")
      .select("max_risk_per_trade_pct, revenge_threshold_trades, max_exposure_pct")
      .eq("id", user.id)
      .limit(1)
      .maybeSingle();
    const rules = {
      max_risk_per_trade_pct: Number(appUser?.max_risk_per_trade_pct) ?? 1,
      revenge_threshold_trades: Number(appUser?.revenge_threshold_trades) ?? 2,
      max_exposure_pct: Number(appUser?.max_exposure_pct) ?? 6
    };
    return NextResponse.json({
      trades,
      currency,
      balance,
      rules
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
