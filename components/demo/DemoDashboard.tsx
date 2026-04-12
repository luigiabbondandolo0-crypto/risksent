"use client";

import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle, ShieldCheck, BarChart2 } from "lucide-react";
import {
  MOCK_DASHBOARD,
  MOCK_EQUITY_CURVE,
  MOCK_ALERTS,
  MOCK_RISK_RULES,
} from "@/lib/demo/mockData";
import { DemoActionModal } from "./DemoActionModal";
import { useDemoAction } from "@/hooks/useDemoAction";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

export function DemoDashboard() {
  const { interceptAction, modalOpen, actionLabel, closeModal } = useDemoAction();

  const d = MOCK_DASHBOARD;

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <motion.div {...fadeUp(0)} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Balance" value={`€${d.balance.toLocaleString()}`} sub="Demo account" color="text-white" />
        <StatCard label="Daily P&L" value={`+€${d.dailyPnl}`} sub={`+${d.dailyPnlPct}%`} color="text-emerald-400" />
        <StatCard label="Win Rate" value={`${d.winRate}%`} sub={`${d.totalTrades} trades`} color="text-cyan-400" />
        <StatCard label="Profit Factor" value={`${d.profitFactor}`} sub={`Avg RR ${d.avgRR}`} color="text-amber-400" />
      </motion.div>

      {/* Equity curve */}
      <motion.div {...fadeUp(0.05)} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          <span className="font-mono text-sm text-slate-300">Equity Curve</span>
          <span className="ml-auto rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
            +12.4%
          </span>
        </div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MOCK_EQUITY_CURVE} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="demoEq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00e676" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#00e676" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} interval={6} />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "#0e0e12", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontFamily: "monospace", fontSize: 12 }}
                labelStyle={{ color: "#94a3b8" }}
                itemStyle={{ color: "#00e676" }}
                formatter={(v: number) => [`€${v.toLocaleString()}`, "Equity"]}
              />
              <Area type="monotone" dataKey="value" stroke="#00e676" strokeWidth={2} fill="url(#demoEq)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Risk rules + Alerts row */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Risk rules */}
        <motion.div {...fadeUp(0.1)} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              <span className="font-mono text-sm text-slate-300">Risk Rules</span>
            </div>
            <button
              onClick={() => interceptAction(() => {}, "edit risk rules")}
              className="rounded-lg border border-white/[0.07] px-2.5 py-1 text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
            >
              Edit
            </button>
          </div>
          <div className="space-y-2">
            {MOCK_RISK_RULES.map((r) => (
              <div key={r.name} className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.01] px-3 py-2">
                <span className="font-mono text-xs text-slate-400">{r.name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-300">{r.current}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${
                      r.status === "safe"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-amber-500/15 text-amber-400"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Alerts */}
        <motion.div {...fadeUp(0.13)} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <span className="font-mono text-sm text-slate-300">Recent Alerts</span>
          </div>
          <div className="space-y-2">
            {MOCK_ALERTS.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-3 rounded-lg border border-white/[0.05] bg-white/[0.01] px-3 py-2.5"
              >
                <span
                  className={`mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-mono font-bold ${
                    a.type === "HIGH" ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"
                  }`}
                >
                  {a.type}
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-xs text-slate-300 leading-snug">{a.message}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-slate-600">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Drawdown row */}
      <motion.div {...fadeUp(0.16)} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Daily DD" value={`${d.dailyDdPct}%`} icon={<TrendingDown className="h-3.5 w-3.5 text-orange-400" />} />
        <MiniStat label="Max DD" value={`${d.maxDdPct}%`} icon={<BarChart2 className="h-3.5 w-3.5 text-red-400" />} />
        <MiniStat label="Active Rules" value="3" icon={<ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />} />
        <MiniStat label="Open Trades" value="2" icon={<TrendingUp className="h-3.5 w-3.5 text-emerald-400" />} />
      </motion.div>

      <DemoActionModal open={modalOpen} action={actionLabel} onClose={closeModal} />
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{label}</p>
      <p className={`mt-1 font-[family-name:var(--font-display)] text-2xl font-bold ${color}`}>{value}</p>
      <p className="font-mono text-xs text-slate-500">{sub}</p>
    </div>
  );
}

function MiniStat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-3">
      {icon}
      <div>
        <p className="font-mono text-[10px] text-slate-500">{label}</p>
        <p className="font-mono text-sm font-bold text-white">{value}</p>
      </div>
    </div>
  );
}
