"use client";

import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import type { RiskGaugeStatus } from "@/lib/risk/riskTypes";

const borderFor: Record<RiskGaugeStatus, string> = {
  safe: "rgba(0,230,118,0.45)",
  watch: "rgba(255,140,0,0.5)",
  danger: "rgba(255,60,60,0.55)"
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
      className="relative overflow-hidden rounded-2xl bg-white/[0.02] p-5"
      style={{
        boxShadow: `0 0 0 1px ${borderFor[status]}, 0 8px 32px -12px rgba(0,0,0,0.55)`,
        transition: "box-shadow 0.3s ease"
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-black/30"
          style={{ color: borderFor[status] }}
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
          <p className="rs-kpi-label mt-3">
            Status:{" "}
            <span
              style={{
                color: status === "safe" ? "#00e676" : status === "watch" ? "#ff8c00" : "#ff3c3c"
              }}
            >
              {status === "safe" ? "Safe" : status === "watch" ? "Watch" : "High risk"}
            </span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
