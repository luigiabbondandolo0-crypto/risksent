"use client";

import { useState } from "react";
import { RefreshCw, Info, Play, BarChart3, Lightbulb } from "lucide-react";
import type { EquityPoint } from "./components/EquityCurveChart";
import type { WhatIfParams } from "./components/WhatIfSliders";

export type Account = {
  id: string;
  broker_type: string;
  account_number: string;
  account_name?: string | null;
  metaapi_account_id: string | null;
};

export type SimulatorStats = {
  profit_pct: number;
  trading_days: number;
  daily_loss_breach: boolean;
  worst_daily_pct: number;
  max_drawdown_pct: number;
  max_loss_breach: boolean;
};

export type SimulatorViewProps = {
  accounts: Account[];
  selectedUuid: string | null;
  setSelectedUuid: (v: string | null) => void;
  error: string | null;
  stats: SimulatorStats | null;
  equityCurve: EquityPoint[];
  projectedEquityCurve: EquityPoint[];
  whatIfParams: WhatIfParams;
  onWhatIfChange: (p: WhatIfParams) => void;
  passProbFtmo2StepP1: number;
  passProbFtmo2StepP2: number;
  passProbFtmo1Step: number;
  passProbSimplifiedP1: number;
  passProbSimplifiedP2: number;
  estimatedDaysToTarget: number;
  status: "fuori_gioco" | "a_rischio" | "in_corsa";
  breachRiskPct: number;
  onRefresh?: () => void;
  refreshing?: boolean;
  ftmoPhase1Pass: boolean;
  ftmoPhase2Pass: boolean;
  ftmo1StepPass: boolean;
  ftmo1StepDailyBreach: boolean;
  ftmo1StepMaxLossBreach: boolean;
  simplifiedPhase1Pass: boolean;
  simplifiedPhase2Pass: boolean;
  simplifiedDailyBreach: boolean;
  simplifiedMaxLossBreach: boolean;
  initialBalance: number;
  balance: number;
  currency: string;
  tradesCount: number;
};

function accountLabel(a: Account): string {
  const login = a.account_number ?? "";
  const name = a.account_name?.trim();
  return name ? `${login} · ${name}` : login;
}

export function SimulatorView(props: SimulatorViewProps) {
  const { accounts, selectedUuid, setSelectedUuid, onRefresh, refreshing = false, stats, tradesCount, error } = props;
  const [showInfo, setShowInfo] = useState(false);
  const [strategyName, setStrategyName] = useState("London Breakout v2");
  const [sessionName, setSessionName] = useState("Q2 EURUSD Replay");
  const [timeframe, setTimeframe] = useState("M15");
  const [sessionPreset, setSessionPreset] = useState<"manual" | "london" | "newyork">("london");

  const sessionPnl = stats?.profit_pct ?? 0;
  const worstDay = stats?.worst_daily_pct ?? 0;
  const maxDd = stats?.max_drawdown_pct ?? 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="rs-card p-5 shadow-rs-soft sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <div>
              <h1 className="rs-page-title">Backtesting</h1>
              <p className="rs-page-sub mt-1">
                Clean backtesting page: strategy/session setup, historical replay, analytics, and improvement advice.
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
          <div className="flex flex-wrap items-center gap-3">
            <select className="rs-input min-w-[200px] max-w-xs" value={selectedUuid ?? ""} onChange={(e) => setSelectedUuid(e.target.value || null)}>
              <option value="">All accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.metaapi_account_id ?? ""}>
                  {accountLabel(a)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing || !selectedUuid}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700/50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh session data
            </button>
          </div>
        </div>
        {showInfo && (
          <div className="mt-4 rounded-lg border border-slate-700 bg-slate-800/70 p-4 text-sm text-slate-300">
            Build your strategy and session, replay historical market context, then evaluate analytics and improve your rules.
          </div>
        )}
      </header>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <section className="rounded-xl border border-slate-800 bg-surface p-5">
        <h2 className="text-sm font-medium text-slate-200 mb-1">Strategy & session setup</h2>
        <p className="text-xs text-slate-500 mb-4">Create your strategy, define session context, and prepare replay testing.</p>
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
          Historical replay backtest
        </h2>
        <p className="text-xs text-slate-500">Replay old market candles and execute your strategy to validate edge before going live.</p>
      </section>

      <section className="rounded-xl border border-slate-800 bg-surface p-5">
        <h2 className="flex items-center gap-2 text-sm font-medium text-slate-200 mb-1">
          <BarChart3 className="h-4 w-4 text-cyan-400" />
          Session analytics
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mt-4">
          <div className="rounded-lg bg-slate-800/40 p-3"><p className="text-xs text-slate-500">Trades tested</p><p className="text-xl text-cyan-300 mt-1">{tradesCount}</p></div>
          <div className="rounded-lg bg-slate-800/40 p-3"><p className="text-xs text-slate-500">Session PnL</p><p className={`text-xl mt-1 ${sessionPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>{sessionPnl >= 0 ? "+" : ""}{sessionPnl.toFixed(2)}%</p></div>
          <div className="rounded-lg bg-slate-800/40 p-3"><p className="text-xs text-slate-500">Worst day</p><p className="text-xl text-amber-400 mt-1">{worstDay.toFixed(2)}%</p></div>
          <div className="rounded-lg bg-slate-800/40 p-3"><p className="text-xs text-slate-500">Max drawdown</p><p className="text-xl text-red-400 mt-1">{maxDd.toFixed(2)}%</p></div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-surface p-5">
        <h2 className="flex items-center gap-2 text-sm font-medium text-slate-200 mb-1">
          <Lightbulb className="h-4 w-4 text-cyan-400" />
          Strategy improvement advice
        </h2>
        <div className="grid gap-3 md:grid-cols-3 mt-4">
          <div className="rounded-lg border border-slate-700/80 bg-slate-900/40 p-3 text-xs text-slate-300">Reduce risk per trade after two consecutive losses.</div>
          <div className="rounded-lg border border-slate-700/80 bg-slate-900/40 p-3 text-xs text-slate-300">Focus only on high expectancy sessions for this strategy.</div>
          <div className="rounded-lg border border-slate-700/80 bg-slate-900/40 p-3 text-xs text-slate-300">Keep only A+ setups and remove low-quality entries.</div>
        </div>
      </section>
    </div>
  );
}
