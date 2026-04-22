"use client";

import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import type { RiskGaugeStatus } from "@/lib/risk/riskTypes";

const borderFor: Record<RiskGaugeStatus, string> = {
  safe: "rgba(74,222,128,0.45)",
  watch: "rgba(245,158,11,0.5)",
  danger: "rgba(248,113,113,0.55)"
};

const blobFor: Record<RiskGaugeStatus, string> = {
  safe: "#4ade80",
  watch: "#f59e0b",
  danger: "#f87171"
};

export type RuleCardProps = {
  icon: LucideIcon;
  label: string;
  description: string;
  value: string;
  onChange: (v: string) => void;
  status: RiskGaugeStatus;
  suffix?: string;
};

export function RuleCard({ icon: Icon, label, description, value, onChange, status, suffix = "%" }: RuleCardProps) {
  return (
    <motion.div
      layout
      whileHover={{ scale: 1.015 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl"
      style={{
        boxShadow: `0 0 0 1px ${borderFor[status]}, 0 0 24px ${status === "danger" ? "rgba(248,113,113,0.09)" : status === "watch" ? "rgba(245,158,11,0.09)" : "rgba(74,222,128,0.09)"}, 0 8px 32px -12px rgba(0,0,0,0.55)`,
        transition: "box-shadow 0.35s cubic-bezier(0.22, 1, 0.36, 1)"
      }}
    >
      <div
        className="pointer-events-none absolute right-0 top-0 h-20 w-20 rounded-full opacity-20 blur-2xl"
        style={{ background: `radial-gradient(circle, ${blobFor[status]}, transparent)` }}
      />
      <div className="relative z-10 flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-black/30"
          style={{ color: blobFor[status] }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-[family-name:var(--font-display)] text-base font-bold tracking-tight text-slate-100">
            {label}
          </p>
          <p className="mt-1 text-xs leading-relaxed font-[family-name:var(--font-mono)] text-slate-500">
            {description}
          </p>
          <motion.div
            key={value}
            initial={{ scale: 0.98, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 32 }}
            className="mt-4 flex items-center gap-2"
          >
            <input
              type="text"
              inputMode="decimal"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="rs-input max-w-[120px] font-[family-name:var(--font-mono)] text-lg font-semibold"
            />
            <span className="text-sm font-[family-name:var(--font-mono)] text-slate-500">{suffix}</span>
          </motion.div>
          <div className="mt-3 flex items-center gap-2">
            <motion.span
              className="h-2 w-2 rounded-full"
              style={{
                background: status === "safe" ? "#4ade80" : status === "watch" ? "#f59e0b" : "#f87171"
              }}
              animate={status !== "safe" ? {
                opacity: [1, 0.3, 1],
                scale: [1, 1.3, 1],
              } : {}}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <p className="rs-kpi-label">
              <span
                style={{
                  color: status === "safe" ? "#4ade80" : status === "watch" ? "#f59e0b" : "#f87171"
                }}
              >
                {status === "safe" ? "Safe" : status === "watch" ? "Watch" : "High risk"}
              </span>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
