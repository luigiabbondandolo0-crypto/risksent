import type { SupabaseClient } from "@supabase/supabase-js";
import { getAccountSummary, getClosedOrders, type TradingAccountRow } from "@/lib/tradingApi";

export type JournalAccountSyncInput = {
  id: string;
  metaapi_account_id: string | null;
  platform: string;
  broker_server: string;
  account_number: string;
};

/**
 * Pull closed deals from MetaApi and upsert into journal_trade; refresh journal_account balance when possible.
 */
export async function syncJournalAccountFromMetaApi(
  supabase: SupabaseClient,
  userId: string,
  journalAccount: JournalAccountSyncInput
): Promise<
  | { ok: true; imported: number; balanceUpdated: boolean }
  | { ok: false; error: string; status?: number }
> {
  const metaId = journalAccount.metaapi_account_id?.trim();
  if (!metaId) {
    return { ok: false, error: "No MetaApi account linked to this journal account.", status: 400 };
  }

  const tradingRow: TradingAccountRow = {
    metaapi_account_id: metaId,
    account_number: String(journalAccount.account_number ?? ""),
    broker_type: journalAccount.platform === "MT4" ? "MT4" : "MT5",
    broker_host: journalAccount.broker_server != null ? String(journalAccount.broker_server) : null,
    broker_port: null
  };

  const [closedResult, summaryResult] = await Promise.all([
    getClosedOrders(tradingRow),
    getAccountSummary(tradingRow)
  ]);

  if (!closedResult.ok) {
    return {
      ok: false,
      error: closedResult.error ?? "Failed to fetch history from MetaApi",
      status: 502
    };
  }

  const raw = closedResult.orders;
  if (!Array.isArray(raw) || raw.length === 0) {
    const balanceUpdated = await updateJournalBalanceFromSummary(
      supabase,
      userId,
      journalAccount.id,
      summaryResult
    );
    return { ok: true, imported: 0, balanceUpdated };
  }

  const rows: Record<string, unknown>[] = [];
  for (const o of raw) {
    if (o == null || typeof o !== "object") continue;
    const rec = o as Record<string, unknown>;
    const ticket = String(rec.ticket ?? "").trim();
    if (!ticket) continue;
    const type = String(rec.type ?? "Buy");
    const direction = type.toLowerCase().includes("sell") ? "SELL" : "BUY";
    const openTime = String(rec.openTime ?? "");
    const closeTime = String(rec.closeTime ?? "");
    if (!openTime || !closeTime) continue;
    const profitNet = Number(rec.profit);
    if (!Number.isFinite(profitNet)) continue;

    const profitGross =
      rec.profitGross != null && Number.isFinite(Number(rec.profitGross))
        ? Number(rec.profitGross)
        : profitNet;
    const openingProfit =
      rec.openingProfit != null && Number.isFinite(Number(rec.openingProfit))
        ? Number(rec.openingProfit)
        : 0;
    const commission =
      rec.commission != null && Number.isFinite(Number(rec.commission))
        ? Number(rec.commission)
        : 0;
    const swap =
      rec.swap != null && Number.isFinite(Number(rec.swap)) ? Number(rec.swap) : 0;

    const sl = rec.stopLoss;
    const stopLoss = sl != null && Number.isFinite(Number(sl)) && Number(sl) > 0 ? Number(sl) : null;

    rows.push({
      user_id: userId,
      account_id: journalAccount.id,
      ticket,
      symbol: String(rec.symbol ?? "").toUpperCase().slice(0, 32),
      direction,
      open_time: openTime,
      close_time: closeTime,
      open_price: Number(rec.openPrice) || 0,
      close_price: Number(rec.closePrice) || 0,
      lot_size: Number(rec.lots) || 0,
      stop_loss: stopLoss,
      take_profit: null,
      pl: profitGross + openingProfit,
      commission,
      swap,
      pips: null,
      risk_reward: null,
      setup_tags: [],
      notes: null,
      screenshot_url: null,
      status: "closed"
    });
  }

  const chunk = 80;
  for (let i = 0; i < rows.length; i += chunk) {
    const part = rows.slice(i, i + chunk);
    const { error } = await supabase.from("journal_trade").upsert(part, {
      onConflict: "account_id,ticket"
    });
    if (error) {
      return { ok: false, error: error.message, status: 500 };
    }
  }

  const balanceUpdated = await updateJournalBalanceFromSummary(
    supabase,
    userId,
    journalAccount.id,
    summaryResult
  );

  return { ok: true, imported: rows.length, balanceUpdated };
}

async function updateJournalBalanceFromSummary(
  supabase: SupabaseClient,
  userId: string,
  journalAccountId: string,
  summaryResult: Awaited<ReturnType<typeof getAccountSummary>>
): Promise<boolean> {
  if (!summaryResult.ok || !summaryResult.summary) return false;
  const { equity, currency } = summaryResult.summary;
  if (!Number.isFinite(equity)) return false;
  const { error } = await supabase
    .from("journal_account")
    .update({
      current_balance: equity,
      currency: String(currency ?? "USD")
        .trim()
        .toUpperCase()
        .slice(0, 8)
    })
    .eq("id", journalAccountId)
    .eq("user_id", userId);
  return !error;
}
