"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Brain, BarChart2, Shield, Zap, Eye, Target } from "lucide-react";

const ACCENT = "#6366f1";
const GREEN  = "#4ADE80";

const CHAT_MESSAGES = [
  { role: "user",      text: "Why do I keep losing on GBPJPY Fridays?" },
  { role: "assistant", text: "Win rate drops to 31% on Fridays — lower liquidity pre-weekend. Your best GBPJPY window is Tues–Weds, London open." },
  { role: "user",      text: "What's my strongest setup?" },
  { role: "assistant", text: "EURUSD breakout, 4H, London open, RR ≥ 2.0. 67.4% win rate across 84 trades." },
];

const FEATURES = [
  { n: "01", icon: BarChart2, title: "Pattern detection",   desc: "Surfaces your highest-win setups from journal data. Knows where your edge actually lives." },
  { n: "02", icon: Brain,     title: "Psychology analysis", desc: "Flags revenge trading, overtrading, and FOMO patterns before they cost you." },
  { n: "03", icon: Target,    title: "Setup scoring",       desc: "Every entry scored against your own rules in real-time. A+ only." },
  { n: "04", icon: Eye,       title: "Session insights",    desc: "Win rate by session, hour, and pair. Your actual best trading window." },
  { n: "05", icon: Shield,    title: "Risk coaching",       desc: "Monitors position size against your rules. Flags deviations before you pull the trigger." },
  { n: "06", icon: Zap,       title: "Instant feedback",    desc: "Post-trade analysis in seconds — not hours later when context is gone." },
];

const STATS = [
  { value: "+67%", label: "avg win rate lift"  },
  { value: "84",   label: "trades per insight" },
  { value: "3×",   label: "faster pattern ID"  },
  { value: "<1s",  label: "feedback latency"   },
];

const fade = (delay = 0) => ({
  initial:     { opacity: 0, y: 10 },
  whileInView: { opacity: 1, y:  0 },
  viewport:    { once: true },
  transition:  { duration: 0.4, delay },
});

export default function AiCoachPage() {
  return (
    <div className="min-h-full overflow-x-hidden" style={{ background: "#070710" }}>

      {/* Single ambient glow — top-right only */}
      <div className="pointer-events-none fixed inset-0" style={{ zIndex: 0 }}>
        <div
          className="absolute -top-40 right-0 w-[55vw] h-[65vh] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.07) 0%, transparent 70%)" }}
        />
      </div>

      {/* ── HERO ── */}
      <section
        className="relative min-h-[90vh] flex items-center px-6 pt-20 pb-16 lg:px-16"
        style={{ zIndex: 1 }}
      >
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-14 items-center">

            {/* Left — headline */}
            <div className="max-w-xl">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="text-[11px] font-mono uppercase tracking-[0.25em] mb-6"
                style={{ color: ACCENT }}
              >
                AI Coach
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-[clamp(52px,7vw,96px)] font-black leading-[0.88] tracking-[-0.04em] text-white mb-6"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Your data<br />
                knows<br />
                <span style={{ color: ACCENT }}>your edge.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="text-slate-400 text-sm leading-relaxed mb-10 max-w-sm"
                style={{ fontFamily: "var(--font-mono), monospace" }}
              >
                Journal entries, backtest results, risk patterns — all analyzed by AI to surface what
                you&apos;re actually good at.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="flex items-center gap-3"
              >
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                  style={{ background: ACCENT }}
                >
                  Get started <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/mock/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors hover:text-white"
                  style={{ color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  View demo
                </Link>
              </motion.div>
            </div>

            {/* Right — chat mockup */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.25 }}
              className="w-full"
            >
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "rgba(10,10,20,0.92)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
                }}
              >
                {/* Chat header */}
                <div
                  className="flex items-center gap-3 px-4 py-3 border-b"
                  style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.015)" }}
                >
                  <div
                    className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: ACCENT }}
                  >
                    <Brain className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
                      AI Coach
                    </p>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full" style={{ background: GREEN }} />
                      <p className="text-[10px] font-mono" style={{ color: GREEN }}>Online</p>
                    </div>
                  </div>
                  <div className="ml-auto flex gap-1.5">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="h-2 w-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
                    ))}
                  </div>
                </div>

                {/* Messages */}
                <div className="p-4 space-y-2.5">
                  {CHAT_MESSAGES.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 + i * 0.22, duration: 0.35 }}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className="max-w-[88%] rounded-xl px-3 py-2 text-xs leading-relaxed"
                        style={{
                          fontFamily: "var(--font-mono), monospace",
                          background: msg.role === "user" ? `${ACCENT}20` : "rgba(255,255,255,0.04)",
                          border: `1px solid ${msg.role === "user" ? `${ACCENT}28` : "rgba(255,255,255,0.06)"}`,
                          color: msg.role === "user" ? "#e2e8f0" : "#94a3b8",
                        }}
                      >
                        {msg.text}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Input */}
                <div className="px-4 pb-4">
                  <div
                    className="flex items-center gap-2 rounded-lg px-3 py-2"
                    style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    <span className="text-[11px] font-mono text-slate-700 flex-1">
                      Ask about your trading data…
                    </span>
                    <div
                      className="h-5 w-5 rounded-md flex items-center justify-center shrink-0"
                      style={{ background: ACCENT }}
                    >
                      <ArrowRight className="h-2.5 w-2.5 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section
        className="relative border-y px-6 lg:px-16 py-8"
        style={{ zIndex: 1, borderColor: "rgba(255,255,255,0.05)" }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {STATS.map((s, i) => (
              <motion.div
                key={i}
                {...fade(i * 0.07)}
                className="px-6 first:pl-0 last:pr-0 py-2 border-r last:border-r-0"
                style={{ borderColor: "rgba(255,255,255,0.05)" }}
              >
                <p
                  className="text-2xl font-black text-white tracking-tight mb-0.5"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {s.value}
                </p>
                <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-slate-600">
                  {s.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="relative px-6 lg:px-16 py-24" style={{ zIndex: 1 }}>
        <div className="max-w-7xl mx-auto">

          <motion.div {...fade()} className="mb-14">
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-600 mb-3">
              Capabilities
            </p>
            <h2
              className="text-[clamp(32px,4vw,56px)] font-black leading-[0.9] tracking-[-0.03em] text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Built for<br />serious traders.
            </h2>
          </motion.div>

          <div
            className="grid grid-cols-1 md:grid-cols-2 border-t border-l"
            style={{ borderColor: "rgba(255,255,255,0.05)" }}
          >
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={i}
                  {...fade(i * 0.05)}
                  className="group flex items-start gap-5 p-7 border-b border-r transition-colors duration-200"
                  style={{ borderColor: "rgba(255,255,255,0.05)", background: "#070710" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#0c0c1a"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#070710"; }}
                >
                  <span
                    className="text-[10px] font-mono mt-0.5 w-6 shrink-0"
                    style={{ color: "rgba(255,255,255,0.15)" }}
                  >
                    {f.n}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: ACCENT }} />
                      <h3
                        className="text-sm font-bold text-white"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {f.title}
                      </h3>
                    </div>
                    <p
                      className="text-xs text-slate-500 leading-relaxed group-hover:text-slate-400 transition-colors duration-200"
                      style={{ fontFamily: "var(--font-mono), monospace" }}
                    >
                      {f.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ── WEEKLY REPORT ── */}
      <section className="relative px-6 lg:px-16 py-20" style={{ zIndex: 1 }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left — text */}
            <div>
              <motion.div {...fade()}>
                <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-600 mb-3">
                  Weekly report
                </p>
                <h2
                  className="text-[clamp(32px,4vw,56px)] font-black leading-[0.9] tracking-[-0.03em] text-white mb-5"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Know exactly<br />
                  <span style={{ color: ACCENT }}>where you stand.</span>
                </h2>
                <p
                  className="text-sm text-slate-400 leading-relaxed max-w-sm mb-8"
                  style={{ fontFamily: "var(--font-mono), monospace" }}
                >
                  Patterns, psychology flags, edge analysis — compiled every week, ready before Monday open.
                </p>
              </motion.div>

              <div className="space-y-3">
                {[
                  "Best and worst setups ranked by expectancy",
                  "Psychology flags — tilt, overtrading, FOMO",
                  "Edge score per session and pair",
                  "Week-over-week improvement tracking",
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    {...fade(i * 0.07)}
                    className="flex items-start gap-3"
                  >
                    <div
                      className="h-px w-4 mt-[7px] shrink-0"
                      style={{ background: ACCENT }}
                    />
                    <p
                      className="text-xs text-slate-500"
                      style={{ fontFamily: "var(--font-mono), monospace" }}
                    >
                      {item}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right — report card */}
            <motion.div
              {...fade(0.1)}
              className="rounded-2xl overflow-hidden"
              style={{
                background: "rgba(10,10,20,0.92)",
                border: "1px solid rgba(255,255,255,0.07)",
                boxShadow: "0 32px 80px rgba(0,0,0,0.4)",
              }}
            >
              {/* Header */}
              <div
                className="px-5 py-4 border-b flex items-center justify-between"
                style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.015)" }}
              >
                <div>
                  <p className="text-xs font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
                    Weekly AI Report
                  </p>
                  <p className="text-[10px] font-mono text-slate-600">Apr 7–13, 2025</p>
                </div>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                  style={{ color: GREEN, background: `${GREEN}12`, border: `1px solid ${GREEN}25` }}
                >
                  Generated
                </span>
              </div>

              {/* Metrics */}
              <div
                className="grid grid-cols-3 border-b"
                style={{ borderColor: "rgba(255,255,255,0.05)" }}
              >
                {[
                  { label: "Win rate",   val: "64%", delta: "+3pts", positive: true  },
                  { label: "Risk score", val: "A−",  delta: "stable", positive: null },
                  { label: "Edge score", val: "71",  delta: "+6",    positive: true  },
                ].map((m, i) => (
                  <div
                    key={i}
                    className="px-4 py-3 text-center border-r last:border-r-0"
                    style={{ background: "rgba(0,0,0,0.2)", borderColor: "rgba(255,255,255,0.05)" }}
                  >
                    <p className="text-lg font-black text-white mb-0.5" style={{ fontFamily: "var(--font-display)" }}>
                      {m.val}
                    </p>
                    <p className="text-[9px] font-mono uppercase tracking-widest text-slate-600">{m.label}</p>
                    <p
                      className="text-[9px] font-mono mt-0.5"
                      style={{ color: m.positive ? GREEN : "rgba(255,255,255,0.2)" }}
                    >
                      {m.delta}
                    </p>
                  </div>
                ))}
              </div>

              {/* Insights */}
              <div className="p-4 space-y-1.5">
                <p className="text-[9px] font-mono uppercase tracking-widest text-slate-700 mb-3">
                  AI insights
                </p>
                {[
                  { tag: "STRONG", positive: true,  text: "EURUSD London breakout: 71% WR — up 4pts. Hold this setup." },
                  { tag: "WATCH",  positive: false,  text: "Monday performance −22%. Reduce size on Mondays." },
                  { tag: "INFO",   positive: null,   text: "Best window: London 08:00–10:00 GMT. WR 69%, avg RR 2.3." },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-lg px-3 py-2.5"
                    style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    <span
                      className="text-[9px] font-mono font-bold shrink-0 mt-0.5 w-10"
                      style={{
                        color: item.positive === true
                          ? GREEN
                          : item.positive === false
                          ? "#F87171"
                          : "rgba(255,255,255,0.25)",
                      }}
                    >
                      {item.tag}
                    </span>
                    <p className="text-[11px] font-mono text-slate-400 leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>

              <div
                className="px-4 py-3 border-t"
                style={{ borderColor: "rgba(255,255,255,0.05)" }}
              >
                <p className="text-[10px] font-mono text-slate-700 text-center">
                  Next report in 3 days · 12 trades queued
                </p>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative px-6 lg:px-16 py-24" style={{ zIndex: 1 }}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            {...fade()}
            className="rounded-2xl px-8 py-16 text-center"
            style={{
              background: `${ACCENT}08`,
              border: `1px solid ${ACCENT}18`,
            }}
          >
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-600 mb-4">
              Ready?
            </p>
            <h2
              className="text-[clamp(36px,5vw,64px)] font-black leading-[0.9] tracking-[-0.03em] text-white mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Your data is<br />
              <span style={{ color: ACCENT }}>trying to help you.</span>
            </h2>
            <p
              className="text-sm text-slate-500 max-w-sm mx-auto mb-8"
              style={{ fontFamily: "var(--font-mono), monospace" }}
            >
              Let the AI Coach surface what your instincts miss.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: ACCENT }}
              >
                Start for free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/mock/dashboard"
                className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-medium transition-colors hover:text-white"
                style={{ color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                View demo
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
