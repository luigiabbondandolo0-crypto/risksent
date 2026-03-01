"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { ProgressBar } from "./components/ProgressBar";
import { EquityCurveChart } from "./components/EquityCurveChart";
import { WhatIfSliders } from "./components/WhatIfSliders";
import { FeedbackAICard, type AIFeedbackData } from "./components/FeedbackAICard";
import { AlertsBar, type ImminentAlert } from "./components/AlertsBar";

const FTMO_PHASE1 = { profit_target_pct: 10, daily_loss_limit_pct: 5, max_loss_pct: 10 };
const FTMO_PHASE2 = { profit_target_pct: 5, daily_loss_limit_pct: 5, max_loss_pct: 10 };
const FTMO_1STEP = { profit_target_pct: 10, daily_loss_limit_pct: 3, max_loss_pct: 10 };
const SIMPLIFIED_PHASE1 = { profit_target_pct: 8, daily_loss_limit_pct: 4, max_loss_pct: 8 };
const SIMPLIFIED_PHASE2 = { profit_target_pct: 4, daily_loss_limit_pct: 4, max_loss_pct: 8 };

export type Account = {
  id: string;
  broker_type: string;
  account_number: string;
  account_name?: string | null;
  metaapi_account_id: string | null;
};

function accountLabel(a: Account): string {
  const login = a.account_number ?? "";
  const name = a.account_name?.trim();
  return name ? `${login} · ${name}` : login;
}

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
  equityCurve: { index: number; date: string; balance: number; pct: number }[];
  passProbabilityPhase1: number;
  passProbabilityPhase2: number;
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

const TRADING_DAYS_CAP = 30;

export function SimulatorView(props: SimulatorViewProps) {
  const {
    accounts,
    selectedUuid,
    setSelectedUuid,
    error,
    stats,
    equityCurve,
    passProbabilityPhase1,
    passProbabilityPhase2,
    estimatedDaysToTarget,
    status,
    breachRiskPct,
    onRefresh,
    refreshing = false,
    ftmoPhase1Pass,
    ftmoPhase2Pass,
    ftmo1StepPass,
    ftmo1StepDailyBreach,
    ftmo1StepMaxLossBreach,
    simplifiedPhase1Pass,
    simplifiedPhase2Pass,
    simplifiedDailyBreach,
    simplifiedMaxLossBreach,
    initialBalance,
    balance,
    currency,
    tradesCount
  } = props;

  const [rulesTab, setRulesTab] = useState<"ftmo" | "simplified">("ftmo");

  const statusLabel =
    status === "fuori_gioco" ? "Fuori gioco" : status === "a_rischio" ? "A rischio breach" : "In corsa";
  const statusColor =
    status === "fuori_gioco" ? "bg-red-500/20 text-red-400" : status === "a_rischio" ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400";

  // Placeholder AI feedback (in future: from API / AI analysis on last 30 trades)
  const aiFeedback: AIFeedbackData = {
    summary: stats
      ? `Sei in Phase 1 con ${stats.profit_pct >= 0 ? "+" : ""}${stats.profit_pct.toFixed(2)}%. Pattern revenge e overtrading vengono analizzati sui ultimi ${tradesCount} trade.`
      : "Connessi un account e chiudi trade per vedere l'analisi.",
    errors: [
      "Revenge su coppie principali dopo 3 perdite (size +78%)",
      "Overtrading pomeridiano (WR 38% dopo le 14:00)",
      "Exposure >6% su 2 trade (violazione regola)"
    ],
    tips: [
      "Dopo 2 perdite: cut size 50% per i prossimi 5 trade",
      "Cut-off trading alle 14:00 – +22% WR atteso",
      "Max exposure 5% – riduci posizioni su correlati"
    ],
    healthScore: stats ? (stats.daily_loss_breach || stats.max_loss_breach ? 35 : 62) : 50
  };

  const imminentAlerts: ImminentAlert[] = [];
  if (stats && breachRiskPct >= 50) {
    imminentAlerts.push({
      id: "breach-risk",
      message: `Rischio breach daily DD nei prossimi trade (probabilità ~${Math.round(breachRiskPct)}%)`,
      severity: breachRiskPct >= 70 ? "error" : "warning"
    });
  }
  if (stats && status === "a_rischio") {
    imminentAlerts.push({
      id: "at-risk",
      message: "Sei vicino al limite daily o max DD – riduci size o fermati oggi.",
      severity: "warning"
    });
  }

  const emptyState = !selectedUuid ? (
    <div className="rounded-xl border border-slate-800 bg-surface p-8 text-center text-slate-500 text-sm">
      Seleziona un conto per vedere il simulator.
    </div>
  ) : !stats ? (
    <div className="rounded-xl border border-slate-800 bg-surface p-8 text-center text-slate-500 text-sm">
      Nessun dato trade ancora. Connetti il conto e chiudi trade per i risultati.
    </div>
  ) : null;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <header className="rounded-xl border border-slate-800 bg-surface p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-50">Challenge Simulator – FTMO & Simplified</h1>
            <p className="text-sm text-slate-500 mt-1">
              Probabilità di passaggio, giorni stimati e stato in tempo reale.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-500 min-w-[200px]"
              value={selectedUuid ?? ""}
              onChange={(e) => setSelectedUuid(e.target.value || null)}
            >
              <option value="">Tutti i conti</option>
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
              Aggiorna Stats Live
            </button>
          </div>
        </div>

        {!emptyState && stats && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-slate-800/50 p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Prob. Phase 1</p>
              <p
                className={`text-2xl font-semibold tabular-nums ${
                  passProbabilityPhase1 >= 60 ? "text-emerald-400" : passProbabilityPhase1 >= 30 ? "text-amber-400" : "text-red-400"
                }`}
              >
                {passProbabilityPhase1}%
              </p>
            </div>
            <div className="rounded-lg bg-slate-800/50 p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Prob. Phase 2</p>
              <p
                className={`text-2xl font-semibold tabular-nums ${
                  passProbabilityPhase2 >= 60 ? "text-emerald-400" : passProbabilityPhase2 >= 30 ? "text-amber-400" : "text-red-400"
                }`}
              >
                {passProbabilityPhase2}%
              </p>
            </div>
            <div className="rounded-lg bg-slate-800/50 p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Giorni al target</p>
              <p className="text-2xl font-semibold text-slate-200 tabular-nums">
                {estimatedDaysToTarget} / {TRADING_DAYS_CAP}
              </p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-700">
                <div
                  className="h-1.5 rounded-full bg-cyan-500 transition-all"
                  style={{ width: `${Math.min(100, ((TRADING_DAYS_CAP - estimatedDaysToTarget) / TRADING_DAYS_CAP) * 100)}%` }}
                />
              </div>
            </div>
            <div className="rounded-lg bg-slate-800/50 p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Stato</p>
              <span className={`inline-block mt-1 rounded-full px-3 py-1 text-sm font-medium ${statusColor}`}>
                {statusLabel}
              </span>
            </div>
          </div>
        )}
      </header>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {emptyState ? (
        emptyState
      ) : (
        stats && (
          <>
            {/* Rules & Status */}
            <div className="rounded-xl border border-slate-800 bg-surface p-5">
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setRulesTab("ftmo")}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    rulesTab === "ftmo" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  FTMO 2-STEP
                </button>
                <button
                  type="button"
                  onClick={() => setRulesTab("simplified")}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    rulesTab === "simplified" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Simplified
                </button>
              </div>

              {rulesTab === "ftmo" && (
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-medium text-slate-300 mb-3">Phase 1</h3>
                    <div className="space-y-3">
                      <ProgressBar
                        label="Profit target"
                        value={stats.profit_pct}
                        limit={FTMO_PHASE1.profit_target_pct}
                        variant="profit"
                      />
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
                    <p className="text-xs text-slate-500 mt-2">
                      {stats.worst_daily_pct > -FTMO_PHASE1.daily_loss_limit_pct
                        ? `Mancano ${(FTMO_PHASE1.daily_loss_limit_pct + stats.worst_daily_pct).toFixed(1)}% al daily DD`
                        : "Breach daily DD già superato"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-300 mb-3">Phase 2</h3>
                    <div className="space-y-3">
                      <ProgressBar
                        label="Profit target"
                        value={stats.profit_pct}
                        limit={FTMO_PHASE2.profit_target_pct}
                        variant="profit"
                      />
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

              {rulesTab === "simplified" && (
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-medium text-slate-300 mb-3">Phase 1</h3>
                    <div className="space-y-3">
                      <ProgressBar
                        label="Profit target"
                        value={stats.profit_pct}
                        limit={SIMPLIFIED_PHASE1.profit_target_pct}
                        variant="profit"
                      />
                      <ProgressBar
                        label="Daily DD"
                        value={stats.worst_daily_pct}
                        limit={-SIMPLIFIED_PHASE1.daily_loss_limit_pct}
                        variant="loss"
                        valueLabel={`${stats.worst_daily_pct.toFixed(2)}%`}
                        limitLabel={`${SIMPLIFIED_PHASE1.daily_loss_limit_pct}%`}
                      />
                      <ProgressBar
                        label="Max DD"
                        value={stats.max_drawdown_pct}
                        limit={SIMPLIFIED_PHASE1.max_loss_pct}
                        variant="loss"
                        valueLabel={`${stats.max_drawdown_pct.toFixed(2)}%`}
                        limitLabel={`${SIMPLIFIED_PHASE1.max_loss_pct}%`}
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-300 mb-3">Phase 2</h3>
                    <div className="space-y-3">
                      <ProgressBar
                        label="Profit target"
                        value={stats.profit_pct}
                        limit={SIMPLIFIED_PHASE2.profit_target_pct}
                        variant="profit"
                      />
                      <ProgressBar
                        label="Daily DD"
                        value={stats.worst_daily_pct}
                        limit={-SIMPLIFIED_PHASE2.daily_loss_limit_pct}
                        variant="loss"
                        valueLabel={`${stats.worst_daily_pct.toFixed(2)}%`}
                        limitLabel={`${SIMPLIFIED_PHASE2.daily_loss_limit_pct}%`}
                      />
                      <ProgressBar
                        label="Max DD"
                        value={stats.max_drawdown_pct}
                        limit={SIMPLIFIED_PHASE2.max_loss_pct}
                        variant="loss"
                        valueLabel={`${stats.max_drawdown_pct.toFixed(2)}%`}
                        limitLabel={`${SIMPLIFIED_PHASE2.max_loss_pct}%`}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Equity + What-If */}
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <EquityCurveChart
                  data={equityCurve}
                  initialBalance={initialBalance}
                  targetPct={rulesTab === "ftmo" ? FTMO_PHASE1.profit_target_pct : SIMPLIFIED_PHASE1.profit_target_pct}
                  height={220}
                />
              </div>
              <div>
                <WhatIfSliders
                  baselineProbPhase1={passProbabilityPhase1}
                  baselineDaysToTarget={estimatedDaysToTarget}
                  baselineBreachRisk={breachRiskPct}
                />
              </div>
            </div>

            {/* AI Coach */}
            <FeedbackAICard
              data={aiFeedback}
              tradesCount={tradesCount}
              periodLabel="ultimi 30 trade"
            />

            {/* Alerts */}
            <AlertsBar
              alerts={imminentAlerts}
              onBlockTrading={imminentAlerts.length > 0 ? () => {} : undefined}
            />
          </>
        )
      )}
    </div>
  );
}
