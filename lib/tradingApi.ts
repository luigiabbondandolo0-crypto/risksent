/**
 * Trading / broker data provider.
 * External HTTP calls are disabled until a new provider is integrated.
 * When configured, the provider session id is stored in `metaapi_account_id` on `trading_account`.
 */

const LOG = "[TradingAPI]";
const PROVIDER_DISABLED =
  "Trading data provider is not configured. Broker linking will return when a new integration is available.";

function normalizeToken(id: string | null | undefined): string {
  if (id == null) return "";
  return String(id).trim().replace(/^["']|["']$/g, "");
}

export type TradingAccountRow = {
  id?: string;
  metaapi_account_id: string | null;
  broker_host: string | null;
  broker_port: string | null;
  account_number: string;
  broker_type: string;
  investor_password_encrypted?: string;
};

export type AccountSummary = {
  balance: number;
  equity: number;
  currency: string;
  [k: string]: unknown;
};

export async function getAccountSummary(
  account: TradingAccountRow
): Promise<{ ok: boolean; summary: AccountSummary | null; error?: string }> {
  const id = normalizeToken(account.metaapi_account_id);
  if (!id) {
    return { ok: false, summary: null, error: "Missing session token" };
  }
  console.warn(LOG, "getAccountSummary skipped:", PROVIDER_DISABLED);
  return { ok: false, summary: null, error: PROVIDER_DISABLED };
}

export async function getClosedOrders(
  account: TradingAccountRow
): Promise<{ ok: boolean; orders: unknown[]; error?: string }> {
  const id = normalizeToken(account.metaapi_account_id);
  if (!id) return { ok: false, orders: [], error: "Missing session token" };
  console.warn(LOG, "getClosedOrders skipped:", PROVIDER_DISABLED);
  return { ok: false, orders: [], error: PROVIDER_DISABLED };
}

export async function getOpenPositions(
  account: TradingAccountRow
): Promise<{ ok: boolean; positions: unknown[]; lastStatus?: number; error?: string }> {
  const id = normalizeToken(account.metaapi_account_id);
  if (!id) return { ok: false, positions: [], error: "Missing session token" };
  console.warn(LOG, "getOpenPositions skipped:", PROVIDER_DISABLED);
  return { ok: false, positions: [], error: PROVIDER_DISABLED };
}

export async function orderSend(
  account: TradingAccountRow,
  params: { symbol: string; operation: string; volume: number; price?: number; stoploss?: number; takeprofit?: number }
): Promise<{ ok: boolean; data: unknown; error?: string }> {
  void params;
  const id = normalizeToken(account.metaapi_account_id);
  if (!id) {
    return { ok: false, data: null, error: "Missing session token" };
  }
  console.warn(LOG, "orderSend skipped:", PROVIDER_DISABLED);
  return { ok: false, data: null, error: PROVIDER_DISABLED };
}

export function accountSelectColumns(): string {
  return "id, metaapi_account_id, broker_host, broker_port, account_number, broker_type, investor_password_encrypted";
}
