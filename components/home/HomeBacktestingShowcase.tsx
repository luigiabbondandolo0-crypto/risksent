"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, LineChart, Plus } from "lucide-react";
import { ReplayChart } from "@/components/backtesting/ReplayChart";
import { bt } from "@/components/backtesting/btClasses";
import {
  buildHomeMockCandles,
  HOME_MOCK_ENTRY,
  HOME_MOCK_SL,
  HOME_MOCK_TP
} from "@/components/home/mockBtCandles";

/** Dashboard-style preview only (e.g. `/backtest` marketing page). */
export function HomeBacktestingDashboardPreview() {
  return (
    <motion.div
      initial={false}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 shadow-xl"
    >
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-lg font-extrabold tracking-tight text-white sm:text-xl">
            Backtesting
          </h3>
          <p className={bt.sub}>Strategies, sessions, and replay analytics.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`${bt.btnPrimary} pointer-events-none cursor-default py-2 text-xs opacity-90`}>
            <Plus className="h-3.5 w-3.5" />
            New strategy
          </span>
          <span className={`${bt.btnGhost} pointer-events-none cursor-default py-2 text-xs`}>
            <LineChart className="h-3.5 w-3.5" />
            New session
          </span>
        </div>
      </header>

      <div className={`${bt.card} !p-4`}>
        <div className="flex w-full items-start justify-between gap-3 text-left">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
              <h4 className="truncate font-[family-name:var(--font-display)] text-base font-bold text-white">
                London breakout v2
              </h4>
            </div>
            <p className="mt-1 pl-6 text-[11px] text-slate-500 font-[family-name:var(--font-mono)]">
              Mean reversion after Asia range.
            </p>
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-x-3 gap-y-1 text-right text-[10px] font-[family-name:var(--font-mono)] sm:grid-cols-4 sm:gap-x-4">
            <span className="text-slate-500">Sessions</span>
            <span className="text-slate-200">8</span>
            <span className="text-slate-500">Win rate</span>
            <span className="text-[#00e676]">56.2%</span>
            <span className="text-slate-500">Avg R:R</span>
            <span className="text-slate-200">1.35</span>
            <span className="text-slate-500">P&amp;L</span>
            <span className="text-[#00e676]">+412</span>
          </div>
        </div>

        <div className="mt-4 space-y-2 border-t border-white/[0.06] pt-4 pl-1">
          <div className="mb-2 flex justify-end">
            <span className="text-[11px] font-[family-name:var(--font-mono)] text-[#ff3c3c] underline decoration-[#ff3c3c]/50">
              + Session for this strategy
            </span>
          </div>
          <ul className="space-y-2">
            <li className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-black/25 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-slate-200">June momentum sweep</p>
                <p className="text-[11px] text-slate-500 font-[family-name:var(--font-mono)]">
                  EURUSD · 2024-06-01 → 2024-06-28 · completed
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-lg border border-[#ff3c3c]/40 bg-[#ff3c3c]/10 px-3 py-1.5 text-[11px] font-medium text-[#ff3c3c]">
                  Replay
                </span>
                <span className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] text-slate-400">
                  Summary
                </span>
              </div>
            </li>
            <li className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-black/25 px-3 py-2 opacity-70">
              <div>
                <p className="text-sm font-medium text-slate-200">May range test</p>
                <p className="text-[11px] text-slate-500 font-[family-name:var(--font-mono)]">
                  GBPUSD · 2024-05-01 → 2024-05-20 · completed
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-lg border border-[#ff3c3c]/40 bg-[#ff3c3c]/10 px-3 py-1.5 text-[11px] font-medium text-[#ff3c3c]">
                  Replay
                </span>
                <span className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] text-slate-400">
                  Summary
                </span>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <p className="mt-3 text-center text-[10px] font-mono text-slate-600">Preview · same layout as the app dashboard</p>
    </motion.div>
  );
}

/** Full marketing block: session replay + dashboard preview (e.g. if reused elsewhere). */
export function HomeBacktestingShowcase() {
  const candles = useMemo(() => buildHomeMockCandles(), []);
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");

  return (
    <div className="w-full space-y-4">
      <motion.div
        initial={false}
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className="rounded-2xl border border-white/[0.08] bg-black/40 p-4 shadow-xl shadow-black/40"
        style={{ boxShadow: "0 0 0 1px rgba(34,211,238,0.06), 0 20px 50px rgba(0,0,0,0.45)" }}
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Session replay</p>
            <p className="font-[family-name:var(--font-display)] text-sm font-bold text-white">EURUSD · M15</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSide("BUY")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                side === "BUY"
                  ? "bg-[#00e676]/20 text-[#00e676] ring-1 ring-[#00e676]/50"
                  : "border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white"
              }`}
            >
              Buy
            </button>
            <button
              type="button"
              onClick={() => setSide("SELL")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                side === "SELL"
                  ? "bg-[#ff3c3c]/20 text-[#ff3c3c] ring-1 ring-[#ff3c3c]/50"
                  : "border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white"
              }`}
            >
              Sell
            </button>
          </div>
        </div>
        <div className="h-[220px] w-full sm:h-[260px]">
          <ReplayChart
            candles={candles}
            entryPrice={HOME_MOCK_ENTRY}
            stopLoss={side === "BUY" ? HOME_MOCK_SL : HOME_MOCK_TP}
            takeProfit={side === "BUY" ? HOME_MOCK_TP : HOME_MOCK_SL}
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Trades", val: "12" },
            { label: "Win rate", val: "58.3%", accent: "#00e676" },
            { label: "Net P&L", val: "+142", accent: "#00e676" },
            { label: "Avg R:R", val: "1.42" }
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-2.5 py-2 text-center"
            >
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">{s.label}</p>
              <p
                className="mt-0.5 text-sm font-bold text-white font-[family-name:var(--font-display)]"
                style={s.accent ? { color: s.accent } : undefined}
              >
                {s.val}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      <HomeBacktestingDashboardPreview />
    </div>
  );
}
