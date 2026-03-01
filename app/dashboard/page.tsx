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
import { DdExposureGauge } from "./components/DdExposureGauge";
import { AlertsOverview } from "./components/AlertsOverview";
import { QuickActions } from "./components/QuickActions";
import { RulesEditPopup, type RiskRules } from "./components/RulesEditPopup";

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
  dailyDdPct?: number | null;
  currentExposurePct?: number | null;
  avgRiskReward: number | null;
  balancePct: number | null;
  equityPct: number | null;
  equityCurve: { date: string; value: number; pctFromStart: number }[];
  dailyStats: { date: string; profit: number; trades: number; wins: number }[];
  initialBalance?: number;
  updatedAt?: string;
  error?: string;
};

type DayStat = { date: string; profit: number; trades: number; wins: number };


const POLL_MS = 45_000;
const CHECK_RISK_THROTTLE_MS = 1 * 60 * 1000; // 1 min — live-ish when dashboard open; cron runs every 2 min for all accounts

function PctLabel({ value }: { value: number | null }) {
  if (value == null) return null;
  const isPos = value >= 0;
  return (
    <span className={isPos ? "text-emerald-400" : "text-red-400"}>
      {isPos ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
}

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [riskRules, setRiskRules] = useState<RiskRules | null>(null);
  const [rulesPopupOpen, setRulesPopupOpen] = useState(false);
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
        console.log("[Dashboard] Fetching /api/accounts...");
        const accRes = await fetch("/api/accounts");
        const body = await accRes.json().catch(() => ({}));
        console.log("[Dashboard] /api/accounts response:", { status: accRes.status, ok: accRes.ok, body });
        if (!accRes.ok) {
          console.error("[Dashboard] /api/accounts failed:", accRes.status, body);
          setError(body?.error ?? "Failed to load accounts");
          return;
        }
        const list = body.accounts ?? [];
        setAccounts(list);
        const first = list?.[0];
        if (first?.metaapi_account_id) setSelectedUuid(first.metaapi_account_id);
        else setSelectedUuid("");
      } catch (e) {
        console.error("[Dashboard] /api/accounts exception:", e);
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

  // Calendar: current month and traded days
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startWeekday = firstDay.getDay();
  const dailyByDate = new Map<string, DayStat>(dailyStats.map((d) => [d.date, d]));

  const monthLabel = firstDay.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric"
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-50">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Balance, equity, win rate and drawdown in real time from MetatraderApi.
            {stats?.updatedAt && (
              <span className="ml-1">
                Last update: {new Date(stats.updatedAt).toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <select
          className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-500"
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
      </header>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <section className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/80 to-slate-900/80 px-4 py-3">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Active risk rules</span>
        {riskRules ? (
          <>
            <span className="text-slate-500">·</span>
            <span className="text-xs text-slate-300">
              Daily loss: {riskRules.daily_loss_pct}% · Risk/trade: {riskRules.max_risk_per_trade_pct}% · Exposure: {riskRules.max_exposure_pct}% · Revenge: {riskRules.revenge_threshold_trades}
            </span>
            <button
              type="button"
              onClick={() => setRulesPopupOpen(true)}
              className="ml-auto text-xs font-medium text-cyan-400 hover:text-cyan-300"
            >
              Edit
            </button>
          </>
        ) : (
          <Link
            href="/rules"
            className="inline-flex items-center rounded-lg bg-cyan-500/20 px-3 py-1.5 text-xs font-medium text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30"
          >
            Set rules
          </Link>
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

      {/* Daily DD & Current Exposure gauges */}
      {riskRules && (
        <section className="grid gap-4 sm:grid-cols-2">
          <DdExposureGauge
            label="Daily DD"
            valuePct={stats?.dailyDdPct ?? null}
            limitPct={riskRules.daily_loss_pct}
            valueLabel="Oggi"
          />
          <DdExposureGauge
            label="Current Exposure %"
            valuePct={stats?.currentExposurePct ?? null}
            limitPct={riskRules.max_exposure_pct}
            valueLabel="Posizioni aperte"
          />
        </section>
      )}

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-5">
          <div className="text-xs text-slate-400 uppercase tracking-wide">Balance</div>
          <div className="mt-1 text-2xl font-bold text-white">
            {stats == null
              ? "—"
              : stats.error
                ? "—"
                : `${stats.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency}`}
          </div>
          {stats && !stats.error && stats.balancePct != null && (
            <div className="mt-1 text-sm">
              <PctLabel value={stats.balancePct} />
            </div>
          )}
        </div>
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-5">
          <div className="text-xs text-slate-400 uppercase tracking-wide">Equity</div>
          <div className="mt-1 text-2xl font-bold text-cyan-400">
            {stats == null
              ? "—"
              : stats.error
                ? "—"
                : `${stats.equity.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency}`}
          </div>
          {stats && !stats.error && stats.equityPct != null && (
            <div className="mt-1 text-sm">
              <PctLabel value={stats.equityPct} />
            </div>
          )}
        </div>
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-5">
          <div className="text-xs text-slate-400 uppercase tracking-wide">Win rate</div>
          <div className="mt-1 text-2xl font-bold text-white">
            {stats == null ? "—" : stats.winRate != null ? `${stats.winRate.toFixed(1)}%` : "—"}
          </div>
          {winRateTrend != null && (
            <p className="mt-1 text-xs text-slate-400">
              {winRateTrend.diff >= 0 ? (
                <span className="text-emerald-400">↑ +{winRateTrend.diff.toFixed(1)}% vs sett. scorsa</span>
              ) : (
                <span className="text-red-400">↓ {winRateTrend.diff.toFixed(1)}% vs sett. scorsa</span>
              )}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-5">
          <div className="text-xs text-slate-400 uppercase tracking-wide">Avg risk/reward</div>
          <div className="mt-1 text-2xl font-bold text-white">
            {stats == null ? "—" : stats.avgRiskReward != null ? stats.avgRiskReward.toFixed(2) : "—"}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Avg win / avg loss</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-5">
          <div className="text-xs text-slate-400 uppercase tracking-wide">Current Max DD</div>
          <div className={`mt-1 text-2xl font-bold ${stats?.maxDd != null && riskRules && Math.abs(stats.maxDd) >= riskRules.daily_loss_pct * 0.8 ? "text-red-400" : "text-slate-200"}`}>
            {stats == null ? "—" : stats.maxDd != null ? `${stats.maxDd.toFixed(2)}%` : "—"}
          </div>
          {stats?.peakDdDate && (
            <p className="mt-1 text-[11px] text-slate-500">Picco: {new Date(stats.peakDdDate).toLocaleDateString("it-IT")}</p>
          )}
          {riskRules && (
            <p className="mt-0.5 text-xs text-slate-400">Vs tuo limite {riskRules.daily_loss_pct}%</p>
          )}
        </div>
      </section>

      <section className="w-full rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-5">
        <div className="text-xs text-slate-400 uppercase tracking-wide mb-4">
          Equity growth — valore assoluto e % da inizio (zoom/pan con la barra sotto)
        </div>
        {stats?.error && <p className="text-sm text-amber-400">{stats.error}</p>}
        {curve.length === 0 && !stats?.error && (
          <div className="h-72 flex items-center justify-center text-slate-500 text-sm">
            {stats == null ? "Loading…" : "No data. Link an account and trade to see the curve."}
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
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
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
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px"
                  }}
                  labelStyle={{ color: "#e2e8f0" }}
                  formatter={(value: number, _name: string, props: { payload?: { value?: number; pctFromStart?: number } }) => [
                    `${Number(value).toFixed(2)}% · ${(props.payload?.value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency}`,
                    "Growth"
                  ]}
                  labelFormatter={(_: string, payload: { payload?: { displayDate?: string } }[]) =>
                    payload?.[0]?.payload?.displayDate ?? ""
                  }
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
                  stroke="#22d3ee"
                  strokeWidth={2}
                  fill="url(#equityGrad)"
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

      <AlertsOverview
        winRate={stats?.winRate ?? null}
        highestDdPct={stats?.highestDdPct ?? null}
      />

      <section>
        <h2 className="text-sm font-semibold text-slate-200 mb-3">Quick Actions</h2>
        <QuickActions onSyncTrades={handleSyncTrades} syncing={syncing} />
      </section>

      <section className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-5">
        <div className="text-xs text-slate-400 uppercase tracking-wide mb-3">
          {monthLabel} — Traded days
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-[10px] text-slate-500 font-medium py-1">
              {d}
            </div>
          ))}
          {Array.from({ length: startWeekday }, (_: number, i: number) => (
            <div key={`pad-${i}`} className="min-h-[64px]" />
          ))}
          {Array.from({ length: daysInMonth }, (_: number, i: number) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayData: DayStat | undefined = dailyByDate.get(dateStr);
            const isFuture = new Date(year, month, day) > now;
            const pct =
              dayData && stats?.initialBalance
                ? (dayData.profit / stats.initialBalance) * 100
                : null;
            const winPct =
              dayData && dayData.trades > 0
                ? (dayData.wins / dayData.trades) * 100
                : null;
            return (
              <div
                key={dateStr}
                className={`min-h-[64px] rounded-lg border flex flex-col items-center justify-center p-1 ${
                  isFuture
                    ? "border-slate-800/50 bg-slate-900/30 text-slate-600"
                    : dayData
                      ? pct != null && pct >= 0
                        ? "border-emerald-500/30 bg-emerald-500/10"
                        : "border-red-500/30 bg-red-500/10"
                      : "border-slate-700/50 bg-slate-800/30 text-slate-500"
                }`}
              >
                <span className="text-xs font-medium text-slate-300">{day}</span>
                {dayData && (
                  <>
                    <span
                      className={`text-xs font-semibold ${
                        pct != null && pct >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {pct != null ? `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%` : "—"}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {dayData.trades} trade{dayData.trades !== 1 ? "s" : ""}
                      {winPct != null ? ` · ${winPct.toFixed(0)}% win` : ""}
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
