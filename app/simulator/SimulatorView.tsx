"use client";

import { Check, X, AlertCircle } from "lucide-react";

const FTMO_PHASE1 = {
  profit_target_pct: 10,
  daily_loss_limit_pct: 5,
  max_loss_pct: 10,
  min_trading_days: 4
};

const FTMO_PHASE2 = {
  profit_target_pct: 5,
  daily_loss_limit_pct: 5,
  max_loss_pct: 10,
  min_trading_days: 4
};

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
  phase1Pass: boolean;
  phase2Pass: boolean;
  initialBalance: number;
  balance: number;
  currency: string;
  tradesCount: number;
};

export function SimulatorView(props: SimulatorViewProps) {
  const {
    accounts,
    selectedUuid,
    setSelectedUuid,
    error,
    stats,
    phase1Pass,
    phase2Pass,
    initialBalance,
    balance,
    currency,
    tradesCount
  } = props;

  const mainContent = !selectedUuid ? (
    <div className="rounded-xl border border-slate-800 bg-surface p-8 text-center text-slate-500 text-sm">
      Select an account to run the FTMO 2-Step simulator.
    </div>
  ) : !stats ? (
    <div className="rounded-xl border border-slate-800 bg-surface p-8 text-center text-slate-500 text-sm">
      No trade data yet. Connect an account and close some trades to see results.
    </div>
  ) : (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-800 bg-surface p-5">
        <h2 className="text-sm font-medium text-slate-200 mb-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          Phase 1 - FTMO Challenge
        </h2>
        <p className="text-xs text-slate-500 mb-4">Profit target 10%, daily loss 5%, max loss 10%, min 4 trading days.</p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center justify-between">
            <span className="text-slate-400">Profit target ≥ {FTMO_PHASE1.profit_target_pct}%</span>
            {stats.profit_pct >= FTMO_PHASE1.profit_target_pct ? (
              <span className="text-emerald-400 flex items-center gap-1"><Check className="h-4 w-4" /> Pass</span>
            ) : (
              <span className="text-red-400 flex items-center gap-1"><X className="h-4 w-4" /> {stats.profit_pct.toFixed(2)}%</span>
            )}
          </li>
          <li className="flex items-center justify-between">
            <span className="text-slate-400">Daily loss limit ≤ {FTMO_PHASE1.daily_loss_limit_pct}%</span>
            {!stats.daily_loss_breach ? (
              <span className="text-emerald-400 flex items-center gap-1"><Check className="h-4 w-4" /> Pass</span>
            ) : (
              <span className="text-red-400 flex items-center gap-1"><X className="h-4 w-4" /> Worst day: {stats.worst_daily_pct.toFixed(2)}%</span>
            )}
          </li>
          <li className="flex items-center justify-between">
            <span className="text-slate-400">Max loss ≤ {FTMO_PHASE1.max_loss_pct}%</span>
            {!stats.max_loss_breach ? (
              <span className="text-emerald-400 flex items-center gap-1"><Check className="h-4 w-4" /> Pass</span>
            ) : (
              <span className="text-red-400 flex items-center gap-1"><X className="h-4 w-4" /> DD: {stats.max_drawdown_pct.toFixed(2)}%</span>
            )}
          </li>
          <li className="flex items-center justify-between">
            <span className="text-slate-400">Min trading days ≥ {FTMO_PHASE1.min_trading_days}</span>
            {stats.trading_days >= FTMO_PHASE1.min_trading_days ? (
              <span className="text-emerald-400 flex items-center gap-1"><Check className="h-4 w-4" /> Pass ({stats.trading_days})</span>
            ) : (
              <span className="text-red-400 flex items-center gap-1"><X className="h-4 w-4" /> {stats.trading_days} days</span>
            )}
          </li>
        </ul>
        <div className="mt-4 pt-4 border-t border-slate-800">
          {phase1Pass ? (
            <p className="text-sm font-medium text-emerald-400 flex items-center gap-2"><Check className="h-4 w-4" /> Phase 1 passed</p>
          ) : (
            <p className="text-sm text-amber-400 flex items-center gap-2"><AlertCircle className="h-4 w-4" /> Phase 1 not passed</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-surface p-5">
        <h2 className="text-sm font-medium text-slate-200 mb-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-500" />
          Phase 2 - Verification
        </h2>
        <p className="text-xs text-slate-500 mb-4">Profit target 5%, daily loss 5%, max loss 10%, min 4 trading days.</p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center justify-between">
            <span className="text-slate-400">Profit target ≥ {FTMO_PHASE2.profit_target_pct}%</span>
            {stats.profit_pct >= FTMO_PHASE2.profit_target_pct ? (
              <span className="text-emerald-400 flex items-center gap-1"><Check className="h-4 w-4" /> Pass</span>
            ) : (
              <span className="text-red-400 flex items-center gap-1"><X className="h-4 w-4" /> {stats.profit_pct.toFixed(2)}%</span>
            )}
          </li>
          <li className="flex items-center justify-between">
            <span className="text-slate-400">Daily loss limit ≤ {FTMO_PHASE2.daily_loss_limit_pct}%</span>
            {!stats.daily_loss_breach ? (
              <span className="text-emerald-400 flex items-center gap-1"><Check className="h-4 w-4" /> Pass</span>
            ) : (
              <span className="text-red-400 flex items-center gap-1"><X className="h-4 w-4" /> Worst day: {stats.worst_daily_pct.toFixed(2)}%</span>
            )}
          </li>
          <li className="flex items-center justify-between">
            <span className="text-slate-400">Max loss ≤ {FTMO_PHASE2.max_loss_pct}%</span>
            {!stats.max_loss_breach ? (
              <span className="text-emerald-400 flex items-center gap-1"><Check className="h-4 w-4" /> Pass</span>
            ) : (
              <span className="text-red-400 flex items-center gap-1"><X className="h-4 w-4" /> DD: {stats.max_drawdown_pct.toFixed(2)}%</span>
            )}
          </li>
          <li className="flex items-center justify-between">
            <span className="text-slate-400">Min trading days ≥ {FTMO_PHASE2.min_trading_days}</span>
            {stats.trading_days >= FTMO_PHASE2.min_trading_days ? (
              <span className="text-emerald-400 flex items-center gap-1"><Check className="h-4 w-4" /> Pass ({stats.trading_days})</span>
            ) : (
              <span className="text-red-400 flex items-center gap-1"><X className="h-4 w-4" /> {stats.trading_days} days</span>
            )}
          </li>
        </ul>
        <div className="mt-4 pt-4 border-t border-slate-800">
          {phase2Pass ? (
            <p className="text-sm font-medium text-emerald-400 flex items-center gap-2"><Check className="h-4 w-4" /> Phase 2 passed</p>
          ) : (
            <p className="text-sm text-amber-400 flex items-center gap-2"><AlertCircle className="h-4 w-4" /> Phase 2 not passed</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-50">FTMO 2-Step Simulator</h1>
          <p className="text-sm text-slate-500 mt-1">
            Check your trading against FTMO 2-Step Challenge rules. Select an account and review Phase 1 and Phase 2.
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
        <div className="rounded-xl border border-slate-800 bg-surface p-4">
          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Summary</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-slate-300">Initial balance: <strong>{initialBalance.toFixed(2)} {currency}</strong></span>
            <span className="text-slate-300">Current balance: <strong>{balance.toFixed(2)} {currency}</strong></span>
            <span className="text-slate-300">Profit: <strong className={stats.profit_pct >= 0 ? "text-emerald-400" : "text-red-400"}>{stats.profit_pct >= 0 ? "+" : ""}{stats.profit_pct.toFixed(2)}%</strong></span>
            <span className="text-slate-300">Trading days: <strong>{stats.trading_days}</strong></span>
            <span className="text-slate-300">Trades: <strong>{tradesCount}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
