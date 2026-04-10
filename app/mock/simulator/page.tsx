"use client";

import { useMemo, useState } from "react";
import { Info, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ProgressBar } from "@/app/simulator/components/ProgressBar";

const FTMO_PHASE1 = { profit_target_pct: 10, daily_loss_limit_pct: 5, max_loss_pct: 10 };
const FTMO_PHASE2 = { profit_target_pct: 5, daily_loss_limit_pct: 5, max_loss_pct: 10 };

/** Static stats mirroring SimulatorView shape */
const MOCK_STATS = {
  profit_pct: 6.2,
  worst_daily_pct: -2.1,
  max_drawdown_pct: 4.8,
  trading_days: 18,
};

export default function MockSimulatorPage() {
  const [rulesTab, setRulesTab] = useState<"ftmo2" | "ftmo1" | "simplified">("ftmo2");
  const [showInfo, setShowInfo] = useState(false);
  const [whatIfBias, setWhatIfBias] = useState(42);
  const stats = MOCK_STATS;

  const projectionCurve = useMemo(() => {
    const days = 30;
    const startPct = stats.profit_pct;
    const dailyDrift = (whatIfBias / 100) * 0.35;
    const out: { day: number; equity: number }[] = [];
    for (let d = 0; d <= days; d++) {
      const wave = Math.sin(d / 4.2) * 0.35;
      const pct = startPct + dailyDrift * d + wave;
      const eq = 100 * (1 + pct / 100);
      out.push({
        day: d,
        equity: Math.round(eq * 100) / 100,
      });
    }
    return out;
  }, [stats.profit_pct, whatIfBias]);

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="rs-card p-5 shadow-rs-soft sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <div>
              <h1 className="rs-page-title">Backtesting</h1>
              <p className="rs-page-sub mt-1">
                Full mock for the backtesting workspace (FX Replay style): replay, scenario controls and projected curve.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowInfo((v) => !v)}
              className="shrink-0 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-800/50 hover:text-cyan-400"
              aria-label="Info"
            >
              <Info className="h-5 w-5" />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select className="rs-input max-w-xs min-w-[200px]" disabled value="mock">
              <option>500123 · FTMO Demo (mock)</option>
            </select>
            <span className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-500">
              Refresh (mock)
            </span>
          </div>
        </div>

        {showInfo && (
          <div className="mt-4 space-y-2 rounded-lg border border-slate-700 bg-slate-800/70 p-4 text-sm text-slate-300">
            <p className="font-medium text-slate-200">What does this page do?</p>
            <p>
              This page simulates your progress against FTMO and Simplified challenge rules. In the live app, values come
              from your closed trades.
            </p>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {(
            [
              ["FTMO 2-Step P1", "62%"],
              ["FTMO 2-Step P2", "58%"],
              ["FTMO 1-Step", "55%"],
              ["Simplified P1", "60%"],
              ["Simplified P2", "52%"],
              ["Status", "On track"],
            ] as const
          ).map(([label, val]) => (
            <div key={label} className="rounded-lg bg-slate-800/50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-cyan-300">{val}</p>
            </div>
          ))}
        </div>
      </header>

      <div className="rounded-xl border border-slate-800 bg-surface p-5">
        <div className="mb-4 flex flex-wrap gap-2">
          {(
            [
              ["ftmo2", "FTMO 2-STEP"],
              ["ftmo1", "FTMO 1-STEP"],
              ["simplified", "Simplified"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setRulesTab(id)}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                rulesTab === id ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {rulesTab === "ftmo2" && (
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-medium text-slate-300">Phase 1</h3>
              <div className="space-y-3">
                <ProgressBar label="Profit target" value={stats.profit_pct} limit={FTMO_PHASE1.profit_target_pct} variant="profit" />
                <ProgressBar
                  label="Daily DD"
                  value={stats.worst_daily_pct}
                  limit={-FTMO_PHASE1.daily_loss_limit_pct}
                  variant="loss"
                  valueLabel={`${stats.worst_daily_pct.toFixed(2)}%`}
                  limitLabel={`${FTMO_PHASE1.daily_loss_limit_pct}%`}
                />
                <ProgressBar
                  label="Max DD"
                  value={stats.max_drawdown_pct}
                  limit={FTMO_PHASE1.max_loss_pct}
                  variant="loss"
                  valueLabel={`${stats.max_drawdown_pct.toFixed(2)}%`}
                  limitLabel={`${FTMO_PHASE1.max_loss_pct}%`}
                />
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-medium text-slate-300">Phase 2</h3>
              <div className="space-y-3">
                <ProgressBar label="Profit target" value={stats.profit_pct} limit={FTMO_PHASE2.profit_target_pct} variant="profit" />
                <ProgressBar
                  label="Daily DD"
                  value={stats.worst_daily_pct}
                  limit={-FTMO_PHASE2.daily_loss_limit_pct}
                  variant="loss"
                  valueLabel={`${stats.worst_daily_pct.toFixed(2)}%`}
                  limitLabel={`${FTMO_PHASE2.daily_loss_limit_pct}%`}
                />
                <ProgressBar
                  label="Max DD"
                  value={stats.max_drawdown_pct}
                  limit={FTMO_PHASE2.max_loss_pct}
                  variant="loss"
                  valueLabel={`${stats.max_drawdown_pct.toFixed(2)}%`}
                  limitLabel={`${FTMO_PHASE2.max_loss_pct}%`}
                />
              </div>
            </div>
          </div>
        )}

        {rulesTab === "ftmo1" && (
          <p className="text-sm text-slate-400">
            FTMO 1-Step rules (mock) — same UI as live with a dedicated tab.
          </p>
        )}
        {rulesTab === "simplified" && (
          <p className="text-sm text-slate-400">
            Simplified challenge (mock) — progress bar and limits as in production.
          </p>
        )}
      </div>

      <section className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-slate-900/95 via-slate-950 to-slate-900 p-5 shadow-xl shadow-cyan-500/5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-100">
              <TrendingUp className="h-5 w-5 text-cyan-400" />
              What-if / projection
            </h2>
            <p className="mt-1 max-w-xl text-sm text-slate-500">
              Move the slider to simulate a daily bias on percentage returns (mock). The curve updates normalized equity
              to 100 over the same horizon as live.
            </p>
          </div>
          <div className="rounded-xl border border-slate-700/80 bg-slate-950/60 px-4 py-3">
            <label className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Scenario bias</label>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                value={whatIfBias}
                onChange={(e) => setWhatIfBias(Number(e.target.value))}
                className="h-2 w-40 accent-cyan-500 sm:w-48"
              />
              <span className="tabular-nums text-sm font-semibold text-cyan-300">{whatIfBias}</span>
            </div>
          </div>
        </div>
        <div className="mt-6 h-56 w-full rounded-xl border border-slate-800/80 bg-slate-950/50 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projectionCurve} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="mockWhatIfGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.45} />
              <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={{ stroke: "#475569" }} />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                axisLine={{ stroke: "#475569" }}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "10px",
                }}
                formatter={(v: number) => [`${v.toFixed(2)} (idx 100)`, "Equity"]}
                labelFormatter={(d) => `Day ${d}`}
              />
              <Area
                type="monotone"
                dataKey="equity"
                stroke="#22d3ee"
                strokeWidth={2}
                fill="url(#mockWhatIfGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-3 text-[11px] text-slate-500">
          Live endpoint coming soon: same UI, but points will be calculated with Monte Carlo simulation on your closed trades.
        </p>
      </section>
    </div>
  );
}
