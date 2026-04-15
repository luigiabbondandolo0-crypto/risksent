"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Brain, TrendingUp, BarChart2, Shield, Zap, Eye, Target } from "lucide-react";

const ACCENT = "#a855f7";
const ACCENT2 = "#6366f1";

const CHAT_MESSAGES = [
  { role: "user",      text: "Why do I keep losing on GBPJPY Fridays?" },
  { role: "assistant", text: "Your win rate on GBPJPY drops to 31% on Fridays — likely due to lower liquidity pre-weekend. Your best GBPJPY sessions are Tues–Weds during London open." },
  { role: "user",      text: "What's my actual edge?" },
  { role: "assistant", text: "EURUSD breakout on 4H, London open, RR ≥ 2.0. Win rate: 67.4% over 84 trades. This is your highest-confidence setup." },
];

const FEATURES = [
  {
    icon: BarChart2,
    title: "Pattern detection",
    desc: "Automatically surfaces your highest-win setups from your journal data. Know exactly when and where your edge is strongest.",
    color: ACCENT,
  },
  {
    icon: Brain,
    title: "Psychology analysis",
    desc: "Tracks your emotional state across trades. Detects revenge trading, overtrading, and FOMO patterns before they cost you.",
    color: "#38BDF8",
  },
  {
    icon: Target,
    title: "Setup scoring",
    desc: "Every setup gets scored in real-time. A+ only. The AI enforces your own criteria — no more B-grade entries.",
    color: "#4ADE80",
  },
  {
    icon: Eye,
    title: "Session insights",
    desc: "London, New York, Asian — your win rate differs by session. AI tells you your best trading window down to the hour.",
    color: ACCENT2,
  },
  {
    icon: Shield,
    title: "Risk coaching",
    desc: "Monitors your risk-per-trade against your own rules. Flags deviations before you pull the trigger on an oversized position.",
    color: "#FB923C",
  },
  {
    icon: Zap,
    title: "Instant feedback",
    desc: "Post-trade analysis in seconds. Not hours later when you've forgotten the context — immediately after you close.",
    color: ACCENT,
  },
];

const STATS = [
  { value: "67%", label: "avg win rate improvement", color: "#4ADE80" },
  { value: "84", label: "trades analyzed per insight", color: ACCENT },
  { value: "3×", label: "faster pattern recognition", color: "#38BDF8" },
  { value: "<1s", label: "post-trade feedback delay", color: "#FB923C" },
];

export default function AiCoachPage() {
  return (
    <div className="min-h-full overflow-x-hidden" style={{ background: "#070710" }}>

      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0" style={{ zIndex: 0 }}>
        <div className="absolute top-[-15%] right-[-10%] w-[70vw] h-[70vw] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(168,85,247,0.09) 0%, transparent 65%)" }} />
        <div className="absolute bottom-[-10%] left-[-5%] w-[55vw] h-[55vw] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.06) 0%, transparent 65%)" }} />
        <div className="absolute top-[40%] left-[40%] w-[30vw] h-[30vw] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(168,85,247,0.04) 0%, transparent 65%)" }} />
        <div className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(168,85,247,0.04) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(ellipse 80% 80% at 50% 30%, black 20%, transparent 100%)",
          }}
        />
      </div>

      {/* ── HERO ── */}
      <section className="relative min-h-[88vh] flex flex-col justify-center px-6 pt-24 pb-20 lg:px-16 overflow-hidden" style={{ zIndex: 1 }}>
        <div className="relative max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-16">

            {/* Left */}
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mb-6"
              >
                <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-[0.2em]"
                  style={{ color: ACCENT, borderColor: "rgba(168,85,247,0.3)", background: "rgba(168,85,247,0.08)" }}>
                  <Brain className="h-3 w-3" />
                  AI Coach
                </span>
              </motion.div>

              <h1
                className="text-[clamp(48px,8vw,120px)] font-black leading-[0.9] tracking-[-0.04em] text-white mb-8"
                style={{ fontFamily: "var(--font-display)" }}
              >
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
                style={{ fontFamily: "var(--font-mono), monospace", fontSize: "14px" }}
              >
                Your journal data, your backtest results, your risk patterns — all analyzed by AI trained on elite trading psychology.{" "}
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
                className="flex flex-wrap gap-3"
              >
                <Link href="/signup"
                  className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-white transition-all hover:scale-[1.03] cursor-pointer"
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
                className="rounded-2xl overflow-hidden"
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
                    <p className="text-xs font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>RiskSent AI Coach</p>
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
                          fontFamily: "var(--font-mono), monospace",
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

                  {/* Typing indicator */}
                  <motion.div
                    className="flex justify-start"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.0, duration: 0.4 }}
                  >
                    <div className="rounded-2xl px-3.5 py-2.5 flex gap-1 items-center"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      {[0,1,2].map(j => (
                        <motion.div key={j}
                          className="h-1.5 w-1.5 rounded-full bg-slate-500"
                          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: j * 0.2 }}
                        />
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* Input area */}
                <div className="px-4 pb-4">
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <span className="text-xs text-slate-600 font-mono flex-1">Ask about your trading data…</span>
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

      {/* ── STATS ── */}
      <section className="relative px-6 lg:px-16 py-12 border-y" style={{ zIndex: 1, borderColor: "rgba(255,255,255,0.05)", background: "rgba(10,8,20,0.9)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <motion.div key={i}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <p className="text-[clamp(32px,4vw,52px)] font-black tracking-tight mb-1"
                style={{ fontFamily: "var(--font-display)", color: s.color, textShadow: `0 0 30px ${s.color}50` }}>
                {s.value}
              </p>
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-slate-500">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="relative px-6 lg:px-16 py-20" style={{ zIndex: 1 }}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-14 max-w-xl"
          >
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-500 mb-3">How it works</p>
            <h2 className="text-[clamp(36px,5vw,64px)] font-black leading-[0.95] tracking-[-0.03em] text-white"
              style={{ fontFamily: "var(--font-display)" }}>
              Your coach.<br />
              <span style={{ color: ACCENT }}>Always on.</span>
            </h2>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { step: "01", title: "Syncs your data", desc: "Pulls every trade from your journal, backtest sessions, and risk events. Full trading history in one place." },
              { step: "02", title: "Finds your patterns", desc: "Machine learning surfaces your real edge — not what you think it is. Your actual highest-probability setups." },
              { step: "03", title: "Coaches you live", desc: "Pre-trade checks, post-trade reviews, psychology flags. Real-time feedback that makes you a better trader." },
            ].map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="relative rounded-2xl p-6 overflow-hidden"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(12px)" }}
              >
                <div className="pointer-events-none absolute -top-6 -right-6 text-[80px] font-black opacity-[0.04] leading-none select-none"
                  style={{ fontFamily: "var(--font-display)", color: ACCENT }}>
                  {s.step}
                </div>
                <span className="text-xs font-mono text-slate-600 mb-4 block">{s.step}</span>
                <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: "var(--font-display)" }}>{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed" style={{ fontFamily: "var(--font-mono), monospace" }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="relative px-6 lg:px-16 py-16" style={{ zIndex: 1 }}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-500 mb-3">Features</p>
            <h2 className="text-[clamp(36px,5vw,64px)] font-black leading-[0.95] tracking-[-0.03em] text-white"
              style={{ fontFamily: "var(--font-display)" }}>
              Built for<br /><span className="text-slate-500">serious traders.</span>
            </h2>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.07 }}
                  whileHover={{ y: -5, transition: { type: "spring", stiffness: 380, damping: 26 } }}
                  className="group relative overflow-hidden rounded-2xl p-6 cursor-default"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(12px)" }}
                >
                  <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `radial-gradient(ellipse at 0% 100%, ${f.color}12 0%, transparent 70%)` }} />
                  <div className="relative">
                    <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{ background: `${f.color}18`, border: `1px solid ${f.color}30` }}>
                      <Icon className="h-4 w-4" style={{ color: f.color }} />
                    </div>
                    <h3 className="text-base font-bold text-white mb-2" style={{ fontFamily: "var(--font-display)" }}>{f.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed group-hover:text-slate-400 transition-colors"
                      style={{ fontFamily: "var(--font-mono), monospace" }}>{f.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIAL ── */}
      <section className="relative px-6 lg:px-16 py-20" style={{ zIndex: 1 }}>
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl p-8 lg:p-12 text-center"
            style={{ background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.15)", backdropFilter: "blur(20px)" }}
          >
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}>
              <Brain className="h-5 w-5 text-white" />
            </div>
            <blockquote className="text-xl font-medium text-white mb-4 leading-relaxed"
              style={{ fontFamily: "var(--font-display)" }}>
              &ldquo;The AI coach found that I was losing 3× more on Mondays after a losing Friday. I had no idea. Changed everything.&rdquo;
            </blockquote>
            <p className="text-sm text-slate-500 font-mono">— Alex R., prop trader, 3-year RiskSent user</p>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative px-6 lg:px-16 py-24" style={{ zIndex: 1 }}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl p-px"
            style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.45), rgba(99,102,241,0.3), rgba(255,255,255,0.04))" }}
          >
            <div className="relative overflow-hidden rounded-3xl px-8 py-16 text-center" style={{ background: "#0a0810" }}>
              <div className="pointer-events-none absolute inset-0"
                style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.1) 0%, transparent 60%)" }} />
              <h2 className="relative text-[clamp(36px,5vw,72px)] font-black leading-[0.95] tracking-[-0.03em] text-white mb-4"
                style={{ fontFamily: "var(--font-display)" }}>
                Your data is<br />
                <span className="bg-clip-text text-transparent"
                  style={{ backgroundImage: "linear-gradient(135deg, #a855f7, #6366f1)" }}>
                  trying to help you.
                </span>
              </h2>
              <p className="relative text-slate-400 max-w-md mx-auto mb-8"
                style={{ fontFamily: "var(--font-mono), monospace", fontSize: "14px" }}>
                Let the AI coach surface what your instincts miss.
              </p>
              <div className="relative flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link href="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-sm font-bold text-white transition-all hover:scale-[1.03] cursor-pointer"
                  style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)", boxShadow: "0 0 40px rgba(168,85,247,0.3)" }}>
                  Start for free <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/mock/dashboard"
                  className="inline-flex items-center justify-center rounded-2xl border px-8 py-4 text-sm font-medium text-slate-300 transition-all hover:text-white cursor-pointer"
                  style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}>
                  View demo
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
