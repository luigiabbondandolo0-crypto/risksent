"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Plus, Lock } from "lucide-react";
import { MOCK_TRADES, MOCK_JOURNAL_STATS, MOCK_EQUITY_CURVE } from "@/lib/demo/mockData";
import { DemoActionModal } from "./DemoActionModal";
import { useDemoAction } from "@/hooks/useDemoAction";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const VISIBLE_ROWS = 10;
const BLURRED_ROWS = 5;

export function DemoJournaling() {
  const { interceptAction, modalOpen, actionLabel, closeModal } = useDemoAction();

  const s = MOCK_JOURNAL_STATS;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-5"
      >
        {[
          { label: "Total Trades", value: s.totalTrades.toString() },
          { label: "Win Rate", value: `${s.winRate}%` },
          { label: "Avg R:R", value: `${s.avgRR}` },
          { label: "Total P&L", value: `+€${s.totalPnl}` },
          { label: "Max DD", value: `${s.maxDd}%` },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{item.label}</p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-white">{item.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Equity curve */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"
      >
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-slate-500">Equity Curve</p>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MOCK_EQUITY_CURVE} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="demoJEq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00e676" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#00e676" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} interval={7} />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} />
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

      {/* Trades table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
          <p className="font-mono text-xs uppercase tracking-widest text-slate-500">
            Sample Trades — 15 of {s.totalTrades}
          </p>
          <button
            onClick={() => interceptAction(() => {}, "log a trade")}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.09] bg-white/[0.03] px-3 py-1.5 text-xs font-mono text-slate-400 transition-all hover:text-slate-200"
          >
            <Plus className="h-3 w-3" />
            Add trade
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-xs font-mono">
            <thead>
              <tr className="border-b border-white/[0.05]">
                {["Date", "Symbol", "Side", "Lots", "Entry", "Exit", "P&L", "R:R"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left font-normal uppercase tracking-wider text-slate-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_TRADES.slice(0, VISIBLE_ROWS).map((t) => (
                <tr key={t.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
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
                  <td className={`px-4 py-2.5 ${t.rr >= 0 ? "text-slate-300" : "text-red-400"}`}>{t.rr}</td>
                </tr>
              ))}

              {/* Blurred rows */}
              {MOCK_TRADES.slice(VISIBLE_ROWS, VISIBLE_ROWS + BLURRED_ROWS).map((t) => (
                <tr key={t.id} className="relative border-b border-white/[0.04]" style={{ filter: "blur(5px)", userSelect: "none" }}>
                  <td className="px-4 py-2.5 text-slate-400">{t.date}</td>
                  <td className="px-4 py-2.5 font-bold text-white">{t.symbol}</td>
                  <td className="px-4 py-2.5 text-slate-300">{t.direction.toUpperCase()}</td>
                  <td className="px-4 py-2.5 text-slate-300">{t.lots}</td>
                  <td className="px-4 py-2.5 text-slate-300">{t.entry}</td>
                  <td className="px-4 py-2.5 text-slate-300">{t.exit}</td>
                  <td className="px-4 py-2.5 text-slate-300">+€{Math.abs(t.pnl).toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-slate-300">{Math.abs(t.rr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Unlock CTA */}
        <button
          onClick={() => interceptAction(() => {}, "view all your real trades")}
          className="flex w-full items-center justify-center gap-2 border-t border-white/[0.05] py-4 text-sm font-mono text-slate-400 transition-colors hover:text-slate-200"
        >
          <Lock className="h-3.5 w-3.5" />
          Unlock all {s.totalTrades} trades — Start free trial
        </button>
      </motion.div>

      <DemoActionModal open={modalOpen} action={actionLabel} onClose={closeModal} />
    </div>
  );
}
