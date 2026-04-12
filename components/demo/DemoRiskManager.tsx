"use client";

import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, Plus } from "lucide-react";
import { MOCK_RISK, MOCK_RISK_RULES, MOCK_RISK_VIOLATIONS } from "@/lib/demo/mockData";
import { DemoActionModal } from "./DemoActionModal";
import { useDemoAction } from "@/hooks/useDemoAction";

export function DemoRiskManager() {
  const { interceptAction, modalOpen, actionLabel, closeModal } = useDemoAction();

  const r = MOCK_RISK;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">
            Risk Manager
          </h1>
          <p className="mt-1 font-mono text-sm text-slate-500">Live demo — sample data</p>
        </div>
        <button
          onClick={() => interceptAction(() => {}, "add a risk rule")}
          className="flex items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-2.5 text-sm font-mono text-slate-300 transition-all hover:text-white"
        >
          <Plus className="h-4 w-4" />
          Add rule
        </button>
      </motion.div>

      {/* Gauges */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <GaugeCard label="Balance" value={`€${r.balance.toLocaleString()}`} sub="Demo" />
        <GaugeCard label="Equity" value={`€${r.equity.toLocaleString()}`} sub="+€247" color="text-emerald-400" />
        <GaugeCard label="Daily DD" value={`${r.dailyDd}%`} sub="/ 2% limit" color="text-amber-400" />
        <GaugeCard label="Max DD" value={`${r.maxDd}%`} sub={`${r.openPositions} positions`} color="text-orange-400" />
      </motion.div>

      {/* Rules */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"
      >
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-cyan-400" />
          <span className="font-mono text-sm text-slate-300">Active Rules</span>
        </div>
        <div className="space-y-2">
          {MOCK_RISK_RULES.map((rule) => (
            <div
              key={rule.name}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.05] bg-white/[0.01] px-4 py-3"
            >
              <div>
                <p className="font-mono text-sm text-white">{rule.name}</p>
                <p className="font-mono text-xs text-slate-500">Limit: {rule.value} · Current: {rule.current}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-mono font-bold ${
                    rule.status === "safe"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-amber-500/15 text-amber-400"
                  }`}
                >
                  {rule.status}
                </span>
                <button
                  onClick={() => interceptAction(() => {}, "edit this rule")}
                  className="font-mono text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Violations */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"
      >
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <span className="font-mono text-sm text-slate-300">Violation History</span>
        </div>
        <div className="space-y-2">
          {MOCK_RISK_VIOLATIONS.map((v) => (
            <div
              key={v.id}
              className="flex items-start gap-3 rounded-xl border border-white/[0.05] bg-white/[0.01] px-4 py-3"
            >
              <span
                className={`mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-mono font-bold ${
                  v.severity === "high" ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"
                }`}
              >
                {v.severity.toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="font-mono text-xs font-bold text-white">{v.rule}</p>
                <p className="font-mono text-xs text-slate-400">{v.message}</p>
                <p className="font-mono text-[10px] text-slate-600 mt-0.5">{v.time}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <DemoActionModal open={modalOpen} action={actionLabel} onClose={closeModal} />
    </div>
  );
}

function GaugeCard({ label, value, sub, color = "text-white" }: { label: string; value: string; sub: string; color?: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{label}</p>
      <p className={`mt-1 font-[family-name:var(--font-display)] text-xl font-bold ${color}`}>{value}</p>
      <p className="font-mono text-xs text-slate-500">{sub}</p>
    </div>
  );
}
