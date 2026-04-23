/**
 * Trading / broker data via MetaApi.cloud REST API.
 * `metaapi_account_id` on `trading_account` = MetaApi account id (UUID from app.metaapi.cloud/accounts).
 *
 * Env: METAAPI_TOKEN (required), METAAPI_BASE_URL (optional, region client API URL),
 * METAAPI_HISTORY_DAYS (optional, default 1095).
 */

const LOG = "[TradingAPI]";
const DEFAULT_BASE = "https://mt-client-api-v1.new-york.agiliumtrade.ai";

function normalizeToken(id: string | null | undefined): string {
  if (id == null) return "";
  return String(id).trim().replace(/^["']|["']$/g, "");
}

function metaApiConfig(): { token: string; base: string; historyDays: number } | null {
  const token = process.env.METAAPI_TOKEN?.trim();
  if (!token) return null;
  const rawBase = process.env.METAAPI_BASE_URL?.trim() || DEFAULT_BASE;
  const base = rawBase.replace(/\/$/, "");
  const daysRaw = process.env.METAAPI_HISTORY_DAYS?.trim();
  const historyDays = daysRaw ? Math.max(30, Math.min(3650, Number(daysRaw) || 1095)) : 1095;
  return { token, base, historyDays };
}

function notConfiguredMessage(): string {
  return "MetaApi is not configured (set METAAPI_TOKEN; optional METAAPI_BASE_URL for your region).";
}

async function metaApiGet<T>(accountId: string, path: string): Promise<{ ok: true; data: T } | { ok: false; status: number; body: string }> {
  const cfg = metaApiConfig();
  if (!cfg) {
    return { ok: false, status: 503, body: notConfiguredMessage() };
  }
  const url = `${cfg.base}${path}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "auth-token": cfg.token
    },
    cache: "no-store"
  });
  const text = await res.text();
  if (!res.ok) {
    return { ok: false, status: res.status, body: text.slice(0, 500) };
  }
  try {
    return { ok: true, data: JSON.parse(text) as T };
  } catch {
    return { ok: false, status: 502, body: "Invalid JSON from MetaApi" };
  }
}

async function metaApiPost<T>(
  accountId: string,
  path: string,
  body: Record<string, unknown>
): Promise<{ ok: true; data: T } | { ok: false; status: number; body: string }> {
  const cfg = metaApiConfig();
  if (!cfg) {
    return { ok: false, status: 503, body: notConfiguredMessage() };
  }
  const url = `${cfg.base}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "auth-token": cfg.token
    },
    body: JSON.stringify(body),
    cache: "no-store"
  });
  const text = await res.text();
  if (!res.ok) {
    return { ok: false, status: res.status, body: text.slice(0, 500) };
  }
  try {
    return { ok: true, data: JSON.parse(text) as T };
  } catch {
    return { ok: false, status: 502, body: "Invalid JSON from MetaApi" };
  }
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

/** Verify token + account; used when linking an account. */
export async function fetchMetaApiAccountInformation(accountId: string): Promise<{
  ok: boolean;
  info: Record<string, unknown> | null;
  error?: string;
}> {
  const id = normalizeToken(accountId);
  if (!id) return { ok: false, info: null, error: "Missing account id" };
  const path = `/users/current/accounts/${encodeURIComponent(id)}/account-information`;
  const res = await metaApiGet<Record<string, unknown>>(id, path);
  if (!res.ok) {
    const hint =
      res.status === 401
        ? "Invalid METAAPI_TOKEN"
        : res.status === 404
          ? "Account not found or not deployed yet"
          : res.body;
    return { ok: false, info: null, error: `MetaApi ${res.status}: ${hint}` };
  }
  return { ok: true, info: res.data };
}

export async function getAccountSummary(
  account: TradingAccountRow
): Promise<{ ok: boolean; summary: AccountSummary | null; error?: string }> {
  const id = normalizeToken(account.metaapi_account_id);
  if (!id) {
    return { ok: false, summary: null, error: "Missing session token" };
  }
  if (!metaApiConfig()) {
    console.warn(LOG, "getAccountSummary:", notConfiguredMessage());
    return { ok: false, summary: null, error: notConfiguredMessage() };
  }
  const path = `/users/current/accounts/${encodeURIComponent(id)}/account-information`;
  const res = await metaApiGet<Record<string, unknown>>(id, path);
  if (!res.ok) {
    return {
      ok: false,
      summary: null,
      error: `MetaApi account-information ${res.status}: ${res.body}`
    };
  }
  const row = res.data;
  const balance = Number(row.balance);
  const equity = Number(row.equity);
  const currency = String(row.currency ?? "USD");
  if (!Number.isFinite(balance) || !Number.isFinite(equity)) {
    return { ok: false, summary: null, error: "MetaApi account-information: invalid balance/equity" };
  }
  return {
    ok: true,
    summary: { balance, equity, currency, platform: row.platform, login: row.login, server: row.server }
  };
}

type MetaDeal = {
  id?: string;
  type?: string;
  entryType?: string;
  symbol?: string;
  time?: string;
  price?: number;
  profit?: number;
  commission?: number;
  swap?: number;
  volume?: number;
  positionId?: string;
  stopLoss?: number;
};

const CLOSING_ENTRIES = new Set(["DEAL_ENTRY_OUT", "DEAL_ENTRY_OUT_BY", "DEAL_ENTRY_INOUT"]);

function dealNetProfit(d: MetaDeal): number {
  return Number(d.profit ?? 0) + Number(d.commission ?? 0) + Number(d.swap ?? 0);
}

function findOpeningDeal(sortedPositionDeals: MetaDeal[], closeDeal: MetaDeal): MetaDeal | null {
  const closeT = new Date(closeDeal.time ?? 0).getTime();
  if (!Number.isFinite(closeT)) return null;
  const opens = sortedPositionDeals.filter((d) => {
    const t = new Date(d.time ?? 0).getTime();
    if (!Number.isFinite(t) || t >= closeT) return false;
    const et = d.entryType ?? "";
    return et === "DEAL_ENTRY_IN" || et === "DEAL_ENTRY_INOUT";
  });
  if (opens.length === 0) return null;
  return opens[opens.length - 1];
}

function positionKey(d: MetaDeal): string {
  const pid = d.positionId?.trim();
  if (pid) return pid;
  return `orphan-${d.id ?? "x"}`;
}

function dealsToClosedOrders(deals: MetaDeal[]): Record<string, unknown>[] {
  const market = deals.filter(
    (d) =>
      (d.type === "DEAL_TYPE_BUY" || d.type === "DEAL_TYPE_SELL") &&
      typeof d.symbol === "string" &&
      d.symbol.length > 0 &&
      typeof d.time === "string"
  );
  const byPos = new Map<string, MetaDeal[]>();
  for (const d of market) {
    const k = positionKey(d);
    if (!byPos.has(k)) byPos.set(k, []);
    byPos.get(k)!.push(d);
  }
  for (const arr of byPos.values()) {
    arr.sort((a, b) => new Date(a.time ?? 0).getTime() - new Date(b.time ?? 0).getTime());
  }

  const rows: Record<string, unknown>[] = [];
  for (const d of market) {
    const et = d.entryType ?? "";
    if (!CLOSING_ENTRIES.has(et)) continue;

    const totalProfit = dealNetProfit(d);
    const sideLabel = d.type === "DEAL_TYPE_SELL" ? "Sell" : "Buy";
    const ticket = Number(d.id) || 0;

    if (et === "DEAL_ENTRY_INOUT") {
      rows.push({
        ticket,
        openTime: d.time,
        closeTime: d.time,
        type: sideLabel,
        symbol: d.symbol,
        lots: d.volume ?? 0,
        openPrice: d.price ?? 0,
        closePrice: d.price ?? 0,
        profit: totalProfit,
        stopLoss: d.stopLoss ?? null
      });
      continue;
    }

    const list = byPos.get(positionKey(d)) ?? [];
    const open = findOpeningDeal(list, d);
    rows.push({
      ticket,
      openTime: open?.time ?? d.time,
      closeTime: d.time,
      type: sideLabel,
      symbol: d.symbol,
      lots: d.volume ?? 0,
      openPrice: open?.price ?? d.price ?? 0,
      closePrice: d.price ?? 0,
      profit: totalProfit,
      stopLoss: (d.stopLoss ?? open?.stopLoss) ?? null
    });
  }
  return rows;
}

async function fetchAllHistoryDeals(accountId: string): Promise<MetaDeal[]> {
  const cfg = metaApiConfig();
  if (!cfg) return [];
  const end = new Date();
  const start = new Date(end.getTime() - cfg.historyDays * 86400000 * 1000);
  const startIso = start.toISOString();
  const endIso = end.toISOString();
  const pathBase = `/users/current/accounts/${encodeURIComponent(accountId)}/history-deals/time/${encodeURIComponent(startIso)}/${encodeURIComponent(endIso)}`;

  const all: MetaDeal[] = [];
  let offset = 0;
  const limit = 1000;
  for (;;) {
    const path = `${pathBase}?offset=${offset}&limit=${limit}`;
    const res = await metaApiGet<MetaDeal[]>(accountId, path);
    if (!res.ok) {
      console.warn(LOG, "history-deals failed", res.status, res.body);
      break;
    }
    const batch = Array.isArray(res.data) ? res.data : [];
    all.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
  }
  return all;
}

export async function getClosedOrders(
  account: TradingAccountRow
): Promise<{ ok: boolean; orders: unknown[]; error?: string }> {
  const id = normalizeToken(account.metaapi_account_id);
  if (!id) return { ok: false, orders: [], error: "Missing session token" };
  if (!metaApiConfig()) {
    return { ok: false, orders: [], error: notConfiguredMessage() };
  }
  try {
    const deals = await fetchAllHistoryDeals(id);
    const orders = dealsToClosedOrders(deals);
    orders.sort(
      (a, b) =>
        new Date(String((b as { closeTime?: string }).closeTime ?? 0)).getTime() -
        new Date(String((a as { closeTime?: string }).closeTime ?? 0)).getTime()
    );
    return { ok: true, orders };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, orders: [], error: msg };
  }
}

export async function getOpenPositions(
  account: TradingAccountRow
): Promise<{ ok: boolean; positions: unknown[]; lastStatus?: number; error?: string }> {
  const id = normalizeToken(account.metaapi_account_id);
  if (!id) return { ok: false, positions: [], error: "Missing session token" };
  if (!metaApiConfig()) {
    return { ok: false, positions: [], error: notConfiguredMessage() };
  }
  const path = `/users/current/accounts/${encodeURIComponent(id)}/positions`;
  const res = await metaApiGet<Record<string, unknown>[]>(id, path);
  if (!res.ok) {
    return {
      ok: false,
      positions: [],
      lastStatus: res.status,
      error: `MetaApi positions ${res.status}: ${res.body}`
    };
  }
  const raw = Array.isArray(res.data) ? res.data : [];
  const positions = raw.map((p) => {
    const t = String(p.type ?? "");
    const side =
      t.includes("SELL") || t === "POSITION_TYPE_SELL" ? "Sell" : t.includes("BUY") ? "Buy" : t;
    const sl = p.stopLoss;
    const stopLoss =
      sl != null && Number(sl) > 0 && Number.isFinite(Number(sl)) ? Number(sl) : undefined;
    return {
      symbol: String(p.symbol ?? ""),
      volume: Number(p.volume) || 0,
      openPrice: Number(p.openPrice) || 0,
      stopLoss,
      type: side
    };
  });
  return { ok: true, positions };
}

const OP_TO_METAAPI: Record<string, string> = {
  Buy: "ORDER_TYPE_BUY",
  Sell: "ORDER_TYPE_SELL",
  BuyStop: "ORDER_TYPE_BUY_STOP",
  SellStop: "ORDER_TYPE_SELL_STOP",
  BuyLimit: "ORDER_TYPE_BUY_LIMIT",
  SellLimit: "ORDER_TYPE_SELL_LIMIT"
};

export async function orderSend(
  account: TradingAccountRow,
  params: { symbol: string; operation: string; volume: number; price?: number; stoploss?: number; takeprofit?: number }
): Promise<{ ok: boolean; data: unknown; error?: string }> {
  const id = normalizeToken(account.metaapi_account_id);
  if (!id) {
    return { ok: false, data: null, error: "Missing session token" };
  }
  if (!metaApiConfig()) {
    return { ok: false, data: null, error: notConfiguredMessage() };
  }
  const actionType = OP_TO_METAAPI[params.operation];
  if (!actionType) {
    return { ok: false, data: null, error: `Unsupported operation: ${params.operation}` };
  }
  const body: Record<string, unknown> = {
    actionType,
    symbol: params.symbol,
    volume: params.volume
  };
  const pending = ["ORDER_TYPE_BUY_STOP", "ORDER_TYPE_SELL_STOP", "ORDER_TYPE_BUY_LIMIT", "ORDER_TYPE_SELL_LIMIT"].includes(
    actionType
  );
  if (pending) {
    if (params.price == null || !Number.isFinite(params.price)) {
      return { ok: false, data: null, error: "price is required for pending orders" };
    }
    body.openPrice = params.price;
  }
  if (params.stoploss != null && Number.isFinite(params.stoploss) && params.stoploss > 0) {
    body.stopLoss = params.stoploss;
  }
  if (params.takeprofit != null && Number.isFinite(params.takeprofit) && params.takeprofit > 0) {
    body.takeProfit = params.takeprofit;
  }
  const path = `/users/current/accounts/${encodeURIComponent(id)}/trade`;
  const res = await metaApiPost<Record<string, unknown>>(id, path, body);
  if (!res.ok) {
    return { ok: false, data: res.body, error: `MetaApi trade ${res.status}: ${res.body}` };
  }
  return { ok: true, data: res.data };
}

export function accountSelectColumns(): string {
  return "id, metaapi_account_id, broker_host, broker_port, account_number, broker_type, investor_password_encrypted";
}
