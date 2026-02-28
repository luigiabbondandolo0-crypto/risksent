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
  volume?: number;
  openPrice?: number;
  stopLoss?: number;
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

function parseOpenPositions(raw: unknown): RawOpenPosition[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (o): o is RawOpenPosition =>
      o != null && typeof o === "object" && typeof (o as RawOpenPosition).symbol === "string"
  );
}

function buildOpenPositionsForRisk(raw: RawOpenPosition[], equity: number): OpenPositionForRisk[] {
  if (equity <= 0) return [];
  const out: OpenPositionForRisk[] = [];
  for (const p of raw) {
    const symbol = String(p.symbol ?? "").trim();
    const volume = Number(p.volume) || 0;
    const openPrice = Number(p.openPrice) || 0;
    const stopLoss = p.stopLoss != null ? Number(p.stopLoss) : undefined;
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
      type: p.type === "sell" ? "sell" : "buy",
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
      const openRes = await fetch(`${METAAPI_BASE}/OpenOrders?id=${encodeURIComponent(uuid)}`, { headers });
      if (openRes.ok) {
        const raw = await openRes.json();
        const rawList = Array.isArray(raw) ? raw : raw?.orders ?? raw?.positions ?? raw ?? [];
        openPositions = buildOpenPositionsForRisk(parseOpenPositions(rawList), useEquity);
      }
    } catch {
      // OpenOrders may not exist
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

  try {
    const [summaryRes, closedRes] = await Promise.all([
      fetch(`${METAAPI_BASE}/AccountSummary?id=${encodeURIComponent(uuid)}`, { headers }),
      fetch(`${METAAPI_BASE}/ClosedOrders?id=${encodeURIComponent(uuid)}`, { headers })
    ]);

    connection.accountSummary = {
      ok: summaryRes.ok,
      status: summaryRes.status,
      error: summaryRes.ok ? "" : (await summaryRes.text().catch(() => "Unknown"))
    };
    else {
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
    else {
      rawClosed = await closedRes.json();
      orders = parseOrders(Array.isArray(rawClosed) ? rawClosed : (rawClosed as { orders?: unknown })?.orders ?? rawClosed ?? []);
    }

    const useEquity = equity > 0 ? equity : balance;
    try {
      const openRes = await fetch(`${METAAPI_BASE}/OpenOrders?id=${encodeURIComponent(uuid)}`, { headers });
      connection.openOrders = {
        ok: openRes.ok,
        status: openRes.status,
        error: openRes.ok ? "" : (await openRes.text().catch(() => "Unknown"))
      };
      if (openRes.ok) {
        rawOpen = await openRes.json();
        const rawList = Array.isArray(rawOpen) ? rawOpen : (rawOpen as { orders?: unknown })?.orders ?? (rawOpen as { positions?: unknown })?.positions ?? rawOpen ?? [];
        openPositions = buildOpenPositionsForRisk(parseOpenPositions(rawList), useEquity);
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
    raw: includeRaw ? { accountSummary: rawSummary, closedOrders: rawClosed, openOrders: rawOpen } : undefined,
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
