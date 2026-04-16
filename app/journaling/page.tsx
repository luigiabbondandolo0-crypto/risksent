"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { ArrowRight, TrendingUp } from "lucide-react";
import AnimatedCounter from "@/components/ui/animated-counter";

gsap.registerPlugin(ScrollTrigger);

const ACCENT = "#00e676";

// Mock trade rows for the animated log
const TRADE_ROWS = [
  { pair: "EURUSD", dir: "LONG",  pl: "+420.50", pct: "+0.41%", tag: "Breakout", win: true,  date: "Apr 14" },
  { pair: "GBPJPY", dir: "SHORT", pl: "-280.00", pct: "-0.28%", tag: "Reversal", win: false, date: "Apr 13" },
  { pair: "XAUUSD", dir: "LONG",  pl: "+310.00", pct: "+0.31%", tag: "Trend",    win: true,  date: "Apr 12" },
  { pair: "USDJPY", dir: "SHORT", pl: "+190.00", pct: "+0.19%", tag: "S/R",      win: true,  date: "Apr 11" },
  { pair: "EURUSD", dir: "LONG",  pl: "-140.00", pct: "-0.14%", tag: "Breakout", win: false, date: "Apr 10" },
  { pair: "BTCUSD", dir: "LONG",  pl: "+850.00", pct: "+0.85%", tag: "Trend",    win: true,  date: "Apr 9" },
];

export default function JournalingPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.refresh();
      gsap.from(".jn-hero-word", {
        yPercent: 110, opacity: 0, duration: 1, stagger: 0.07, ease: "expo.out", delay: 0.2,
      });
      gsap.from(".jn-fade", {
        opacity: 0, y: 20, duration: 0.8, stagger: 0.1, delay: 0.8, ease: "power3.out",
      });
      gsap.utils.toArray<HTMLElement>(".jn-reveal").forEach((el) => {
        gsap.from(el, {
          opacity: 0, y: 40, duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none none" },
        });
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-full overflow-x-hidden bg-[#080809]">

      {/* HERO */}
      <section className="relative min-h-[85vh] flex flex-col justify-center px-6 pt-24 pb-20 lg:px-16 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(0,230,118,0.07) 0%, transparent 65%)" }} />
          <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(34,211,238,0.04) 0%, transparent 65%)" }} />
        </div>
        <div className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(0,230,118,0.05) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
          }}
        />

        <div className="relative max-w-7xl mx-auto w-full">
          {/* Animated trade rows — right column on desktop */}
          <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-[420px] overflow-hidden opacity-70 pointer-events-none">
            <div className="absolute inset-0"
              style={{ background: "linear-gradient(90deg, #080809 0%, transparent 20%, transparent 80%, #080809 100%)" }} />
            {TRADE_ROWS.map((t, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 0.6, x: 0 }}
                transition={{ delay: 0.8 + i * 0.15, duration: 0.5, ease: "easeOut" }}
                className="flex items-center justify-between px-4 py-2.5 border-b"
                style={{ borderColor: "rgba(255,255,255,0.04)", fontFamily: "'JetBrains Mono', monospace" }}>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full" style={{ background: t.win ? ACCENT : "#ff3c3c" }} />
                  <span className="text-xs font-bold text-white">{t.pair}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{ color: t.dir === "LONG" ? ACCENT : "#ff3c3c", background: t.dir === "LONG" ? "rgba(0,230,118,0.1)" : "rgba(255,60,60,0.1)" }}>
                    {t.dir}
                  </span>
                  <span className="text-[10px] text-slate-600 px-1.5 py-0.5 rounded bg-white/[0.03]">{t.tag}</span>
                </div>
                <span className="text-xs font-bold" style={{ color: t.win ? ACCENT : "#ff3c3c" }}>{t.pl}</span>
              </motion.div>
            ))}
          </div>

          <div className="jn-fade mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-[0.2em]"
              style={{ color: ACCENT, borderColor: "rgba(0,230,118,0.3)", background: "rgba(0,230,118,0.08)" }}>
              <TrendingUp className="h-3 w-3" />
              Trading Journal
            </span>
          </div>

          <h1 className="text-[clamp(48px,8vw,120px)] font-black leading-[0.9] tracking-[-0.04em] text-white mb-8"
            style={{ fontFamily: "var(--font-display)" }}>
            {["Every", "trade"].map((w, i) => (
              <span key={i} className="inline-block overflow-hidden mr-[0.2em]">
                <span className="jn-hero-word inline-block">{w}</span>
              </span>
            ))}
            <br />
            {["teaches", "you"].map((w, i) => (
              <span key={i} className="inline-block overflow-hidden mr-[0.2em]">
                <span className="jn-hero-word inline-block">{w}</span>
              </span>
            ))}
            <span className="inline-block overflow-hidden">
              <span className="jn-hero-word inline-block bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(135deg, #00e676, #22d3ee)" }}>
                something.
              </span>
            </span>
          </h1>

          <div className="jn-fade flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <p className="max-w-lg text-slate-400 leading-relaxed lg:max-w-sm"
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px" }}>
              Log every trade. Tag every setup. Review your psychology.<br />
              <span className="text-slate-300">Turn every loss into data — and every pattern into profit.</span>
            </p>
            <div className="flex gap-3">
              <Link href="/signup"
                className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-black transition-all hover:scale-[1.03] cursor-pointer"
                style={{ background: "linear-gradient(135deg, #00e676, #22d3ee)", boxShadow: "0 0 30px rgba(0,230,118,0.25)" }}>
                Start journaling <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/mock/dashboard"
                className="inline-flex items-center gap-2 rounded-2xl border px-6 py-3 text-sm font-medium text-slate-300 transition-all hover:text-white cursor-pointer"
                style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", backdropFilter: "blur(12px)" }}>
                Live demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="px-6 lg:px-16 py-12 border-y"
        style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(14,14,18,0.9)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { to: 346, suffix: "+", label: "Trades logged",        color: ACCENT },
            { to: 58,  suffix: "%", label: "Win rate tracked",     color: "#22d3ee" },
            { to: 22,  suffix: "",  label: "Sessions this month",  color: ACCENT },
            { to: 3,   suffix: "x", label: "Performance clarity",  color: "#818cf8" },
          ].map((s, i) => (
            <div key={i} className="stat-item text-center">
              <div className="text-[clamp(32px,4vw,56px)] font-black tracking-tight mb-1"
                style={{ fontFamily: "var(--font-display)", color: s.color, textShadow: `0 0 30px ${s.color}50` }}>
                <AnimatedCounter to={s.to} suffix={s.suffix} glowColor={s.color} duration={1400} />
              </div>
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DASHBOARD PREVIEW */}
      <section className="px-6 lg:px-16 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="jn-reveal relative overflow-hidden rounded-3xl p-px"
            style={{ background: "linear-gradient(135deg, rgba(0,230,118,0.3), rgba(34,211,238,0.2), rgba(255,255,255,0.04))" }}>
            <div className="rounded-3xl p-6 sm:p-8 lg:p-12" style={{ background: "#0a0a10" }}>

              {/* Header */}
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Journal Dashboard</p>
                  <p className="text-lg font-bold text-white mt-1" style={{ fontFamily: "var(--font-display)" }}>April 2026</p>
                </div>
                <span className="rounded-full px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-widest"
                  style={{ color: ACCENT, background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.2)" }}>
                  22 trades logged
                </span>
              </div>

              {/* Mini stat pills */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: "Win rate", value: "62%", color: ACCENT },
                  { label: "Profit factor", value: "1.8", color: "#22d3ee" },
                  { label: "Best setup", value: "Breakout", color: "#818cf8" },
                ].map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.4, ease: "easeOut" }}
                    whileHover={{ scale: 1.03, transition: { type: "spring", stiffness: 400, damping: 24 } }}
                    className="rounded-xl p-3 sm:p-4 text-center cursor-default"
                    style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${s.color}20` }}
                  >
                    <p
                      className="text-xl sm:text-2xl font-black"
                      style={{ fontFamily: "var(--font-display)", color: s.color, textShadow: `0 0 20px ${s.color}50` }}
                    >
                      {s.value}
                    </p>
                    <p className="text-[9px] font-mono uppercase tracking-widest text-slate-600 mt-1">{s.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Calendar heatmap */}
              <div className="rounded-2xl p-4 sm:p-6 mb-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-4">Monthly activity</p>
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                  {["S","M","T","W","T","F","S"].map((d, di) => (
                    <div key={di} className="text-center text-[9px] font-mono text-slate-600 pb-1">{d}</div>
                  ))}
                  {[...Array(3)].map((_, i) => <div key={`pad-${i}`} />)}
                  {[
                    null, null, {p:0.04,w:2}, null, {p:0.20,w:3}, {p:-0.12,w:4},
                    null, null, {p:0.09,w:2}, null, null, {p:0.31,w:5}, {p:-0.08,w:5},
                    {p:-0.04,w:6}, null, null, null, {p:0.12,w:3}, null, {p:0.20,w:4},
                    null, null, null, null, null, null, null,
                  ].map((d, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.7 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.018, duration: 0.32, ease: "easeOut" }}
                      whileHover={d ? { scale: 1.12, transition: { type: "spring", stiffness: 500, damping: 22 } } : {}}
                      className="aspect-square rounded-lg flex flex-col items-center justify-center text-[8px] sm:text-[9px] font-mono cursor-default"
                      style={{
                        background: d ? (d.p >= 0 ? "rgba(0,230,118,0.15)" : "rgba(255,60,60,0.15)") : "rgba(255,255,255,0.03)",
                        border: d ? `1px solid ${d.p >= 0 ? "rgba(0,230,118,0.35)" : "rgba(255,60,60,0.35)"}` : "1px solid rgba(255,255,255,0.05)",
                        color: d ? (d.p >= 0 ? ACCENT : "#ff3c3c") : "#334155",
                        boxShadow: d ? `0 0 12px ${d.p >= 0 ? "rgba(0,230,118,0.1)" : "rgba(255,60,60,0.1)"}` : "none",
                      }}
                    >
                      {d ? `${d.p >= 0 ? "+" : ""}${d.p.toFixed(2)}%` : ""}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Recent trades */}
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="px-4 py-3 border-b"
                  style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Recent trades</p>
                </div>
                {TRADE_ROWS.slice(0, 4).map((t, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.4, ease: "easeOut" }}
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                    className="flex items-center justify-between px-4 py-3 border-b last:border-0 transition-colors duration-150"
                    style={{ borderColor: "rgba(255,255,255,0.04)" }}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <motion.div
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ background: t.win ? ACCENT : "#ff3c3c", boxShadow: `0 0 6px ${t.win ? ACCENT : "#ff3c3c"}` }}
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.3 }}
                      />
                      <span className="text-sm font-bold text-white truncate" style={{ fontFamily: "var(--font-display)" }}>{t.pair}</span>
                      <span className="hidden sm:inline text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0"
                        style={{ color: t.dir === "LONG" ? ACCENT : "#ff3c3c", background: t.dir === "LONG" ? "rgba(0,230,118,0.1)" : "rgba(255,60,60,0.1)" }}>
                        {t.dir}
                      </span>
                      <span className="hidden md:inline text-[10px] font-mono text-slate-500 px-2 py-0.5 rounded-full shrink-0" style={{ background: "rgba(255,255,255,0.04)" }}>
                        {t.tag}
                      </span>
                      <span className="hidden lg:inline text-[10px] font-mono text-slate-600 shrink-0">{t.date}</span>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-sm font-bold font-mono" style={{ color: t.win ? ACCENT : "#ff3c3c" }}>{t.pl}</p>
                      <p className="text-[10px] font-mono text-slate-500">{t.pct}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="px-6 lg:px-16 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="jn-reveal mb-12">
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-500 mb-3">Your growth</p>
            <h2 className="text-[clamp(36px,5vw,64px)] font-black leading-[0.95] tracking-[-0.03em] text-white"
              style={{ fontFamily: "var(--font-display)" }}>
              Trade by trade.<br /><span className="text-slate-500">Day by day.</span>
            </h2>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-px"
              style={{ background: `linear-gradient(180deg, ${ACCENT}40, ${ACCENT}10, transparent)` }} />

            {[
              { title: "You log your first trade", sub: "Entry, exit, size, P&L. Pair, session, setup tag.", day: "Day 1" },
              { title: "Patterns start emerging", sub: "RiskSent surfaces your highest-win setups automatically.", day: "Week 2" },
              { title: "You identify your edge", sub: "Specific pair + session combination. 68% win rate. You had no idea.", day: "Month 1" },
              { title: "Psychology data accumulates", sub: "You discover you lose after 3 consecutive wins. Data doesn't lie.", day: "Month 3" },
              { title: "Systematic trader. Finally.", sub: "Your decisions are driven by data, not emotion.", day: "Month 6" },
            ].map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
                className="relative pl-12 pb-10 last:pb-0">
                {/* Dot */}
                <div className="absolute left-[13px] top-[6px] h-[6px] w-[6px] rounded-full -translate-x-1/2"
                  style={{ background: ACCENT, boxShadow: `0 0 12px ${ACCENT}` }} />
                <div className="scan-card rounded-xl p-5"
                  style={{ background: "rgba(14,14,18,0.85)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(12px)" }}>
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="text-sm font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>{step.title}</h3>
                    <span className="text-[10px] font-mono shrink-0 px-2 py-0.5 rounded"
                      style={{ color: ACCENT, background: "rgba(0,230,118,0.1)" }}>{step.day}</span>
                  </div>
                  <p className="text-xs text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{step.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-6 lg:px-16 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="jn-reveal mb-12">
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-500 mb-3">Features</p>
            <h2 className="text-[clamp(36px,5vw,64px)] font-black leading-[0.95] tracking-[-0.03em] text-white"
              style={{ fontFamily: "var(--font-display)" }}>
              Stop guessing.<br /><span className="text-slate-500">Start reviewing.</span>
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Trade logging",      desc: "Log every trade automatically or manually. Entry, exit, size, P&L — all in one place.", color: ACCENT },
              { title: "Setup tagging",      desc: "Tag every trade by setup type, session, pair and emotional state. Find your best patterns.", color: "#22d3ee" },
              { title: "Calendar heatmap",   desc: "See your P&L across every trading day at a glance. Spot your best and worst days instantly.", color: "#818cf8" },
              { title: "Psychology notes",   desc: "Write notes on every trade. Review your mindset patterns — the ones that cost you money.", color: ACCENT },
              { title: "Win/loss breakdown", desc: "Break down your performance by pair, session, setup and time. Know where your edge lives.", color: "#ff8c00" },
              { title: "Streak tracking",    desc: "Track your consecutive winning and losing days. Gamify your discipline.", color: "#22d3ee" },
            ].map((f, i) => (
              <motion.div key={i} initial={false}
                whileHover={{ y: -6, transition: { type: "spring", stiffness: 380, damping: 26 } }}
                className="jn-reveal scan-card group relative overflow-hidden rounded-2xl p-6 cursor-default"
                style={{ background: "rgba(14,14,18,0.85)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(12px)" }}>
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(ellipse at 0% 100%, ${f.color}10 0%, transparent 70%)` }} />
                <div className="relative">
                  <div className="h-2 w-2 rounded-full mb-4" style={{ background: f.color, boxShadow: `0 0 8px ${f.color}` }} />
                  <h3 className="text-base font-black text-white mb-2" style={{ fontFamily: "var(--font-display)" }}>{f.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed group-hover:text-slate-400 transition-colors"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}>{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 lg:px-16 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="jn-reveal relative overflow-hidden rounded-3xl p-px"
            style={{ background: "linear-gradient(135deg, rgba(0,230,118,0.4), rgba(34,211,238,0.2), rgba(255,255,255,0.03))" }}>
            <div className="relative overflow-hidden rounded-3xl px-8 py-16 text-center" style={{ background: "#0a0a10" }}>
              <div className="pointer-events-none absolute inset-0"
                style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(0,230,118,0.08) 0%, transparent 60%)" }} />
              <h2 className="relative text-[clamp(36px,5vw,72px)] font-black leading-[0.95] tracking-[-0.03em] text-white"
                style={{ fontFamily: "var(--font-display)" }}>
                Your trades are<br />
                <span className="bg-clip-text text-transparent"
                  style={{ backgroundImage: "linear-gradient(135deg, #00e676, #22d3ee)" }}>
                  trying to teach you.
                </span>
              </h2>
              <p className="relative mt-4 text-slate-400 max-w-md mx-auto"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px" }}>Are you listening?</p>
              <div className="relative mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link href="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-sm font-bold text-black transition-all hover:scale-[1.03] cursor-pointer"
                  style={{ background: "linear-gradient(135deg, #00e676, #22d3ee)", boxShadow: "0 0 40px rgba(0,230,118,0.3)" }}>
                  Start journaling free <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/mock/dashboard"
                  className="inline-flex items-center justify-center rounded-2xl border px-8 py-4 text-sm font-medium text-slate-300 transition-all hover:text-white cursor-pointer"
                  style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}>
                  View demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
