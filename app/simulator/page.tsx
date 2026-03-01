"use client";

import { useEffect, useState, useMemo } from "react";
import { SimulatorView, type Account, type SimulatorStats } from "./SimulatorView";

const FTMO_PHASE1 = { profit_target_pct: 10, daily_loss_limit_pct: 5, max_loss_pct: 10 };
const FTMO_PHASE2 = { profit_target_pct: 5, daily_loss_limit_pct: 5, max_loss_pct: 10 };
const FTMO_1STEP = { profit_target_pct: 10, daily_loss_limit_pct: 3, max_loss_pct: 10 };
const SIMPLIFIED_PHASE1 = { profit_target_pct: 8, daily_loss_limit_pct: 4, max_loss_pct: 8 };
const SIMPLIFIED_PHASE2 = { profit_target_pct: 4, daily_loss_limit_pct: 4, max_loss_pct: 8 };

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

export default function SimulatorPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [balance, setBalance] = useState(0);
  const [initialBalance, setInitialBalance] = useState(0);
  const [currency, setCurrency] = useState("EUR");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const accRes = await fetch("/api/accounts");
        if (!accRes.ok) {
          setError("Failed to load accounts");
          return;
        }
        const { accounts: list } = await accRes.json();
        setAccounts(list ?? []);
        const first = list?.[0];
        if (first?.metaapi_account_id) setSelectedUuid(first.metaapi_account_id);
        else setSelectedUuid("");
      } catch {
        setError("Failed to load accounts");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (selectedUuid === null) return;
    const u = selectedUuid || "";
    (async () => {
      setTrades([]);
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
      }
    })();
  }, [selectedUuid]);

  const stats = useMemo(() => {
    return computeChallengeStats(trades, initialBalance, balance);
  }, [trades, initialBalance, balance]);

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
        <h1 className="text-xl font-semibold text-slate-50">Simulator</h1>
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
