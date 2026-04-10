"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send } from "lucide-react";

const APPROACH_S = 3.6;
const ALERT_HOLD_S = 4.2;

export function HomeLiveAlertsPhone() {
  const [cycle, setCycle] = useState(0);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    setShowAlert(false);
    const hit = window.setTimeout(() => setShowAlert(true), APPROACH_S * 1000);
    return () => window.clearTimeout(hit);
  }, [cycle]);

  useEffect(() => {
    if (!showAlert) return;
    const t = window.setTimeout(() => {
      setShowAlert(false);
      setCycle((c) => c + 1);
    }, ALERT_HOLD_S * 1000);
    return () => window.clearTimeout(t);
  }, [showAlert]);

  return (
    <div className="relative mx-auto flex w-full max-w-[280px] flex-col items-center sm:max-w-[300px]">
      <AnimatePresence mode="wait">
        {showAlert && (
          <motion.div
            key="tg"
            initial={{ opacity: 0, y: 12, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className="absolute -top-2 z-20 w-[108%] max-w-[340px] -translate-y-full px-1"
          >
            <div
              className="rounded-2xl border border-white/[0.12] p-3 shadow-2xl"
              style={{
                background: "linear-gradient(145deg, rgba(30,32,40,0.98), rgba(14,14,18,0.98))",
                boxShadow: "0 24px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(56,189,248,0.12)"
              }}
            >
              <div className="flex gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#229ED9] text-white shadow-lg shadow-[#229ED9]/30">
                  <Send className="h-5 w-5" strokeWidth={2.2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-white">RiskSent · Risk Manager</p>
                  <p className="mt-1 text-[11px] leading-snug text-slate-300 font-[family-name:var(--font-mono)]">
                    That&apos;s <span className="font-semibold text-[#ff8c00]">loss #2 today</span>. You&apos;re{" "}
                    <span className="text-white">done trading for the session</span> — flat, no new risk. Step away
                    now or you&apos;ll bleed the account with revenge and overtrading.
                  </p>
                  <p className="mt-1.5 text-[9px] font-mono uppercase tracking-wider text-slate-600">
                    Live alert · now
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="relative w-full"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
      >
        <div
          className="relative overflow-hidden rounded-[2.2rem] border border-white/[0.12] bg-[#0a0a0c] p-2 shadow-2xl"
          style={{
            boxShadow:
              "0 40px 80px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.04), 0 0 60px rgba(255,60,60,0.06)"
          }}
        >
          <div className="absolute left-1/2 top-2 z-10 h-5 w-[32%] -translate-x-1/2 rounded-full bg-black/90 ring-1 ring-white/10" />

          <div className="relative mt-6 overflow-hidden rounded-[1.65rem] bg-[#0e0f12] ring-1 ring-white/[0.06]">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
              <span className="text-[10px] font-mono font-bold text-slate-400">MetaTrader 5</span>
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#00e676]" />
              </div>
            </div>

            <div className="border-b border-white/[0.05] px-3 py-1.5">
              <p className="text-center text-[11px] font-mono font-bold text-slate-200">EURUSD,M5</p>
              <p className="text-center text-[9px] font-mono text-slate-500">Bid 1.08218 · Ask 1.08220</p>
            </div>

            <div className="relative aspect-[9/16] max-h-[320px] min-h-[260px] w-full bg-gradient-to-b from-[#12141a] to-[#0a0b0e]">
              <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                {[20, 35, 50, 65, 80].map((x) => (
                  <line
                    key={x}
                    x1={x}
                    y1="8"
                    x2={x}
                    y2="92"
                    stroke="rgba(255,255,255,0.03)"
                    strokeWidth="0.3"
                  />
                ))}
                {[22, 38, 54, 70].map((y) => (
                  <line
                    key={y}
                    x1="8"
                    y1={y}
                    x2="92"
                    y2={y}
                    stroke="rgba(255,255,255,0.03)"
                    strokeWidth="0.3"
                  />
                ))}

                {[
                  [16, 32, 28, 30],
                  [24, 30, 32, 29],
                  [32, 34, 36, 32],
                  [40, 31, 35, 33],
                  [48, 36, 40, 34],
                  [56, 38, 42, 36],
                  [64, 42, 46, 40],
                  [72, 46, 50, 44],
                  [80, 50, 54, 48],
                  [88, 54, 58, 52]
                ].map(([x, openY, highY, lowY], i) => {
                  const up = lowY > openY;
                  const top = Math.min(openY, lowY);
                  const h = Math.max(0.6, Math.abs(openY - lowY));
                  return (
                    <g key={i}>
                      <line
                        x1={x}
                        y1={highY}
                        x2={x}
                        y2={lowY}
                        stroke={up ? "#00e676" : "#ff3c3c"}
                        strokeWidth="0.35"
                      />
                      <rect
                        x={x - 1.2}
                        y={top}
                        width="2.4"
                        height={h}
                        rx="0.15"
                        fill={up ? "#00e676" : "#ff3c3c"}
                        opacity={0.88}
                      />
                    </g>
                  );
                })}

                <line
                  x1="8"
                  y1="72"
                  x2="92"
                  y2="72"
                  stroke="#ff3c3c"
                  strokeWidth="0.5"
                  strokeDasharray="2 1.5"
                  opacity={0.95}
                />
                <text x="54" y="69.5" fill="#ff3c3c" fontSize="3" fontFamily="ui-monospace, monospace">
                  SL 1.0822
                </text>
              </svg>

              <motion.div
                key={cycle}
                className="absolute left-[52%] h-2 w-2 -translate-x-1/2 rounded-full bg-[#38bdf8] shadow-[0_0_12px_rgba(56,189,248,0.9)] ring-2 ring-[#38bdf8]/40"
                initial={{ top: "52%" }}
                animate={{ top: "72%" }}
                transition={{ duration: APPROACH_S, ease: [0.45, 0, 0.55, 1] }}
              />

              <div className="absolute bottom-2 left-2 right-2 flex justify-between text-[8px] font-mono text-slate-500">
                <span>Vol</span>
                <span className={showAlert ? "animate-pulse text-[#ff3c3c]" : "text-slate-400"}>
                  {showAlert ? "Stop loss" : "Price into stop"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <p className="mt-4 text-center text-[10px] font-mono uppercase tracking-wider text-slate-600">
        MetaTrader on your phone → Telegram fires instantly
      </p>
    </div>
  );
}
