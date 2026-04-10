"use client";

import { useState } from "react";
import { Info, Play, BarChart3, Lightbulb } from "lucide-react";

export default function MockSimulatorPage() {
  const [showInfo, setShowInfo] = useState(false);
  const [strategyName, setStrategyName] = useState("NY Reversal v1");
  const [sessionName, setSessionName] = useState("April Gold Replay");
  const [timeframe, setTimeframe] = useState("M5");
  const [sessionPreset, setSessionPreset] = useState<"manual" | "london" | "newyork">("newyork");

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="rs-card p-5 shadow-rs-soft sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="rs-page-title">Backtesting</h1>
            <p className="rs-page-sub mt-1">
              Clean mock backtesting page: strategy/session setup, historical replay, analytics, and improvement advice.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowInfo((v) => !v)}
            className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-800/50 hover:text-cyan-400"
            aria-label="Info"
          >
            <Info className="h-5 w-5" />
          </button>
        </div>
        {showInfo && (
          <div className="mt-4 rounded-lg border border-slate-700 bg-slate-800/70 p-4 text-sm text-slate-300">
            It mirrors an FXReplay-style flow: create your strategy, define your replay session, backtest in historical context, and review analytics.
          </div>
        )}
      </header>

      <section className="rounded-xl border border-slate-800 bg-surface p-5">
        <h2 className="text-sm font-medium text-slate-200 mb-1">Strategy & session setup (mock)</h2>
        <p className="text-xs text-slate-500 mb-4">Create your strategy profile and configure replay session settings.</p>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-700/80 bg-slate-900/40 p-4 space-y-3">
            <label className="block text-xs text-slate-400">
              Strategy name
              <input
                value={strategyName}
                onChange={(e) => setStrategyName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
              />
            </label>
            <label className="block text-xs text-slate-400">
              Timeframe
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
              >
                {["M1", "M5", "M15", "H1", "H4"].map((tf) => (
                  <option key={tf} value={tf}>
                    {tf}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="rounded-lg border border-slate-700/80 bg-slate-900/40 p-4 space-y-3">
            <label className="block text-xs text-slate-400">
              Session name
              <input
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {([
                ["manual", "Manual"],
                ["london", "London"],
                ["newyork", "New York"],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSessionPreset(id)}
                  className={`rounded-lg px-3 py-1.5 text-xs ${
                    sessionPreset === id
                      ? "border border-cyan-500/40 bg-cyan-500/15 text-cyan-300"
                      : "border border-slate-700 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {label} session
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-surface p-5">
        <h2 className="flex items-center gap-2 text-sm font-medium text-slate-200 mb-1">
          <Play className="h-4 w-4 text-cyan-400" />
          Historical replay backtest (mock)
        </h2>
        <p className="text-xs text-slate-500">Replay old market data candle-by-candle and test if your strategy really has edge.</p>
      </section>

      <section className="rounded-xl border border-slate-800 bg-surface p-5">
        <h2 className="flex items-center gap-2 text-sm font-medium text-slate-200 mb-1">
          <BarChart3 className="h-4 w-4 text-cyan-400" />
          Session analytics (mock)
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mt-4">
          <div className="rounded-lg bg-slate-800/40 p-3"><p className="text-xs text-slate-500">Trades tested</p><p className="text-xl text-cyan-300 mt-1">76</p></div>
          <div className="rounded-lg bg-slate-800/40 p-3"><p className="text-xs text-slate-500">Win rate</p><p className="text-xl text-emerald-400 mt-1">58.4%</p></div>
          <div className="rounded-lg bg-slate-800/40 p-3"><p className="text-xs text-slate-500">Avg R multiple</p><p className="text-xl text-cyan-300 mt-1">1.43R</p></div>
          <div className="rounded-lg bg-slate-800/40 p-3"><p className="text-xs text-slate-500">Max drawdown</p><p className="text-xl text-red-400 mt-1">4.80%</p></div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-surface p-5">
        <h2 className="flex items-center gap-2 text-sm font-medium text-slate-200 mb-1">
          <Lightbulb className="h-4 w-4 text-cyan-400" />
          Strategy improvement advice (mock)
        </h2>
        <div className="grid gap-3 md:grid-cols-3 mt-4">
          <div className="rounded-lg border border-slate-700/80 bg-slate-900/40 p-3 text-xs text-slate-300">Cut risk by 20% after two losses in a row.</div>
          <div className="rounded-lg border border-slate-700/80 bg-slate-900/40 p-3 text-xs text-slate-300">Keep only session windows with positive expectancy.</div>
          <div className="rounded-lg border border-slate-700/80 bg-slate-900/40 p-3 text-xs text-slate-300">Remove B/C-grade setups and keep only A+ execution patterns.</div>
        </div>
      </section>
    </div>
  );
}
