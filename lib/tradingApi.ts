/**
 * Trading API abstraction: MetaAPI (metatraderapi.dev) vs mtapi.io.
 * Verbose logging for migration debugging.
 */

const LOG = "[TradingAPI]";
const METAAPI_BASE = "https://api.metatraderapi.dev";

function getMtapiBase(): string {
  const base = process.env.MTAPI_BASE_URL?.trim();
  if (base) return base.replace(/\/$/, "");
  return "https://mt5.mtapi.io";
}

export type TradingAccountRow = {
  id?: string;
  provider: "metaapi" | "mtapi";
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

/** MetaAPI: GET with x-api-key. mtapi: GET with id=token, no API key. */
async function fetchProvider(
  account: TradingAccountRow,
  metaApiKey: string | undefined,
  url: string,
  label: string
): Promise<{ ok: boolean; status: number; data: unknown; error?: string }> {
  const provider = account.provider ?? "metaapi";
  const id = account.metaapi_account_id;
  if (!id) {
    verboseErr(`${label}: missing account id/token`, { provider, accountId: account.id });
    return { ok: false, status: 0, data: null, error: "Missing account id/token" };
  }

  if (provider === "mtapi") {
    const base = getMtapiBase();
    const fullUrl = url.startsWith("http") ? url : `${base}${url.startsWith("/") ? "" : "/"}${url}`;
    verboseLog(`${label} (mtapi)`, { url: fullUrl.replace(id, "***"), provider });
    try {
      const res = await fetch(fullUrl, { headers: { Accept: "application/json" } });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        verboseErr(`${label} mtapi failed`, {
          status: res.status,
          body: typeof data === "object" ? JSON.stringify(data).slice(0, 300) : String(data)
        });
        return { ok: false, status: res.status, data, error: res.statusText };
      }
      verboseLog(`${label} mtapi ok`, { status: res.status });
      return { ok: true, status: res.status, data };
    } catch (e) {
      verboseErr(`${label} mtapi request failed`, { err: e instanceof Error ? e.message : String(e) });
      return { ok: false, status: 0, data: null, error: e instanceof Error ? e.message : String(e) };
    }
  }

  // metaapi
  if (!metaApiKey) {
    verboseErr(`${label}: METATRADERAPI_API_KEY not set`);
    return { ok: false, status: 0, data: null, error: "API key not set" };
  }
  verboseLog(`${label} (metaapi)`, { url: url.replace(id, "***"), provider });
  try {
    const res = await fetch(url, {
      headers: { "x-api-key": metaApiKey, Accept: "application/json" }
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      verboseErr(`${label} metaapi failed`, {
        status: res.status,
        body: typeof data === "object" ? JSON.stringify(data).slice(0, 300) : String(data)
      });
      return { ok: false, status: res.status, data, error: res.statusText };
    }
    verboseLog(`${label} metaapi ok`, { status: res.status });
    return { ok: true, status: res.status, data };
  } catch (e) {
    verboseErr(`${label} metaapi request failed`, { err: e instanceof Error ? e.message : String(e) });
    return { ok: false, status: 0, data: null, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Get account summary (balance, equity, currency). */
export async function getAccountSummary(
  account: TradingAccountRow,
  metaApiKey: string | undefined
): Promise<{ ok: boolean; summary: AccountSummary | null; error?: string }> {
  const id = account.metaapi_account_id;
  if (!id) {
    return { ok: false, summary: null, error: "Missing account id/token" };
  }
  const provider = account.provider ?? "metaapi";
  let url: string;
  if (provider === "mtapi") {
    url = `${getMtapiBase()}/AccountSummary?id=${encodeURIComponent(id)}`;
  } else {
    url = `${METAAPI_BASE}/AccountSummary?id=${encodeURIComponent(id)}`;
  }
  const out = await fetchProvider(account, metaApiKey, url, "AccountSummary");
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

/** Get closed orders (for history / trades). MetaAPI: ClosedOrders. mtapi: OrderHistory with from/to. */
export async function getClosedOrders(
  account: TradingAccountRow,
  metaApiKey: string | undefined
): Promise<{ ok: boolean; orders: unknown[]; error?: string }> {
  const id = account.metaapi_account_id;
  if (!id) return { ok: false, orders: [], error: "Missing account id/token" };
  const provider = account.provider ?? "metaapi";
  let url: string;
  if (provider === "mtapi") {
    const from = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    const to = new Date().toISOString();
    url = `${getMtapiBase()}/OrderHistory?id=${encodeURIComponent(id)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
  } else {
    url = `${METAAPI_BASE}/ClosedOrders?id=${encodeURIComponent(id)}`;
  }
  const out = await fetchProvider(account, metaApiKey, url, "ClosedOrders/OrderHistory");
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
  verboseLog("ClosedOrders/OrderHistory parsed", { count: orders.length });
  return { ok: true, orders };
}

/** Get open positions/orders. MetaAPI: try several endpoints. mtapi: OpenedOrders only. */
export async function getOpenPositions(
  account: TradingAccountRow,
  metaApiKey: string | undefined
): Promise<{ ok: boolean; positions: unknown[]; lastStatus?: number; error?: string }> {
  const id = account.metaapi_account_id;
  if (!id) return { ok: false, positions: [], error: "Missing account id/token" };
  const provider = account.provider ?? "metaapi";

  if (provider === "mtapi") {
    const url = `${getMtapiBase()}/OpenedOrders?id=${encodeURIComponent(id)}`;
    const out = await fetchProvider(account, metaApiKey, url, "OpenedOrders");
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

  // metaapi: try multiple endpoints (existing behaviour)
  const endpoints = [
    `${METAAPI_BASE}/HistoryPositions?id=${encodeURIComponent(id)}`,
    `${METAAPI_BASE}/OrderHistory?id=${encodeURIComponent(id)}&from=${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}&sort=OpenTime&ascending=false`,
    `${METAAPI_BASE}/OpenPositions?id=${encodeURIComponent(id)}`,
    `${METAAPI_BASE}/Positions?id=${encodeURIComponent(id)}`
  ];
  let lastStatus = 0;
  let lastError = "";
  const merged: unknown[] = [];
  for (const endpoint of endpoints) {
    const out = await fetchProvider(account, metaApiKey, endpoint, "OpenPositions(metaapi)");
    lastStatus = out.status;
    if (!out.ok) {
      lastError = out.error ?? String(out.data);
      continue;
    }
    const data = out.data;
    if (Array.isArray(data)) {
      const openOnly = (data as unknown[]).filter((item: unknown) => {
        const i = item as Record<string, unknown>;
        const state = String(i?.state ?? "").toLowerCase();
        const closeTime = i?.closeTime ?? i?.close_time;
        return (
          state === "started" ||
          state === "open" ||
          state === "opened" ||
          !closeTime ||
          closeTime === "" ||
          closeTime === null
        );
      });
      merged.push(...openOnly);
    } else if (data && typeof data === "object" && Array.isArray((data as Record<string, unknown>).orders)) {
      merged.push(...((data as Record<string, unknown>).orders as unknown[]));
    } else if (data && typeof data === "object" && Array.isArray((data as Record<string, unknown>).positions)) {
      merged.push(...((data as Record<string, unknown>).positions as unknown[]));
    }
    if (merged.length > 0) break;
  }
  verboseLog("OpenPositions(metaapi) merged", { count: merged.length, lastStatus, lastError: lastError.slice(0, 100) });
  return {
    ok: merged.length > 0 || lastStatus === 200,
    positions: merged,
    lastStatus,
    error: merged.length === 0 ? lastError || undefined : undefined
  };
}

/** Resolve which account to use: optional uuid, or first account for user. Returns full row for tradingApi. */
export function accountSelectColumns(): string {
  return "id, provider, metaapi_account_id, broker_host, broker_port, account_number, broker_type, investor_password_encrypted";
}
