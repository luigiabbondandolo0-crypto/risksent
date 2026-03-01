"use client";

import { Check, X, AlertCircle } from "lucide-react";
import { PerformanceFeedbackMock } from "./PerformanceFeedbackMock";

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

function formatBalance(n: number): string {
  return n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

function PhaseCard(
  title: string,
  subtitle: string,
  stats: SimulatorStats,
  phase: { profit_target_pct: number; daily_loss_limit_pct: number; max_loss_pct: number },
  dailyBreach: boolean,
  maxLossBreach: boolean,
  pass: boolean,
  dotColor: string
) {
  return (
    <div className="rounded-xl border border-slate-800 bg-surface p-5">
      <h2 className="text-sm font-medium text-slate-200 mb-1 flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        {title}
      </h2>
      <p className="text-xs text-slate-500 mb-4">{subtitle}</p>
      <ul className="space-y-2 text-sm">
        <li className="flex items-center justify-between">
          <span className="text-slate-400">Profit target ≥ {phase.profit_target_pct}%</span>
          {stats.profit_pct >= phase.profit_target_pct ? (
            <span className="text-emerald-400 flex items-center gap-1"><Check className="h-4 w-4" /> Pass</span>
          ) : (
            <span className="text-red-400 flex items-center gap-1"><X className="h-4 w-4" /> {stats.profit_pct.toFixed(2)}%</span>
          )}
        </li>
        <li className="flex items-center justify-between">
          <span className="text-slate-400">Daily loss limit ≤ {phase.daily_loss_limit_pct}%</span>
          {!dailyBreach ? (
            <span className="text-emerald-400 flex items-center gap-1"><Check className="h-4 w-4" /> Pass</span>
          ) : (
            <span className="text-red-400 flex items-center gap-1"><X className="h-4 w-4" /> Worst day: {stats.worst_daily_pct.toFixed(2)}%</span>
          )}
        </li>
        <li className="flex items-center justify-between">
          <span className="text-slate-400">Max loss ≤ {phase.max_loss_pct}%</span>
          {!maxLossBreach ? (
            <span className="text-emerald-400 flex items-center gap-1"><Check className="h-4 w-4" /> Pass</span>
          ) : (
            <span className="text-red-400 flex items-center gap-1"><X className="h-4 w-4" /> DD: {stats.max_drawdown_pct.toFixed(2)}%</span>
          )}
        </li>
      </ul>
      <div className="mt-4 pt-4 border-t border-slate-800">
        {pass ? (
          <p className="text-sm font-medium text-emerald-400 flex items-center gap-2"><Check className="h-4 w-4" /> Passed</p>
        ) : (
          <p className="text-sm text-amber-400 flex items-center gap-2"><AlertCircle className="h-4 w-4" /> Not passed</p>
        )}
      </div>
    </div>
  );
}

export function SimulatorView(props: SimulatorViewProps) {
  const {
    accounts,
    selectedUuid,
    setSelectedUuid,
    error,
    stats,
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

  const mainContent = !selectedUuid ? (
    <div className="rounded-xl border border-slate-800 bg-surface p-8 text-center text-slate-500 text-sm">
      Select an account to run the simulators.
    </div>
  ) : !stats ? (
    <div className="rounded-xl border border-slate-800 bg-surface p-8 text-center text-slate-500 text-sm">
      No trade data yet. Connect an account and close some trades to see results.
    </div>
  ) : (
    <div className="space-y-8">
      <div>
        <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">FTMO 2-STEP</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          {PhaseCard(
            "Phase 1",
            "Profit target 10%, daily loss 5%, max loss 10%.",
            stats,
            FTMO_PHASE1,
            stats.daily_loss_breach,
            stats.max_loss_breach,
            ftmoPhase1Pass,
            "bg-amber-500"
          )}
          {PhaseCard(
            "Phase 2",
            "Profit target 5%, daily loss 5%, max loss 10%.",
            stats,
            FTMO_PHASE2,
            stats.daily_loss_breach,
            stats.max_loss_breach,
            ftmoPhase2Pass,
            "bg-cyan-500"
          )}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">FTMO 1-STEP</h2>
        <div className="grid gap-6 lg:grid-cols-1 max-w-xl">
          {PhaseCard(
            "Phase 1",
            "Profit target 10%, daily loss 3%, max loss 10%. Single step to FTMO Account.",
            stats,
            FTMO_1STEP,
            ftmo1StepDailyBreach,
            ftmo1StepMaxLossBreach,
            ftmo1StepPass,
            "bg-emerald-500"
          )}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">ALTERNATIVE 2-STEP</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          {PhaseCard(
            "Phase 1",
            "Profit target 8%, daily loss 4%, max loss 8%.",
            stats,
            SIMPLIFIED_PHASE1,
            simplifiedDailyBreach,
            simplifiedMaxLossBreach,
            simplifiedPhase1Pass,
            "bg-violet-500"
          )}
          {PhaseCard(
            "Phase 2",
            "Profit target 4%, daily loss 4%, max loss 8%.",
            stats,
            SIMPLIFIED_PHASE2,
            simplifiedDailyBreach,
            simplifiedMaxLossBreach,
            simplifiedPhase2Pass,
            "bg-sky-500"
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-50">Challenge Simulator</h1>
          <p className="text-sm text-slate-500 mt-1">
            Confronta il trading con FTMO 2-STEP, FTMO 1-STEP e Alternative 2-STEP. Seleziona un account e controlla Phase 1 e Phase 2.
          </p>
        </div>
        <select
          className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-500 min-w-[200px]"
          value={selectedUuid ?? ""}
          onChange={(e) => setSelectedUuid(e.target.value || null)}
        >
          <option value="">Select account</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.metaapi_account_id ?? ""}>
              {accountLabel(a)}
            </option>
          ))}
        </select>
      </header>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {mainContent}

      {stats && (
        <>
          <div className="rounded-xl border border-slate-800 bg-surface p-4">
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Summary</h3>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="text-slate-300">Initial balance: <strong>{formatBalance(initialBalance)} {currency}</strong></span>
              <span className="text-slate-300">Current balance: <strong>{formatBalance(balance)} {currency}</strong></span>
              <span className="text-slate-300">Profit: <strong className={stats.profit_pct >= 0 ? "text-emerald-400" : "text-red-400"}>{stats.profit_pct >= 0 ? "+" : ""}{stats.profit_pct.toFixed(2)}%</strong></span>
              <span className="text-slate-300">Trading days: <strong>{stats.trading_days}</strong></span>
              <span className="text-slate-300">Trades: <strong>{tradesCount}</strong></span>
            </div>
          </div>

          <PerformanceFeedbackMock tradesCount={tradesCount} periodLabel="periodo analizzato" />
        </>
      )}
    </div>
  );
}
