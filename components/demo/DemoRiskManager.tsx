"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, Plus, Send, ToggleLeft, ToggleRight } from "lucide-react";
import {
  MOCK_RISK, MOCK_RISK_RULES, MOCK_RISK_VIOLATIONS, MOCK_TELEGRAM_ALERTS,
} from "@/lib/demo/mockData";
import { DemoActionModal } from "./DemoActionModal";
import { useDemoAction } from "@/hooks/useDemoAction";

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease },
});

export function DemoRiskManager() {
  const { interceptAction, modalOpen, actionLabel, closeModal } = useDemoAction();
  const r = MOCK_RISK;

  // Local toggle state — visual only, all changes intercepted
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(MOCK_TELEGRAM_ALERTS.map((a) => [a.id, a.enabled]))
  );

  return (
    <div className="space-y-5">

      {/* Header */}
      <motion.div {...fadeUp(0)} className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">Risk Manager</h1>
          <p className="mt-1 font-mono text-sm text-slate-500">Live monitor · 5 active rules</p>
        </div>
        <button
          onClick={() => interceptAction(() => {}, "add a risk rule")}
          className="flex items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-2.5 text-sm font-mono text-slate-300 transition-all hover:text-white"
        >
          <Plus className="h-4 w-4" />
          Add rule
        </button>
      </motion.div>

      {/* Live metrics */}
      <motion.div {...fadeUp(0.04)} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DDGauge label="Daily DD"    value={r.dailyDd}   limit={r.dailyDdLimit} />
        <DDGauge label="Max DD"      value={r.maxDd}     limit={r.maxDdLimit}   />
        <MetricCard label="Balance"  value={`€${r.balance.toLocaleString()}`}       sub="Current" />
        <MetricCard label="Equity"   value={`€${r.equity.toLocaleString()}`}        sub={`+€${(r.equity - r.balance).toFixed(2)} unrealized`} color="text-emerald-400" />
      </motion.div>

      <motion.div {...fadeUp(0.07)} className="grid grid-cols-2 gap-3">
        <MetricCard label="Open Positions" value={r.openPositions.toString()} sub="EURUSD, XAUUSD" />
        <MetricCard label="Today's P&L"    value="+€312.50"                   sub="+2.57%" color="text-emerald-400" />
      </motion.div>

      {/* Active rules */}
      <motion.div {...fadeUp(0.10)} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-cyan-400" />
            <span className="font-mono text-sm text-slate-300">Active Rules</span>
          </div>
          <button
            onClick={() => interceptAction(() => {}, "add a risk rule")}
            className="rounded-lg border border-white/[0.07] px-2.5 py-1 text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
          >
            + Add
          </button>
        </div>
        <div className="space-y-3">
          {MOCK_RISK_RULES.map((rule) => (
            <div key={rule.name} className="rounded-xl border border-white/[0.05] bg-white/[0.01] px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <p className="font-mono text-sm font-bold text-white">{rule.name}</p>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-mono font-bold ${rule.status === "safe" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
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
              <p className="font-mono text-xs text-slate-500 mb-2">Current: {rule.current} · Limit: {rule.limit}</p>
              <div className="h-1.5 w-full rounded-full bg-white/[0.06]">
                <div
                  className={`h-1.5 rounded-full transition-all ${rule.status === "safe" ? "bg-emerald-500" : "bg-amber-500"}`}
                  style={{ width: `${Math.min(rule.pct, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Violation history */}
      <motion.div {...fadeUp(0.13)} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <span className="font-mono text-sm text-slate-300">Violation History</span>
        </div>
        <div className="space-y-2">
          {MOCK_RISK_VIOLATIONS.map((v) => (
            <div key={v.id} className="flex items-start gap-3 rounded-xl border border-white/[0.05] bg-white/[0.01] px-4 py-3">
              <span className={`mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-mono font-bold ${v.severity === "high" ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"}`}>
                {v.severity.toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="font-mono text-xs font-bold text-white">{v.rule}</p>
                <p className="font-mono text-xs text-slate-400 leading-snug">{v.message}</p>
                <p className="font-mono text-[10px] text-slate-600 mt-0.5">{v.time}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Telegram alerts */}
      <motion.div {...fadeUp(0.16)} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-[#ff3c3c]" />
            <span className="font-mono text-sm text-slate-300">Telegram Alerts</span>
          </div>
          <button
            onClick={() => interceptAction(() => {}, "add a Telegram alert")}
            className="rounded-lg border border-white/[0.07] px-2.5 py-1 text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
          >
            + Add
          </button>
        </div>
        <div className="space-y-2">
          {MOCK_TELEGRAM_ALERTS.map((ta) => (
            <div key={ta.id} className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.01] px-4 py-3">
              <div>
                <p className="font-mono text-xs font-bold text-white">{ta.name}</p>
                <p className="font-mono text-[10px] text-slate-500">{ta.channel}</p>
              </div>
              <button
                onClick={() => {
                  interceptAction(() => {
                    setToggles((prev) => ({ ...prev, [ta.id]: !prev[ta.id] }));
                  }, "toggle Telegram alerts");
                }}
                className="text-slate-400 hover:text-slate-200 transition-colors"
                aria-label="Toggle alert"
              >
                {toggles[ta.id]
                  ? <ToggleRight className="h-5 w-5 text-emerald-400" />
                  : <ToggleLeft  className="h-5 w-5 text-slate-600"   />
                }
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      <DemoActionModal open={modalOpen} action={actionLabel} onClose={closeModal} />
    </div>
  );
}

function DDGauge({ label, value, limit }: { label: string; value: number; limit: number }) {
  const pct = Math.min((value / limit) * 100, 100);
  const isWarn = pct > 65;
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-1">{label}</p>
      <p className={`font-[family-name:var(--font-display)] text-2xl font-bold ${isWarn ? "text-amber-400" : "text-white"}`}>
        {value}%
        <span className="ml-1 text-sm font-normal text-slate-500">/ {limit}%</span>
      </p>
      <div className="mt-2 h-1.5 w-full rounded-full bg-white/[0.06]">
        <div
          className={`h-1.5 rounded-full transition-all ${isWarn ? "bg-amber-500" : "bg-emerald-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, color = "text-white" }: { label: string; value: string; sub: string; color?: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{label}</p>
      <p className={`mt-1 font-[family-name:var(--font-display)] text-xl font-bold ${color}`}>{value}</p>
      <p className="font-mono text-xs text-slate-500">{sub}</p>
    </div>
  );
}
