"use client";

import { useEffect, useState, useCallback } from "react";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";

type Account = {
  id: string;
  broker_type: string;
  account_number: string;
  metaapi_account_id: string | null;
  created_at: string;
};

type Stats = {
  balance: number;
  equity: number;
  currency?: string;
  winRate: number | null;
  maxDd: number | null;
  highestDdPct: number | null;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    setStats(null);
    fetchStats(selectedUuid);
    const t = setInterval(() => fetchStats(selectedUuid), POLL_MS);
    return () => clearInterval(t);
  }, [selectedUuid, fetchStats]);

  const currency = stats?.currency ?? "EUR";
  const curve = stats?.equityCurve ?? [];
  const dailyStats = stats?.dailyStats ?? [];

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
    <div className="space-y-6">
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
              {a.broker_type} • {a.account_number.slice(-4)}
            </option>
          ))}
        </select>
      </header>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-xl border border-slate-800 bg-surface p-5">
          <div className="text-xs text-slate-400 uppercase tracking-wide">Balance</div>
          <div className="mt-1 text-2xl font-semibold text-white">
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
        <div className="rounded-xl border border-slate-800 bg-surface p-5">
          <div className="text-xs text-slate-400 uppercase tracking-wide">Equity</div>
          <div className="mt-1 text-2xl font-semibold text-cyan-400">
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
        <div className="rounded-xl border border-slate-800 bg-surface p-5">
          <div className="text-xs text-slate-400 uppercase tracking-wide">Win rate</div>
          <div className="mt-1 text-2xl font-semibold text-white">
            {stats == null ? "—" : stats.winRate != null ? `${stats.winRate.toFixed(1)}%` : "—"}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">From closed trades</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-surface p-5">
          <div className="text-xs text-slate-400 uppercase tracking-wide">Max DD</div>
          <div className="mt-1 text-2xl font-semibold text-red-400">
            {stats == null ? "—" : stats.maxDd != null ? `${stats.maxDd.toFixed(2)}%` : "—"}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Current drawdown</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-surface p-5">
          <div className="text-xs text-slate-400 uppercase tracking-wide">Avg risk/reward</div>
          <div className="mt-1 text-2xl font-semibold text-white">
            {stats == null ? "—" : stats.avgRiskReward != null ? stats.avgRiskReward.toFixed(2) : "—"}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Avg win / avg loss</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-surface p-5">
          <div className="text-xs text-slate-400 uppercase tracking-wide">Highest DD</div>
          <div className="mt-1 text-2xl font-semibold text-red-400">
            {stats == null
              ? "—"
              : stats.highestDdPct != null
                ? `-${stats.highestDdPct.toFixed(2)}%`
                : "—"}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Peak drawdown registered</p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-surface p-5">
        <div className="text-xs text-slate-400 uppercase tracking-wide mb-4">
          Equity growth (% from start)
        </div>
        {stats?.error && <p className="text-sm text-amber-400">{stats.error}</p>}
        {curve.length === 0 && !stats?.error && (
          <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
            {stats == null ? "Loading…" : "No data. Link an account and trade to see the curve."}
          </div>
        )}
        {curve.length > 0 && (
          <div className="h-64 w-full">
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
                  formatter={(value: number) => [`${Number(value).toFixed(2)}%`, "Growth"]}
                  labelFormatter={(_: string, payload: { payload?: { displayDate?: string } }[]) =>
                    payload?.[0]?.payload?.displayDate ?? ""
                  }
                />
                <Area
                  type="monotone"
                  dataKey="pctFromStart"
                  stroke="#22d3ee"
                  strokeWidth={2}
                  fill="url(#equityGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-800 bg-surface p-5">
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
