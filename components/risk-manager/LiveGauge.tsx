"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import type { RiskGaugeStatus } from "@/lib/risk/riskTypes";

const ARC = 125;

function colorsForStatus(status: RiskGaugeStatus): { stroke: string; glow: string } {
  switch (status) {
    case "danger":
      return { stroke: "#ff3c3c", glow: "drop-shadow(0 0 10px rgba(255,60,60,0.85))" };
    case "watch":
      return { stroke: "#ff8c00", glow: "drop-shadow(0 0 8px rgba(255,140,0,0.75))" };
    default:
      return { stroke: "#00e676", glow: "drop-shadow(0 0 8px rgba(0,230,118,0.55))" };
  }
}

export type LiveGaugeProps = {
  value: number | null;
  limit: number;
  label: string;
  unit: string;
  status: RiskGaugeStatus;
  /** 0–1+ fill ratio for arc (caller computes from value vs limit) */
  ratio: number;
  valueDisplay: string;
};

export function LiveGauge({ limit, label, unit, status, ratio, valueDisplay }: LiveGaugeProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [animatedPct, setAnimatedPct] = useState(0);
  const targetPct = Math.min(100, ratio * 100);
  const { stroke, glow } = colorsForStatus(status);
  const over = Math.max(0, ratio - 1);

  useEffect(() => {
    if (!isInView) return;
    const duration = 1000;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedPct(eased * targetPct);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [isInView, targetPct]);

  const labelStatus =
    status === "danger" ? "DANGER" : status === "watch" ? "WATCH" : "SAFE";

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="relative flex flex-col items-center gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-5"
      style={
        status === "danger"
          ? { boxShadow: "0 0 0 1px rgba(255,60,60,0.28), 0 0 28px rgba(255,60,60,0.14)" }
          : undefined
      }
    >
      <span className="text-center text-[10px] font-[family-name:var(--font-mono)] font-medium uppercase tracking-widest text-slate-500">
        {label}
      </span>

      <div className="relative h-[78px] w-40 overflow-hidden">
        <svg viewBox="0 0 100 50" className="h-full w-full">
          <path
            d="M 10 45 A 40 40 0 0 1 90 45"
            fill="none"
            stroke="#1e1e1e"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M 10 45 A 40 40 0 0 1 90 45"
            fill="none"
            stroke={stroke}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${(animatedPct / 100) * ARC} ${ARC}`}
            opacity={0.12}
          />
          <path
            d="M 10 45 A 40 40 0 0 1 90 45"
            fill="none"
            stroke={stroke}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${(animatedPct / 100) * ARC} ${ARC}`}
            style={{ filter: glow }}
          />
        </svg>
        {over > 0 && (
          <span className="absolute right-1 top-0 rounded-md border border-red-500/40 bg-red-500/15 px-1.5 py-0.5 text-[9px] font-[family-name:var(--font-mono)] text-red-300">
            +{(over * 100).toFixed(0)}%
          </span>
        )}
      </div>

      <span
        className="text-lg font-bold font-[family-name:var(--font-mono)]"
        style={{ color: stroke }}
      >
        {valueDisplay}
      </span>
      <span className="text-[10px] font-[family-name:var(--font-mono)] text-slate-600">
        limit {limit}
        {unit === "%" ? "%" : unit === "losses" ? " losses" : ` ${unit}`}
      </span>

      <motion.span
        animate={status === "danger" ? { opacity: [1, 0.55, 1] } : { opacity: 1 }}
        transition={status === "danger" ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" } : {}}
        className="rounded-full px-2 py-0.5 text-[9px] font-[family-name:var(--font-mono)] font-bold uppercase tracking-wider"
        style={{
          color: stroke,
          background: `${stroke}18`,
          border: `1px solid ${stroke}40`
        }}
      >
        {labelStatus}
      </motion.span>

      <div className="mt-1 h-1 w-full max-w-[160px] overflow-hidden rounded-full bg-[#1e1e1e]">
        <motion.div
          initial={{ width: 0 }}
          animate={isInView ? { width: `${Math.min(100, ratio * 100)}%` } : {}}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: stroke, boxShadow: `0 0 8px ${stroke}` }}
        />
      </div>
    </motion.div>
  );
}
