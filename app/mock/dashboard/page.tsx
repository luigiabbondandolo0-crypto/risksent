"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  MOCK_CURRENCY,
  MOCK_DASHBOARD_STATS,
  MOCK_RULES,
  MOCK_ALERTS,
} from "@/lib/mock/siteMockData";

const curve = MOCK_DASHBOARD_STATS.equityCurve;

export default function MockDashboardPage() {
  const s = MOCK_DASHBOARD_STATS;
  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in">
      <header>
        <h1 className="rs-page-title">Dashboard</h1>
        <p className="rs-page-sub">Dati dimostrativi — stessi blocchi della dashboard reale.</p>
      </header>

      <section className="rs-card p-5 sm:p-6 shadow-rs-soft">
        <h2 className="text-base font-semibold text-slate-100">Regole attive (mock)</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {(
            [
              ["Daily loss", `${MOCK_RULES.daily_loss_pct}%`],
              ["Risk / trade", `${MOCK_RULES.max_risk_per_trade_pct}%`],
              ["Exposure", `${MOCK_RULES.max_exposure_pct}%`],
              ["Revenge", String(MOCK_RULES.revenge_threshold_trades)],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="rounded-xl border border-slate-700/50 bg-slate-950/40 px-4 py-3">
              <div className="rs-kpi-label">{k}</div>
              <div className="mt-1 text-lg font-semibold tabular-nums text-white">{v}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rs-card p-5 sm:p-6 shadow-rs-soft">
        <h2 className="text-base font-semibold text-slate-100">Equity (mock)</h2>
        <p className="mt-1 text-xs text-slate-500">% dall&apos;inizio — esempio statico.</p>
        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={curve.map((p) => ({
                ...p,
                displayDate: new Date(p.date).toLocaleDateString("it-IT", {
                  day: "numeric",
                  month: "short",
                }),
              }))}
              margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
            >
              <defs>
                <linearGradient id="mockEquityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="displayDate" tick={{ fill: "#94a3b8", fontSize: 10 }} stroke="#475569" />
              <YAxis
                tickFormatter={(v: number) => `${v}%`}
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                stroke="#475569"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`${Number(value).toFixed(2)}%`, "Crescita"]}
              />
              <Area
                type="monotone"
                dataKey="pctFromStart"
                stroke="#a78bfa"
                strokeWidth={2}
                fill="url(#mockEquityGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rs-card p-5 shadow-rs-soft">
          <div className="rs-kpi-label">Balance</div>
          <p className="mt-1 text-xl font-semibold text-white">
            {s.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} {MOCK_CURRENCY}
          </p>
          <p className="mt-1 text-sm text-emerald-400">+{s.balancePct?.toFixed(2)}%</p>
        </div>
        <div className="rs-card p-5 shadow-rs-soft">
          <div className="rs-kpi-label">Equity</div>
          <p className="mt-1 text-xl font-semibold text-cyan-300">
            {s.equity.toLocaleString(undefined, { minimumFractionDigits: 2 })} {MOCK_CURRENCY}
          </p>
          <p className="mt-1 text-sm text-emerald-400">+{s.equityPct?.toFixed(2)}%</p>
        </div>
        <div className="rs-card p-5 shadow-rs-soft">
          <div className="rs-kpi-label">Win rate</div>
          <p className="mt-1 text-2xl font-bold text-white">{s.winRate.toFixed(1)}%</p>
        </div>
        <div className="rs-card p-5 shadow-rs-soft">
          <div className="rs-kpi-label">Max drawdown</div>
          <p className="mt-1 text-xl font-semibold text-red-400">-{s.highestDdPct?.toFixed(2)}%</p>
        </div>
      </section>

      <section className="rs-card p-5 sm:p-6 shadow-rs-soft">
        <h2 className="text-base font-semibold text-slate-100">Alert (mock)</h2>
        <ul className="mt-4 space-y-3">
          {MOCK_ALERTS.map((a) => (
            <li
              key={a.id}
              className={`rounded-xl border p-3.5 ${
                a.severity === "high"
                  ? "border-red-500/35 bg-red-500/10"
                  : "border-amber-500/35 bg-amber-500/10"
              }`}
            >
              <p className="text-sm font-medium text-slate-200">{a.message}</p>
              <p className="mt-1 text-xs text-slate-400">
                Suggerimento: <span className="text-cyan-300">{a.solution}</span>
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
