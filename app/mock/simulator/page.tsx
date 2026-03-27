"use client";

import { useState } from "react";
import { Info } from "lucide-react";
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
  const stats = MOCK_STATS;

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="rs-card p-5 shadow-rs-soft sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <div>
              <h1 className="rs-page-title">Challenge simulator</h1>
              <p className="rs-page-sub mt-1">
                Stessa struttura della pagina live: probabilità e tab per challenge (dati mock).
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
            FTMO 1-Step rules (mock) — stessa UI della live con tab dedicata.
          </p>
        )}
        {rulesTab === "simplified" && (
          <p className="text-sm text-slate-400">
            Simplified challenge (mock) — progress bar e limiti come in produzione.
          </p>
        )}
      </div>

      <section className="rs-card p-5 shadow-rs-soft">
        <h2 className="text-sm font-semibold text-slate-200">What-if / projection</h2>
        <p className="mt-2 text-sm text-slate-500">
          Nella build reale: slider e curve proiettate. Qui è un placeholder statico per la stessa sezione.
        </p>
        <div className="mt-4 h-32 rounded-xl border border-dashed border-slate-700 bg-slate-950/40" />
      </section>
    </div>
  );
}
