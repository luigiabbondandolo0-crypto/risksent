"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight } from "lucide-react";
import { HomeBacktestingShowcase } from "@/components/home/HomeBacktestingShowcase";
import { HomeLiveAlertsPhone } from "@/components/home/HomeLiveAlertsPhone";

gsap.registerPlugin(ScrollTrigger);

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.refresh();

      // Hero text stagger
      gsap.from(".hero-word", {
        yPercent: 110,
        opacity: 0,
        duration: 1,
        stagger: 0.08,
        ease: "expo.out",
        delay: 0.2,
      });

      gsap.from(".hero-sub", {
        opacity: 0,
        y: 20,
        duration: 0.8,
        delay: 0.9,
        ease: "power3.out",
      });

      gsap.from(".hero-cta", {
        opacity: 0,
        y: 16,
        duration: 0.7,
        delay: 1.1,
        ease: "power3.out",
      });

      // Marquee
      gsap.to(".marquee-inner", {
        xPercent: -50,
        ease: "none",
        scrollTrigger: {
          trigger: ".marquee-section",
          start: "top bottom",
          end: "bottom top",
          scrub: 0.5,
        },
      });

      // Feature sections
      gsap.utils.toArray<HTMLElement>(".feature-section").forEach((section) => {
        const heading = section.querySelector(".feature-heading");
        const body = section.querySelector(".feature-body");
        const num = section.querySelector(".feature-num");

        gsap.from(num, {
          opacity: 0,
          x: -40,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: section, start: "top 85%", toggleActions: "play none none none" },
        });

        gsap.from(heading, {
          yPercent: 60,
          opacity: 0,
          duration: 1,
          ease: "expo.out",
          scrollTrigger: { trigger: section, start: "top 80%", toggleActions: "play none none none" },
        });

        gsap.from(body, {
          opacity: 0,
          y: 20,
          duration: 0.8,
          delay: 0.2,
          ease: "power3.out",
          scrollTrigger: { trigger: section, start: "top 75%", toggleActions: "play none none none" },
        });
      });

      // Stats
      gsap.utils.toArray<HTMLElement>(".stat-item").forEach((el, i) => {
        gsap.from(el, {
          opacity: 0,
          y: 30,
          duration: 0.7,
          delay: i * 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 90%", toggleActions: "play none none none" },
        });
      });

      // Module cards — set visible immediately then animate
      gsap.set(".module-card", { opacity: 1 });
      gsap.from(".module-card", {
        opacity: 0,
        y: 40,
        duration: 0.7,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".modules-grid",
          start: "top 95%",
          toggleActions: "play none none none",
        },
      });

      // Final CTA
      gsap.from(".final-cta-text", {
        yPercent: 30,
        opacity: 0,
        duration: 1.2,
        ease: "expo.out",
        scrollTrigger: { trigger: ".final-cta", start: "top 80%", toggleActions: "play none none none" },
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-full overflow-x-hidden bg-[#080809]">

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex flex-col justify-center px-6 pt-24 pb-20 lg:px-16 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(255,60,60,0.06) 0%, transparent 65%)" }} />
          <div className="absolute top-[10%] right-[-15%] w-[60vw] h-[60vw] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.07) 0%, transparent 65%)" }} />
          <div className="absolute bottom-[-10%] left-[30%] w-[50vw] h-[50vw] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(0,230,118,0.04) 0%, transparent 65%)" }} />
        </div>

        <div className="relative max-w-7xl mx-auto w-full">
          <div className="hero-sub mb-8 flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-400" />
            </span>
            <span className="text-[11px] font-mono font-medium uppercase tracking-[0.25em] text-slate-500">
              All-in-one trading platform · MT4 / MT5
            </span>
          </div>

          <h1 className="text-[clamp(52px,9vw,130px)] font-black leading-[0.9] tracking-[-0.04em] text-white mb-10"
            style={{ fontFamily: "'Syne', sans-serif" }}>
            {["Stop", "trading", "blind."].map((word, i) => (
              <span key={i} className="inline-block overflow-hidden mr-[0.2em]">
                <span className="hero-word inline-block">{word}</span>
              </span>
            ))}
            <br />
            {["Start", "trading", "with"].map((word, i) => (
              <span key={i} className="inline-block overflow-hidden mr-[0.2em]">
                <span className="hero-word inline-block">{word}</span>
              </span>
            ))}
            <span className="inline-block overflow-hidden mr-[0.2em]">
              <span
                className="hero-word inline-block bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(135deg, #ff3c3c 0%, #ff8c00 50%, #ff3c3c 100%)", backgroundSize: "200% 100%" }}
              >
                data.
              </span>
            </span>
          </h1>

          <div className="hero-sub flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <p className="max-w-md text-lg text-slate-400 leading-relaxed" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px" }}>
              One subscription. Backtesting, Journaling,<br />
              Risk Manager, Live Alerts.<br />
              <span className="text-slate-300">Everything your edge needs.</span>
            </p>
            <div className="hero-cta flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="group inline-flex items-center justify-center gap-2.5 rounded-2xl px-8 py-4 text-sm font-bold text-black transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
                style={{ background: "linear-gradient(135deg, #ff3c3c, #ff8c00)", boxShadow: "0 0 40px rgba(255,60,60,0.3), 0 1px 0 rgba(255,255,255,0.2) inset" }}
              >
                Start for free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/mock/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border px-8 py-4 text-sm font-medium text-slate-300 transition-all duration-200 hover:text-white hover:scale-[1.02]"
                style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}
              >
                Live demo
                <ChevronRight className="h-4 w-4 opacity-50" />
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
          <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-500">Scroll</span>
          <div className="h-8 w-px bg-gradient-to-b from-slate-500 to-transparent" />
        </div>
      </section>

      {/* ─── MARQUEE ─── */}
      <div className="marquee-section overflow-hidden border-y py-5"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)" }}>
        <div className="marquee-inner flex gap-16 whitespace-nowrap will-change-transform"
          style={{ width: "200%" }}>
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-16">
              {["Backtesting", "·", "Journaling", "·", "Risk Manager", "·", "Live Alerts", "·", "Telegram Alerts", "·", "Equity Curve", "·", "Drawdown Control", "·", "Win Rate Analytics", "·"].map((item, j) => (
                <span key={j} className={`text-[13px] font-mono uppercase tracking-[0.2em] ${item === "·" ? "text-slate-700" : "text-slate-500"}`}>
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ─── FEATURE SECTIONS ─── */}
      <section className="px-6 lg:px-16 py-8">
        <div className="max-w-7xl mx-auto space-y-4">
          {[
            {
              num: "01",
              heading: "Backtest before\nyou bet.",
              body: "Test every strategy on real historical data before you risk a single dollar. Know your edge before the market does.",
              accent: "#22d3ee",
              tag: "Backtesting Lab",
              stats: [
                { val: "278", label: "Strategies tested" },
                { val: "94%", label: "Accuracy rate" },
              ],
            },
            {
              num: "02",
              heading: "Journal every\ndecision.",
              body: "Track your trades, tag your setups, review your psychology. Turn every loss into a lesson — automatically.",
              accent: "#00e676",
              tag: "Trading Journal",
              stats: [
                { val: "346", label: "Trades logged" },
                { val: "58%", label: "Win rate tracked" },
              ],
            },
            {
              num: "03",
              heading: "Never blow\nan account\nagain.",
              body: "Real-time risk monitoring. The moment you're about to do something stupid, RiskSent stops you. Hard blocks. Live alerts. Zero excuses.",
              accent: "#ff3c3c",
              tag: "Risk Sentinel",
              stats: [
                { val: "< 1s", label: "Alert latency" },
                { val: "24/7", label: "Live monitoring" },
              ],
            },
            {
              num: "04",
              heading: "One alert.\nOne decision.",
              body: "Telegram alerts that hit your phone the second your rules are broken. Not after. Not during. The exact moment it matters.",
              accent: "#ff8c00",
              tag: "Live Alerts",
              stats: [
                { val: "∞", label: "Custom rules" },
                { val: "0", label: "Missed alerts" },
              ],
            },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={false}
              whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 28 } }}
              whileTap={{ scale: 0.997 }}
              className="feature-section group relative overflow-hidden rounded-3xl p-10 lg:p-16 transition-shadow duration-500 hover:shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{ background: `radial-gradient(ellipse at 0% 50%, ${feature.accent}0a 0%, transparent 60%)` }}
              />
              <div
                className={`relative flex flex-col gap-10 ${i === 0 || i === 3 ? "lg:flex-row lg:items-start lg:justify-between" : "lg:flex-row lg:items-center lg:justify-between"}`}
              >
                <div className={i === 0 || i === 3 ? "min-w-0 lg:max-w-xl lg:flex-1" : "lg:w-3/5"}>
                  <div className="flex items-center gap-4 mb-6">
                    <span
                      className="feature-num text-[11px] font-mono font-bold uppercase tracking-[0.3em] px-3 py-1.5 rounded-full"
                      style={{ color: feature.accent, background: `${feature.accent}15`, border: `1px solid ${feature.accent}30` }}
                    >
                      {feature.tag}
                    </span>
                  </div>
                  <div className="overflow-hidden">
                    <h2
                      className="feature-heading text-[clamp(36px,5vw,72px)] font-black leading-[0.95] tracking-[-0.03em] text-white whitespace-pre-line"
                      style={{ fontFamily: "'Syne', sans-serif" }}
                    >
                      {feature.heading}
                    </h2>
                  </div>
                  <p className="feature-body mt-5 text-slate-400 max-w-lg leading-relaxed" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px" }}>
                    {feature.body}
                  </p>
                  {i !== 0 && i !== 3 && (
                    <div className="mt-10 flex gap-8 lg:hidden">
                      {feature.stats.map((s, j) => (
                        <div key={j} className="stat-item">
                          <div
                            className="text-3xl font-black tracking-tight"
                            style={{ color: feature.accent, fontFamily: "'Syne', sans-serif", textShadow: `0 0 30px ${feature.accent}60` }}
                          >
                            {s.val}
                          </div>
                          <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">
                            {s.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {i === 0 && (
                  <div className="w-full min-w-0 lg:max-w-[min(520px,46vw)] lg:shrink-0">
                    <HomeBacktestingShowcase />
                  </div>
                )}
                {i === 3 && (
                  <div className="flex w-full justify-center lg:w-auto lg:shrink-0 lg:pt-4">
                    <HomeLiveAlertsPhone />
                  </div>
                )}

                {(i === 0 || i === 3) && (
                  <div className="flex flex-wrap gap-8 lg:hidden">
                    {feature.stats.map((s, j) => (
                      <div key={j} className="stat-item">
                        <div
                          className="text-3xl font-black tracking-tight"
                          style={{ color: feature.accent, fontFamily: "'Syne', sans-serif", textShadow: `0 0 30px ${feature.accent}60` }}
                        >
                          {s.val}
                        </div>
                        <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">
                          {s.label}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div
                  className={`flex gap-8 lg:flex-col lg:gap-6 ${i === 0 || i === 3 ? "hidden lg:flex lg:w-44 lg:shrink-0" : "lg:w-1/4"}`}
                >
                  {feature.stats.map((s, j) => (
                    <div key={j} className="stat-item">
                      <div
                        className="text-4xl font-black tracking-tight"
                        style={{ color: feature.accent, fontFamily: "'Syne', sans-serif", textShadow: `0 0 30px ${feature.accent}60` }}
                      >
                        {s.val}
                      </div>
                      <div className="mt-1 text-[11px] font-mono uppercase tracking-[0.2em] text-slate-500">
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── MODULES GRID ─── */}
      <section className="px-6 lg:px-16 py-24 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(255,60,60,0.05) 0%, transparent 60%)" }} />
        <div className="max-w-7xl mx-auto relative">
          <div className="mb-16 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-500 mb-3">Platform</p>
              <h2
                className="text-[clamp(40px,6vw,80px)] font-black leading-[0.95] tracking-[-0.03em] text-white"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                One subscription.<br />
                <span className="text-slate-500">Everything included.</span>
              </h2>
            </div>
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition-colors hover:text-white"
            >
              Start for free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="modules-grid grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Backtesting", desc: "Validate strategies on historical data before going live.", num: "01", color: "#22d3ee" },
              { title: "Journaling", desc: "Log every trade, tag setups, review your patterns.", num: "02", color: "#00e676" },
              { title: "Risk Sentinel", desc: "Live monitoring with hard blocks when rules are broken.", num: "03", color: "#ff3c3c" },
              { title: "Live Alerts", desc: "Telegram alerts at the exact moment your rules are hit.", num: "04", color: "#ff8c00" },
            ].map((m, i) => (
              <motion.div
                key={i}
                initial={false}
                whileHover={{
                  y: -8,
                  transition: { type: "spring", stiffness: 420, damping: 24 }
                }}
                whileTap={{ scale: 0.98 }}
                className="module-card group relative overflow-hidden rounded-2xl p-6 transition-shadow duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.07)"
                }}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(ellipse at 50% 100%, ${m.color}12 0%, transparent 70%)` }}
                />
                <motion.div
                  className="relative"
                  whileHover={{ x: 2 }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                >
                  <div className="flex items-start justify-between mb-6">
                    <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-600">{m.num}</span>
                    <motion.div
                      className="h-2 w-2 rounded-full"
                      style={{ background: m.color, boxShadow: `0 0 8px ${m.color}` }}
                      animate={{ scale: [1, 1.2, 1], opacity: [1, 0.85, 1] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
                    />
                  </div>
                  <h3
                    className="text-xl font-black tracking-tight text-white mb-2 transition-colors group-hover:text-white"
                    style={{ fontFamily: "'Syne', sans-serif" }}
                  >
                    {m.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed transition-colors group-hover:text-slate-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {m.desc}
                  </p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="px-6 lg:px-16 py-16 border-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-[11px] font-mono uppercase tracking-[0.3em] text-slate-600 mb-12">
            From traders who made the switch
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { name: "Luca", role: "FTMO Trader", text: "I dropped 3 tools after moving to RiskSent. Everything feeds into my risk decisions now.", avatar: "L", color: "#22d3ee" },
              { name: "Sara", role: "Swing Trader", text: "One subscription. Test, journal, control risk. I never switch apps anymore.", avatar: "S", color: "#00e676" },
              { name: "Marco", role: "Prop Firm Coach", text: "The live alerts plus journaling history changed how I coach. Finally one process.", avatar: "M", color: "#ff3c3c" },
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={false}
                whileHover={{ y: -6, borderColor: "rgba(255,255,255,0.14)", transition: { type: "spring", stiffness: 380, damping: 26 } }}
                whileTap={{ scale: 0.99 }}
                className="rounded-2xl p-6 transition-colors"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <p className="text-sm text-slate-300 leading-relaxed mb-6">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <motion.div
                    className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-black"
                    style={{ background: t.color }}
                    whileHover={{ scale: 1.08, rotate: 4 }}
                  >
                    {t.avatar}
                  </motion.div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="final-cta px-6 lg:px-16 py-40 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(255,60,60,0.08) 0%, transparent 70%)" }} />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
        <div className="final-cta-text relative max-w-7xl mx-auto text-center">
          <h2
            className="text-[clamp(52px,10vw,140px)] font-black leading-[0.9] tracking-[-0.04em] text-white"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Your edge.<br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #ff3c3c 0%, #ff8c00 50%, #ff3c3c 100%)", backgroundSize: "200% 100%" }}
            >
              One platform.
            </span>
          </h2>
          <p className="mt-8 text-slate-500 max-w-xl mx-auto" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px" }}>
            Stop fragmenting your workflow across 4 tools.<br />
            RiskSent is everything you need — nothing you don&apos;t.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="group inline-flex items-center justify-center gap-2.5 rounded-2xl px-10 py-5 text-base font-bold text-black transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, #ff3c3c, #ff8c00)",
                boxShadow: "0 0 60px rgba(255,60,60,0.4), 0 1px 0 rgba(255,255,255,0.2) inset",
              }}
            >
              Start for free
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/mock/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border px-10 py-5 text-base font-medium text-slate-300 transition-all hover:text-white hover:scale-[1.02]"
              style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}
            >
              View live demo
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t px-6 py-8 lg:px-16" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="mx-auto max-w-7xl flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-black text-white"
              style={{ background: "linear-gradient(135deg, #ff3c3c, #ff8c00)" }}
            >
              RS
            </div>
            <span className="text-sm font-semibold text-slate-400">RiskSent</span>
          </div>
          <p className="text-[11px] text-slate-600 font-mono">
            © {new Date().getFullYear()} RiskSent · All-in-one trading platform
          </p>
          <div className="flex gap-6 text-[11px] font-mono text-slate-600">
            <Link href="/login" className="hover:text-slate-300 transition-colors">Log in</Link>
            <Link href="/mock/dashboard" className="hover:text-slate-300 transition-colors">Demo</Link>
            <Link href="/signup" className="hover:text-slate-300 transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}