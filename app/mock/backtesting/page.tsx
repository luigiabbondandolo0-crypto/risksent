"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  FlaskConical,
  Layers,
  Pencil,
  Play,
  Plus,
  Trash2,
  TrendingUp,
  BarChart2,
} from "lucide-react";

type MockSession = {
  id: string;
  name: string;
  symbol: string;
  timeframe: string;
  initial_balance: number;
  current_balance: number;
  status: "active" | "completed" | "paused";
  trades: number;
  winRate: number;
};

type MockStrategy = {
  id: string;
  name: string;
  description: string;
  sessions: MockSession[];
};

const MOCK_STRATEGIES: MockStrategy[] = [
  {
    id: "mock-str-1",
    name: "London breakout",
    description: "Trade highs/lows of the Asian range at London open.",
    sessions: [
      {
        id: "mock-sess-1",
        name: "EURUSD — May 2025",
        symbol: "EURUSD",
        timeframe: "M15",
        initial_balance: 10_000,
        current_balance: 11_240,
        status: "completed",
        trades: 42,
        winRate: 57,
      },
      {
        id: "mock-sess-2",
        name: "GBPUSD — Q2",
        symbol: "GBPUSD",
        timeframe: "H1",
        initial_balance: 10_000,
        current_balance: 10_680,
        status: "active",
        trades: 18,
        winRate: 50,
      },
    ],
  },
  {
    id: "mock-str-2",
    name: "NY reversal",
    description: "Reversal setups at NY session open on liquidity sweeps.",
    sessions: [
      {
        id: "mock-sess-3",
        name: "USDJPY — April 2025",
        symbol: "USDJPY",
        timeframe: "M30",
        initial_balance: 10_000,
        current_balance: 9_420,
        status: "completed",
        trades: 28,
        winRate: 43,
      },
    ],
  },
];

function statusColor(s: MockSession["status"]) {
  if (s === "active") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (s === "completed") return "border-slate-600/60 bg-slate-700/20 text-slate-300";
  return "border-amber-500/30 bg-amber-500/10 text-amber-300";
}

function SessionRow({ s }: { s: MockSession }) {
  const pnl = s.current_balance - s.initial_balance;
  const pnlPct = (pnl / s.initial_balance) * 100;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-slate-100 truncate">{s.name}</p>
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase ${statusColor(s.status)}`}>
            {s.status}
          </span>
        </div>
        <p className="mt-0.5 font-mono text-[11px] text-slate-500">
          {s.symbol} · {s.timeframe} · {s.trades} trades · {s.winRate}% win
        </p>
      </div>
      <div className="text-right">
        <p className={`font-mono text-sm font-semibold ${pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {pnl >= 0 ? "+" : ""}
          {pnl.toFixed(2)} ({pnlPct >= 0 ? "+" : ""}
          {pnlPct.toFixed(2)}%)
        </p>
        <p className="font-mono text-[10px] text-slate-600">
          {s.current_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Link
          href={`/mock/backtesting/session/${s.id}/replay`}
          className="flex items-center gap-1 rounded-lg border border-[#6366f1]/30 bg-[#6366f1]/10 px-2.5 py-1.5 text-[11px] font-mono text-[#a5b4fc] hover:bg-[#6366f1]/20"
        >
          <Play className="h-3 w-3" />
          Replay
        </Link>
        <Link
          href={`/mock/backtesting/session/${s.id}/replay`}
          className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-mono text-slate-300 hover:bg-white/[0.06]"
        >
          <BarChart2 className="h-3 w-3" />
          Results
        </Link>
      </div>
    </div>
  );
}

function StrategyCard({ strategy }: { strategy: MockStrategy }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="rs-card overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#6366f1]/15">
          <Layers className="h-4 w-4 text-[#818cf8]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-bold text-white truncate">{strategy.name}</p>
          <p className="mt-0.5 font-mono text-[11px] text-slate-500 truncate">{strategy.description}</p>
        </div>
        <div className="hidden md:flex items-center gap-4 mr-3">
          <div className="text-right">
            <p className="font-mono text-sm font-semibold text-slate-200">{strategy.sessions.length}</p>
            <p className="font-mono text-[10px] text-slate-600">sessions</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="cursor-not-allowed rounded-lg p-1.5 text-slate-700"
            title="Disabled in demo"
          >
            <Pencil className="h-3.5 w-3.5" />
          </span>
          <span
            className="cursor-not-allowed rounded-lg p-1.5 text-slate-700"
            title="Disabled in demo"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </span>
          <ChevronDown
            className={`h-4 w-4 text-slate-500 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="sessions"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/[0.06]"
          >
            <div className="space-y-2 px-5 py-4">
              {strategy.sessions.map((s) => (
                <SessionRow key={s.id} s={s} />
              ))}
              <span
                className="mt-1 inline-flex cursor-not-allowed items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs font-mono text-slate-500"
                title="Disabled in demo"
              >
                <Plus className="h-3.5 w-3.5" />
                New session
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MockBacktestingPage() {
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h1 className="rs-page-title">Backtesting Lab</h1>
          <p className="rs-page-sub">
            Demo — showing sample strategies and sessions. Create real ones after sign up.
          </p>
        </div>
        <span
          className="inline-flex cursor-not-allowed items-center gap-2 self-start rounded-xl bg-slate-800/50 px-4 py-2.5 font-mono text-sm font-semibold text-slate-500 sm:self-auto"
          title="Disabled in demo"
        >
          <Plus className="h-4 w-4" />
          New Strategy
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        {MOCK_STRATEGIES.map((strategy) => (
          <StrategyCard key={strategy.id} strategy={strategy} />
        ))}
      </motion.div>

      <div className="flex items-center justify-center gap-2 rounded-2xl border border-[#6366f1]/20 bg-[#6366f1]/[0.05] px-4 py-4 text-sm font-mono text-[#a5b4fc]">
        <TrendingUp className="h-4 w-4" />
        <span>
          Try the full backtesting with real data —{" "}
          <Link href="/pricing" className="underline underline-offset-2 hover:text-white">
            start your free trial
          </Link>
          .
        </span>
        <FlaskConical className="h-4 w-4" />
      </div>
    </div>
  );
}
