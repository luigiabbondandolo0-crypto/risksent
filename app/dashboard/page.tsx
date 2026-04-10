"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
  Brush
} from "recharts";
import { DdExposureCard } from "./components/DdExposureCard";
import { AlertsOverview } from "./components/AlertsOverview";
import { QuickActions } from "./components/QuickActions";
import { RulesEditPopup, type RiskRules } from "./components/RulesEditPopup";
import { RiskRewardTableModal } from "./components/RiskRewardTableModal";
import { WinsLossesGauge } from "./components/WinsLossesGauge";

type Account = {
  id: string;
  broker_type: string;
  account_number: string;
  account_name?: string | null;
  metaapi_account_id: string | null;
  created_at: string;
};

function accountLabel(a: Account): string {
  const login = a.account_number ?? "";
  const name = a.account_name?.trim();
  return name ? `${login} · ${name}` : login;
}

type Stats = {
  balance: number;
  equity: number;
  currency?: string;
  winRate: number | null;
  maxDd: number | null;
  highestDdPct: number | null;
  peakDdDate?: string | null;
  maxDdDollars?: number | null;
  dailyDdPct?: number | null;
  currentExposurePct?: number | null;
  avgRiskReward: number | null;
  avgWin?: number | null;
  avgLoss?: number | null;
  avgWinPct?: number | null;
  avgLossPct?: number | null;
  winsCount?: number;
  lossesCount?: number;
  drawsCount?: number;
  profitFactor?: number | null;
  balancePct: number | null;
  equityPct: number | null;
  equityCurve: { date: string; value: number; pctFromStart: number }[];
  dailyStats: { date: string; profit: number; trades: number; wins: number }[];
  initialBalance?: number;
  updatedAt?: string;
  error?: string;
};

type DayStat = { date: string; profit: number; trades: number; wins: number };

type RuleStatus = "safe" | "watch" | "high";

function getRuleStatus(current: number | null, limit: number): RuleStatus {
  if (current == null || limit <= 0) return "safe";
  const ratio = Math.abs(current) / limit;
  if (ratio >= 0.95) return "high";
  if (ratio >= 0.75) return "watch";
  return "safe";
}

function ruleStatusPill(status: RuleStatus) {
  if (status === "high") return "border-red-500/40 bg-red-500/15 text-red-300";
  if (status === "watch") return "border-orange-500/40 bg-orange-500/15 text-orange-300";
  return "border-emerald-500/40 bg-emerald-500/15 text-emerald-300";
}

function AnimatedNumber({
  value,
  decimals = 2,
  suffix = "",
  className = "",
  forceNegative = false,
}: {
  value: number | null | undefined;
  decimals?: number;
  suffix?: string;
  className?: string;
  forceNegative?: boolean;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value == null) return;
    const duration = 800;
    const start = performance.now();
    const from = 0;
    const to = value;
    let raf = 0;

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (to - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  if (value == null) return <span className={className}>—</span>;
  const shown = forceNegative ? -Math.abs(display) : display;
  return (
    <span className={className}>
      {shown >= 0 ? "+" : ""}
      {shown.toFixed(decimals)}
      {suffix}
    </span>
  );
}


const POLL_MS = 45_000;
const CHECK_RISK_THROTTLE_MS = 1 * 60 * 1000; // 1 min — live-ish when dashboard open; cron runs every 2 min for all accounts

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [riskRules, setRiskRules] = useState<RiskRules | null>(null);
  const [rulesPopupOpen, setRulesPopupOpen] = useState(false);
  const [rrTableOpen, setRrTableOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastCheckRiskRef = useRef<{ uuid: string; at: number } | null>(null);

  const fetchStats = useCallback(async (uuid: string | null) => {
    if (uuid === null) return;
    const u = uuid || undefined;
    const res = await fetch(
      `/api/dashboard-stats${u ? `?uuid=${encodeURIComponent(u)}` : ""}`
    );
    const data = await res.json();
    if (!res.ok) {
      setStats({
        balance: 0,
        equity: 0,
        winRate: null,
        maxDd: null,
        highestDdPct: null,
        avgRiskReward: null,
        balancePct: null,
        equityPct: null,
        equityCurve: [],
        dailyStats: [],
        error: data.error
      });
      return;
    }
    setStats(data);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const accRes = await fetch("/api/accounts");
        const body = await accRes.json().catch(() => ({}));
        if (!accRes.ok) {
          setError(body?.error ?? "Failed to load accounts");
          return;
        }
        const list = body.accounts ?? [];
        setAccounts(list);
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
    (async () => {
      try {
        const res = await fetch("/api/rules");
        if (res.ok) {
          const r = await res.json();
          setRiskRules({
            daily_loss_pct: Number(r.daily_loss_pct) ?? 5,
            max_risk_per_trade_pct: Number(r.max_risk_per_trade_pct) ?? 1,
            max_exposure_pct: Number(r.max_exposure_pct) ?? 6,
            revenge_threshold_trades: Number(r.revenge_threshold_trades) ?? 3
          });
        } else {
          setRiskRules(null);
        }
      } catch {
        setRiskRules(null);
      }
    })();
  }, []);

  useEffect(() => {
    if (selectedUuid === null) return;
    setStats(null);
    fetchStats(selectedUuid);
    const t = setInterval(() => fetchStats(selectedUuid), POLL_MS);
    return () => clearInterval(t);
  }, [selectedUuid, fetchStats]);

  // Risk check: quando le stats sono caricate, invia a check-risk (throttle 5 min per account)
  useEffect(() => {
    if (!stats || stats.error || !selectedUuid) return;
    const now = Date.now();
    const last = lastCheckRiskRef.current;
    if (last && last.uuid === selectedUuid && now - last.at < CHECK_RISK_THROTTLE_MS) return;
    lastCheckRiskRef.current = { uuid: selectedUuid, at: now };
    fetch("/api/alerts/check-risk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uuid: selectedUuid })
    }).catch(() => {});
  }, [stats, selectedUuid]);

  const currency = stats?.currency ?? "EUR";
  const curve = stats?.equityCurve ?? [];
  const dailyStats = stats?.dailyStats ?? [];

  // Win rate trend: last 7 days vs previous 7 days (from dailyStats)
  const winRateTrend = (() => {
    if (!dailyStats.length) return null;
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const last7: { trades: number; wins: number } = { trades: 0, wins: 0 };
    const prev7: { trades: number; wins: number } = { trades: 0, wins: 0 };
    for (const d of dailyStats) {
      if (d.date > fourteenDaysAgo.toISOString().slice(0, 10) && d.date <= today) {
        if (d.date > sevenDaysAgo.toISOString().slice(0, 10)) {
          last7.trades += d.trades;
          last7.wins += d.wins;
        } else {
          prev7.trades += d.trades;
          prev7.wins += d.wins;
        }
      }
    }
    if (last7.trades === 0 || prev7.trades === 0) return null;
    const wrLast = (last7.wins / last7.trades) * 100;
    const wrPrev = (prev7.wins / prev7.trades) * 100;
    const diff = wrLast - wrPrev;
    return { wrLast, wrPrev, diff };
  })();

  const handleSyncTrades = useCallback(() => {
    if (!selectedUuid) return;
    setSyncing(true);
    fetchStats(selectedUuid).finally(() => setSyncing(false));
  }, [selectedUuid, fetchStats]);

  // Calendar: displayed month (navigable)
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startWeekday = firstDay.getDay();
  const dailyByDate = new Map<string, DayStat>(dailyStats.map((d) => [d.date, d]));
  const now = new Date();

  const monthLabel = firstDay.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric"
  });
  const goPrevMonth = () => setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1));
  const goNextMonth = () => setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1));

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="rs-page-title">Dashboard</h1>
          <p className="rs-page-sub">
            Risk, performance, and activity for the selected account — updated on a short interval while you stay on this page.
          </p>
          {stats?.updatedAt && (
            <p className="mt-2 text-xs text-slate-500">
              Last updated{" "}
              {new Date(stats.updatedAt).toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </p>
          )}
        </div>
        <div className="w-full sm:max-w-[min(100%,20rem)] shrink-0">
          <label htmlFor="dashboard-account" className="rs-section-title mb-2 block">
            Trading account
          </label>
          <select
            id="dashboard-account"
            className="rs-input"
            value={selectedUuid ?? ""}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedUuid(e.target.value || null)}
            disabled={loading}
          >
            <option value="">Select account</option>
            {accounts.map((a: Account) => (
              <option key={a.id} value={a.metaapi_account_id ?? ""}>
                {accountLabel(a)}
              </option>
            ))}
          </select>
        </div>
      </header>

      {!loading && accounts.length === 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Non hai un account collegato -{" "}
          <Link href="/add-account" className="font-semibold underline hover:text-amber-100">
            Aggiungilo
          </Link>
        </div>
      )}

      {loading && (
        <div className="rs-card overflow-hidden p-6" aria-hidden>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="h-12 w-12 shrink-0 rounded-xl bg-slate-800/80 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 max-w-full rounded bg-slate-800/80 animate-pulse" />
              <div className="h-3 w-full max-w-md rounded bg-slate-800/60 animate-pulse" />
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-slate-800/50 animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {error && (
        <div
          className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          role="alert"
        >
          {error}
        </div>
      )}

      {!loading && (
      <>
      <section className="rs-card-accent p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-base font-semibold tracking-tight text-slate-100">Active risk rules</h3>
          {riskRules ? (
            <button
              type="button"
              onClick={() => setRulesPopupOpen(true)}
              className="rounded-lg border border-cyan-500/35 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-200 transition-colors hover:bg-cyan-500/20"
            >
              Edit
            </button>
          ) : (
            <Link
              href="/app/risk-manager"
              className="inline-flex items-center rounded-lg border border-cyan-500/35 bg-cyan-500/15 px-3 py-1.5 text-xs font-medium text-cyan-200 transition-colors hover:bg-cyan-500/25"
            >
              Set rules
            </Link>
          )}
        </div>
        {riskRules && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <div className="rounded-xl border border-slate-700/50 bg-slate-950/40 px-4 py-3">
              <div className="rs-kpi-label">Daily loss</div>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs rs-mono font-semibold uppercase tracking-wide
                border-inherit">
                <span className={`h-2 w-2 rounded-full ${
                  getRuleStatus(stats?.dailyDdPct ?? null, riskRules.daily_loss_pct) === "watch"
                    ? "bg-orange-400 animate-pulse"
                    : getRuleStatus(stats?.dailyDdPct ?? null, riskRules.daily_loss_pct) === "high"
                    ? "bg-red-400"
                    : "bg-emerald-400"
                }`} />
                <span className={`${ruleStatusPill(getRuleStatus(stats?.dailyDdPct ?? null, riskRules.daily_loss_pct))} rounded-full border px-2 py-0.5`}>
                  {riskRules.daily_loss_pct}% limit
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-slate-700/50 bg-slate-950/40 px-4 py-3">
              <div className="rs-kpi-label">Risk / trade</div>
              <div className="mt-2 inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300 rs-mono">
                  {riskRules.max_risk_per_trade_pct}% limit
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-slate-700/50 bg-slate-950/40 px-4 py-3">
              <div className="rs-kpi-label">Exposure</div>
              <div className="mt-2 inline-flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${
                  getRuleStatus(stats?.currentExposurePct ?? null, riskRules.max_exposure_pct) === "watch"
                    ? "bg-orange-400 animate-pulse"
                    : getRuleStatus(stats?.currentExposurePct ?? null, riskRules.max_exposure_pct) === "high"
                    ? "bg-red-400"
                    : "bg-emerald-400"
                }`} />
                <span className={`${ruleStatusPill(getRuleStatus(stats?.currentExposurePct ?? null, riskRules.max_exposure_pct))} rounded-full border px-2 py-0.5 text-xs font-semibold rs-mono`}>
                  {riskRules.max_exposure_pct}% limit
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-slate-700/50 bg-slate-950/40 px-4 py-3">
              <div className="rs-kpi-label">Revenge</div>
              <div className="mt-2 inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300 rs-mono">
                  {riskRules.revenge_threshold_trades} losses
                </span>
              </div>
            </div>
          </div>
        )}
      </section>
      {riskRules && (
        <RulesEditPopup
          open={rulesPopupOpen}
          onClose={() => setRulesPopupOpen(false)}
          initialRules={riskRules}
          onSaved={(r) => {
            setRiskRules(r);
            setRulesPopupOpen(false);
          }}
        />
      )}

      <AlertsOverview />

      <section className="grid gap-4 md:grid-cols-3 sm:gap-5">
        <div className="rs-card-accent p-5 shadow-rs-soft transition-transform duration-200 hover:scale-[1.02]">
          <div className="rs-kpi-label">Balance</div>
          <div className="mt-1 text-2xl font-bold text-white rs-mono">
            <AnimatedNumber value={stats?.balancePct} suffix="%" />
          </div>
          <div className={`mt-1 text-sm font-semibold rs-mono ${
            (stats?.balancePct ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"
          }`}>
            {stats == null || stats.error ? "No data" : `${stats.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency}`}
          </div>
        </div>
        <div className="rs-card-accent p-5 shadow-rs-soft transition-transform duration-200 hover:scale-[1.02]">
          <div className="rs-kpi-label">Equity</div>
          <div className="mt-1 text-2xl font-bold text-white rs-mono">
            <AnimatedNumber value={stats?.equityPct} suffix="%" />
          </div>
          <div className={`mt-1 text-sm font-semibold rs-mono ${
            (stats?.equityPct ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"
          }`}>
            {stats == null || stats.error ? "No data" : `${stats.equity.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency}`}
          </div>
        </div>
        <div className="rs-card-accent p-5 shadow-rs-soft transition-transform duration-200 hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <span className="rs-kpi-label">Win rate & avg R:R</span>
            <button
              type="button"
              onClick={() => setRrTableOpen(true)}
              className="rounded-full p-1 text-slate-500 hover:text-cyan-400 hover:bg-slate-700/50 transition-colors"
              title="Risk:Reward & Win Rate"
              aria-label="Info"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
            </button>
          </div>
          <div className="flex items-start justify-between gap-3 mt-1">
            <div>
              <div className="text-2xl font-bold text-white">
                <AnimatedNumber value={stats?.winRate} decimals={1} suffix="%" />
              </div>
              {winRateTrend != null && (
                <p className="mt-0.5 text-xs text-slate-400">
                  {winRateTrend.diff >= 0 ? <span className="text-emerald-400">↑ +{winRateTrend.diff.toFixed(1)}%</span> : <span className="text-red-400">↓ {winRateTrend.diff.toFixed(1)}%</span>} vs last week
                </p>
              )}
              <div className="mt-2 pt-2 border-t border-slate-700/50">
                <span className="text-xs text-slate-500">Avg R:R </span>
                <span className="text-lg font-bold text-white">
                  <AnimatedNumber value={stats?.avgRiskReward} />
                </span>
              </div>
            </div>
            {(stats?.winsCount != null || stats?.lossesCount != null) && (
              <WinsLossesGauge
                wins={stats?.winsCount ?? 0}
                losses={stats?.lossesCount ?? 0}
                draws={stats?.drawsCount ?? 0}
              />
            )}
          </div>
        </div>
        <RiskRewardTableModal open={rrTableOpen} onClose={() => setRrTableOpen(false)} />
      </section>

      <section className="grid gap-4 md:grid-cols-3 sm:gap-5">
        <div className="rs-card-accent p-5 shadow-rs-soft transition-transform duration-200 hover:scale-[1.02]">
          <div className="rs-kpi-label">Avg win</div>
          <div className="mt-1 text-2xl font-bold rs-mono text-emerald-400">
            <AnimatedNumber value={stats?.avgWin} suffix={` ${currency}`} />
          </div>
          <div className="mt-1 text-xs text-slate-500 rs-mono">
            {stats?.avgWinPct != null ? `${stats.avgWinPct.toFixed(2)}%` : "No data"}
          </div>
        </div>
        <div className="rs-card-accent p-5 shadow-rs-soft transition-transform duration-200 hover:scale-[1.02]">
          <div className="rs-kpi-label">Avg loss</div>
          <div className="mt-1 text-2xl font-bold rs-mono text-red-400">
            <AnimatedNumber value={stats?.avgLoss} suffix={` ${currency}`} forceNegative />
          </div>
          <div className="mt-1 text-xs text-slate-500 rs-mono">
            {stats?.avgLossPct != null ? `${stats.avgLossPct.toFixed(2)}%` : "No data"}
          </div>
        </div>

        <div className="rs-card-accent p-5 shadow-rs-soft transition-transform duration-200 hover:scale-[1.02]">
          <div className="rs-kpi-label">Max drawdown</div>
          <div className="mt-1 text-2xl font-bold rs-mono text-red-400">
            <AnimatedNumber
              value={stats?.highestDdPct != null ? -Math.abs(stats.highestDdPct) : null}
              suffix="%"
            />
          </div>
          <div className="mt-1 text-xs text-slate-500 rs-mono">
            {stats?.peakDdDate ? new Date(stats.peakDdDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "No data"}
          </div>
        </div>
      </section>

      {/* Daily DD & Current Exposure — single card (mock values when no data) */}
      {riskRules && (
        <DdExposureCard
          dailyDdPct={stats?.dailyDdPct ?? -0.52}
          dailyLimitPct={riskRules.daily_loss_pct}
          exposurePct={stats?.currentExposurePct ?? 2.3}
          exposureLimitPct={riskRules.max_exposure_pct}
          isMock={stats?.dailyDdPct == null && stats?.currentExposurePct == null}
        />
      )}

      {/* Equity curve — full width, below Daily DD & exposure */}
      <section className="rs-card w-full p-5 sm:p-6 shadow-rs-soft">
        <div className="mb-1 text-base font-semibold tracking-tight text-slate-100">Equity growth</div>
        <p className="mb-4 text-xs text-slate-500 leading-relaxed">
          % from start and balance in {currency}. Use the brush below the chart to zoom or pan.
        </p>
        {stats?.error && <p className="mb-3 text-sm text-amber-400/95">{stats.error}</p>}
        {curve.length === 0 && !stats?.error && (
          <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-slate-700/60 bg-slate-950/30 px-4 text-center text-sm text-slate-500">
            {stats == null ? "Loading…" : "No data yet. Link an account and place trades to see the curve."}
          </div>
        )}
        {curve.length > 0 && (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={curve.map((p: { date: string; value: number; pctFromStart: number }) => ({
                  ...p,
                  pct: p.pctFromStart,
                  displayDate: new Date(p.date).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "2-digit"
                  })
                }))}
                margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
              >
                <defs>
                  <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff3c3c" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#ff3c3c" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="displayDate"
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                  axisLine={{ stroke: "#475569" }}
                  tickLine={{ stroke: "#475569" }}
                />
                <YAxis
                  tickFormatter={(v: number) => `${v}%`}
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                  axisLine={{ stroke: "#475569" }}
                  tickLine={{ stroke: "#475569" }}
                />
                <Tooltip
                  cursor={{ stroke: "#ff8c00", strokeOpacity: 0.5 }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload[0]?.payload) return null;
                    const row = payload[0].payload as { displayDate: string; pctFromStart: number; value: number };
                    return (
                      <div className="rounded-lg border border-[#1e1e1e] bg-[#111] px-3 py-2 shadow-[0_0_18px_rgba(255,60,60,0.15)]">
                        <p className="text-[11px] text-slate-400">{row.displayDate}</p>
                        <p className="text-sm font-semibold text-slate-100 rs-mono">
                          {row.pctFromStart.toFixed(2)}% · {row.value.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                        </p>
                      </div>
                    );
                  }}
                />
                {riskRules && (
                  <ReferenceLine
                    y={-riskRules.daily_loss_pct}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="pctFromStart"
                  stroke="#ff3c3c"
                  strokeWidth={2.5}
                  fill="url(#equityGrad)"
                  isAnimationActive
                  animationDuration={900}
                  animationEasing="ease-out"
                />
                <Brush
                  dataKey="displayDate"
                  height={24}
                  stroke="#475569"
                  fill="#1e293b"
                  tickFormatter={(v: string) => v}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Calendar — traded days */}
      <section className="rs-card p-5 sm:p-6 shadow-rs-soft">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-base font-semibold tracking-tight text-slate-100 capitalize">{monthLabel}</div>
            <div className="mt-0.5 text-xs text-slate-500">Days with activity — tap a day to open trades</div>
          </div>
          <div className="flex gap-1.5">
            <button type="button" onClick={goPrevMonth} className="rounded-lg border border-slate-600/80 px-2.5 py-1.5 text-xs text-slate-300 transition-colors hover:bg-slate-800" aria-label="Previous month">←</button>
            <button type="button" onClick={goNextMonth} className="rounded-lg border border-slate-600/80 px-2.5 py-1.5 text-xs text-slate-300 transition-colors hover:bg-slate-800" aria-label="Next month">→</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-[10px] text-slate-500 font-medium py-1">{d}</div>
          ))}
          {Array.from({ length: startWeekday }, (_, i) => (
            <div key={`pad-${i}`} className="min-h-[64px]" />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayData = dailyByDate.get(dateStr);
            const isFuture = new Date(year, month, day) > now;
            const pct = dayData && stats?.initialBalance ? (dayData.profit / stats.initialBalance) * 100 : null;
            const winPct = dayData && dayData.trades > 0 ? (dayData.wins / dayData.trades) * 100 : null;
            const cellClass = `min-h-[64px] rounded-lg border flex flex-col items-center justify-center p-1 ${
              isFuture ? "border-slate-800/50 bg-slate-900/30 text-slate-600" :
              dayData ? (pct != null && pct >= 0 ? "border-emerald-500/30 bg-emerald-500/10" : "border-red-500/30 bg-red-500/10") :
              "border-slate-700/50 bg-slate-800/30 text-slate-500"
            }`;
            const content = (
              <>
                <span className="text-xs font-medium text-slate-300">{day}</span>
                {dayData && (
                  <>
                    <span className={`text-xs font-semibold ${pct != null && pct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {pct != null ? `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%` : "—"}
                    </span>
                    <span className="text-[10px] text-slate-400">{dayData.trades} trade{dayData.trades !== 1 ? "s" : ""}{winPct != null ? ` · ${winPct.toFixed(0)}% win` : ""}</span>
                  </>
                )}
              </>
            );
            return dayData ? (
              <Link
                key={dateStr}
                href={`/trades?date=${dateStr}${selectedUuid ? `&uuid=${encodeURIComponent(selectedUuid)}` : ""}`}
                className={`${cellClass} hover:ring-2 hover:ring-cyan-500/50 transition-colors`}
                title={`View trades on ${dateStr}`}
              >
                {content}
              </Link>
            ) : (
              <div key={dateStr} className={cellClass}>
                {content}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="rs-section-title mb-3 text-slate-400">Quick actions</h2>
        <QuickActions onSyncTrades={handleSyncTrades} syncing={syncing} />
      </section>
      </>
      )}
    </div>
  );
}
