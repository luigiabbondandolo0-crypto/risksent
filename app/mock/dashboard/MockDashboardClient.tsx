"use client";

import { useMemo, useState } from "react";
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

  const healthScore = 69;

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="rs-page-title">Dashboard</h1>
          <p className="rs-page-sub">
            Risk, performance, and activity — mock data. Stessa struttura della dashboard live.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Last updated{" "}
            {new Date(stats.updatedAt ?? Date.now()).toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </p>
        </div>
        <div className="w-full sm:max-w-[min(100%,20rem)] shrink-0">
          <label htmlFor="mock-dash-account" className="rs-section-title mb-2 block">
            Trading account
          </label>
          <select id="mock-dash-account" className="rs-input" value={MOCK_UUID} disabled>
            <option value={MOCK_UUID}>{MOCK_ACCOUNT_LABEL}</option>
          </select>
        </div>
      </header>

      <section className="rs-card p-5 sm:p-6 shadow-rs-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-base font-semibold tracking-tight text-slate-100">Active risk rules</h3>
          <span className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-500">Edit (mock)</span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-xl border border-slate-700/50 bg-slate-950/40 px-4 py-3">
            <div className="rs-kpi-label">Daily loss</div>
            <div className="mt-2 inline-flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${
                getRuleStatus(stats.dailyDdPct, riskRules.daily_loss_pct) === "watch"
                  ? "bg-orange-400 animate-pulse"
                  : getRuleStatus(stats.dailyDdPct, riskRules.daily_loss_pct) === "high"
                  ? "bg-red-400"
                  : "bg-emerald-400"
              }`} />
              <span className={`${ruleStatusPill(getRuleStatus(stats.dailyDdPct, riskRules.daily_loss_pct))} rounded-full border px-2 py-0.5 text-xs font-semibold rs-mono`}>
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
                getRuleStatus(stats.currentExposurePct, riskRules.max_exposure_pct) === "watch"
                  ? "bg-orange-400 animate-pulse"
                  : getRuleStatus(stats.currentExposurePct, riskRules.max_exposure_pct) === "high"
                  ? "bg-red-400"
                  : "bg-emerald-400"
              }`} />
              <span className={`${ruleStatusPill(getRuleStatus(stats.currentExposurePct, riskRules.max_exposure_pct))} rounded-full border px-2 py-0.5 text-xs font-semibold rs-mono`}>
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
        viewAllHref="/mock/rules"
        viewAllLabel="Open rules & alerts (mock)"
      />

      <section className="grid gap-4 md:grid-cols-3 sm:gap-5">
        <div className="rs-card p-5 shadow-rs-soft">
          <div className="rs-kpi-label">Balance</div>
          <div className="mt-1 text-2xl font-bold text-white rs-mono">
            {stats.balancePct != null ? `${stats.balancePct >= 0 ? "+" : ""}${stats.balancePct.toFixed(2)}%` : "—"}
          </div>
          <div className={`mt-1 text-sm font-semibold rs-mono ${
            (stats.balancePct ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"
          }`}>
            {stats.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
          </div>
        </div>
        <div className="rs-card p-5 shadow-rs-soft">
          <div className="rs-kpi-label">Equity</div>
          <div className="mt-1 text-2xl font-bold text-white rs-mono">
            {stats.equityPct != null ? `${stats.equityPct >= 0 ? "+" : ""}${stats.equityPct.toFixed(2)}%` : "—"}
          </div>
          <div className={`mt-1 text-sm font-semibold rs-mono ${
            (stats.equityPct ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"
          }`}>
            {stats.equity.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
          </div>
        </div>

        <div className="rs-card p-5 shadow-rs-soft">
          <div className="flex items-center justify-between">
            <span className="rs-kpi-label">Win rate & avg R:R</span>
            <button
              type="button"
              onClick={() => setRrTableOpen(true)}
              className="rounded-full p-1 text-slate-500 transition-colors hover:bg-slate-700/50 hover:text-cyan-400"
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
              <div className="text-2xl font-bold text-white">{stats.winRate.toFixed(1)}%</div>
              {winRateTrend != null && (
                <p className="mt-0.5 text-xs text-slate-400">
                  {winRateTrend.diff >= 0 ? (
                    <span className="text-emerald-400">↑ +{winRateTrend.diff.toFixed(1)}%</span>
                  ) : (
                    <span className="text-red-400">↓ {winRateTrend.diff.toFixed(1)}%</span>
                  )}{" "}
                  vs last week
                </p>
              )}
              <div className="mt-2 border-t border-slate-700/50 pt-2">
                <span className="text-xs text-slate-500">Avg R:R </span>
                <span className="text-lg font-bold text-white">{stats.avgRiskReward.toFixed(2)}</span>
              </div>
            </div>
            <WinsLossesGauge wins={stats.winsCount} losses={stats.lossesCount} draws={stats.drawsCount} />
          </div>
        </div>
        <RiskRewardTableModal open={rrTableOpen} onClose={() => setRrTableOpen(false)} />
      </section>

      <section className="grid gap-4 md:grid-cols-3 sm:gap-5">
        <div className="rs-card p-5 shadow-rs-soft">
          <div className="rs-kpi-label">Avg win</div>
          <div className="mt-1 text-2xl font-bold rs-mono text-emerald-400">
            +{stats.avgWin.toFixed(2)} {currency}
          </div>
          <div className="mt-1 text-xs text-slate-500 rs-mono">
            {stats.avgWinPct.toFixed(2)}%
          </div>
        </div>
        <div className="rs-card p-5 shadow-rs-soft">
          <div className="rs-kpi-label">Avg loss</div>
          <div className="mt-1 text-2xl font-bold rs-mono text-red-400">
            {stats.avgLoss.toFixed(2)} {currency}
          </div>
          <div className="mt-1 text-xs text-slate-500 rs-mono">
            {stats.avgLossPct.toFixed(2)}%
          </div>
        </div>
        <div className="rs-card p-5 shadow-rs-soft">
          <div className="rs-kpi-label">Max drawdown</div>
          <div className="mt-1 text-2xl font-bold rs-mono text-red-400">
            -{Math.abs(stats.highestDdPct ?? 0).toFixed(2)}%
          </div>
          <div className="mt-1 text-xs text-slate-500 rs-mono">
            {new Date(stats.peakDdDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </div>
        </div>
      </section>
      <section className="flex justify-center">
        <div className="rs-card w-full max-w-sm p-5 shadow-rs-soft">
          <div className="flex items-center justify-between">
            <span className="rs-kpi-label">Account health</span>
          </div>
          <div className="mt-3 inline-flex items-baseline gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-4 py-2.5">
            <span className="text-2xl font-bold text-emerald-400">{healthScore}</span>
            <span className="text-sm text-slate-500">/ 100</span>
          </div>
        </div>
      </section>

      <DdExposureCard
        dailyDdPct={stats.dailyDdPct}
        dailyLimitPct={riskRules.daily_loss_pct}
        exposurePct={stats.currentExposurePct}
        exposureLimitPct={riskRules.max_exposure_pct}
        isMock
      />

      <section className="rs-card w-full p-5 sm:p-6 shadow-rs-soft">
        <div className="mb-1 text-base font-semibold tracking-tight text-slate-100">Equity growth</div>
        <p className="mb-4 text-xs text-slate-500 leading-relaxed">
          % from start and balance in {currency}. Use the brush below the chart to zoom or pan.
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
                <linearGradient id="mockLiveEquityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff3c3c" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#ff3c3c" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="displayDate" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={{ stroke: "#475569" }} />
              <YAxis
                tickFormatter={(v: number) => `${v}%`}
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                axisLine={{ stroke: "#475569" }}
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
              <ReferenceLine
                y={-riskRules.daily_loss_pct}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
              <Area
                type="monotone"
                dataKey="pctFromStart"
                stroke="#ff3c3c"
                strokeWidth={2.5}
                fill="url(#mockLiveEquityGrad)"
                isAnimationActive
                animationDuration={900}
                animationEasing="ease-out"
              />
              <Brush dataKey="displayDate" height={24} stroke="#475569" fill="#1e293b" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rs-card p-5 sm:p-6 shadow-rs-soft">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-base font-semibold capitalize tracking-tight text-slate-100">{monthLabel}</div>
            <div className="mt-0.5 text-xs text-slate-500">Days with activity — tap a day to open trades (mock)</div>
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1))}
              className="rounded-lg border border-slate-600/80 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1))}
              className="rounded-lg border border-slate-600/80 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
            >
              →
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-1 text-[10px] font-medium text-slate-500">
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
                href={`/mock/trades?date=${dateStr}`}
                className={`${cellClass} transition-colors hover:ring-2 hover:ring-cyan-500/50`}
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
        <MockQuickActions />
      </section>
    </div>
  );
}
