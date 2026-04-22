"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  Brush,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";
import { DdExposureCard } from "@/app/dashboard/components/DdExposureCard";
import { RiskRewardTableModal } from "@/app/dashboard/components/RiskRewardTableModal";
import { WinsLossesGauge } from "@/app/dashboard/components/WinsLossesGauge";
import { MockQuickActions } from "@/app/mock/components/MockQuickActions";
import { DashboardAlertsSection } from "@/components/dashboard/DashboardAlertsSection";
import {
  MOCK_CURRENCY,
  MOCK_DASHBOARD_STATS,
  MOCK_RULES,
  MOCK_ALERTS,
} from "@/lib/mock/siteMockData";

const MOCK_UUID = "mock-uuid";
const MOCK_ACCOUNT_LABEL = "500123 · FTMO Demo";

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

type DayStat = { date: string; profit: number; trades: number; wins: number };

function AnimatedNumber({
  value,
  decimals = 2,
  suffix = "",
  forceNegative = false,
}: {
  value: number | null | undefined;
  decimals?: number;
  suffix?: string;
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

  if (value == null) return <span>—</span>;
  const shown = forceNegative ? -Math.abs(display) : display;
  return (
    <span>
      {shown >= 0 ? "+" : ""}
      {shown.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export function MockDashboardClient() {
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [rrTableOpen, setRrTableOpen] = useState(false);

  const stats = MOCK_DASHBOARD_STATS;
  const riskRules = MOCK_RULES;
  const currency = MOCK_CURRENCY;
  const curve = stats.equityCurve;
  const dailyStats = stats.dailyStats as DayStat[];

  const winRateTrend = useMemo(() => {
    if (!dailyStats.length) return null;
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const last7 = { trades: 0, wins: 0 };
    const prev7 = { trades: 0, wins: 0 };
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
    return { wrLast, wrPrev, diff: wrLast - wrPrev };
  }, [dailyStats]);

  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startWeekday = firstDay.getDay();
  const dailyByDate = new Map(dailyStats.map((d) => [d.date, d]));
  const now = new Date();
  const monthLabel = firstDay.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const ruleItems = [
    { label: "Daily loss" as const, value: `${riskRules.daily_loss_pct}% limit`, status: getRuleStatus(stats.dailyDdPct, riskRules.daily_loss_pct) },
    { label: "Risk / trade" as const, value: `${riskRules.max_risk_per_trade_pct}% limit`, status: "safe" as RuleStatus },
    { label: "Exposure" as const, value: `${riskRules.max_exposure_pct}% limit`, status: getRuleStatus(stats.currentExposurePct, riskRules.max_exposure_pct) },
    { label: "Revenge" as const, value: `${riskRules.revenge_threshold_trades} losses`, status: "safe" as RuleStatus },
  ];

  return (
    <div className="relative space-y-6 lg:space-y-8 animate-fade-in">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -top-40 left-1/4 h-96 w-96 rounded-full opacity-[0.06] blur-3xl"
          style={{ background: "radial-gradient(circle, #6366f1, transparent)" }}
        />
        <div
          className="absolute top-1/3 right-0 h-72 w-72 rounded-full opacity-[0.04] blur-3xl"
          style={{ background: "radial-gradient(circle, #38bdf8, transparent)" }}
        />
        <div
          className="absolute bottom-1/4 left-0 h-64 w-64 rounded-full opacity-[0.04] blur-3xl"
          style={{ background: "radial-gradient(circle, #4ade80, transparent)" }}
        />
      </div>

      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="rs-page-title"
            style={{
              background: "linear-gradient(135deg, #e0e7ff 0%, #a78bfa 50%, #6366f1 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Dashboard
          </motion.h1>
          <p className="mt-1.5 rs-page-sub">
            Risk, performance, and activity — same layout as the live app, mock data.
          </p>
          <p className="mt-1 text-xs font-mono text-slate-600">
            Last updated{" "}
            {new Date(stats.updatedAt ?? Date.now()).toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </p>
        </div>
        <div className="w-full sm:max-w-[min(100%,20rem)] shrink-0">
          <label htmlFor="mock-dash-account" className="mb-2 block text-[11px] font-mono uppercase tracking-[0.1em] text-slate-500">
            Trading account
          </label>
          <select id="mock-dash-account" className="rs-input" value={MOCK_UUID} disabled>
            <option value={MOCK_UUID}>{MOCK_ACCOUNT_LABEL}</option>
          </select>
        </div>
      </header>

      <section
        className="relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl sm:p-6"
        style={{
          background: "linear-gradient(135deg, rgba(99,102,241,0.07) 0%, rgba(255,255,255,0.01) 100%)",
          borderColor: "rgba(99,102,241,0.2)",
          boxShadow: "0 0 40px -10px rgba(99,102,241,0.15), 0 8px 32px -8px rgba(0,0,0,0.5)",
        }}
      >
        <div
          className="pointer-events-none absolute -top-12 right-12 h-24 w-32 rounded-full opacity-20 blur-3xl"
          style={{ background: "#6366f1" }}
        />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="h-1 w-5 rounded-full" style={{ background: "linear-gradient(90deg, #6366f1, #a78bfa)" }} />
            <h3 className="text-sm font-mono font-semibold uppercase tracking-[0.1em] text-slate-300">Active risk rules</h3>
          </div>
          <span className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-mono text-slate-500">
            Edit (mock)
          </span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {ruleItems.map(({ label, value, status }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -2, transition: { duration: 0.15, ease: [0.22, 1, 0.36, 1] } }}
              className="relative overflow-hidden rounded-xl border px-4 py-3 backdrop-blur-xl"
              style={{
                borderColor:
                  status === "high"
                    ? "rgba(248,113,113,0.3)"
                    : status === "watch"
                      ? "rgba(251,146,60,0.3)"
                      : "rgba(74,222,128,0.18)",
                background:
                  status === "high"
                    ? "rgba(248,113,113,0.06)"
                    : status === "watch"
                      ? "rgba(251,146,60,0.06)"
                      : "rgba(74,222,128,0.04)",
              }}
            >
              <div className="rs-kpi-label">{label}</div>
              <div className="mt-2 inline-flex items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    status === "watch"
                      ? "animate-pulse bg-orange-400"
                      : status === "high"
                        ? "bg-red-400"
                        : "bg-emerald-400"
                  }`}
                />
                <span className={`${ruleStatusPill(status)} rounded-full border px-2 py-0.5 text-xs font-mono font-semibold`}>
                  {value}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <DashboardAlertsSection
        title="Risk alerts"
        subtitle="Mock preview — same layout as the live dashboard"
        items={MOCK_ALERTS.map((a) => ({
          id: a.id,
          message: a.message,
          severity: a.severity,
          solution: a.solution,
          alert_date: a.alert_date,
          read: a.read,
        }))}
        loading={false}
        viewAllHref="/mock/risk-manager"
        viewAllLabel="Open rules & alerts (mock)"
      />

      <section className="grid gap-4 md:grid-cols-3 sm:gap-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -3, transition: { duration: 0.15 } }}
          className="relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl"
          style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.09) 0%, rgba(255,255,255,0.01) 100%)",
            borderColor: "rgba(99,102,241,0.22)",
            boxShadow: "0 0 32px -8px rgba(99,102,241,0.14), 0 8px 32px -8px rgba(0,0,0,0.5)",
          }}
        >
          <div
            className="pointer-events-none absolute -top-8 -right-4 h-20 w-20 rounded-full opacity-25 blur-2xl"
            style={{ background: "#6366f1" }}
          />
          <div className="rs-kpi-label">Balance</div>
          <div className="mt-1 font-display text-2xl font-bold text-white">
            <AnimatedNumber value={stats.balancePct} suffix="%" />
          </div>
          <div
            className={`mt-1 font-mono text-sm font-semibold ${
              (stats.balancePct ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {stats.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -3, transition: { duration: 0.15 } }}
          className="relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl"
          style={{
            background: "linear-gradient(135deg, rgba(56,189,248,0.08) 0%, rgba(255,255,255,0.01) 100%)",
            borderColor: "rgba(56,189,248,0.2)",
            boxShadow: "0 0 32px -8px rgba(56,189,248,0.12), 0 8px 32px -8px rgba(0,0,0,0.5)",
          }}
        >
          <div
            className="pointer-events-none absolute -top-8 -right-4 h-20 w-20 rounded-full opacity-20 blur-2xl"
            style={{ background: "#38bdf8" }}
          />
          <div className="rs-kpi-label">Equity</div>
          <div className="mt-1 font-display text-2xl font-bold text-white">
            <AnimatedNumber value={stats.equityPct} suffix="%" />
          </div>
          <div
            className={`mt-1 font-mono text-sm font-semibold ${
              (stats.equityPct ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {stats.equity.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -3, transition: { duration: 0.15 } }}
          className="relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl"
          style={{
            background: "linear-gradient(135deg, rgba(74,222,128,0.07) 0%, rgba(255,255,255,0.01) 100%)",
            borderColor: "rgba(74,222,128,0.18)",
            boxShadow: "0 0 32px -8px rgba(74,222,128,0.1), 0 8px 32px -8px rgba(0,0,0,0.5)",
          }}
        >
          <div
            className="pointer-events-none absolute -top-8 -right-4 h-20 w-20 rounded-full opacity-15 blur-2xl"
            style={{ background: "#4ade80" }}
          />
          <div className="flex items-center justify-between">
            <span className="rs-kpi-label">Win rate & avg R:R</span>
            <button
              type="button"
              onClick={() => setRrTableOpen(true)}
              className="rounded-full p-1 text-slate-500 transition-colors hover:bg-slate-700/50 hover:text-[#6366f1]"
              aria-label="Info"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
          <div className="mt-1 flex items-start justify-between gap-3">
            <div>
              <div className="font-display text-2xl font-bold text-white">
                <AnimatedNumber value={stats.winRate} decimals={1} suffix="%" />
              </div>
              {winRateTrend != null && (
                <p className="mt-0.5 font-mono text-xs text-slate-400">
                  {winRateTrend.diff >= 0 ? (
                    <span className="text-emerald-400">↑ +{winRateTrend.diff.toFixed(1)}%</span>
                  ) : (
                    <span className="text-red-400">↓ {winRateTrend.diff.toFixed(1)}%</span>
                  )}{" "}
                  vs last week
                </p>
              )}
              <div className="mt-2 border-t border-slate-700/50 pt-2">
                <span className="font-mono text-xs text-slate-500">Avg R:R </span>
                <span className="font-display text-lg font-bold text-white">
                  <AnimatedNumber value={stats.avgRiskReward} />
                </span>
              </div>
            </div>
            <WinsLossesGauge wins={stats.winsCount} losses={stats.lossesCount} draws={stats.drawsCount} />
          </div>
        </motion.div>
        <RiskRewardTableModal open={rrTableOpen} onClose={() => setRrTableOpen(false)} />
      </section>

      <section className="grid gap-4 md:grid-cols-3 sm:gap-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -3, transition: { duration: 0.15 } }}
          className="relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl"
          style={{
            background: "linear-gradient(135deg, rgba(74,222,128,0.07) 0%, rgba(255,255,255,0.01) 100%)",
            borderColor: "rgba(74,222,128,0.18)",
            boxShadow: "0 0 32px -8px rgba(74,222,128,0.1), 0 8px 32px -8px rgba(0,0,0,0.5)",
          }}
        >
          <div
            className="pointer-events-none absolute -top-8 -right-4 h-20 w-20 rounded-full opacity-15 blur-2xl"
            style={{ background: "#4ade80" }}
          />
          <div className="rs-kpi-label">Avg win</div>
          <div className="mt-1 font-display text-2xl font-bold text-emerald-400">
            <AnimatedNumber value={stats.avgWin} suffix={` ${currency}`} />
          </div>
          <div className="mt-1 font-mono text-xs text-slate-500">{stats.avgWinPct.toFixed(2)}%</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -3, transition: { duration: 0.15 } }}
          className="relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl"
          style={{
            background: "linear-gradient(135deg, rgba(248,113,113,0.07) 0%, rgba(255,255,255,0.01) 100%)",
            borderColor: "rgba(248,113,113,0.2)",
            boxShadow: "0 0 32px -8px rgba(248,113,113,0.1), 0 8px 32px -8px rgba(0,0,0,0.5)",
          }}
        >
          <div
            className="pointer-events-none absolute -top-8 -right-4 h-20 w-20 rounded-full opacity-15 blur-2xl"
            style={{ background: "#f87171" }}
          />
          <div className="rs-kpi-label">Avg loss</div>
          <div className="mt-1 font-display text-2xl font-bold text-red-400">
            <AnimatedNumber value={stats.avgLoss} suffix={` ${currency}`} forceNegative />
          </div>
          <div className="mt-1 font-mono text-xs text-slate-500">{stats.avgLossPct.toFixed(2)}%</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -3, transition: { duration: 0.15 } }}
          className="relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl"
          style={{
            background: "linear-gradient(135deg, rgba(248,113,113,0.07) 0%, rgba(255,255,255,0.01) 100%)",
            borderColor: "rgba(248,113,113,0.2)",
            boxShadow: "0 0 32px -8px rgba(248,113,113,0.1), 0 8px 32px -8px rgba(0,0,0,0.5)",
          }}
        >
          <div
            className="pointer-events-none absolute -top-8 -right-4 h-20 w-20 rounded-full opacity-15 blur-2xl"
            style={{ background: "#f87171" }}
          />
          <div className="rs-kpi-label">Max drawdown</div>
          <div className="mt-1 font-display text-2xl font-bold text-red-400">
            <AnimatedNumber value={-(Math.abs(stats.highestDdPct ?? 0))} suffix="%" />
          </div>
          <div className="mt-1 font-mono text-xs text-slate-500">
            {new Date(stats.peakDdDate).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </div>
        </motion.div>
      </section>

      <DdExposureCard
        dailyDdPct={stats.dailyDdPct}
        dailyLimitPct={riskRules.daily_loss_pct}
        exposurePct={stats.currentExposurePct}
        exposureLimitPct={riskRules.max_exposure_pct}
        isMock
      />

      <section
        className="relative w-full overflow-hidden rounded-2xl border p-5 backdrop-blur-xl sm:p-6"
        style={{
          background: "linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(255,255,255,0.01) 100%)",
          borderColor: "rgba(99,102,241,0.15)",
          boxShadow: "0 8px 32px -8px rgba(0,0,0,0.5)",
        }}
      >
        <div
          className="pointer-events-none absolute -top-16 right-16 h-32 w-48 rounded-full opacity-[0.07] blur-3xl"
          style={{ background: "#6366f1" }}
        />
        <div className="mb-1 flex items-center gap-2">
          <span className="h-1 w-4 rounded-full" style={{ background: "linear-gradient(90deg, #6366f1, #a78bfa)" }} />
          <span className="text-sm font-mono font-semibold uppercase tracking-[0.1em] text-slate-300">Equity growth</span>
        </div>
        <p className="mb-4 mt-1 pl-6 text-xs font-mono text-slate-600 leading-relaxed">
          % from start · balance in {currency} · drag brush to zoom
        </p>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={curve.map((p) => ({
                ...p,
                displayDate: new Date(p.date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "2-digit",
                }),
              }))}
              margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
            >
              <defs>
                <linearGradient id="mockEquityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="displayDate"
                tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "var(--font-mono)" }}
                axisLine={{ stroke: "#475569" }}
              />
              <YAxis
                tickFormatter={(v: number) => `${v}%`}
                tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "var(--font-mono)" }}
                axisLine={{ stroke: "#475569" }}
              />
              <Tooltip
                cursor={{ stroke: "#a78bfa", strokeOpacity: 0.5 }}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload[0]?.payload) return null;
                  const row = payload[0].payload as { displayDate: string; pctFromStart: number; value: number };
                  return (
                    <div className="rounded-lg border border-[#1e1e1e] bg-[#111] px-3 py-2 shadow-[0_0_18px_rgba(99,102,241,0.15)]">
                      <p className="text-[11px] font-mono text-slate-400">{row.displayDate}</p>
                      <p className="text-sm font-semibold text-slate-100 font-mono">
                        {row.pctFromStart.toFixed(2)}% · {row.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
                        {currency}
                      </p>
                    </div>
                  );
                }}
              />
              <ReferenceLine y={-riskRules.daily_loss_pct} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5} />
              <Area
                type="monotone"
                dataKey="pctFromStart"
                stroke="#6366f1"
                strokeWidth={2.5}
                fill="url(#mockEquityGrad)"
                isAnimationActive
                animationDuration={900}
                animationEasing="ease-out"
              />
              <Brush dataKey="displayDate" height={24} stroke="#475569" fill="#1e293b" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section
        className="relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl sm:p-6"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
          borderColor: "rgba(99,102,241,0.15)",
          boxShadow: "0 8px 32px -8px rgba(0,0,0,0.5)",
        }}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-1 w-4 rounded-full" style={{ background: "linear-gradient(90deg, #6366f1, #a78bfa)" }} />
              <span className="text-sm font-mono font-semibold uppercase tracking-[0.1em] text-slate-300 capitalize">
                {monthLabel}
              </span>
            </div>
            <div className="mt-1 pl-6 text-xs font-mono text-slate-600">Tap a day to open trades (mock)</div>
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1))}
              className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-xs font-mono text-slate-400 transition-all hover:border-indigo-500/30 hover:text-slate-200"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1))}
              className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-xs font-mono text-slate-400 transition-all hover:border-indigo-500/30 hover:text-slate-200"
            >
              →
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-1 text-[10px] font-mono font-medium text-slate-500">
              {d}
            </div>
          ))}
          {Array.from({ length: startWeekday }, (_, i) => (
            <div key={`pad-${i}`} className="min-h-[64px]" />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayData = dailyByDate.get(dateStr);
            const isFuture = new Date(year, month, day) > now;
            const pct =
              dayData && stats.initialBalance ? (dayData.profit / stats.initialBalance) * 100 : null;
            const winPct = dayData && dayData.trades > 0 ? (dayData.wins / dayData.trades) * 100 : null;
            const cellClass = `min-h-[64px] rounded-lg border flex flex-col items-center justify-center p-1 ${
              isFuture
                ? "border-slate-800/50 bg-slate-900/30 text-slate-600"
                : dayData
                  ? pct != null && pct >= 0
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : "border-red-500/30 bg-red-500/10"
                  : "border-slate-700/50 bg-slate-800/30 text-slate-500"
            }`;
            const content = (
              <>
                <span className="text-xs font-medium text-slate-300">{day}</span>
                {dayData && (
                  <>
                    <span
                      className={`text-xs font-semibold ${pct != null && pct >= 0 ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {pct != null ? `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%` : "—"}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {dayData.trades} trade{dayData.trades !== 1 ? "s" : ""}
                      {winPct != null ? ` · ${winPct.toFixed(0)}% win` : ""}
                    </span>
                  </>
                )}
              </>
            );
            return dayData ? (
              <Link
                key={dateStr}
                href={`/mock/journaling?date=${dateStr}`}
                className={`${cellClass} transition-colors hover:ring-2 hover:ring-[#6366f1]/50`}
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
        <div className="mb-3 flex items-center gap-2">
          <span className="h-1 w-4 rounded-full" style={{ background: "linear-gradient(90deg, #6366f1, #a78bfa)" }} />
          <h2 className="text-sm font-mono font-semibold uppercase tracking-[0.1em] text-slate-400">Quick actions</h2>
        </div>
        <MockQuickActions />
      </section>
    </div>
  );
}
