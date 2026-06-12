"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

// ─── Timing ────────────────────────────────────────────────────────────────
const PHASE_CHART_S   = 3.8;   // chart candles play / price approaches SL
const PHASE_HIT_S     = 0.35;  // flash when SL is hit
const PHASE_NOTIF_S   = 5.8;   // notification is visible
const PHASE_RESET_S   = 0.8;   // brief pause before loop

type Phase = "chart" | "hit" | "notif" | "reset";

// ─── Static chart candles (viewBox 0 0 100 100) ────────────────────────────
// x = center, o = open%, c = close% (percent from top, so 0=top, 100=bottom)
// SL line at y=72
const CANDLES = [
  { x: 10, o: 52, c: 46, h: 44, l: 54, bull: true  },
  { x: 18, o: 48, c: 43, h: 41, l: 50, bull: true  },
  { x: 26, o: 43, c: 49, h: 41, l: 51, bull: false },
  { x: 34, o: 49, c: 44, h: 42, l: 51, bull: true  },
  { x: 42, o: 44, c: 50, h: 42, l: 52, bull: false },
  { x: 50, o: 52, c: 57, h: 50, l: 60, bull: false },
  { x: 58, o: 58, c: 65, h: 56, l: 67, bull: false },
  { x: 66, o: 65, c: 71, h: 63, l: 73, bull: false },
  // SL hit candle — close pierces SL (y=72)
  { x: 74, o: 71, c: 77, h: 69, l: 79, bull: false, slHit: true },
];

const SL_Y = 72;
const SL_PRICE = "1.08219";
const PRICE_BEFORE = "1.08246";
const PRICE_AFTER  = "1.08198";

export function HomeLiveAlertsPhone() {
  const [phase, setPhase] = useState<Phase>("chart");
  const [cycle, setCycle] = useState(0);
  const reduceMotion = useReducedMotion();
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];
  };

  useEffect(() => {
    setPhase("chart");
    clearTimers();

    if (reduceMotion) {
      setPhase("notif");
      return;
    }

    const push = (fn: () => void, ms: number) => {
      timerRef.current.push(setTimeout(fn, ms));
    };

    const chartMs   = PHASE_CHART_S   * 1000;
    const hitMs     = PHASE_HIT_S     * 1000;
    const notifMs   = PHASE_NOTIF_S   * 1000;
    const resetMs   = PHASE_RESET_S   * 1000;

    push(() => setPhase("hit"),   chartMs);
    push(() => setPhase("notif"), chartMs + hitMs);
    push(() => setPhase("reset"), chartMs + hitMs + notifMs);
    push(() => {
      setPhase("chart");
      setCycle((c) => c + 1);
    }, chartMs + hitMs + notifMs + resetMs);

    return clearTimers;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycle, reduceMotion]);

  const slHit = phase === "hit" || phase === "notif" || phase === "reset";
  const showNotif = phase === "notif";

  return (
    <div className="relative mx-auto flex w-full max-w-[260px] flex-col items-center select-none sm:max-w-[280px]">

      {/* ── Phone shell ── */}
      <motion.div
        className="relative w-full"
        whileHover={{ scale: 1.015 }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
      >
        {/* Outer frame */}
        <div
          className="relative overflow-hidden rounded-[2.6rem] p-[3px]"
          style={{
            background: "linear-gradient(160deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.10) 100%)",
            boxShadow: "0 48px 100px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.12)",
          }}
        >
          <div
            className="relative overflow-hidden rounded-[2.35rem]"
            style={{ background: "#0a0a0c" }}
          >
            {/* Dynamic island */}
            <div className="absolute left-1/2 top-2.5 z-20 h-[18px] w-[80px] -translate-x-1/2 rounded-full bg-black" />

            {/* Status bar */}
            <div className="flex items-center justify-between px-6 pt-3 pb-1" style={{ paddingTop: "14px" }}>
              <span className="text-[9px] font-semibold text-white/70 font-mono">9:41</span>
              <div className="flex items-center gap-1.5">
                <svg width="15" height="10" viewBox="0 0 15 10" fill="none">
                  <rect x="0" y="3" width="3" height="7" rx="0.6" fill="white" fillOpacity="0.4"/>
                  <rect x="4" y="2" width="3" height="8" rx="0.6" fill="white" fillOpacity="0.6"/>
                  <rect x="8" y="0.5" width="3" height="9.5" rx="0.6" fill="white" fillOpacity="0.85"/>
                  <rect x="12.5" y="3.5" width="2" height="3" rx="0.4" fill="white" fillOpacity="0.5"/>
                </svg>
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                  <path d="M7 1.2C9.5 1.2 11.8 2.3 13.3 4.1L14 3.3C12.2 1.2 9.8 0 7 0C4.2 0 1.8 1.2 0 3.3L0.7 4.1C2.2 2.3 4.5 1.2 7 1.2Z" fill="white" fillOpacity="0.45"/>
                  <path d="M7 3.8C8.6 3.8 10.1 4.5 11.1 5.7L11.9 4.9C10.6 3.5 8.9 2.6 7 2.6C5.1 2.6 3.4 3.5 2.1 4.9L2.9 5.7C3.9 4.5 5.4 3.8 7 3.8Z" fill="white" fillOpacity="0.65"/>
                  <path d="M7 6.5C7.9 6.5 8.8 6.9 9.4 7.6L10.2 6.8C9.3 5.8 8.2 5.3 7 5.3C5.8 5.3 4.7 5.8 3.8 6.8L4.6 7.6C5.2 6.9 6.1 6.5 7 6.5Z" fill="white" fillOpacity="0.85"/>
                  <circle cx="7" cy="9" r="1" fill="white"/>
                </svg>
                <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
                  <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="white" strokeOpacity="0.35"/>
                  <rect x="2" y="2" width="17" height="8" rx="2" fill="white" fillOpacity="0.85"/>
                  <path d="M22.5 4.5C23.3 4.5 23.8 5 23.8 5.7V6.3C23.8 7 23.3 7.5 22.5 7.5V4.5Z" fill="white" fillOpacity="0.4"/>
                </svg>
              </div>
            </div>

            {/* Trading terminal UI */}
            <div className="mx-2 mb-2 overflow-hidden rounded-[1.6rem]"
              style={{
                background: "linear-gradient(180deg, #0d0f14 0%, #090a0e 100%)",
                border: "1px solid rgba(255,255,255,0.05)"
              }}
            >
              {/* Terminal header */}
              <div
                className="flex items-center justify-between border-b px-3 py-2"
                style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}
              >
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-sm" style={{ background: "linear-gradient(135deg, #6366f1, #38bdf8)" }} />
                  <span className="text-[10px] font-mono font-bold text-slate-300">MT5 Terminal</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-700" />
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-700" />
                  <div
                    className="h-1.5 w-1.5 rounded-full transition-colors duration-300"
                    style={{ background: slHit ? "#ef4444" : "#22c55e" }}
                  />
                </div>
              </div>

              {/* Pair info */}
              <div className="flex items-center justify-between border-b px-3 py-1.5"
                style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                <span className="text-[11px] font-mono font-bold text-white">EUR/USD · M5</span>
                <motion.span
                  className="text-[10px] font-mono font-semibold"
                  animate={{ color: slHit ? "#ef4444" : "#94a3b8" }}
                  transition={{ duration: 0.3 }}
                >
                  {slHit ? PRICE_AFTER : PRICE_BEFORE}
                </motion.span>
              </div>

              {/* Chart area */}
              <div className="relative" style={{ height: "200px" }}>
                {/* Screen flash on SL hit */}
                <AnimatePresence>
                  {phase === "hit" && (
                    <motion.div
                      className="pointer-events-none absolute inset-0 z-10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 0.45, 0] }}
                      transition={{ duration: 0.35, times: [0, 0.3, 1] }}
                      style={{ background: "rgba(239,68,68,0.6)" }}
                    />
                  )}
                </AnimatePresence>

                <svg
                  className="absolute inset-0 h-full w-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  {/* Grid lines */}
                  {[20, 40, 60, 80].map((y) => (
                    <line key={y} x1="0" y1={y} x2="100" y2={y}
                      stroke="rgba(255,255,255,0.025)" strokeWidth="0.4" />
                  ))}
                  {[25, 50, 75].map((x) => (
                    <line key={x} x1={x} y1="0" x2={x} y2="100"
                      stroke="rgba(255,255,255,0.025)" strokeWidth="0.4" />
                  ))}

                  {/* Candles */}
                  {CANDLES.map((c, i) => {
                    const isHitCandle = !!c.slHit;
                    const showHitCandle = isHitCandle && slHit;
                    const showNormalCandle = !isHitCandle || slHit;
                    if (!showNormalCandle && isHitCandle && !slHit) return null;

                    const color = isHitCandle && slHit ? "#ef4444"
                      : c.bull ? "#22c55e" : "#ef4444";
                    const bodyTop = Math.min(c.o, c.c);
                    const bodyH   = Math.max(0.8, Math.abs(c.o - c.c));

                    return (
                      <g key={i}>
                        {/* Wick */}
                        <line x1={c.x} y1={c.h} x2={c.x} y2={c.l}
                          stroke={color} strokeWidth="0.4" opacity={0.9} />
                        {/* Body */}
                        <rect
                          x={c.x - 1.6} y={bodyTop}
                          width="3.2" height={bodyH}
                          rx="0.2"
                          fill={color}
                          opacity={isHitCandle && !slHit ? 0 : 0.88}
                        />
                      </g>
                    );
                  })}

                  {/* SL line */}
                  <line
                    x1="0" y1={SL_Y} x2="100" y2={SL_Y}
                    stroke={slHit ? "#ef4444" : "rgba(239,68,68,0.7)"}
                    strokeWidth={slHit ? "0.7" : "0.55"}
                    strokeDasharray="2.5 1.8"
                  />
                  <rect x="55" y={SL_Y - 5.5} width="25" height="5" rx="0.8"
                    fill={slHit ? "rgba(239,68,68,0.25)" : "rgba(239,68,68,0.12)"}
                  />
                  <text x="57.5" y={SL_Y - 2} fill={slHit ? "#ef4444" : "rgba(239,68,68,0.85)"}
                    fontSize="3" fontFamily="ui-monospace, monospace" fontWeight="600">
                    SL · {SL_PRICE}
                  </text>
                </svg>

                {/* Approaching price dot */}
                <AnimatePresence>
                  {phase === "chart" && (
                    <motion.div
                      key={`dot-${cycle}`}
                      className="pointer-events-none absolute z-[5]"
                      style={{
                        left: "calc(58% + 4px)",
                        top: "48%",
                        width: 8, height: 8,
                        borderRadius: "50%",
                        background: "#38bdf8",
                        boxShadow: "0 0 10px 3px rgba(56,189,248,0.7)",
                        transform: "translate(-50%, -50%)",
                      }}
                      initial={{ opacity: 1, y: 0 }}
                      animate={{ opacity: 1, y: "52px" }}
                      transition={{ duration: PHASE_CHART_S * 0.85, ease: [0.45, 0, 0.55, 1] }}
                    />
                  )}
                </AnimatePresence>

                {/* Status label */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  <span className="text-[8px] font-mono text-slate-600">Vol: 1.2K</span>
                  <motion.span
                    className="text-[8px] font-mono font-semibold"
                    animate={{
                      color: slHit ? "#ef4444" : "#64748b",
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {slHit ? "▼ Stop Loss Hit" : phase === "chart" ? "⚠ Approaching SL" : ""}
                  </motion.span>
                </div>
              </div>

              {/* Bottom bar */}
              <div className="flex items-center justify-between border-t px-3 py-2"
                style={{ borderColor: "rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.01)" }}>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full" style={{ background: slHit ? "#ef4444" : "#22c55e" }} />
                  <span className="text-[8px] font-mono text-slate-500">
                    {slHit ? "Position closed" : "Long · 0.10 lot"}
                  </span>
                </div>
                <span
                  className="text-[9px] font-mono font-bold"
                  style={{ color: slHit ? "#ef4444" : "#22c55e" }}
                >
                  {slHit ? "-$28.40" : "+$14.20"}
                </span>
              </div>
            </div>

            {/* ── In-screen iOS notification ── */}
            <AnimatePresence>
              {showNotif && (
                <motion.div
                  key="notif"
                  initial={{ y: -120, opacity: 0, scale: 0.92 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: -110, opacity: 0, scale: 0.94 }}
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  className="absolute left-2 right-2 z-30"
                  style={{ top: "14px" }}
                >
                  <div
                    className="overflow-hidden rounded-2xl"
                    style={{
                      background: "rgba(18,18,24,0.97)",
                      border: "1px solid rgba(239,68,68,0.3)",
                      boxShadow: "0 20px 50px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 0 30px rgba(239,68,68,0.15)",
                      backdropFilter: "blur(24px)",
                    }}
                  >
                    {/* Notification header */}
                    <div className="flex items-center gap-2 border-b px-3 py-2"
                      style={{ borderColor: "rgba(239,68,68,0.15)", background: "rgba(239,68,68,0.06)" }}>
                      {/* Telegram icon */}
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: "#229ED9", boxShadow: "0 0 12px rgba(34,158,217,0.4)" }}>
                        <svg viewBox="0 0 24 24" fill="white" width="14" height="14">
                          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.02 9.52c-.146.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.883.701z"/>
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-white">Telegram</span>
                          <span className="text-[9px] font-mono text-slate-500">now</span>
                        </div>
                        <span className="text-[9px] text-slate-500">RiskSent · Risk Desk</span>
                      </div>
                    </div>

                    {/* Notification body */}
                    <div className="px-3 py-2.5 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-wide">🚨 Stop Loss Hit</span>
                        <span className="rounded px-1 py-0.5 text-[8px] font-mono font-bold uppercase"
                          style={{ background: "rgba(239,68,68,0.18)", color: "#f87171" }}>
                          EURUSD
                        </span>
                      </div>
                      <p className="text-[10px] leading-snug text-slate-300 font-mono">
                        Loss #2 this session.{" "}
                        <span className="font-semibold text-white">Daily limit at 80%.</span>
                      </p>
                      <p className="text-[10px] leading-snug font-mono" style={{ color: "#fb923c" }}>
                        → No new positions until tomorrow's session.
                      </p>
                      <p className="text-[9px] font-mono text-slate-600 pt-0.5">
                        Review your journal · protect your account
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                      <button className="flex-1 py-2 text-[10px] font-semibold text-indigo-400 hover:bg-white/[0.03] transition-colors">
                        View Risk Manager
                      </button>
                      <div className="w-px" style={{ background: "rgba(255,255,255,0.05)" }} />
                      <button className="flex-1 py-2 text-[10px] font-mono text-slate-500 hover:bg-white/[0.03] transition-colors">
                        Dismiss
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>

        {/* Glow under phone */}
        <div
          className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 h-16 w-[70%] rounded-full blur-2xl opacity-40"
          style={{ background: slHit ? "radial-gradient(ellipse, rgba(239,68,68,0.5), transparent)" : "radial-gradient(ellipse, rgba(99,102,241,0.4), transparent)" }}
        />
      </motion.div>

      {/* Caption */}
      <p className="mt-5 text-center text-[10px] font-mono uppercase tracking-[0.22em] text-slate-600">
        Live alert · delivered via Telegram
      </p>
    </div>
  );
}
