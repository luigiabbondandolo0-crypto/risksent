"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

type DdExposureCardProps = {
  dailyDdPct: number | null;
  dailyLimitPct: number;
  exposurePct: number | null;
  exposureLimitPct: number;
  isMock?: boolean;
};

function gaugeColor(ratio: number): string {
  if (ratio >= 1) return "#ff3c3c";
  if (ratio >= 0.75) return "#ff8c00";
  return "#00e676";
}

function gaugeGlow(ratio: number): string {
  if (ratio >= 1) return "drop-shadow(0 0 8px rgba(255,60,60,0.8))";
  if (ratio >= 0.75) return "drop-shadow(0 0 8px rgba(255,140,0,0.7))";
  return "drop-shadow(0 0 8px rgba(0,230,118,0.6))";
}

function SemiGauge({
  valuePct,
  limitPct,
  label,
}: {
  valuePct: number | null;
  limitPct: number;
  label: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [animatedPct, setAnimatedPct] = useState(0);

  const ratio =
    valuePct != null && limitPct > 0
      ? Math.min(1.5, Math.abs(valuePct) / limitPct)
      : 0;
  const targetPct = Math.min(100, ratio * 100);
  const color = gaugeColor(ratio);
  const glow = gaugeGlow(ratio);
  const over = Math.max(0, ratio - 1);
  const arcLength = 125;

  useEffect(() => {
    if (!isInView) return;
    const duration = 1000;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedPct(eased * targetPct);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [isInView, targetPct]);

  const isPositive = valuePct != null && valuePct >= 0;
  const valueColor = isPositive ? "#00e676" : "#ff3c3c";

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center gap-1"
    >
      {/* Label */}
      <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mb-1">
        {label}
      </span>

      {/* Gauge */}
      <div className="relative w-36 h-[72px] overflow-hidden">
        <svg viewBox="0 0 100 50" className="w-full h-full">
          {/* Background track */}
          <path
            d="M 10 45 A 40 40 0 0 1 90 45"
            fill="none"
            stroke="#1e1e1e"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Secondary track glow */}
          <path
            d="M 10 45 A 40 40 0 0 1 90 45"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${(animatedPct / 100) * arcLength} ${arcLength}`}
            opacity={0.15}
          />
          {/* Main arc */}
          <path
            d="M 10 45 A 40 40 0 0 1 90 45"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${(animatedPct / 100) * arcLength} ${arcLength}`}
            style={{ filter: glow }}
          />
          {/* Limit tick */}
          <line
            x1="50" y1="8"
            x2="50" y2="14"
            stroke="#334155"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>

        {/* Over limit badge */}
        {over > 0 && (
          <span className="absolute right-0 top-0 rounded-full border border-red-500/40 bg-red-500/15 px-1.5 py-0.5 text-[9px] font-mono text-red-300">
            +{(over * 100).toFixed(0)}%
          </span>
        )}
      </div>

      {/* Value */}
      <span className="text-xl font-bold font-mono" style={{ color: valueColor }}>
        {valuePct != null
          ? `${valuePct >= 0 ? "+" : ""}${valuePct.toFixed(2)}%`
          : "—"}
      </span>

      {/* Limit */}
      <span className="text-[10px] text-slate-600 font-mono">
        limit {limitPct}%
      </span>

      {/* Progress bar sotto */}
      <div className="w-full mt-1 h-[2px] rounded-full bg-[#1e1e1e] overflow-hidden" style={{ width: "144px" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={isInView ? { width: `${Math.min(100, ratio * 100)}%` } : {}}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: color, boxShadow: `0 0 6px ${color}` }}
        />
      </div>
    </motion.div>
  );
}

export function DdExposureCard({
  dailyDdPct,
  dailyLimitPct,
  exposurePct,
  exposureLimitPct,
  isMock,
}: DdExposureCardProps) {
  return (
    <section className="rs-card-accent p-5 sm:p-6 shadow-rs-soft">
      <div className="mb-6 flex items-center justify-between gap-2">
        <div>
          <div className="text-base font-semibold tracking-tight text-slate-100">
            Daily DD & exposure
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Compared to your rule limits
          </p>
        </div>
        {isMock && (
          <span className="shrink-0 rounded-md border border-amber-500/35 bg-amber-500/15 px-2 py-1 text-[10px] font-medium text-amber-200">
            Sample data
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-start justify-around gap-8">
        <SemiGauge
          valuePct={dailyDdPct}
          limitPct={dailyLimitPct}
          label="Daily DD (today)"
        />
        <SemiGauge
          valuePct={exposurePct}
          limitPct={exposureLimitPct}
          label="Current Exposure"
        />
      </div>
    </section>
  );
}