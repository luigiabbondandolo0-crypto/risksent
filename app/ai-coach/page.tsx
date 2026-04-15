"use client";

import { AiCoachPageClient } from "@/components/ai-coach/AiCoachPageClient";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Brain } from "lucide-react";

const ACCENT = "#a855f7";

// Typing animation bubbles
const CHAT_MESSAGES = [
  { role: "user",      text: "Why do I keep losing on GBPJPY Fridays?" },
  { role: "assistant", text: "Your win rate on GBPJPY drops to 31% on Fridays — likely due to lower liquidity pre-weekend. Your best GBPJPY sessions are Tues–Weds during London open. Want me to flag future Friday setups?" },
  { role: "user",      text: "Yes. And what's my actual edge?" },
  { role: "assistant", text: "Your top setup: EURUSD breakout on 4H, London open, RR ≥ 2.0. Win rate: 67.4% over 84 trades. Consider focusing here exclusively." },
];

export default function AiCoachPage() {
  return (
    <div className="min-h-full overflow-x-hidden bg-[#080809]">

      {/* HERO WRAPPER */}
      <section className="relative min-h-[85vh] flex flex-col justify-center px-6 pt-24 pb-20 lg:px-16 overflow-hidden">
        {/* Purple particle field */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-15%] right-[-10%] w-[70vw] h-[70vw] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(168,85,247,0.08) 0%, transparent 65%)" }} />
          <div className="absolute bottom-[-10%] left-[-5%] w-[55vw] h-[55vw] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.06) 0%, transparent 65%)" }} />
          <div className="absolute top-[40%] left-[40%] w-[30vw] h-[30vw] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(168,85,247,0.04) 0%, transparent 65%)" }} />
        </div>
        <div className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(168,85,247,0.05) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
          }}
        />

        <div className="relative max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-16">
            {/* Left: headline */}
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mb-6"
              >
                <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-[0.2em]"
                  style={{ color: ACCENT, borderColor: "rgba(168,85,247,0.3)", background: "rgba(168,85,247,0.08)" }}>
                  <Brain className="h-3 w-3" />
                  AI Coach
                </span>
              </motion.div>

              <h1 className="text-[clamp(48px,8vw,120px)] font-black leading-[0.9] tracking-[-0.04em] text-white mb-8"
                style={{ fontFamily: "'Syne', sans-serif" }}>
                {["Your", "unfair"].map((w, i) => (
                  <span key={i} className="inline-block overflow-hidden mr-[0.2em]">
                    <motion.span
                      className="inline-block"
                      initial={{ y: "110%", opacity: 0 }}
                      animate={{ y: "0%", opacity: 1 }}
                      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] as [number, number, number, number], delay: 0.2 + i * 0.08 }}
                    >
                      {w}
                    </motion.span>
                  </span>
                ))}
                <br />
                <span className="inline-block overflow-hidden">
                  <motion.span
                    className="inline-block bg-clip-text text-transparent"
                    style={{ backgroundImage: "linear-gradient(135deg, #a855f7, #6366f1)" }}
                    initial={{ y: "110%", opacity: 0 }}
                    animate={{ y: "0%", opacity: 1 }}
                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] as [number, number, number, number], delay: 0.36 }}
                  >
                    advantage.
                  </motion.span>
                </span>
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.65 }}
                className="max-w-lg text-slate-400 leading-relaxed mb-8"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px" }}
              >
                Your journal data, your backtest results, your risk patterns — all analyzed by AI trained on elite trading psychology.<br />
                <span className="text-slate-300">It knows your edge better than you do.</span>
              </motion.p>

              {/* Feature pills */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="flex flex-wrap gap-2 mb-8"
              >
                {["Pattern detection", "Psychology analysis", "Setup scoring", "Session insights", "Risk coaching"].map((pill, i) => (
                  <motion.span key={pill}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9 + i * 0.07, duration: 0.4 }}
                    className="text-[11px] font-mono px-3 py-1.5 rounded-full border"
                    style={{ color: ACCENT, borderColor: "rgba(168,85,247,0.25)", background: "rgba(168,85,247,0.08)" }}
                  >
                    {pill}
                  </motion.span>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.1 }}
                className="flex gap-3"
              >
                <Link href="/signup"
                  className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-black transition-all hover:scale-[1.03] cursor-pointer"
                  style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)", boxShadow: "0 0 30px rgba(168,85,247,0.3)" }}>
                  Talk to your coach <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/mock/dashboard"
                  className="inline-flex items-center gap-2 rounded-2xl border px-6 py-3 text-sm font-medium text-slate-300 transition-all hover:text-white cursor-pointer"
                  style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", backdropFilter: "blur(12px)" }}>
                  Live demo
                </Link>
              </motion.div>
            </div>

            {/* Right: chat mockup */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              className="shrink-0 w-full lg:max-w-sm"
            >
              <div
                className="rounded-2xl overflow-hidden crt-overlay"
                style={{
                  background: "rgba(12,10,20,0.95)",
                  border: "1px solid rgba(168,85,247,0.2)",
                  boxShadow: "0 0 60px rgba(168,85,247,0.08), 0 24px 80px rgba(0,0,0,0.5)",
                  backdropFilter: "blur(20px)",
                }}
              >
                {/* Chat header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b"
                  style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(168,85,247,0.05)" }}>
                  <div className="h-8 w-8 rounded-full flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)", boxShadow: "0 0 12px rgba(168,85,247,0.4)" }}>
                    <Brain className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>RiskSent AI Coach</p>
                    <p className="text-[10px] font-mono text-emerald-400">● Online</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="p-4 space-y-3">
                  {CHAT_MESSAGES.map((msg, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + i * 0.3, duration: 0.4 }}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed"
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          background: msg.role === "user"
                            ? "rgba(168,85,247,0.15)"
                            : "rgba(255,255,255,0.04)",
                          border: msg.role === "user"
                            ? "1px solid rgba(168,85,247,0.25)"
                            : "1px solid rgba(255,255,255,0.06)",
                          color: msg.role === "user" ? "#e2e8f0" : "#94a3b8",
                        }}
                      >
                        {msg.text}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Input area */}
                <div className="px-4 pb-4">
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <span className="text-xs text-slate-600 font-mono flex-1">Ask about your trading data...</span>
                    <div className="h-6 w-6 rounded-lg flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}>
                      <ArrowRight className="h-3 w-3 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* AI COACH APP */}
      <section className="px-6 lg:px-16 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl p-px"
            style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.35), rgba(99,102,241,0.25), rgba(255,255,255,0.04))" }}>
            <div className="rounded-3xl" style={{ background: "#0a0810" }}>
              <AiCoachPageClient />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
