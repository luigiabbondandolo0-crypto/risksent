/**
 * Shared logic to run risk check for one account: fetch data, compute findings, dedupe, insert alert + Telegram.
 * Used by POST /api/alerts/check-risk and by cron /api/cron/check-risk-all.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getRiskFindings, type OpenPositionForRisk, type RiskFinding, type RiskRules, type StatsForRisk } from "./riskCheck";
import { sendSmartTelegramAlert } from "./telegram/sendSmartTelegramAlert";
import { createSupabaseAdmin } from "./supabaseAdmin";
import { loadMergedRiskRules } from "@/lib/risk/loadMergedRiskRules";
import { resolveJournalAccountForTradingRow } from "@/lib/risk/resolveJournalForTrading";
import { effectiveNotifySettings, notifyFlagForRule, type NotifySettingsLike } from "@/lib/risk/violationEngine";
import {
  getAccountSummary,
  getClosedOrders,
  getOpenPositions,
  accountSelectColumns,
  type TradingAccountRow
} from "./tradingApi";
const DEFAULT_CONTRACT_SIZE = 100_000;
const DEDUPE_HOURS = 12;

type FindingType = RiskFinding["type"];

const FINDING_TYPE_TO_ALERT: Record<FindingType, string> = {
  daily_loss: "daily_drawdown",
  max_drawdown: "max_drawdown",
  current_exposure: "position_size",
  max_risk_per_trade: "position_size",
  revenge_trading: "revenge_trading",
  consecutive_losses: "consecutive_losses",
  overtrading: "overtrading",
};

function buildAlertData(
  type: FindingType,
  ctx: {
    balance: number;
    equity: number;
    rules: RiskRules;
    stats: StatsForRisk;
    openPositions: OpenPositionForRisk[];
    currentExposurePct: number | null;
  }
): Record<string, unknown> {
  const { balance, rules, stats, openPositions, currentExposurePct } = ctx;
  switch (type) {
    case "daily_loss": {
      const worstDayPct =
        stats.dailyStats.length > 0 && stats.initialBalance > 0
          ? Math.min(...stats.dailyStats.map((d) => (d.profit / stats.initialBalance) * 100))
          : 0;
      return {
        currentDD: Math.abs(worstDayPct).toFixed(2),
        limitDD: rules.daily_loss_pct,
        balance: balance.toFixed(0),
      };
    }
    case "max_drawdown":
      return {
        currentDD: (stats.highestDdPct ?? 0).toFixed(2),
        limitDD: rules.max_exposure_pct,
        balance: balance.toFixed(0),
      };
    case "current_exposure":
      return {
        positionSize: (currentExposurePct ?? 0).toFixed(2),
        limit: rules.max_exposure_pct,
        symbol: "portfolio",
      };
    case "max_risk_per_trade": {
      const worst = openPositions.reduce<OpenPositionForRisk | null>(
        (max, p) => (p.riskPct != null && (max?.riskPct ?? 0) < p.riskPct ? p : max),
        null
      );
      return {
        positionSize: (worst?.riskPct ?? 0).toFixed(2),
        limit: rules.max_risk_per_trade_pct,
        symbol: worst?.symbol ?? "open position",
      };
    }
    case "revenge_trading":
      return {
        tradesCount: rules.revenge_threshold_trades,
        minutes: 30,
      };
    case "consecutive_losses":
      return {
        count: stats.consecutiveLossesAtEnd,
        totalLoss: Math.abs(
          stats.dailyStats
            .slice(-stats.consecutiveLossesAtEnd)
            .reduce((s, d) => s + d.profit, 0)
        ).toFixed(0),
      };
    case "overtrading": {
      const todayStr = new Date().toISOString().slice(0, 10);
      const todayTrades = stats.dailyStats.find((d) => d.date === todayStr);
      const avgTrades =
        stats.dailyStats.length > 0
          ? Math.round(stats.dailyStats.reduce((s) => s + 1, 0) / stats.dailyStats.length)
          : 5;
      return {
        tradesCount: todayTrades ? 1 : 0,
        avgTrades,
      };
    }
  }
}

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
      consecutiveLossesAtEnd: 0,
      todayTrades: 0,
      avgTradesPerDay: null
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

  // Today's trade count (UTC) and average trades/day over prior 30 days (excluding today).
  const LOOKBACK_DAYS = 30;
  const todayStr = new Date().toISOString().slice(0, 10);
  const cutoff = Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
  const dayCounts = new Map<string, number>();
  let todayTrades = 0;
  for (const o of sorted) {
    const day = o.closeTime.slice(0, 10);
    if (day === todayStr) {
      todayTrades += 1;
      continue;
    }
    const ts = new Date(o.closeTime).getTime();
    if (Number.isNaN(ts) || ts < cutoff) continue;
    dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
  }
  const avgTradesPerDay =
    dayCounts.size > 0
      ? Array.from(dayCounts.values()).reduce((s, n) => s + n, 0) / dayCounts.size
      : null;

  return {
    initialBalance: initialBalance > 0 ? initialBalance : balance,
    dailyStats,
    highestDdPct,
    consecutiveLossesAtEnd,
    todayTrades,
    avgTradesPerDay
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
 * Run full risk check for one user/account: fetch trading provider data, get rules, compute findings, dedupe and create alerts + Telegram.
 * supabase: use route client for authenticated user, or admin for cron (any user).
 */
export async function runRiskCheckForAccount(params: {
  userId: string;
  uuid: string;
  supabase: SupabaseClient;
}): Promise<RunRiskCheckResult> {
  const { userId, uuid, supabase } = params;

  let balance = 0;
  let equity = 0;
  let orders: ClosedOrder[] = [];
  let openPositions: OpenPositionForRisk[] = [];

  const { data: rawRow } = await supabase
    .from("trading_account")
    .select(accountSelectColumns())
    .eq("user_id", userId)
    .eq("metaapi_account_id", uuid)
    .limit(1)
    .single();

  const accountRow = rawRow && typeof rawRow === "object" && "metaapi_account_id" in rawRow ? (rawRow as unknown as TradingAccountRow) : null;
  if (!accountRow?.metaapi_account_id) {
    console.error("[riskCheckRun] No account found for userId/uuid", { userId: userId.slice(0, 8), uuidLen: uuid?.length });
    return { ok: false, error: "Account not found", findings: [] };
  }

  console.log("[riskCheckRun] runRiskCheckForAccount", { uuidLen: uuid.length });

  try {
    const [summaryResult, closedResult, openResult] = await Promise.all([
      getAccountSummary(accountRow),
      getClosedOrders(accountRow),
      getOpenPositions(accountRow)
    ]);
    if (summaryResult.ok && summaryResult.summary) {
      balance = summaryResult.summary.balance;
      equity = summaryResult.summary.equity ?? balance;
    }
    if (closedResult.ok) {
      orders = parseOrders(closedResult.orders);
    }
    const useEquity = equity > 0 ? equity : balance;
    if (openResult.ok && openResult.positions.length > 0) {
      openPositions = buildOpenPositionsForRisk(parseOpenPositions(openResult.positions), useEquity);
    }
  } catch (e) {
    console.error("[riskCheckRun] fetch failed", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to fetch account",
      findings: []
    };
  }

  const journalCtx = await resolveJournalAccountForTradingRow(supabase, userId, accountRow);
  const merged = await loadMergedRiskRules(supabase, userId, journalCtx?.id ?? null);

  const rules: RiskRules = {
    daily_loss_pct: merged.daily_loss_pct,
    max_risk_per_trade_pct: merged.max_risk_per_trade_pct,
    max_exposure_pct: merged.max_exposure_pct,
    revenge_threshold_trades: merged.revenge_threshold_trades
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

  // Fetch user's Telegram chat ID once for the whole loop
  const adminDb = createSupabaseAdmin();
  const { data: appUser } = await adminDb
    .from("app_user")
    .select("telegram_chat_id")
    .eq("id", userId)
    .maybeSingle();
  const userChatId = appUser?.telegram_chat_id?.trim() ?? null;

  // Load per-rule notification preferences once. Findings whose rule is toggled off
  // must not produce an alert row, a Telegram message, or anything downstream.
  const { data: notifRow } = await supabase
    .from("risk_notifications")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  const notif = (notifRow ?? null) as NotifySettingsLike | null;
  const effectiveNotif = effectiveNotifySettings(notif);
  const rn = notifRow as
    | { telegram_enabled?: boolean | null; telegram_chat_id?: string | null }
    | null
    | undefined;
  /** Match Risk Manager: if a risk_notifications row exists, do not fall back to app_user when disabled. */
  const telegramSendChatId =
    rn && rn.telegram_enabled && rn.telegram_chat_id?.trim()
      ? String(rn.telegram_chat_id).trim()
      : !rn
        ? userChatId
        : null;
  console.log("[riskCheckRun] notif loaded", {
    userId: userId.slice(0, 8) + "...",
    hasRow: !!notif,
    notify_daily_dd: notif?.notify_daily_dd ?? null,
    effective_daily_dd: effectiveNotif.notify_daily_dd,
    notify_max_dd: notif?.notify_max_dd ?? null,
    notify_position_size: notif?.notify_position_size ?? null,
    notify_consecutive_losses: notif?.notify_consecutive_losses ?? null,
    notify_weekly_loss: notif?.notify_weekly_loss ?? null,
    notify_overtrading: notif?.notify_overtrading ?? null,
    notify_revenge: notif?.notify_revenge ?? null,
    findingsCount: findings.length,
    telegramTarget: telegramSendChatId ? "set" : "none"
  });
  if (findings.length === 0) {
    // Gate logs only run inside the loop — when there is nothing to evaluate, expect no
    // "[riskCheckRun] gate" lines. Common on cron when all accounts are within limits.
    console.log(
      "[riskCheckRun] no findings — skip gate / alert / telegram (getRiskFindings empty)"
    );
  }

  for (const f of findings) {
    const allowed = notifyFlagForRule(f.type, effectiveNotif);
    console.log("[riskCheckRun] gate", { rule_type: f.type, allowed, hasNotif: !!notif });
    if (!allowed) {
      continue;
    }

    let recentQ = supabase
      .from("alert")
      .select("id")
      .eq("user_id", userId)
      .eq("rule_type", f.type)
      .gte("alert_date", dedupeSince)
      .limit(1);
    recentQ = journalCtx?.id ? recentQ.eq("account_id", journalCtx.id) : recentQ.is("account_id", null);
    const { data: recent } = await recentQ;
    if (recent && recent.length > 0) continue;

    const { data: alertRow } = await supabase
      .from("alert")
      .insert({
        user_id: userId,
        message: f.message,
        severity: f.severity,
        solution: f.advice,
        rule_type: f.type,
        account_id: journalCtx?.id ?? null,
        account_nickname: journalCtx?.nickname ?? null
      })
      .select("id")
      .single();

    if (alertRow && telegramSendChatId) {
      const alertType = FINDING_TYPE_TO_ALERT[f.type];
      const alertData = buildAlertData(f.type, { balance, equity, rules, stats, openPositions, currentExposurePct });
      await sendSmartTelegramAlert({
        chatId: telegramSendChatId,
        alertType,
        data: alertData,
        fallbackMessage: `⚠️ Risk alert: ${f.message}`,
        supabase,
        userId,
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
  includeRaw?: boolean;
}): Promise<RiskCheckDryRunResult> {
  const { userId, uuid, supabase, includeRaw = true } = params;

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

  const { data: rawRow } = await supabase
    .from("trading_account")
    .select(accountSelectColumns())
    .eq("user_id", userId)
    .eq("metaapi_account_id", uuid)
    .limit(1)
    .single();

  const accountRow = rawRow && typeof rawRow === "object" && "metaapi_account_id" in rawRow ? (rawRow as unknown as TradingAccountRow) : null;
  if (!accountRow?.metaapi_account_id) {
    console.error("[riskCheckDryRun] No account found", { userId: userId.slice(0, 8), uuidLen: uuid?.length });
    return {
      ok: false,
      error: "Account not found",
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

  console.log("[riskCheckDryRun] uuidLen=", uuid.length);

  try {
    const [summaryResult, closedResult, openResult] = await Promise.all([
      getAccountSummary(accountRow),
      getClosedOrders(accountRow),
      getOpenPositions(accountRow)
    ]);

    connection.accountSummary = {
      ok: summaryResult.ok,
      status: summaryResult.ok ? 200 : 0,
      error: summaryResult.error ?? ""
    };
    if (summaryResult.ok && summaryResult.summary) {
      rawSummary = summaryResult.summary;
      balance = summaryResult.summary.balance;
      equity = summaryResult.summary.equity ?? balance;
    }

    connection.closedOrders = {
      ok: closedResult.ok,
      status: closedResult.ok ? 200 : 0,
      error: closedResult.error ?? ""
    };
    if (closedResult.ok) {
      rawClosed = closedResult.orders;
      orders = parseOrders(closedResult.orders);
    }

    connection.openOrders = {
      ok: openResult.ok,
      status: openResult.lastStatus ?? (openResult.ok ? 200 : 0),
      error: openResult.error ?? ""
    };
    if (includeRaw) {
      openOrdersResponses = [
        { endpoint: "OpenedOrders", status: openResult.lastStatus ?? 0, body: openResult.positions }
      ];
    }
    const useEquity = equity > 0 ? equity : balance;
    if (openResult.ok && openResult.positions.length > 0) {
      rawOpen = openResult.positions;
      openPositions = buildOpenPositionsForRisk(parseOpenPositions(openResult.positions), useEquity);
    } else {
      rawOpen = [];
    }
  } catch (e) {
    console.error("[riskCheckDryRun] fetch failed", e);
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

  const journalCtxDry = await resolveJournalAccountForTradingRow(supabase, userId, accountRow);
  const mergedDry = await loadMergedRiskRules(supabase, userId, journalCtxDry?.id ?? null);

  const rules: RiskRules = {
    daily_loss_pct: mergedDry.daily_loss_pct,
    max_risk_per_trade_pct: mergedDry.max_risk_per_trade_pct,
    max_exposure_pct: mergedDry.max_exposure_pct,
    revenge_threshold_trades: mergedDry.revenge_threshold_trades
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
