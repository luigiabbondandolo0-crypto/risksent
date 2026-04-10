"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  BarChart3,
  ChevronRight,
  FlaskConical,
  LineChart,
  Play,
  Plus,
  Square,
  Target
} from "lucide-react";
import type {
  BacktestSession,
  BacktestStrategy,
  SessionEquityPoint
} from "@/lib/backtesting/types";
import { rollupStrategy } from "@/lib/backtesting/aggregate";
import {
  loadStore,
  saveStore,
  type BacktestingNamespace
} from "@/lib/backtesting/storage";
import { simulateSessionRun } from "@/lib/backtesting/simulate";

const ASSETS = [
  "EURUSD",
  "GBPUSD",
  "USDJPY",
  "AUDUSD",
  "XAUUSD",
  "BTCUSD",
  "US500"
] as const;

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type Variant = "live" | "mock";

function accentClass(v: Variant, kind: "btn" | "border" | "text" | "soft") {
  if (v === "mock") {
    if (kind === "btn") return "border-violet-500/40 bg-violet-500/15 text-violet-100 hover:bg-violet-500/25";
    if (kind === "border") return "border-violet-500/35";
    if (kind === "text") return "text-violet-300";
    return "bg-violet-500/10 text-violet-200/95";
  }
  if (kind === "btn") return "border-cyan-500/40 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25";
  if (kind === "border") return "border-cyan-500/35";
  if (kind === "text") return "text-cyan-300";
  return "bg-cyan-500/10 text-cyan-200/95";
}

type Props = {
  variant: Variant;
};

export function BacktestingApp({ variant }: Props) {
  const ns = variant as BacktestingNamespace;
  const [strategies, setStrategies] = useState<BacktestStrategy[]>([]);
  const [sessions, setSessions] = useState<BacktestSession[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);
  const [strategyNameInput, setStrategyNameInput] = useState("");

  const [sessionFormOpen, setSessionFormOpen] = useState(false);
  const [sfName, setSfName] = useState("");
  const [sfDuration, setSfDuration] = useState(60);
  const [sfAsset, setSfAsset] = useState<string>(ASSETS[0]);
  const [sfBalance, setSfBalance] = useState(10000);
  const [sfStrategyId, setSfStrategyId] = useState<string | null>(null);

  const [runnerSessionId, setRunnerSessionId] = useState<string | null>(null);
  const [runEquity, setRunEquity] = useState<SessionEquityPoint[]>([]);
  const [runWarmup, setRunWarmup] = useState(false);
  const [pendingSim, setPendingSim] = useState<ReturnType<typeof simulateSessionRun> | null>(null);

  const persist = useCallback(
    (nextS: BacktestStrategy[], nextSes: BacktestSession[]) => {
      setStrategies(nextS);
      setSessions(nextSes);
      saveStore(ns, { strategies: nextS, sessions: nextSes });
    },
    [ns]
  );

  useEffect(() => {
    const { strategies: st, sessions: se } = loadStore(ns);
    setStrategies(st);
    setSessions(se);
    setHydrated(true);
  }, [ns]);

  useEffect(() => {
    if (!hydrated || !strategies.length) return;
    setSelectedStrategyId((cur) => (cur && strategies.some((s) => s.id === cur) ? cur : strategies[0].id));
  }, [hydrated, strategies]);

  const selectedStrategy = useMemo(
    () => strategies.find((s) => s.id === selectedStrategyId) ?? null,
    [strategies, selectedStrategyId]
  );

  const strategySessions = useMemo(
    () => sessions.filter((s) => s.strategyId === selectedStrategyId).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [sessions, selectedStrategyId]
  );

  const rollup = useMemo(
    () => (selectedStrategyId ? rollupStrategy(selectedStrategyId, sessions) : null),
    [selectedStrategyId, sessions]
  );

  const activeRunner = useMemo(
    () => (runnerSessionId ? sessions.find((s) => s.id === runnerSessionId) : null),
    [runnerSessionId, sessions]
  );

  const createStrategy = (e: React.FormEvent) => {
    e.preventDefault();
    const name = strategyNameInput.trim();
    if (!name) return;
    const st: BacktestStrategy = { id: newId(), name, createdAt: new Date().toISOString() };
    const next = [...strategies, st];
    persist(next, sessions);
    setSelectedStrategyId(st.id);
    setStrategyNameInput("");
  };

  const openNewSessionForm = () => {
    if (!selectedStrategyId && strategies[0]) setSelectedStrategyId(strategies[0].id);
    setSfStrategyId(selectedStrategyId ?? strategies[0]?.id ?? null);
    setSfName("");
    setSfDuration(60);
    setSfAsset(ASSETS[0]);
    setSfBalance(10000);
    setSessionFormOpen(true);
  };

  const submitSession = (e: React.FormEvent) => {
    e.preventDefault();
    const sid = sfStrategyId ?? selectedStrategyId;
    if (!sid) return;
    const name = sfName.trim() || "Session";
    const sess: BacktestSession = {
      id: newId(),
      strategyId: sid,
      name,
      durationMinutes: Math.max(5, Math.min(24 * 60, sfDuration)),
      asset: sfAsset,
      initialBalance: Math.max(100, sfBalance),
      createdAt: new Date().toISOString(),
      status: "draft"
    };
    const nextSes = [...sessions, sess];
    persist(strategies, nextSes);
    setSessionFormOpen(false);
    setSelectedStrategyId(sid);
  };

  const startSession = (sessionId: string) => {
    const sess = sessions.find((s) => s.id === sessionId);
    if (!sess) return;
    const running: BacktestSession = { ...sess, status: "running", startedAt: new Date().toISOString() };
    const nextSes = sessions.map((s) => (s.id === sessionId ? running : s));
    persist(strategies, nextSes);
    setRunnerSessionId(sessionId);
    setRunWarmup(true);
    setRunEquity([]);
    const sim = simulateSessionRun(sessionId, sess.initialBalance, sess.durationMinutes, sess.asset);
    setPendingSim(sim);
    window.setTimeout(() => {
      setRunEquity(sim.equity);
      setRunWarmup(false);
    }, 1600);
  };

  const completeSession = () => {
    if (!runnerSessionId || !pendingSim || !activeRunner) return;
    const done: BacktestSession = {
      ...activeRunner,
      status: "completed",
      endedAt: new Date().toISOString(),
      tradesTested: pendingSim.tradesTested,
      winRatePct: pendingSim.winRatePct,
      avgRMultiple: pendingSim.avgRMultiple,
      maxDrawdownPct: pendingSim.maxDrawdownPct,
      netPnlPct: pendingSim.netPnlPct
    };
    const nextSes = sessions.map((s) => (s.id === runnerSessionId ? done : s));
    persist(strategies, nextSes);
    setRunnerSessionId(null);
    setPendingSim(null);
    setRunEquity([]);
  };

  const cancelRunner = () => {
    if (!runnerSessionId) return;
    const sess = sessions.find((s) => s.id === runnerSessionId);
    if (!sess) return;
    const reverted: BacktestSession = {
      ...sess,
      status: "draft",
      startedAt: undefined
    };
    const nextSes = sessions.map((s) => (s.id === runnerSessionId ? reverted : s));
    persist(strategies, nextSes);
    setRunnerSessionId(null);
    setPendingSim(null);
    setRunEquity([]);
    setRunWarmup(false);
  };

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-500 text-sm">
        Loading backtesting workspace…
      </div>
    );
  }

  /* ——— First visit: strategy only ——— */
  if (strategies.length === 0) {
    return (
      <div className="space-y-8 animate-fade-in max-w-lg">
        <header>
          <h1 className="rs-page-title">Backtesting</h1>
          <p className="rs-page-sub mt-1">
            Start by naming your first strategy. Then you&apos;ll create sessions, link them to this strategy, and run
            replay backtests with analytics per session and rolled up per strategy.
          </p>
        </header>
        <form onSubmit={createStrategy} className={`rs-card p-6 shadow-rs-soft border ${accentClass(variant, "border")}`}>
          <h2 className="text-sm font-semibold text-slate-100 mb-1 flex items-center gap-2">
            <Target className={`h-4 w-4 ${accentClass(variant, "text")}`} />
            Create strategy
          </h2>
          <p className="text-xs text-slate-500 mb-4">A strategy groups one or more backtest sessions.</p>
          <label className="block text-xs text-slate-400 mb-1">Strategy name</label>
          <input
            required
            value={strategyNameInput}
            onChange={(e) => setStrategyNameInput(e.target.value)}
            placeholder="e.g. London breakout v1"
            className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 mb-4"
          />
          <button
            type="submit"
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium ${accentClass(variant, "btn")}`}
          >
            Continue
            <ChevronRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    );
  }

  /* ——— Active session runner ——— */
  if (runnerSessionId && activeRunner) {
    return (
      <div className="space-y-6 animate-fade-in">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="rs-page-title">Session running</h1>
            <p className="rs-page-sub mt-1">
              {activeRunner.name} · {activeRunner.asset} · {activeRunner.durationMinutes} min · balance{" "}
              {activeRunner.initialBalance.toLocaleString()}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={cancelRunner}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800/50 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
            >
              <Square className="h-3.5 w-3.5" />
              Cancel
            </button>
            <button
              type="button"
              onClick={completeSession}
              disabled={runWarmup || !pendingSim}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium disabled:opacity-50 ${accentClass(variant, "btn")}`}
            >
              Complete session
            </button>
          </div>
        </header>

        <section className="rs-card p-5 shadow-rs-soft">
          <div className="flex items-center gap-2 mb-2">
            <LineChart className={`h-4 w-4 ${accentClass(variant, "text")}`} />
            <h2 className="text-sm font-semibold text-slate-100">Replay equity</h2>
          </div>
          <div className="h-72 w-full rounded-xl border border-slate-800 bg-slate-950/40">
            {runWarmup ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">Starting replay…</div>
            ) : runEquity.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={runEquity} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <defs>
                    <linearGradient id="btEq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={variant === "mock" ? "#a78bfa" : "#22d3ee"} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={variant === "mock" ? "#a78bfa" : "#22d3ee"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="step" tick={{ fontSize: 10, fill: "#64748b" }} stroke="#334155" />
                  <YAxis
                    domain={["auto", "auto"]}
                    tickFormatter={(v) => `${Number(v).toFixed(1)}%`}
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    stroke="#334155"
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      fontSize: "12px"
                    }}
                    formatter={(v: number) => [`${v.toFixed(2)}%`, "PnL %"]}
                  />
                  <Area type="monotone" dataKey="pct" stroke={variant === "mock" ? "#a78bfa" : "#22d3ee"} fill="url(#btEq)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </section>

        {!runWarmup && pendingSim && (
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <p className="text-xs text-slate-500">Trades (sim)</p>
              <p className="text-xl font-semibold text-slate-100 mt-1">{pendingSim.tradesTested}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <p className="text-xs text-slate-500">Win rate</p>
              <p className="text-xl font-semibold text-emerald-400 mt-1">{pendingSim.winRatePct.toFixed(1)}%</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <p className="text-xs text-slate-500">Avg R</p>
              <p className="text-xl font-semibold text-slate-100 mt-1">{pendingSim.avgRMultiple.toFixed(2)}R</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <p className="text-xs text-slate-500">Max DD</p>
              <p className="text-xl font-semibold text-red-400 mt-1">{pendingSim.maxDrawdownPct.toFixed(2)}%</p>
            </div>
          </section>
        )}
      </div>
    );
  }

  /* ——— Hub ——— */
  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="rs-page-title">Backtesting</h1>
          <p className="rs-page-sub mt-1">
            Strategies hold many sessions. Session analytics roll up into strategy analytics.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const name = strategyNameInput.trim();
              if (!name) return;
              const st: BacktestStrategy = { id: newId(), name, createdAt: new Date().toISOString() };
              persist([...strategies, st], sessions);
              setSelectedStrategyId(st.id);
              setStrategyNameInput("");
            }}
            className="flex flex-wrap items-center gap-2"
          >
            <input
              value={strategyNameInput}
              onChange={(e) => setStrategyNameInput(e.target.value)}
              placeholder="New strategy name"
              className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 min-w-[180px]"
            />
            <button
              type="submit"
              className={`inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-medium ${accentClass(variant, "btn")}`}
            >
              <Plus className="h-3.5 w-3.5" />
              Add strategy
            </button>
          </form>
          <button
            type="button"
            onClick={openNewSessionForm}
            className={`inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-medium ${accentClass(variant, "btn")}`}
          >
            <FlaskConical className="h-3.5 w-3.5" />
            New session
          </button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 px-1">Strategies</p>
          <nav className="flex flex-col gap-1">
            {strategies.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedStrategyId(st.id)}
                className={`rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                  st.id === selectedStrategyId
                    ? variant === "mock"
                      ? "border border-violet-500/35 bg-violet-500/10 text-violet-100"
                      : "border border-cyan-500/35 bg-cyan-500/10 text-cyan-100"
                    : "border border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                {st.name}
              </button>
            ))}
          </nav>
        </aside>

        <div className="space-y-6 min-w-0">
          {selectedStrategy && rollup && (
            <>
              <section className={`rs-card p-5 shadow-rs-soft border ${accentClass(variant, "border")}`}>
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className={`h-4 w-4 ${accentClass(variant, "text")}`} />
                  <h2 className="text-sm font-semibold text-slate-100">Strategy analytics</h2>
                  <span className="text-xs text-slate-500">({selectedStrategy.name})</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Metric label="Sessions" value={String(rollup.sessionCount)} />
                  <Metric label="Completed" value={String(rollup.completedCount)} />
                  <Metric
                    label="Avg win rate"
                    value={rollup.avgWinRatePct != null ? `${rollup.avgWinRatePct.toFixed(1)}%` : "—"}
                  />
                  <Metric
                    label="Avg max DD"
                    value={rollup.avgMaxDdPct != null ? `${rollup.avgMaxDdPct.toFixed(2)}%` : "—"}
                  />
                  <Metric
                    label="Best session PnL"
                    value={rollup.bestNetPnlPct != null ? `${rollup.bestNetPnlPct >= 0 ? "+" : ""}${rollup.bestNetPnlPct.toFixed(2)}%` : "—"}
                  />
                  <Metric
                    label="Worst session PnL"
                    value={rollup.worstNetPnlPct != null ? `${rollup.worstNetPnlPct.toFixed(2)}%` : "—"}
                  />
                  <Metric label="Total trades (all sessions)" value={String(rollup.totalTrades)} />
                </div>
              </section>

              <section className="rs-card p-5 shadow-rs-soft">
                <h2 className="text-sm font-semibold text-slate-100 mb-4">Sessions</h2>
                {strategySessions.length === 0 ? (
                  <p className="text-sm text-slate-500">No sessions yet. Create one and link it to this strategy.</p>
                ) : (
                  <ul className="space-y-2">
                    {strategySessions.map((sess) => (
                      <li
                        key={sess.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/30 px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-100">{sess.name}</p>
                          <p className="text-xs text-slate-500">
                            {sess.asset} · {sess.durationMinutes} min · bal {sess.initialBalance.toLocaleString()} ·{" "}
                            <span className="capitalize">{sess.status}</span>
                          </p>
                          {sess.status === "completed" && sess.netPnlPct != null && (
                            <p className="text-xs text-slate-400 mt-1">
                              PnL {sess.netPnlPct >= 0 ? "+" : ""}
                              {sess.netPnlPct.toFixed(2)}% · WR {sess.winRatePct?.toFixed(1)}% · DD{" "}
                              {sess.maxDrawdownPct?.toFixed(2)}%
                            </p>
                          )}
                        </div>
                        {sess.status === "draft" && (
                          <button
                            type="button"
                            onClick={() => startSession(sess.id)}
                            className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium ${accentClass(variant, "btn")}`}
                          >
                            <Play className="h-3.5 w-3.5" />
                            Start backtest
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </div>

      {sessionFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog">
          <form
            onSubmit={submitSession}
            className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-950 p-6 shadow-xl"
          >
            <h2 className="text-lg font-semibold text-slate-100 mb-1">New session</h2>
            <p className="text-xs text-slate-500 mb-4">Link this session to a strategy, then start the replay when ready.</p>

            <label className="block text-xs text-slate-400 mb-1">Session name</label>
            <input
              required
              value={sfName}
              onChange={(e) => setSfName(e.target.value)}
              className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm"
            />

            <label className="block text-xs text-slate-400 mb-1">Duration (minutes)</label>
            <input
              type="number"
              min={5}
              max={1440}
              value={sfDuration}
              onChange={(e) => setSfDuration(Number(e.target.value))}
              className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm"
            />

            <label className="block text-xs text-slate-400 mb-1">Asset</label>
            <select
              value={sfAsset}
              onChange={(e) => setSfAsset(e.target.value)}
              className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm"
            >
              {ASSETS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>

            <label className="block text-xs text-slate-400 mb-1">Initial balance</label>
            <input
              type="number"
              min={100}
              step={100}
              value={sfBalance}
              onChange={(e) => setSfBalance(Number(e.target.value))}
              className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm"
            />

            <label className="block text-xs text-slate-400 mb-1">Strategy</label>
            <select
              value={sfStrategyId ?? ""}
              onChange={(e) => setSfStrategyId(e.target.value || null)}
              className="mb-6 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm"
            >
              {strategies.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSessionFormOpen(false)}
                className="rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`rounded-lg border px-3 py-2 text-xs font-medium ${accentClass(variant, "btn")}`}
              >
                Create session
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-800/40 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-semibold text-slate-100 mt-0.5">{value}</p>
    </div>
  );
}
