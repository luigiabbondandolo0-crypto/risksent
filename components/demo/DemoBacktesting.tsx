"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, CheckCircle, Activity, ChevronLeft } from "lucide-react";
import { MOCK_BT_SESSIONS } from "@/lib/demo/mockData";
import { DemoActionModal } from "./DemoActionModal";
import { useDemoAction } from "@/hooks/useDemoAction";

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

type Session = typeof MOCK_BT_SESSIONS[number];

const STATUS_STYLE: Record<string, string> = {
  completed: "bg-emerald-500/15 text-emerald-400",
  active:    "bg-cyan-500/15 text-cyan-400",
};

const TF_COLOR: Record<string, string> = {
  M5:  "border-cyan-500/30 text-cyan-400",
  H1:  "border-amber-500/30 text-amber-400",
  M15: "border-purple-500/30 text-purple-400",
};

export function DemoBacktesting() {
  const { interceptAction, modalOpen, actionLabel, closeModal } = useDemoAction();
  const [activeSession, setActiveSession] = useState<Session | null>(null);

  return (
    <>
      <AnimatePresence mode="wait">
        {activeSession ? (
          <SessionDetail
            key="detail"
            session={activeSession}
            onBack={() => setActiveSession(null)}
            interceptAction={interceptAction}
          />
        ) : (
          <SessionList
            key="list"
            onSelect={setActiveSession}
            interceptAction={interceptAction}
          />
        )}
      </AnimatePresence>

      <DemoActionModal open={modalOpen} action={actionLabel} onClose={closeModal} />
    </>
  );
}

function SessionList({
  onSelect,
  interceptAction,
}: {
  onSelect: (s: Session) => void;
  interceptAction: (fn: () => void, label?: string) => void;
}) {
  return (
    <motion.div
      key="list"
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease }}
      className="space-y-5"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">Backtesting</h1>
          <p className="mt-1 font-mono text-sm text-slate-500">3 strategy sessions · click to explore</p>
        </div>
        <button
          onClick={() => interceptAction(() => {}, "create a new backtesting session")}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-black transition-all hover:scale-[1.02]"
          style={{ background: "linear-gradient(135deg, #ff3c3c, #ff8c00)" }}
        >
          <Plus className="h-4 w-4" />
          New session
        </button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Runs",    value: "3" },
          { label: "Best Return",   value: "+18.4%" },
          { label: "Best Win Rate", value: "71.2%" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{item.label}</p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-white">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MOCK_BT_SESSIONS.map((s, i) => {
          const returnPct = (((s.finalBalance - s.initialBalance) / s.initialBalance) * 100).toFixed(1);
          const netPnl = (s.finalBalance - s.initialBalance).toLocaleString();
          return (
            <motion.button
              key={s.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.07, ease }}
              whileHover={{ y: -6, transition: { type: "spring", stiffness: 420, damping: 26 } }}
              onClick={() => onSelect(s)}
              className="flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 text-left transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
            >
              <div className="flex items-start justify-between gap-2 mb-4">
                <div>
                  <p className="font-bold text-white">{s.name}</p>
                  <p className="font-mono text-xs text-slate-500 mt-0.5">{s.dateFrom} — {s.dateTo}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${STATUS_STYLE[s.status]}`}>
                    {s.status === "active" ? <Activity className="h-2.5 w-2.5" /> : <CheckCircle className="h-2.5 w-2.5" />}
                    {s.status}
                  </span>
                  <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-mono ${TF_COLOR[s.timeframe] ?? "border-white/10 text-slate-400"}`}>
                    {s.symbol} {s.timeframe}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <Metric label="Trades"         value={s.totalTrades.toString()} />
                <Metric label="Win Rate"        value={`${s.winRate}%`} />
                <Metric label="Profit Factor"   value={`${s.profitFactor}`} />
                <Metric label="Max DD"          value={`${s.maxDd}%`} />
              </div>

              <div className="mt-auto rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Return</p>
                  <p className="font-[family-name:var(--font-display)] text-lg font-bold text-emerald-400">+{returnPct}%</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Net P&L</p>
                  <p className="font-[family-name:var(--font-display)] text-lg font-bold text-white">+€{netPnl}</p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

function SessionDetail({
  session,
  onBack,
  interceptAction,
}: {
  session: Session;
  onBack: () => void;
  interceptAction: (fn: () => void, label?: string) => void;
}) {
  const returnPct = (((session.finalBalance - session.initialBalance) / session.initialBalance) * 100).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.35, ease }}
      className="space-y-5"
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 font-mono text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">{session.name}</h1>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-mono font-bold ${STATUS_STYLE[session.status]}`}>
            {session.status}
          </span>
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-mono ${TF_COLOR[session.timeframe] ?? ""}`}>
            {session.symbol} · {session.timeframe}
          </span>
        </div>
        <p className="mt-1 font-mono text-sm text-slate-500">{session.dateFrom} — {session.dateTo}</p>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Return",        value: `+${returnPct}%`,             color: "text-emerald-400" },
          { label: "Net P&L",       value: `+€${(session.finalBalance - session.initialBalance).toLocaleString()}`, color: "text-emerald-400" },
          { label: "Win Rate",      value: `${session.winRate}%`,         color: "text-cyan-400" },
          { label: "Profit Factor", value: `${session.profitFactor}`,     color: "text-amber-400" },
          { label: "Total Trades",  value: session.totalTrades.toString(), color: "text-white" },
          { label: "Avg R:R",       value: `${session.avgRR}`,            color: "text-white" },
          { label: "Max DD",        value: `${session.maxDd}%`,           color: "text-orange-400" },
          { label: "Final Balance", value: `€${session.finalBalance.toLocaleString()}`, color: "text-white" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{item.label}</p>
            <p className={`mt-1 font-[family-name:var(--font-display)] text-lg font-bold ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => interceptAction(() => {}, "view the replay for this session")}
          className="flex items-center gap-1.5 rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-2 text-sm font-mono text-slate-300 transition-all hover:text-white"
        >
          View replay
        </button>
        <button
          onClick={() => interceptAction(() => {}, "export session results")}
          className="flex items-center gap-1.5 rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-2 text-sm font-mono text-slate-300 transition-all hover:text-white"
        >
          Export results
        </button>
        <button
          onClick={() => interceptAction(() => {}, "run a new session with these settings")}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-black transition-all hover:scale-[1.02]"
          style={{ background: "linear-gradient(135deg, #ff3c3c, #ff8c00)" }}
        >
          <Plus className="h-3.5 w-3.5" />
          Run new session
        </button>
      </div>
    </motion.div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/[0.04] bg-white/[0.01] px-3 py-2">
      <p className="font-mono text-[10px] text-slate-600">{label}</p>
      <p className="font-mono text-sm font-bold text-white">{value}</p>
    </div>
  );
}
