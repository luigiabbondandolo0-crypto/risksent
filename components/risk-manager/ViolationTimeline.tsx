"use client";

import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";

export type ViolationItem = {
  id: string;
  rule_type: string;
  value_at_violation: number;
  limit_value: number;
  message: string;
  created_at: string;
};

function badge(ruleType: string): string {
  switch (ruleType) {
    case "daily_dd":
      return "Daily DD";
    case "exposure":
      return "Exposure";
    case "revenge":
      return "Revenge";
    case "risk_per_trade":
      return "Risk / trade";
    default:
      return ruleType;
  }
}

function dotColor(message: string, ruleType: string): string {
  const t = `${message} ${ruleType}`.toLowerCase();
  if (t.includes("exceed") || t.includes("reached")) return "#ff3c3c";
  return "#ff8c00";
}

export function ViolationTimeline({ violations }: { violations: ViolationItem[] }) {
  if (violations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#00e676]/30 bg-[#00e676]/10 text-2xl text-[#00e676]"
        >
          ✓
        </motion.div>
        <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-slate-200">
          No violations — rules have been respected.
        </p>
        <p className="mt-2 max-w-sm text-sm font-[family-name:var(--font-mono)] text-slate-500">
          When limits are approached or breached, they will appear here with timestamps.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-0">
      {violations.map((v, i) => (
        <motion.li
          key={v.id}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.06, duration: 0.35, ease: "easeOut" }}
          className="relative flex gap-4 border-b border-white/[0.05] py-4 last:border-0"
        >
          <div className="flex flex-col items-center pt-1">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: dotColor(v.message, v.rule_type), boxShadow: `0 0 10px ${dotColor(v.message, v.rule_type)}` }}
            />
            {i < violations.length - 1 && (
              <span className="mt-2 w-px flex-1 min-h-[24px] bg-gradient-to-b from-white/10 to-transparent" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-[family-name:var(--font-mono)] font-semibold uppercase tracking-wide text-slate-300">
                {badge(v.rule_type)}
              </span>
              <span className="text-[11px] font-[family-name:var(--font-mono)] text-slate-600">
                {format(parseISO(v.created_at), "MMM d, yyyy · HH:mm")}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-200">{v.message}</p>
            <p className="mt-1 text-xs font-[family-name:var(--font-mono)] text-slate-500">
              Value: {Number(v.value_at_violation).toFixed(2)} · Limit: {Number(v.limit_value).toFixed(2)}
            </p>
          </div>
        </motion.li>
      ))}
    </ul>
  );
}
