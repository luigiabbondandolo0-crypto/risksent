"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { ProgressBar } from "./components/ProgressBar";
import { EquityCurveChart } from "./components/EquityCurveChart";
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

const TRADING_DAYS_CAP = 30;

function probColor(p: number): string {
  return p >= 60 ? "text-emerald-400" : p >= 30 ? "text-amber-400" : "text-red-400";
}

export function SimulatorView(props: SimulatorViewProps) {
  const {
    accounts,
    selectedUuid,
    setSelectedUuid,
    error,
    stats,
    equityCurve,
    passProbFtmo2StepP1,
    passProbFtmo2StepP2,
    passProbFtmo1Step,
    passProbSimplifiedP1,
    passProbSimplifiedP2,
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

  const [rulesTab, setRulesTab] = useState<"ftmo2" | "ftmo1" | "simplified">("ftmo2");

  const statusLabel =
    status === "fuori_gioco" ? "Out of the game" : status === "a_rischio" ? "At breach risk" : "On track";
  const statusColor =
    status === "fuori_gioco" ? "bg-red-500/20 text-red-400" : status === "a_rischio" ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400";

  const aiFeedback: AIFeedbackData = {
    summary: stats
      ? `You are in Phase 1 at ${stats.profit_pct >= 0 ? "+" : ""}${stats.profit_pct.toFixed(2)}%. Revenge and overtrading patterns are analysed over the last ${tradesCount} trades.`
      : "Connect an account and close trades to see the analysis.",
    errors: [
      "Revenge on major pairs after 3 losses (size +78%)",
      "Afternoon overtrading (38% WR after 14:00)",
      "Exposure >6% on 2 trades (rule violation)"
    ],
    tips: [
      "After 2 losses: cut size 50% for the next 5 trades",
      "Trading cut-off at 14:00 – +22% WR expected",
      "Max exposure 5% – reduce correlated positions"
    ],
    healthScore: stats ? (stats.daily_loss_breach || stats.max_loss_breach ? 35 : 62) : 50
  };

  const imminentAlerts: ImminentAlert[] = [];
  if (stats && breachRiskPct >= 50) {
    imminentAlerts.push({
      id: "breach-risk",
      message: `Daily DD breach risk in the next trades (probability ~${Math.round(breachRiskPct)}%)`,
      severity: breachRiskPct >= 70 ? "error" : "warning"
    });
  }
  if (stats && status === "a_rischio") {
    imminentAlerts.push({
      id: "at-risk",
      message: "You are close to daily or max DD limit – reduce size or stop for today.",
      severity: "warning"
    });
  }

  const emptyState = !selectedUuid ? (
    <div className="rounded-xl border border-slate-800 bg-surface p-8 text-center text-slate-500 text-sm">
      Select an account to run the simulator.
    </div>
  ) : !stats ? (
    <div className="rounded-xl border border-slate-800 bg-surface p-8 text-center text-slate-500 text-sm">
      No trade data yet. Connect the account and close some trades to see results.
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
              Pass probability for each challenge based on your current trading behaviour.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-500 min-w-[200px]"
              value={selectedUuid ?? ""}
              onChange={(e) => setSelectedUuid(e.target.value || null)}
            >
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
              Refresh live stats
            </button>
          </div>
        </div>

        {!emptyState && stats && (
          <>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <div className="rounded-lg bg-slate-800/50 p-3">
                <p className="text-xs text-slate-500 uppercase tracking-wide">FTMO 2-Step P1</p>
                <p className={`text-xl font-semibold tabular-nums ${probColor(passProbFtmo2StepP1)}`}>{passProbFtmo2StepP1}%</p>
              </div>
              <div className="rounded-lg bg-slate-800/50 p-3">
                <p className="text-xs text-slate-500 uppercase tracking-wide">FTMO 2-Step P2</p>
                <p className={`text-xl font-semibold tabular-nums ${probColor(passProbFtmo2StepP2)}`}>{passProbFtmo2StepP2}%</p>
              </div>
              <div className="rounded-lg bg-slate-800/50 p-3">
                <p className="text-xs text-slate-500 uppercase tracking-wide">FTMO 1-Step</p>
                <p className={`text-xl font-semibold tabular-nums ${probColor(passProbFtmo1Step)}`}>{passProbFtmo1Step}%</p>
              </div>
              <div className="rounded-lg bg-slate-800/50 p-3">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Simplified P1</p>
                <p className={`text-xl font-semibold tabular-nums ${probColor(passProbSimplifiedP1)}`}>{passProbSimplifiedP1}%</p>
              </div>
              <div className="rounded-lg bg-slate-800/50 p-3">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Simplified P2</p>
                <p className={`text-xl font-semibold tabular-nums ${probColor(passProbSimplifiedP2)}`}>{passProbSimplifiedP2}%</p>
              </div>
              <div className="rounded-lg bg-slate-800/50 p-3">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Status</p>
                <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>
                  {statusLabel}
                </span>
                <p className="text-xs text-slate-500 mt-1">Days to target: {estimatedDaysToTarget} / {TRADING_DAYS_CAP}</p>
              </div>
            </div>
          </>
        )}
      </header>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {emptyState ? (
        emptyState
      ) : (
        stats && (
          <>
            {/* Rules & Status – tabs for FTMO 2-Step, FTMO 1-Step, Simplified */}
            <div className="rounded-xl border border-slate-800 bg-surface p-5">
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setRulesTab("ftmo2")}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    rulesTab === "ftmo2" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  FTMO 2-STEP
                </button>
                <button
                  type="button"
                  onClick={() => setRulesTab("ftmo1")}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    rulesTab === "ftmo1" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  FTMO 1-STEP
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

              {rulesTab === "ftmo2" && (
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-medium text-slate-300 mb-3">Phase 1</h3>
                    <div className="space-y-3">
                      <ProgressBar label="Profit target" value={stats.profit_pct} limit={FTMO_PHASE1.profit_target_pct} variant="profit" />
                      <ProgressBar label="Daily DD" value={stats.worst_daily_pct} limit={-FTMO_PHASE1.daily_loss_limit_pct} variant="loss" valueLabel={`${stats.worst_daily_pct.toFixed(2)}%`} limitLabel={`${FTMO_PHASE1.daily_loss_limit_pct}%`} />
                      <ProgressBar label="Max DD" value={stats.max_drawdown_pct} limit={FTMO_PHASE1.max_loss_pct} variant="loss" valueLabel={`${stats.max_drawdown_pct.toFixed(2)}%`} limitLabel={`${FTMO_PHASE1.max_loss_pct}%`} />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      {stats.worst_daily_pct > -FTMO_PHASE1.daily_loss_limit_pct
                        ? `${(FTMO_PHASE1.daily_loss_limit_pct + stats.worst_daily_pct).toFixed(1)}% headroom to daily DD limit`
                        : "Daily DD limit already breached"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-300 mb-3">Phase 2</h3>
                    <div className="space-y-3">
                      <ProgressBar label="Profit target" value={stats.profit_pct} limit={FTMO_PHASE2.profit_target_pct} variant="profit" />
                      <ProgressBar label="Daily DD" value={stats.worst_daily_pct} limit={-FTMO_PHASE2.daily_loss_limit_pct} variant="loss" valueLabel={`${stats.worst_daily_pct.toFixed(2)}%`} limitLabel={`${FTMO_PHASE2.daily_loss_limit_pct}%`} />
                      <ProgressBar label="Max DD" value={stats.max_drawdown_pct} limit={FTMO_PHASE2.max_loss_pct} variant="loss" valueLabel={`${stats.max_drawdown_pct.toFixed(2)}%`} limitLabel={`${FTMO_PHASE2.max_loss_pct}%`} />
                    </div>
                  </div>
                </div>
              )}

              {rulesTab === "ftmo1" && (
                <div>
                  <h3 className="text-sm font-medium text-slate-300 mb-3">Phase 1 (single step)</h3>
                  <div className="space-y-3 max-w-md">
                    <ProgressBar label="Profit target" value={stats.profit_pct} limit={FTMO_1STEP.profit_target_pct} variant="profit" />
                    <ProgressBar label="Daily DD" value={stats.worst_daily_pct} limit={-FTMO_1STEP.daily_loss_limit_pct} variant="loss" valueLabel={`${stats.worst_daily_pct.toFixed(2)}%`} limitLabel={`${FTMO_1STEP.daily_loss_limit_pct}%`} />
                    <ProgressBar label="Max DD" value={stats.max_drawdown_pct} limit={FTMO_1STEP.max_loss_pct} variant="loss" valueLabel={`${stats.max_drawdown_pct.toFixed(2)}%`} limitLabel={`${FTMO_1STEP.max_loss_pct}%`} />
                  </div>
                </div>
              )}

              {rulesTab === "simplified" && (
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-medium text-slate-300 mb-3">Phase 1</h3>
                    <div className="space-y-3">
                      <ProgressBar label="Profit target" value={stats.profit_pct} limit={SIMPLIFIED_PHASE1.profit_target_pct} variant="profit" />
                      <ProgressBar label="Daily DD" value={stats.worst_daily_pct} limit={-SIMPLIFIED_PHASE1.daily_loss_limit_pct} variant="loss" valueLabel={`${stats.worst_daily_pct.toFixed(2)}%`} limitLabel={`${SIMPLIFIED_PHASE1.daily_loss_limit_pct}%`} />
                      <ProgressBar label="Max DD" value={stats.max_drawdown_pct} limit={SIMPLIFIED_PHASE1.max_loss_pct} variant="loss" valueLabel={`${stats.max_drawdown_pct.toFixed(2)}%`} limitLabel={`${SIMPLIFIED_PHASE1.max_loss_pct}%`} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-300 mb-3">Phase 2</h3>
                    <div className="space-y-3">
                      <ProgressBar label="Profit target" value={stats.profit_pct} limit={SIMPLIFIED_PHASE2.profit_target_pct} variant="profit" />
                      <ProgressBar label="Daily DD" value={stats.worst_daily_pct} limit={-SIMPLIFIED_PHASE2.daily_loss_limit_pct} variant="loss" valueLabel={`${stats.worst_daily_pct.toFixed(2)}%`} limitLabel={`${SIMPLIFIED_PHASE2.daily_loss_limit_pct}%`} />
                      <ProgressBar label="Max DD" value={stats.max_drawdown_pct} limit={SIMPLIFIED_PHASE2.max_loss_pct} variant="loss" valueLabel={`${stats.max_drawdown_pct.toFixed(2)}%`} limitLabel={`${SIMPLIFIED_PHASE2.max_loss_pct}%`} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Equity curve */}
            <EquityCurveChart
              data={equityCurve}
              initialBalance={initialBalance}
              targetPct={rulesTab === "ftmo2" ? FTMO_PHASE1.profit_target_pct : rulesTab === "ftmo1" ? FTMO_1STEP.profit_target_pct : SIMPLIFIED_PHASE1.profit_target_pct}
              height={220}
            />

            <FeedbackAICard data={aiFeedback} tradesCount={tradesCount} periodLabel="last 30 trades" />

            <AlertsBar alerts={imminentAlerts} onBlockTrading={imminentAlerts.length > 0 ? () => {} : undefined} />
          </>
        )
      )}
    </div>
  );
}
