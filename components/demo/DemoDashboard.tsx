"use client";

import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, TrendingDown, AlertTriangle, ShieldCheck, BarChart2,
  Zap, Activity,
} from "lucide-react";
import {
  MOCK_DASHBOARD, MOCK_EQUITY_CURVE, MOCK_ALERTS, MOCK_RISK_RULES, MOCK_OPEN_TRADES,
} from "@/lib/demo/mockData";
import { DemoActionModal } from "./DemoActionModal";
import { useDemoAction } from "@/hooks/useDemoAction";

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease },
});

const ALERT_COLOR: Record<string, string> = {
  HIGH:   "bg-red-500/15 text-red-400",
  MEDIUM: "bg-amber-500/15 text-amber-400",
  LOW:    "bg-slate-500/15 text-slate-400",
};

export function DemoDashboard() {
  const { interceptAction, modalOpen, actionLabel, closeModal } = useDemoAction();
  const d = MOCK_DASHBOARD;

  return (
    <div className="space-y-5">

      {/* Top stat cards */}
      <motion.div {...fadeUp(0)} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Balance"       value={`€${d.balance.toLocaleString()}`}    sub="Live account"           color="text-white" />
        <StatCard label="Daily P&L"     value={`+€${d.dailyPnl}`}                   sub={`+${d.dailyPnlPct}%`}   color="text-emerald-400" />
        <StatCard label="Win Rate"      value={`${d.winRate}%`}                      sub={`${d.totalTrades} trades`} color="text-cyan-400" />
        <StatCard label="Profit Factor" value={`${d.profitFactor}`}                  sub={`Avg RR ${d.avgRR}`}    color="text-amber-400" />
      </motion.div>

      {/* Secondary P&L row */}
      <motion.div {...fadeUp(0.04)} className="grid grid-cols-3 gap-3">
        <MiniStat label="Weekly P&L"  value={`+€${d.weeklyPnl.toLocaleString()}`}  sub={`+${d.weeklyPnlPct}%`}  color="text-emerald-300" />
        <MiniStat label="Monthly P&L" value={`+€${d.monthlyPnl.toLocaleString()}`} sub={`+${d.monthlyPnlPct}%`} color="text-emerald-300" />
        <MiniStat label="Open Trades" value={d.openTrades.toString()}               sub="right now"              color="text-white" />
      </motion.div>

      {/* Equity curve */}
      <motion.div {...fadeUp(0.07)} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          <span className="font-mono text-sm text-slate-300">Equity Curve</span>
          <span className="ml-auto rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
            +24.5%
          </span>
        </div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MOCK_EQUITY_CURVE} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="demoEq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00e676" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#00e676" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} interval={9} />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `€${(v / 1000).toFixed(1)}k`} />
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

      {/* Open trades */}
      <motion.div {...fadeUp(0.1)} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
        <div className="mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-cyan-400" />
          <span className="font-mono text-sm text-slate-300">Open Positions</span>
          <span className="ml-auto rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-mono text-cyan-400">
            {MOCK_OPEN_TRADES.length} live
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-xs font-mono">
            <thead>
              <tr className="border-b border-white/[0.05]">
                {["Symbol", "Side", "Lots", "Entry", "Current", "P&L", "Open for"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-normal uppercase tracking-wider text-slate-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_OPEN_TRADES.map((t) => (
                <tr key={t.id} className="border-b border-white/[0.03]">
                  <td className="px-3 py-2.5 font-bold text-white">{t.symbol}</td>
                  <td className={`px-3 py-2.5 font-bold ${t.direction === "buy" ? "text-emerald-400" : "text-red-400"}`}>
                    {t.direction.toUpperCase()}
                  </td>
                  <td className="px-3 py-2.5 text-slate-300">{t.lots}</td>
                  <td className="px-3 py-2.5 text-slate-300">{t.entry}</td>
                  <td className="px-3 py-2.5 text-slate-300">{t.current}</td>
                  <td className="px-3 py-2.5 font-bold text-emerald-400">+€{t.pnl.toFixed(2)}</td>
                  <td className="px-3 py-2.5 text-slate-500">{t.openSince}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Risk rules + Alerts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Risk rules */}
        <motion.div {...fadeUp(0.13)} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
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
          <div className="space-y-2.5">
            {MOCK_RISK_RULES.map((r) => (
              <div key={r.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs text-slate-400">{r.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-300">{r.current} / {r.limit}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-mono font-bold ${r.status === "safe" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
                      {r.status}
                    </span>
                  </div>
                </div>
                <div className="h-1 w-full rounded-full bg-white/[0.06]">
                  <div
                    className={`h-1 rounded-full transition-all ${r.status === "safe" ? "bg-emerald-500" : "bg-amber-500"}`}
                    style={{ width: `${Math.min(r.pct, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Alerts */}
        <motion.div {...fadeUp(0.16)} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <span className="font-mono text-sm text-slate-300">Recent Alerts</span>
          </div>
          <div className="space-y-2">
            {MOCK_ALERTS.map((a) => (
              <div key={a.id} className="flex items-start gap-3 rounded-lg border border-white/[0.05] bg-white/[0.01] px-3 py-2.5">
                <span className={`mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-mono font-bold ${ALERT_COLOR[a.type] ?? ""}`}>
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

      {/* DD + summary row */}
      <motion.div {...fadeUp(0.19)} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DDCard label="Daily DD" value={d.dailyDdPct} limit={2} unit="%" icon={<TrendingDown className="h-3.5 w-3.5 text-amber-400" />} />
        <DDCard label="Max DD"   value={d.maxDdPct}   limit={8} unit="%" icon={<BarChart2    className="h-3.5 w-3.5 text-red-400"   />} />
        <MiniStat2 label="Active Rules" value={`${d.activeRules}`} icon={<ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />} />
        <MiniStat2 label="Profit Factor" value={`${d.profitFactor}` } icon={<Zap className="h-3.5 w-3.5 text-amber-400" />} />
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

function MiniStat({ label, value, sub, color = "text-white" }: { label: string; value: string; sub: string; color?: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{label}</p>
      <p className={`mt-0.5 font-[family-name:var(--font-display)] text-lg font-bold ${color}`}>{value}</p>
      <p className="font-mono text-xs text-slate-500">{sub}</p>
    </div>
  );
}

function MiniStat2({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-3">
      {icon}
      <div>
        <p className="font-mono text-[10px] text-slate-500">{label}</p>
        <p className="font-mono text-sm font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

function DDCard({ label, value, limit, unit, icon }: { label: string; value: number; limit: number; unit: string; icon: React.ReactNode }) {
  const pct = Math.min((value / limit) * 100, 100);
  const isWarn = pct > 70;
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <p className="font-mono text-[10px] text-slate-500">{label}</p>
      </div>
      <p className={`font-mono text-sm font-bold ${isWarn ? "text-amber-400" : "text-white"}`}>
        {value}{unit} <span className="text-slate-600 font-normal">/ {limit}{unit}</span>
      </p>
      <div className="mt-1.5 h-1 w-full rounded-full bg-white/[0.06]">
        <div
          className={`h-1 rounded-full ${isWarn ? "bg-amber-500" : "bg-emerald-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
