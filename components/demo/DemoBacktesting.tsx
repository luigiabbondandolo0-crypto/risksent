"use client";

import { motion } from "framer-motion";
import { Plus, CheckCircle } from "lucide-react";
import { MOCK_BT_SESSIONS } from "@/lib/demo/mockData";
import { DemoActionModal } from "./DemoActionModal";
import { useDemoAction } from "@/hooks/useDemoAction";

export function DemoBacktesting() {
  const { interceptAction, modalOpen, actionLabel, closeModal } = useDemoAction();

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1
            className="font-[family-name:var(--font-display)] text-2xl font-bold text-white"
          >
            Backtesting
          </h1>
          <p className="mt-1 font-mono text-sm text-slate-500">
            2 sample sessions shown in demo mode
          </p>
        </div>
        <button
          onClick={() => interceptAction(() => {}, "create a new backtesting session")}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-black transition-all hover:scale-[1.02]"
          style={{ background: "linear-gradient(135deg, #ff3c3c, #ff8c00)" }}
        >
          <Plus className="h-4 w-4" />
          New session
        </button>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2">
        {MOCK_BT_SESSIONS.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.07 }}
            className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"
          >
            <div className="flex items-start justify-between gap-2 mb-4">
              <div>
                <p className="font-bold text-white">{s.name}</p>
                <p className="font-mono text-xs text-slate-500 mt-0.5">
                  {s.dateFrom} — {s.dateTo}
                </p>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
                <CheckCircle className="h-3 w-3" />
                {s.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <Metric label="Trades" value={s.totalTrades.toString()} />
              <Metric label="Win Rate" value={`${s.winRate}%`} />
              <Metric label="Profit Factor" value={`${s.profitFactor}`} />
              <Metric label="Max DD" value={`${s.maxDd}%`} />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Return</p>
                <p className="font-[family-name:var(--font-display)] text-lg font-bold text-emerald-400">
                  +{(((s.finalBalance - s.initialBalance) / s.initialBalance) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Net P&L</p>
                <p className="font-[family-name:var(--font-display)] text-lg font-bold text-white">
                  +€{(s.finalBalance - s.initialBalance).toLocaleString()}
                </p>
              </div>
            </div>

            <button
              onClick={() => interceptAction(() => {}, "view this backtesting session")}
              className="mt-3 w-full rounded-xl border border-white/[0.07] py-2 font-mono text-xs text-slate-400 transition-colors hover:text-slate-200"
            >
              View session
            </button>
          </motion.div>
        ))}
      </div>

      <DemoActionModal open={modalOpen} action={actionLabel} onClose={closeModal} />
    </div>
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
