"use client";

/**
 * Challenge Simulator – strumento decisionale proattivo per FTMO/Simplified.
 * Dati: /api/accounts, /api/trades?uuid=, /api/dashboard-stats?uuid=
 * In alternativa (Supabase diretto): da auth getUser(), poi
 *   const { data: trades } = await supabase.from('closed_orders').select('*').eq('metaapi_account_id', uuid).order('closeTime');
 *   const { data: rules } = await supabase.from('rules').select('*').eq('app_user_id', userId);
 */
import { useEffect, useState, useMemo, useCallback } from "react";
import { SimulatorView, type Account, type SimulatorStats } from "./SimulatorView";
import type { EquityPoint } from "./components/EquityCurveChart";

const FTMO_PHASE1 = { profit_target_pct: 10, daily_loss_limit_pct: 5, max_loss_pct: 10 };
const FTMO_PHASE2 = { profit_target_pct: 5, daily_loss_limit_pct: 5, max_loss_pct: 10 };
const FTMO_1STEP = { profit_target_pct: 10, daily_loss_limit_pct: 3, max_loss_pct: 10 };
const SIMPLIFIED_PHASE1 = { profit_target_pct: 8, daily_loss_limit_pct: 4, max_loss_pct: 8 };
const SIMPLIFIED_PHASE2 = { profit_target_pct: 4, daily_loss_limit_pct: 4, max_loss_pct: 8 };

const TRADING_DAYS_CAP = 30;

type Trade = {
  ticket: number;
  closeTime: string;
  profit: number;
};

function computeChallengeStats(
  trades: Trade[],
  initialBalance: number,
  currentBalance: number
): SimulatorStats {
  if (initialBalance <= 0 || trades.length === 0) {
    return {
      profit_pct: 0,
      trading_days: 0,
      daily_loss_breach: false,
      worst_daily_pct: 0,
      max_drawdown_pct: 0,
      max_loss_breach: false
    };
  }
  const sorted = [...trades].sort(
    (a, b) => new Date(a.closeTime).getTime() - new Date(b.closeTime).getTime()
  );
  const dayProfit = new Map<string, number>();
  let running = initialBalance;
  let peak = initialBalance;
  for (const t of sorted) {
    const day = t.closeTime.slice(0, 10);
    dayProfit.set(day, (dayProfit.get(day) ?? 0) + t.profit);
    running += t.profit;
    if (running > peak) peak = running;
  }
  const profit_pct = ((currentBalance - initialBalance) / initialBalance) * 100;
  const trading_days = dayProfit.size;
  let worst_daily_pct = 0;
  for (const [, pnl] of dayProfit) {
    const pct = (pnl / initialBalance) * 100;
    if (pct < worst_daily_pct) worst_daily_pct = pct;
  }
  const daily_loss_breach = worst_daily_pct < -FTMO_PHASE1.daily_loss_limit_pct;
  const max_drawdown_pct = peak > 0 ? ((peak - currentBalance) / peak) * 100 : 0;
  const max_loss_breach = max_drawdown_pct > FTMO_PHASE1.max_loss_pct;
  return {
    profit_pct,
    trading_days,
    daily_loss_breach,
    worst_daily_pct,
    max_drawdown_pct,
    max_loss_breach
  };
}

/** Build equity curve from sorted trades: balance and pct after each trade */
function buildEquityCurve(
  trades: Trade[],
  initialBalance: number
): EquityPoint[] {
  if (initialBalance <= 0 || trades.length === 0) return [];
  const sorted = [...trades].sort(
    (a, b) => new Date(a.closeTime).getTime() - new Date(b.closeTime).getTime()
  );
  let running = initialBalance;
  const points: EquityPoint[] = [];
  points.push({
    index: 0,
    date: sorted[0]?.closeTime?.slice(0, 10) ?? "",
    balance: initialBalance,
    pct: 0
  });
  sorted.forEach((t, i) => {
    running += t.profit;
    const pct = ((running - initialBalance) / initialBalance) * 100;
    points.push({
      index: i + 1,
      date: t.closeTime.slice(0, 10),
      balance: running,
      pct
    });
  });
  return points;
}

/**
 * Simple heuristic: probability to pass Phase 1 (0–100).
 * If already breached → 0. Else combine progress toward target and buffer on DD.
 */
function estimatePassProbabilityPhase1(stats: SimulatorStats | null): number {
  if (!stats) return 50;
  if (stats.daily_loss_breach || stats.max_loss_breach) return 0;
  const progress = Math.min(1, stats.profit_pct / FTMO_PHASE1.profit_target_pct);
  const dailyBuffer = Math.max(0, (FTMO_PHASE1.daily_loss_limit_pct + stats.worst_daily_pct) / FTMO_PHASE1.daily_loss_limit_pct);
  const ddBuffer = Math.max(0, (FTMO_PHASE1.max_loss_pct - stats.max_drawdown_pct) / FTMO_PHASE1.max_loss_pct);
  return Math.round((progress * 40) + (dailyBuffer * 30) + (ddBuffer * 30));
}

/** Estimated days to reach Phase 1 target (10%). Uses average daily rate so far. */
function estimateDaysToTarget(stats: SimulatorStats | null): number {
  if (!stats || stats.trading_days === 0) return TRADING_DAYS_CAP;
  if (stats.profit_pct >= FTMO_PHASE1.profit_target_pct) return 0;
  const dailyRate = stats.profit_pct / stats.trading_days;
  if (dailyRate <= 0) return TRADING_DAYS_CAP;
  const remaining = FTMO_PHASE1.profit_target_pct - stats.profit_pct;
  return Math.min(TRADING_DAYS_CAP, Math.max(1, Math.round(remaining / dailyRate)));
}

/** Overall status: fuori_gioco (breach), a_rischio (close to limit), in_corsa */
function getStatus(stats: SimulatorStats | null): "fuori_gioco" | "a_rischio" | "in_corsa" {
  if (!stats) return "in_corsa";
  if (stats.daily_loss_breach || stats.max_loss_breach) return "fuori_gioco";
  const nearDaily = stats.worst_daily_pct < -FTMO_PHASE1.daily_loss_limit_pct * 0.8;
  const nearMaxDd = stats.max_drawdown_pct > FTMO_PHASE1.max_loss_pct * 0.8;
  if (nearDaily || nearMaxDd) return "a_rischio";
  return "in_corsa";
}

/** Placeholder breach risk % (e.g. probability of hitting daily DD in next N trades) */
function estimateBreachRiskPct(stats: SimulatorStats | null): number {
  if (!stats) return 20;
  if (stats.daily_loss_breach || stats.max_loss_breach) return 100;
  const dailyHeadroom = FTMO_PHASE1.daily_loss_limit_pct + stats.worst_daily_pct;
  if (dailyHeadroom <= 0) return 80;
  if (dailyHeadroom < 1) return 60;
  if (dailyHeadroom < 2) return 35;
  return Math.max(5, 25 - stats.trading_days);
}

export default function SimulatorPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [balance, setBalance] = useState(0);
  const [initialBalance, setInitialBalance] = useState(0);
  const [currency, setCurrency] = useState("EUR");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAccounts = useCallback(async () => {
    try {
      const accRes = await fetch("/api/accounts");
      if (!accRes.ok) return;
      const { accounts: list } = await accRes.json();
      setAccounts(list ?? []);
      const first = list?.[0];
      if (first?.metaapi_account_id) setSelectedUuid(first.metaapi_account_id);
      else setSelectedUuid(null);
    } catch {
      setError("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const fetchTradesAndStats = useCallback(async () => {
    const u = selectedUuid ?? "";
    if (!u) return;
    setRefreshing(true);
    setError(null);
    try {
      const [tradesRes, statsRes] = await Promise.all([
        fetch(`/api/trades?uuid=${encodeURIComponent(u)}`),
        fetch(`/api/dashboard-stats?uuid=${encodeURIComponent(u)}`)
      ]);
      const tradesData = await tradesRes.json().catch(() => ({}));
      const statsData = await statsRes.json().catch(() => ({}));
      if (tradesRes.ok && tradesData.trades) {
        setTrades(tradesData.trades);
        setCurrency(tradesData.currency ?? "EUR");
      }
      if (statsRes.ok && !statsData.error) {
        setBalance(Number(statsData.balance) ?? 0);
        setInitialBalance(Number(statsData.initialBalance) ?? 0);
      } else if (tradesRes.ok && tradesData.trades?.length) {
        const totalProfit = (tradesData.trades as Trade[]).reduce((s, t) => s + t.profit, 0);
        const bal = Number(tradesData.balance ?? statsData.balance ?? 0) || 0;
        setBalance(bal);
        setInitialBalance(bal - totalProfit);
      }
    } catch {
      setError("Failed to load data");
    } finally {
      setRefreshing(false);
    }
  }, [selectedUuid]);

  useEffect(() => {
    if (selectedUuid) fetchTradesAndStats();
    else {
      setTrades([]);
      setBalance(0);
      setInitialBalance(0);
    }
  }, [selectedUuid, fetchTradesAndStats]);

  const stats = useMemo(
    () => computeChallengeStats(trades, initialBalance, balance),
    [trades, initialBalance, balance]
  );

  const equityCurve = useMemo(
    () => buildEquityCurve(trades, initialBalance),
    [trades, initialBalance]
  );

  const passProbabilityPhase1 = useMemo(() => estimatePassProbabilityPhase1(stats), [stats]);
  const passProbabilityPhase2 = useMemo(
    () => (stats && !stats.daily_loss_breach && !stats.max_loss_breach ? Math.max(0, passProbabilityPhase1 - 10) : 0),
    [stats, passProbabilityPhase1]
  );
  const estimatedDaysToTarget = useMemo(() => estimateDaysToTarget(stats), [stats]);
  const status = useMemo(() => getStatus(stats), [stats]);
  const breachRiskPct = useMemo(() => estimateBreachRiskPct(stats), [stats]);

  const ftmoPhase1Pass = !!(
    stats &&
    !stats.daily_loss_breach &&
    !stats.max_loss_breach &&
    stats.profit_pct >= FTMO_PHASE1.profit_target_pct
  );
  const ftmoPhase2Pass = !!(
    stats &&
    !stats.daily_loss_breach &&
    !stats.max_loss_breach &&
    stats.profit_pct >= FTMO_PHASE2.profit_target_pct
  );
  const ftmo1StepDailyBreach = stats ? stats.worst_daily_pct < -FTMO_1STEP.daily_loss_limit_pct : false;
  const ftmo1StepMaxLossBreach = stats ? stats.max_drawdown_pct > FTMO_1STEP.max_loss_pct : false;
  const ftmo1StepPass = !!(
    stats &&
    !ftmo1StepDailyBreach &&
    !ftmo1StepMaxLossBreach &&
    stats.profit_pct >= FTMO_1STEP.profit_target_pct
  );
  const simplifiedDailyBreach = stats ? stats.worst_daily_pct < -SIMPLIFIED_PHASE1.daily_loss_limit_pct : false;
  const simplifiedMaxLossBreach = stats ? stats.max_drawdown_pct > SIMPLIFIED_PHASE1.max_loss_pct : false;
  const simplifiedPhase1Pass = !!(
    stats &&
    !simplifiedDailyBreach &&
    !simplifiedMaxLossBreach &&
    stats.profit_pct >= SIMPLIFIED_PHASE1.profit_target_pct
  );
  const simplifiedPhase2Pass = !!(
    stats &&
    !simplifiedDailyBreach &&
    !simplifiedMaxLossBreach &&
    stats.profit_pct >= SIMPLIFIED_PHASE2.profit_target_pct
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-slate-50">Challenge Simulator</h1>
        <p className="text-slate-500 text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <SimulatorView
      accounts={accounts}
      selectedUuid={selectedUuid}
      setSelectedUuid={setSelectedUuid}
      error={error}
      stats={stats}
      equityCurve={equityCurve}
      passProbabilityPhase1={passProbabilityPhase1}
      passProbabilityPhase2={passProbabilityPhase2}
      estimatedDaysToTarget={estimatedDaysToTarget}
      status={status}
      breachRiskPct={breachRiskPct}
      onRefresh={fetchTradesAndStats}
      refreshing={refreshing}
      ftmoPhase1Pass={ftmoPhase1Pass}
      ftmoPhase2Pass={ftmoPhase2Pass}
      ftmo1StepPass={ftmo1StepPass}
      ftmo1StepDailyBreach={ftmo1StepDailyBreach}
      ftmo1StepMaxLossBreach={ftmo1StepMaxLossBreach}
      simplifiedPhase1Pass={simplifiedPhase1Pass}
      simplifiedPhase2Pass={simplifiedPhase2Pass}
      simplifiedDailyBreach={simplifiedDailyBreach}
      simplifiedMaxLossBreach={simplifiedMaxLossBreach}
      initialBalance={initialBalance}
      balance={balance}
      currency={currency}
      tradesCount={trades.length}
    />
  );
}
