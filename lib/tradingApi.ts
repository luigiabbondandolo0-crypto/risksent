/**
 * Trading API: mtapi.io only.
 * Session token from Connect (host, port, user, password); token stored in metaapi_account_id.
 */

const LOG = "[TradingAPI]";

function getMtapiBase(): string {
  const base = process.env.MTAPI_BASE_URL?.trim();
  if (base) return base.replace(/\/$/, "");
  return "https://mt5.mtapi.io";
}

/** mtapi expects id without surrounding quotes; normalize token for URL params. */
function normalizeToken(id: string | null | undefined): string {
  if (id == null) return "";
  const s = String(id).trim().replace(/^["']|["']$/g, "");
  return s;
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

function verboseLog(msg: string, detail?: Record<string, unknown>): void {
  console.log(LOG, msg, detail ?? "");
}

function verboseErr(msg: string, detail?: Record<string, unknown>): void {
  console.error(LOG, "[ERROR]", msg, detail ?? "");
}

async function fetchMtapi(
  id: string,
  url: string,
  label: string
): Promise<{ ok: boolean; status: number; data: unknown; error?: string }> {
  const fullUrl = url.startsWith("http") ? url : `${getMtapiBase()}${url.startsWith("/") ? "" : "/"}${url}`;
  verboseLog(`${label}`, { url: fullUrl.replace(normalizeToken(id), "***") });
  try {
    const res = await fetch(fullUrl, { headers: { Accept: "application/json" } });
    const data = await res.json().catch(() => null);
    // mtapi: 201 = exception (error body with message/code), not success
    if (res.status === 201) {
      const errObj = data && typeof data === "object" ? (data as { message?: string; code?: string }) : {};
      const errMsg = errObj.message ?? errObj.code ?? "Provider error (201)";
      verboseErr(`${label} 201`, { message: errMsg });
      return { ok: false, status: 201, data, error: errMsg };
    }
    if (!res.ok) {
      verboseErr(`${label} failed`, {
        status: res.status,
        body: typeof data === "object" ? JSON.stringify(data).slice(0, 300) : String(data)
      });
      return { ok: false, status: res.status, data, error: res.statusText };
    }
    verboseLog(`${label} ok`, { status: res.status });
    return { ok: true, status: res.status, data };
  } catch (e) {
    verboseErr(`${label} request failed`, { err: e instanceof Error ? e.message : String(e) });
    return { ok: false, status: 0, data: null, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Get account summary (balance, equity, currency). */
export async function getAccountSummary(
  account: TradingAccountRow
): Promise<{ ok: boolean; summary: AccountSummary | null; error?: string }> {
  const id = normalizeToken(account.metaapi_account_id);
  if (!id) {
    return { ok: false, summary: null, error: "Missing session token" };
  }
  const url = `${getMtapiBase()}/AccountSummary?id=${encodeURIComponent(id)}`;
  const out = await fetchMtapi(id, url, "AccountSummary");
  if (!out.ok) {
    return { ok: false, summary: null, error: out.error };
  }
  const d = out.data as Record<string, unknown> | null;
  if (!d || typeof d !== "object") {
    verboseErr("AccountSummary: unexpected response shape", { data: d });
    return { ok: false, summary: null, error: "Invalid response" };
  }
  const summary: AccountSummary = {
    balance: Number(d.balance) ?? 0,
    equity: Number(d.equity) ?? Number(d.balance) ?? 0,
    currency: String(d.currency ?? "EUR").trim() || "EUR",
    ...d
  };
  verboseLog("AccountSummary parsed", {
    balance: summary.balance,
    equity: summary.equity,
    currency: summary.currency
  });
  return { ok: true, summary };
}

/** Get closed orders (OrderHistory with from/to). */
export async function getClosedOrders(
  account: TradingAccountRow
): Promise<{ ok: boolean; orders: unknown[]; error?: string }> {
  const id = normalizeToken(account.metaapi_account_id);
  if (!id) return { ok: false, orders: [], error: "Missing session token" };
  const from = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
  const to = new Date().toISOString();
  const url = `${getMtapiBase()}/OrderHistory?id=${encodeURIComponent(id)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
  const out = await fetchMtapi(id, url, "OrderHistory");
  if (!out.ok) {
    return { ok: false, orders: [], error: out.error };
  }
  let orders: unknown[] = [];
  if (Array.isArray(out.data)) {
    orders = out.data;
  } else if (out.data && typeof out.data === "object" && Array.isArray((out.data as Record<string, unknown>).orders)) {
    orders = (out.data as Record<string, unknown>).orders as unknown[];
  } else if (out.data && typeof out.data === "object") {
    orders = [out.data];
  }
  verboseLog("OrderHistory parsed", { count: orders.length });
  return { ok: true, orders };
}

/** Get open positions (OpenedOrders). */
export async function getOpenPositions(
  account: TradingAccountRow
): Promise<{ ok: boolean; positions: unknown[]; lastStatus?: number; error?: string }> {
  const id = normalizeToken(account.metaapi_account_id);
  if (!id) return { ok: false, positions: [], error: "Missing session token" };
  const url = `${getMtapiBase()}/OpenedOrders?id=${encodeURIComponent(id)}`;
  const out = await fetchMtapi(id, url, "OpenedOrders");
  if (!out.ok) {
    return { ok: false, positions: [], lastStatus: out.status, error: out.error };
  }
  let positions: unknown[] = [];
  if (Array.isArray(out.data)) {
    positions = out.data;
  } else if (out.data && typeof out.data === "object" && Array.isArray((out.data as Record<string, unknown>).orders)) {
    positions = (out.data as Record<string, unknown>).orders as unknown[];
  }
  verboseLog("OpenedOrders parsed", { count: positions.length });
  return { ok: true, positions, lastStatus: out.status };
}

/** Place order via mtapi OrderSend. operation: Buy | Sell | BuyStop | SellStop | BuyLimit | SellLimit. price required for pending. */
export async function orderSend(
  account: TradingAccountRow,
  params: { symbol: string; operation: string; volume: number; price?: number }
): Promise<{ ok: boolean; data: unknown; error?: string }> {
  const id = normalizeToken(account.metaapi_account_id);
  if (!id) {
    return { ok: false, data: null, error: "Missing session token" };
  }
  const { symbol, operation, volume, price } = params;
  const search = new URLSearchParams({
    id,
    symbol: symbol.trim(),
    operation: String(operation).trim(),
    volume: String(volume)
  });
  if (price != null && Number.isFinite(price)) {
    search.set("price", String(price));
  }
  const url = `${getMtapiBase()}/OrderSend?${search.toString()}`;
  const out = await fetchMtapi(id, url, "OrderSend");
  if (!out.ok) {
    return { ok: false, data: out.data, error: out.error };
  }
  verboseLog("OrderSend result", { data: out.data });
  return { ok: true, data: out.data };
}

/** Columns to select for trading_account when using tradingApi. */
export function accountSelectColumns(): string {
  return "id, metaapi_account_id, broker_host, broker_port, account_number, broker_type, investor_password_encrypted";
}
