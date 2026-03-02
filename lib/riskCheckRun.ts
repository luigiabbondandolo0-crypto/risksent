/**
 * Shared logic to run risk check for one account: fetch data, compute findings, dedupe, insert alert + Telegram.
 * Used by POST /api/alerts/check-risk and by cron /api/cron/check-risk-all.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getRiskFindings, type OpenPositionForRisk, type RiskFinding, type RiskRules, type StatsForRisk } from "./riskCheck";
import { sendAlertToTelegram } from "./telegramAlert";

const METAAPI_BASE = "https://api.metatraderapi.dev";
const DEFAULT_CONTRACT_SIZE = 100_000;
const DEDUPE_HOURS = 12;

type ClosedOrder = { closeTime?: string; profit?: number };

type RawOpenPosition = {
  symbol?: string;
  instrument?: string;
  volume?: number;
  lots?: number;
  openPrice?: number;
  open_price?: number;
  price?: number;
  currentPrice?: number;
  stopLoss?: number;
  stop_loss?: number;
  type?: string;
};

function parseOrders(orders: unknown): ClosedOrder[] {
  if (!Array.isArray(orders)) return [];
  return orders.filter(
    (o): o is ClosedOrder =>
      o != null &&
      typeof (o as ClosedOrder).closeTime === "string" &&
      typeof (o as ClosedOrder).profit === "number"
  ) as ClosedOrder[];
}

function buildStatsForRisk(balance: number, orders: ClosedOrder[]): StatsForRisk {
  const valid = orders.filter(
    (o) => o.closeTime && typeof o.profit === "number"
  ) as { closeTime: string; profit: number }[];
  if (valid.length === 0) {
    return {
      initialBalance: balance,
      dailyStats: [],
      highestDdPct: null,
      consecutiveLossesAtEnd: 0
    };
  }
  const totalProfit = valid.reduce((s, o) => s + o.profit, 0);
  const initialBalance = balance - totalProfit;
  const sorted = [...valid].sort(
    (a, b) => new Date(a.closeTime).getTime() - new Date(b.closeTime).getTime()
  );

  const dayMap = new Map<string, number>();
  let running = initialBalance;
  const curve: number[] = [initialBalance];
  for (const o of sorted) {
    running += o.profit;
    curve.push(running);
    const dateStr = o.closeTime.slice(0, 10);
    dayMap.set(dateStr, (dayMap.get(dateStr) ?? 0) + o.profit);
  }
  const dailyStats = Array.from(dayMap.entries()).map(([date, profit]) => ({
    date,
    profit
  }));

  let peak = curve[0] ?? initialBalance;
  let maxDdPct = 0;
  for (let i = 1; i < curve.length; i++) {
    const v = curve[i] ?? 0;
    if (v > peak) peak = v;
    const dd = peak > 0 ? ((peak - v) / peak) * 100 : 0;
    if (dd > maxDdPct) maxDdPct = dd;
  }
  const highestDdPct = maxDdPct > 0 ? maxDdPct : null;

  const byCloseDesc = [...sorted].sort(
    (a, b) => new Date(b.closeTime).getTime() - new Date(a.closeTime).getTime()
  );
  let consecutiveLossesAtEnd = 0;
  for (const o of byCloseDesc) {
    if (o.profit < 0) consecutiveLossesAtEnd++;
    else break;
  }

  return {
    initialBalance: initialBalance > 0 ? initialBalance : balance,
    dailyStats,
    highestDdPct,
    consecutiveLossesAtEnd
  };
}

/** Extract array of open position-like objects from various API response shapes. */
function extractOpenListFromResponse(rawData: unknown): unknown[] {
  if (!rawData || typeof rawData !== "object") return [];
  const o = rawData as Record<string, unknown>;
  if (Array.isArray(rawData)) return rawData;
  // Nested: data.positions, data.orders
  const data = o.data as Record<string, unknown> | undefined;
  if (data && typeof data === "object") {
    const fromData = extractOpenListFromResponse(data);
    if (fromData.length > 0) return fromData;
  }
  for (const key of ["positions", "orders", "position"]) {
    const v = o[key];
    if (Array.isArray(v)) {
      if (key === "orders") {
        return (v as unknown[]).filter((item: unknown) => {
          const i = item as Record<string, unknown>;
          const state = String(i?.state ?? "").toLowerCase();
          const closeTime = i?.closeTime ?? i?.close_time;
          const isOpen =
            state === "started" ||
            state === "open" ||
            state === "opened" ||
            !closeTime ||
            closeTime === "" ||
            closeTime === null;
          return isOpen;
        });
      }
      return v;
    }
  }
  return [];
}

function parseOpenPositions(raw: unknown): RawOpenPosition[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (o): o is RawOpenPosition =>
      o != null &&
      typeof o === "object" &&
      (typeof (o as RawOpenPosition).symbol === "string" || typeof (o as RawOpenPosition).instrument === "string")
  );
}

function buildOpenPositionsForRisk(raw: RawOpenPosition[], equity: number): OpenPositionForRisk[] {
  if (equity <= 0) return [];
  const out: OpenPositionForRisk[] = [];
  for (const p of raw) {
    const symbol = String(p.symbol ?? (p as RawOpenPosition).instrument ?? "").trim();
    const volume = Number(p.volume ?? (p as RawOpenPosition).lots) || 0;
    const openPrice =
      Number(
        p.openPrice ??
          (p as RawOpenPosition).open_price ??
          (p as RawOpenPosition).price ??
          (p as RawOpenPosition).currentPrice
      ) || 0;
    const stopLossRaw = p.stopLoss ?? (p as RawOpenPosition).stop_loss;
    const stopLoss = stopLossRaw != null ? Number(stopLossRaw) : undefined;
    if (!symbol || volume <= 0 || openPrice <= 0) continue;
    let riskPct: number | null = null;
    if (stopLoss != null && Number.isFinite(stopLoss) && stopLoss !== openPrice) {
      const riskAmount = Math.abs(openPrice - stopLoss) * volume * DEFAULT_CONTRACT_SIZE;
      riskPct = (riskAmount / equity) * 100;
    }
    out.push({
      symbol,
      volume,
      openPrice,
      stopLoss: stopLoss ?? null,
      type: String(p.type ?? "").toLowerCase() === "sell" ? "sell" : "buy",
      riskPct: riskPct ?? null
    });
  }
  return out;
}

export type RunRiskCheckResult = {
  ok: boolean;
  error?: string;
  findings: RiskFinding[];
};

/**
 * Run full risk check for one user/account: fetch MetaAPI data, get rules, compute findings, dedupe and create alerts + Telegram.
 * supabase: use route client for authenticated user, or admin for cron (any user).
 */
export async function runRiskCheckForAccount(params: {
  userId: string;
  uuid: string;
  supabase: SupabaseClient;
  apiKey: string;
}): Promise<RunRiskCheckResult> {
  const { userId, uuid, supabase, apiKey } = params;

  const headers = { "x-api-key": apiKey, Accept: "application/json" };
  let balance = 0;
  let equity = 0;
  let orders: ClosedOrder[] = [];
  let openPositions: OpenPositionForRisk[] = [];

  try {
    const [summaryRes, closedRes] = await Promise.all([
      fetch(`${METAAPI_BASE}/AccountSummary?id=${encodeURIComponent(uuid)}`, { headers }),
      fetch(`${METAAPI_BASE}/ClosedOrders?id=${encodeURIComponent(uuid)}`, { headers })
    ]);
    if (summaryRes.ok) {
      const summary = await summaryRes.json();
      balance = Number(summary.balance) ?? 0;
      equity = Number(summary.equity) ?? balance;
    }
    if (closedRes.ok) {
      const raw = await closedRes.json();
      orders = parseOrders(Array.isArray(raw) ? raw : raw?.orders ?? raw ?? []);
    }
    const useEquity = equity > 0 ? equity : balance;
    try {
      const endpoints = [
        `${METAAPI_BASE}/HistoryPositions?id=${encodeURIComponent(uuid)}`,
        `${METAAPI_BASE}/OrderHistory?id=${encodeURIComponent(uuid)}&from=${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}&sort=OpenTime&ascending=false`,
        `${METAAPI_BASE}/OpenPositions?id=${encodeURIComponent(uuid)}`,
        `${METAAPI_BASE}/Positions?id=${encodeURIComponent(uuid)}`
      ];
      const mergedOpenList: unknown[] = [];
      for (const endpoint of endpoints) {
        const res = await fetch(endpoint, { headers });
        if (!res.ok) continue;
        const data = await res.json().catch(() => null);
        const list = extractOpenListFromResponse(data);
        if (Array.isArray(list) && list.length > 0) {
          mergedOpenList.push(...list);
        }
      }
      if (mergedOpenList.length > 0) {
        openPositions = buildOpenPositionsForRisk(parseOpenPositions(mergedOpenList), useEquity);
      }
    } catch {
      // OpenPositions may not exist or be available - silently skip
    }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to fetch account",
      findings: []
    };
  }

  const { data: appUser } = await supabase
    .from("app_user")
    .select("daily_loss_pct, max_risk_per_trade_pct, max_exposure_pct, revenge_threshold_trades")
    .eq("id", userId)
    .single();

  const rules: RiskRules = {
    daily_loss_pct: Number(appUser?.daily_loss_pct) ?? 5,
    max_risk_per_trade_pct: Number(appUser?.max_risk_per_trade_pct) ?? 1,
    max_exposure_pct: Number(appUser?.max_exposure_pct) ?? 6,
    revenge_threshold_trades: Number(appUser?.revenge_threshold_trades) ?? 3
  };

  const stats = buildStatsForRisk(balance, orders);
  const useEquity = equity > 0 ? equity : balance;
  const currentExposurePct =
    openPositions.length > 0
      ? openPositions.reduce((s, p) => s + (p.riskPct ?? 0), 0)
      : null;
  const findings = getRiskFindings(rules, stats, {
    openPositions,
    equity: useEquity,
    currentExposurePct
  });

  const dedupeSince = new Date(Date.now() - DEDUPE_HOURS * 60 * 60 * 1000).toISOString();

  for (const f of findings) {
    const { data: recent } = await supabase
      .from("alert")
      .select("id")
      .eq("user_id", userId)
      .eq("rule_type", f.type)
      .gte("alert_date", dedupeSince)
      .limit(1);
    if (recent && recent.length > 0) continue;

    const { data: alertRow } = await supabase
      .from("alert")
      .insert({
        user_id: userId,
        message: f.message,
        severity: f.severity,
        solution: f.advice,
        rule_type: f.type
      })
      .select("id")
      .single();

    if (alertRow) {
      const levelLabel = { lieve: "MILD", medio: "MEDIUM", alto: "HIGH" }[f.level] ?? f.level.toUpperCase();
      await sendAlertToTelegram({
        user_id: userId,
        message: `[${levelLabel}] ${f.message}`,
        severity: f.severity,
        solution: f.advice
      });
    }
  }

  return { ok: true, findings };
}

export type RiskCheckDryRunResult = {
  ok: boolean;
  error?: string;
  timestamp: string;
  uuid: string;
  connection: {
    accountSummary: { ok: boolean; status?: number; error?: string };
    closedOrders: { ok: boolean; status?: number; error?: string };
    openOrders: { ok: boolean; status?: number; error?: string };
  };
  raw?: {
    accountSummary: unknown;
    closedOrders: unknown;
    openOrders: unknown;
    openOrdersResponses?: { endpoint: string; status: number; body: unknown }[];
  };
  balance: number;
  equity: number;
  closedOrdersCount: number;
  openPositionsCount: number;
  rules: RiskRules;
  stats: StatsForRisk;
  openPositions: OpenPositionForRisk[];
  currentExposurePct: number | null;
  findings: RiskFinding[];
};

/**
 * Run risk check without creating alerts or sending Telegram. Returns full detail for monitoring/debug.
 */
export async function runRiskCheckDryRun(params: {
  userId: string;
  uuid: string;
  supabase: SupabaseClient;
  apiKey: string;
  includeRaw?: boolean;
}): Promise<RiskCheckDryRunResult> {
  const { userId, uuid, supabase, apiKey, includeRaw = true } = params;

  const headers = { "x-api-key": apiKey, Accept: "application/json" };
  const connection = {
    accountSummary: { ok: false, status: 0 as number | undefined, error: "" },
    closedOrders: { ok: false, status: 0 as number | undefined, error: "" },
    openOrders: { ok: false, status: 0 as number | undefined, error: "" }
  };
  let balance = 0;
  let equity = 0;
  let orders: ClosedOrder[] = [];
  let openPositions: OpenPositionForRisk[] = [];
  let rawSummary: unknown;
  let rawClosed: unknown;
  let rawOpen: unknown;
  let openOrdersResponses: { endpoint: string; status: number; body: unknown }[] = [];

  // Debug: log UUID being used
  console.log("[riskCheckDryRun] Using account UUID:", uuid);
  console.log("[riskCheckDryRun] API Key configured:", apiKey ? "Yes" : "No");
  console.log("[riskCheckDryRun] API Key length:", apiKey?.length ?? 0);
  console.log("[riskCheckDryRun] API Key starts with:", apiKey?.substring(0, 10) ?? "N/A");

  const accountSummaryUrl = `${METAAPI_BASE}/AccountSummary?id=${encodeURIComponent(uuid)}`;
  const closedOrdersUrl = `${METAAPI_BASE}/ClosedOrders?id=${encodeURIComponent(uuid)}`;
  
  console.log("[riskCheckDryRun] AccountSummary URL:", accountSummaryUrl);
  console.log("[riskCheckDryRun] ClosedOrders URL:", closedOrdersUrl);

  try {
    const [summaryRes, closedRes] = await Promise.all([
      fetch(accountSummaryUrl, { headers }),
      fetch(closedOrdersUrl, { headers })
    ]);

    const summaryErrorText = summaryRes.ok ? "" : (await summaryRes.text().catch(() => "Unknown"));
    console.log("[riskCheckDryRun] AccountSummary response:", {
      ok: summaryRes.ok,
      status: summaryRes.status,
      error: summaryErrorText.substring(0, 200)
    });
    
    connection.accountSummary = {
      ok: summaryRes.ok,
      status: summaryRes.status,
      error: summaryErrorText
    };
    if (summaryRes.ok) {
      rawSummary = await summaryRes.json();
      const s = rawSummary as { balance?: number; equity?: number };
      balance = Number(s?.balance) ?? 0;
      equity = Number(s?.equity) ?? balance;
    }

    connection.closedOrders = {
      ok: closedRes.ok,
      status: closedRes.status,
      error: closedRes.ok ? "" : (await closedRes.text().catch(() => "Unknown"))
    };
    if (closedRes.ok) {
      rawClosed = await closedRes.json();
      orders = parseOrders(Array.isArray(rawClosed) ? rawClosed : (rawClosed as { orders?: unknown })?.orders ?? rawClosed ?? []);
    }

    const useEquity = equity > 0 ? equity : balance;
    try {
      const endpoints = [
        { url: `${METAAPI_BASE}/HistoryPositions?id=${encodeURIComponent(uuid)}`, name: "HistoryPositions" },
        { url: `${METAAPI_BASE}/OrderHistory?id=${encodeURIComponent(uuid)}&from=${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}&sort=OpenTime&ascending=false`, name: "OrderHistory" },
        { url: `${METAAPI_BASE}/OpenPositions?id=${encodeURIComponent(uuid)}`, name: "OpenPositions" },
        { url: `${METAAPI_BASE}/Positions?id=${encodeURIComponent(uuid)}`, name: "Positions" }
      ];
      const mergedOpenList: unknown[] = [];
      const openOrdersResponses: { endpoint: string; status: number; body: unknown }[] = [];
      let anyOk = false;
      let lastStatus = 0;
      let lastError = "";
      for (const endpoint of endpoints) {
        const res = await fetch(endpoint.url, { headers });
        lastStatus = res.status;
        const data = await res.json().catch(() => null);
        if (includeRaw) openOrdersResponses.push({ endpoint: endpoint.name, status: res.status, body: data });
        if (!res.ok) {
          lastError = await res.text().catch(() => endpoint.name + " failed");
          continue;
        }
        anyOk = true;
        const list = extractOpenListFromResponse(data);
        if (Array.isArray(list) && list.length > 0) {
          mergedOpenList.push(...list);
        }
      }
      connection.openOrders = {
        ok: anyOk,
        status: lastStatus,
        error: anyOk ? (mergedOpenList.length === 0 ? "" : "") : (lastError || "All endpoints failed")
      };
      if (mergedOpenList.length > 0) {
        rawOpen = mergedOpenList;
        openPositions = buildOpenPositionsForRisk(parseOpenPositions(mergedOpenList), useEquity);
      } else {
        rawOpen = [];
      }
    } catch (e) {
      connection.openOrders.error = e instanceof Error ? e.message : "Request failed";
    }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to fetch",
      timestamp: new Date().toISOString(),
      uuid,
      connection,
      balance: 0,
      equity: 0,
      closedOrdersCount: 0,
      openPositionsCount: 0,
      rules: { daily_loss_pct: 0, max_risk_per_trade_pct: 0, max_exposure_pct: 0, revenge_threshold_trades: 0 },
      stats: { initialBalance: 0, dailyStats: [], highestDdPct: null, consecutiveLossesAtEnd: 0 },
      openPositions: [],
      currentExposurePct: null,
      findings: []
    };
  }

  const { data: appUser } = await supabase
    .from("app_user")
    .select("daily_loss_pct, max_risk_per_trade_pct, max_exposure_pct, revenge_threshold_trades")
    .eq("id", userId)
    .single();

  const rules: RiskRules = {
    daily_loss_pct: Number(appUser?.daily_loss_pct) ?? 5,
    max_risk_per_trade_pct: Number(appUser?.max_risk_per_trade_pct) ?? 1,
    max_exposure_pct: Number(appUser?.max_exposure_pct) ?? 6,
    revenge_threshold_trades: Number(appUser?.revenge_threshold_trades) ?? 3
  };

  const stats = buildStatsForRisk(balance, orders);
  const useEquityOut = equity > 0 ? equity : balance;
  const currentExposurePct =
    openPositions.length > 0
      ? openPositions.reduce((s, p) => s + (p.riskPct ?? 0), 0)
      : null;
  const findings = getRiskFindings(rules, stats, {
    openPositions,
    equity: useEquityOut,
    currentExposurePct
  });

  return {
    ok: true,
    timestamp: new Date().toISOString(),
    uuid,
    connection,
    raw: includeRaw
      ? {
          accountSummary: rawSummary,
          closedOrders: rawClosed,
          openOrders: rawOpen,
          openOrdersResponses: openOrdersResponses?.length ? openOrdersResponses : undefined
        }
      : undefined,
    balance,
    equity,
    closedOrdersCount: orders.length,
    openPositionsCount: openPositions.length,
    rules,
    stats,
    openPositions,
    currentExposurePct,
    findings
  };
}
