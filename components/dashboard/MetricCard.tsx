"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface MetricCardProps {
  label: string;
  value: number | null;
  prefix?: string;
  suffix?: string;
  trend?: "up" | "down" | "neutral";
  positiveIsGood?: boolean;
  decimals?: number;
  note?: string;
}

export function MetricCard({
  label,
  value,
  prefix = "",
  suffix = "",
  trend = "neutral",
  positiveIsGood = true,
  decimals = 2,
  note,
}: MetricCardProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  const inferredTrend: "up" | "down" | "neutral" =
    trend !== "neutral"
      ? trend
      : value == null
      ? "neutral"
      : positiveIsGood
      ? value >= 0 ? "up" : "down"
      : value < 0 ? "up" : "down";

  const borderColor =
    inferredTrend === "up" ? "#00e676" : inferredTrend === "down" ? "#ff3c3c" : "#555";

  useEffect(() => {
    if (!isInView) return;
    const duration = 1200;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const target = value ?? 0;
      setDisplay(parseFloat((eased * target).toFixed(decimals)));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, value, decimals]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ scale: 1.02 }}
      style={{ borderLeft: `3px solid ${borderColor}` }}
      className="bg-[#111] border border-[#1e1e1e] rounded-lg p-5 cursor-default transition-shadow hover:shadow-lg"
    >
      <p className="text-[11px] font-mono text-[#555] tracking-widest uppercase mb-3">
        {label}
      </p>
      <p className="text-2xl font-bold font-display text-white tracking-tight">
        {value == null
          ? "—"
          : `${prefix}${display.toLocaleString("it-IT", { minimumFractionDigits: decimals })}${suffix}`}
      </p>
      {note && (
        <p className="text-xs font-mono text-[#555] mt-1">{note}</p>
      )}
    </motion.div>
  );
}