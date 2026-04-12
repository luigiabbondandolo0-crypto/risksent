"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { TrendingUp, TrendingDown, Plus, X, Tag } from "lucide-react";
import {
  MOCK_TRADES, MOCK_JOURNAL_STATS, MOCK_EQUITY_CURVE,
  MOCK_PNL_BY_SYMBOL, MOCK_PNL_BY_DOW,
  type MockTrade,
} from "@/lib/demo/mockData";
import { DemoActionModal } from "./DemoActionModal";
import { useDemoAction } from "@/hooks/useDemoAction";

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

export function DemoJournaling() {
  const { interceptAction, modalOpen, actionLabel, closeModal } = useDemoAction();
  const [selectedTrade, setSelectedTrade] = useState<MockTrade | null>(null);
  const s = MOCK_JOURNAL_STATS;

  return (
    <div className="space-y-5">

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
      >
        {[
          { label: "Total Trades",   value: s.totalTrades.toString() },
          { label: "Win Rate",       value: `${s.winRate}%` },
          { label: "Avg R:R",        value: `${s.avgRR}` },
          { label: "Profit Factor",  value: `${s.profitFactor}` },
          { label: "Total P&L",      value: `+€${s.totalPnl.toLocaleString()}` },
          { label: "Max DD",         value: `${s.maxDd}%` },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{item.label}</p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-white">{item.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Equity curve */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05, ease }}
        className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"
      >
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          <p className="font-mono text-sm text-slate-300">Equity Curve — 3 Months</p>
          <span className="ml-auto rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
            +24.5%
          </span>
        </div>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MOCK_EQUITY_CURVE} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="demoJEq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00e676" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#00e676" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} interval={9} />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `€${(v/1000).toFixed(1)}k`} />
              <Tooltip
                contentStyle={{ background: "#0e0e12", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontFamily: "monospace", fontSize: 12 }}
                labelStyle={{ color: "#94a3b8" }}
                itemStyle={{ color: "#00e676" }}
                formatter={(v: number) => [`€${v.toLocaleString()}`, "Equity"]}
              />
              <Area type="monotone" dataKey="value" stroke="#00e676" strokeWidth={2} fill="url(#demoJEq)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Charts row: P&L by symbol + P&L by day */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease }}
          className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"
        >
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-slate-500">P&L by Symbol</p>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_PNL_BY_SYMBOL} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `€${v}`} />
                <YAxis type="category" dataKey="symbol" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={52} />
                <Tooltip
                  contentStyle={{ background: "#0e0e12", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontFamily: "monospace", fontSize: 12 }}
                  formatter={(v: number) => [`+€${v}`, "Net P&L"]}
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                />
                <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
                  {MOCK_PNL_BY_SYMBOL.map((_, i) => (
                    <Cell key={i} fill={["#00e676","#00b0ff","#ff3c3c","#ff8c00","#a78bfa","#34d399"][i % 6]} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.11, ease }}
          className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"
        >
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-slate-500">P&L by Day of Week</p>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_PNL_BY_DOW} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `€${v}`} />
                <Tooltip
                  contentStyle={{ background: "#0e0e12", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontFamily: "monospace", fontSize: 12 }}
                  formatter={(v: number) => [v >= 0 ? `+€${v}` : `€${v}`, "P&L"]}
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {MOCK_PNL_BY_DOW.map((entry, i) => (
                    <Cell key={i} fill={entry.pnl >= 0 ? "#00e676" : "#ff3c3c"} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Trades table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.14, ease }}
        className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-slate-500">Trade Log</p>
            <p className="font-mono text-[10px] text-slate-600 mt-0.5">Showing last 30 of {s.totalTrades} trades</p>
          </div>
          <button
            onClick={() => interceptAction(() => {}, "log a trade")}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.09] bg-white/[0.03] px-3 py-1.5 text-xs font-mono text-slate-400 transition-all hover:text-slate-200"
          >
            <Plus className="h-3 w-3" />
            Add trade
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-xs font-mono">
            <thead>
              <tr className="border-b border-white/[0.05]">
                {["Date", "Symbol", "Side", "Lots", "Entry", "Exit", "P&L", "R:R", "Tags"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left font-normal uppercase tracking-wider text-slate-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_TRADES.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => setSelectedTrade(t)}
                  className="cursor-pointer border-b border-white/[0.04] hover:bg-white/[0.025] transition-colors"
                >
                  <td className="px-4 py-2.5 text-slate-400">{t.date}</td>
                  <td className="px-4 py-2.5 font-bold text-white">{t.symbol}</td>
                  <td className="px-4 py-2.5">
                    <span className={`flex items-center gap-1 ${t.direction === "buy" ? "text-emerald-400" : "text-red-400"}`}>
                      {t.direction === "buy" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {t.direction.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-300">{t.lots}</td>
                  <td className="px-4 py-2.5 text-slate-300">{t.entry}</td>
                  <td className="px-4 py-2.5 text-slate-300">{t.exit}</td>
                  <td className={`px-4 py-2.5 font-bold ${t.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {t.pnl >= 0 ? "+" : ""}€{t.pnl.toFixed(2)}
                  </td>
                  <td className={`px-4 py-2.5 ${t.rr >= 0 ? "text-slate-300" : "text-red-400"}`}>{t.rr}R</td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {t.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="rounded-full border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-slate-400">{tag}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Trade detail modal */}
      <AnimatePresence>
        {selectedTrade && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedTrade(null)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.22, ease }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="relative w-full max-w-md rounded-2xl border p-6 shadow-2xl"
                style={{ background: "#0e0e12", borderColor: "rgba(255,255,255,0.08)" }}
              >
                <button
                  onClick={() => setSelectedTrade(null)}
                  className="absolute right-4 top-4 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <span className="font-[family-name:var(--font-display)] text-xl font-black text-white">{selectedTrade.symbol}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${selectedTrade.direction === "buy" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                    {selectedTrade.direction.toUpperCase()}
                  </span>
                  <span className={`ml-auto font-[family-name:var(--font-display)] text-lg font-bold ${selectedTrade.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {selectedTrade.pnl >= 0 ? "+" : ""}€{selectedTrade.pnl.toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    ["Date",     selectedTrade.date],
                    ["Duration", selectedTrade.duration],
                    ["Open",     selectedTrade.openTime],
                    ["Close",    selectedTrade.closeTime],
                    ["Entry",    selectedTrade.entry.toString()],
                    ["Exit",     selectedTrade.exit.toString()],
                    ["SL",       selectedTrade.sl.toString()],
                    ["TP",       selectedTrade.tp.toString()],
                    ["Lots",     selectedTrade.lots.toString()],
                    ["R:R",      `${selectedTrade.rr}R`],
                  ].map(([label, val]) => (
                    <div key={label} className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2">
                      <p className="font-mono text-[10px] text-slate-600">{label}</p>
                      <p className="font-mono text-xs font-bold text-white">{val}</p>
                    </div>
                  ))}
                </div>

                {selectedTrade.tags.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-slate-500 mt-0.5 shrink-0" />
                    {selectedTrade.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-mono text-slate-300">{tag}</span>
                    ))}
                  </div>
                )}

                {selectedTrade.notes && (
                  <div className="rounded-xl border border-white/[0.05] bg-white/[0.01] px-3 py-2.5">
                    <p className="font-mono text-[10px] text-slate-600 mb-1">Notes</p>
                    <p className="font-mono text-xs text-slate-400 leading-relaxed">{selectedTrade.notes}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <DemoActionModal open={modalOpen} action={actionLabel} onClose={closeModal} />
    </div>
  );
}
