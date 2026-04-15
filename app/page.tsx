"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronRight } from "lucide-react";
import { HomeLiveAlertsPhone } from "@/components/home/HomeLiveAlertsPhone";

// Three.js canvas — SSR disabled
const HorizonCanvas = dynamic(() => import("@/components/ui/horizon-canvas"), {
  ssr: false,
  loading: () => null,
});

gsap.registerPlugin(ScrollTrigger);

// Scroll-section labels
const SECTIONS = [
  { id: "CONTROL", sub: "Chaos without discipline" },
  { id: "EDGE",    sub: "Your strategy, validated" },
  { id: "EXECUTE", sub: "Discipline at every entry" },
];

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.refresh();

      // ── Scroll progress bar ────────────────────────────────────────────
      ScrollTrigger.create({
        start: "top top",
        end: "max",
        onUpdate: (self) => {
          const bar = document.getElementById("rs-scroll-progress");
          if (bar) bar.style.transform = `scaleX(${self.progress})`;
        },
      });

      // ── Hero text stagger on load ──────────────────────────────────────
      gsap.from(".hero-word", {
        yPercent: 110,
        opacity: 0,
        duration: 1,
        stagger: 0.08,
        ease: "expo.out",
        delay: 0.3,
      });
      gsap.from(".hero-sub", {
        opacity: 0,
        y: 20,
        duration: 0.8,
        delay: 1.0,
        ease: "power3.out",
      });
      gsap.from(".hero-cta", {
        opacity: 0,
        y: 16,
        duration: 0.7,
        delay: 1.2,
        ease: "power3.out",
      });

      // ── Hero parallax — content rises as you scroll past ──────────────
      gsap.to(".hero-content", {
        y: -100,
        opacity: 0.2,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero-section",
          start: "top top",
          end: "bottom top",
          scrub: 1.2,
        },
      });

      // ── Marquee scroll ─────────────────────────────────────────────────
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

      // ── Feature sections — continuous scrub reveal ─────────────────────
      gsap.utils.toArray<HTMLElement>(".feature-section").forEach((section) => {
        const heading = section.querySelector(".feature-heading");
        const body = section.querySelector(".feature-body");
        const num = section.querySelector(".feature-num");

        gsap.fromTo(num,
          { opacity: 0, x: -40 },
          {
            opacity: 1, x: 0,
            scrollTrigger: { trigger: section, start: "top 88%", end: "top 55%", scrub: 0.6 },
          }
        );
        gsap.fromTo(heading,
          { yPercent: 50, opacity: 0 },
          {
            yPercent: 0, opacity: 1,
            scrollTrigger: { trigger: section, start: "top 85%", end: "top 45%", scrub: 0.8 },
          }
        );
        gsap.fromTo(body,
          { opacity: 0, y: 28 },
          {
            opacity: 1, y: 0,
            scrollTrigger: { trigger: section, start: "top 78%", end: "top 38%", scrub: 0.7 },
          }
        );
      });

      // ── Stat items — scrub reveal ──────────────────────────────────────
      gsap.utils.toArray<HTMLElement>(".stat-item").forEach((el) => {
        gsap.fromTo(el,
          { opacity: 0, y: 30 },
          {
            opacity: 1, y: 0,
            scrollTrigger: { trigger: el, start: "top 92%", end: "top 65%", scrub: 0.5 },
          }
        );
      });

      // ── Module cards — stagger scrub ──────────────────────────────────
      gsap.set(".module-card", { opacity: 1 });
      gsap.utils.toArray<HTMLElement>(".module-card").forEach((card, i) => {
        gsap.fromTo(card,
          { opacity: 0, y: 50 },
          {
            opacity: 1, y: 0,
            scrollTrigger: {
              trigger: ".modules-grid",
              start: `top ${92 - i * 2}%`,
              end: `top ${60 - i * 2}%`,
              scrub: 0.6 + i * 0.1,
            },
          }
        );
      });

      // ── Final CTA — scrub reveal ───────────────────────────────────────
      gsap.fromTo(".final-cta-text",
        { yPercent: 25, opacity: 0 },
        {
          yPercent: 0, opacity: 1,
          scrollTrigger: { trigger: ".final-cta", start: "top 85%", end: "top 45%", scrub: 0.9 },
        }
      );

      // ── Scroll journey labels — scrub in + scrub out ───────────────────
      gsap.utils.toArray<HTMLElement>(".scroll-section-label").forEach((el) => {
        gsap.fromTo(el,
          { opacity: 0, scale: 0.88, y: 40 },
          {
            opacity: 1, scale: 1, y: 0,
            scrollTrigger: { trigger: el, start: "top 80%", end: "top 40%", scrub: 0.7 },
          }
        );
      });

      // ── Testimonial cards — stagger scrub ────────────────────────────
      gsap.utils.toArray<HTMLElement>(".testimonial-card").forEach((card, i) => {
        gsap.fromTo(card,
          { opacity: 0, y: 40 },
          {
            opacity: 1, y: 0,
            scrollTrigger: {
              trigger: ".testimonials-section",
              start: `top ${88 - i * 3}%`,
              end: `top ${55 - i * 3}%`,
              scrub: 0.5 + i * 0.08,
            },
          }
        );
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-full overflow-x-hidden" style={{ background: "#070710" }}>

      {/* ── SCROLL PROGRESS BAR ── */}
      <div
        id="rs-scroll-progress"
        className="fixed top-0 left-0 right-0 h-[2px] origin-left pointer-events-none"
        style={{
          zIndex: 200,
          background: "linear-gradient(90deg, #6366F1, #A78BFA, #38BDF8)",
          transform: "scaleX(0)",
        }}
      />

      {/* ── THREE.JS BACKGROUND CANVAS ── */}
      <HorizonCanvas accentColor="#6366F1" />

      {/* ─── HERO ─── */}
      <section className="hero-section relative min-h-screen flex flex-col justify-center px-6 pt-24 pb-20 lg:px-16 overflow-hidden" style={{ zIndex: 1 }}>
        {/* Dot grid */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
          }}
        />
        {/* Noise */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="hero-content relative max-w-7xl mx-auto w-full">
          {/* Badge */}
          <div className="hero-sub mb-8 flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: "#6366F1" }} />
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "#6366F1" }} />
            </span>
            <span className="text-[11px] font-mono font-medium uppercase tracking-[0.25em] text-slate-500">
              All-in-one trading platform · risk and execution discipline
            </span>
          </div>

          {/* Headline */}
          <h1
            className="text-[clamp(36px,9vw,130px)] font-black leading-[0.9] tracking-[-0.04em] text-white mb-8"
            style={{ fontFamily: "var(--font-display)" }}
          >
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
                style={{
                  backgroundImage: "linear-gradient(135deg, #6366F1 0%, #A78BFA 50%, #6366F1 100%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 2.4s infinite linear",
                }}
              >
                data.
              </span>
            </span>
          </h1>

          <div className="hero-sub flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-6">
              <p className="max-w-md text-lg text-slate-400 leading-relaxed" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px" }}>
                One subscription. Backtesting, Journaling,<br />
                Risk Manager, Live Alerts.<br />
                <span className="text-slate-300">Everything your edge needs.</span>
              </p>
              <div className="hero-cta flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-2xl px-8 py-4 text-sm font-bold text-black transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
                  style={{
                    background: "linear-gradient(135deg, #6366F1, #A78BFA)",
                    boxShadow: "0 0 40px rgba(99,102,241,0.35), 0 1px 0 rgba(255,255,255,0.2) inset",
                  }}
                >
                  <span
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)",
                      backgroundSize: "200% 100%",
                      animation: "shimmer 2.4s infinite linear",
                    }}
                  />
                  Start for free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/mock/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border px-8 py-4 text-sm font-medium text-slate-300 transition-all duration-200 hover:text-white hover:scale-[1.02] cursor-pointer"
                  style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", backdropFilter: "blur(12px)" }}
                >
                  Live demo
                  <ChevronRight className="h-4 w-4 opacity-50" />
                </Link>
              </div>
            </div>

            {/* Floating equity card */}
            <motion.div
              className="hero-cta hidden lg:block animate-float-y"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3, duration: 0.8, ease: "easeOut" }}
            >
              <div
                className="relative rounded-2xl border p-5 w-72 crt-overlay"
                style={{
                  background: "rgba(14,14,18,0.7)",
                  borderColor: "rgba(99,102,241,0.15)",
                  backdropFilter: "blur(20px)",
                  boxShadow: "0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset",
                }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-600">Equity curve</span>
                  <span className="text-xs font-mono" style={{ color: "#6366F1", textShadow: "0 0 12px rgba(99,102,241,0.6)" }}>+12.4%</span>
                </div>
                <svg viewBox="0 0 260 80" className="w-full" fill="none">
                  <defs>
                    <linearGradient id="heroChartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366F1" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,70 L30,60 L60,55 L90,45 L120,38 L150,30 L180,20 L210,14 L240,8 L260,4" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
                  <path d="M0,70 L30,60 L60,55 L90,45 L120,38 L150,30 L180,20 L210,14 L240,8 L260,4 L260,80 L0,80 Z" fill="url(#heroChartGrad)" />
                  <circle cx="260" cy="4" r="3" fill="#6366F1" style={{ filter: "drop-shadow(0 0 6px #6366F1)" }} />
                </svg>
                <div className="mt-3 flex gap-3">
                  {["DD -1.4%", "WR 62%", "RR 2.1"].map((s) => (
                    <span key={s} className="text-[9px] font-mono text-slate-600 bg-white/[0.03] rounded px-1.5 py-0.5 border border-white/[0.04]">{s}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
          <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-500">Scroll</span>
          <div className="h-8 w-px bg-gradient-to-b from-slate-500 to-transparent" />
        </div>
      </section>

      {/* ─── SCROLL JOURNEY SECTIONS ─── */}
      {SECTIONS.map((sec, i) => (
        <section
          key={sec.id}
          className="relative flex items-center justify-center min-h-[60vh] px-6 lg:px-16"
          style={{ zIndex: 1 }}
        >
          <div className="scroll-section-label text-center">
            <p className="text-[11px] font-mono uppercase tracking-[0.35em] text-slate-600 mb-4">
              {String(i + 1).padStart(2, "0")} / 03
            </p>
            <h2
              className="text-[clamp(36px,10vw,140px)] font-black leading-none tracking-[-0.04em]"
              style={{
                fontFamily: "var(--font-display)",
                background: i === 0
                  ? "linear-gradient(135deg, #6366F1, #A78BFA)"
                  : i === 1
                  ? "linear-gradient(135deg, #A78BFA, #38BDF8)"
                  : "linear-gradient(135deg, #38BDF8, #4ADE80)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {sec.id}
            </h2>
            <p className="mt-3 text-slate-500 font-mono text-sm">{sec.sub}</p>
          </div>
        </section>
      ))}

      {/* ─── MARQUEE ─── */}
      <div
        className="marquee-section overflow-hidden border-y py-5 relative"
        style={{ zIndex: 1, borderColor: "rgba(255,255,255,0.06)", background: "rgba(14,14,18,0.9)", backdropFilter: "blur(20px)" }}
      >
        <div className="marquee-inner flex gap-16 whitespace-nowrap will-change-transform" style={{ width: "200%" }}>
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-16">
              {["Backtesting", "·", "Journaling", "·", "Risk Manager", "·", "Live Alerts", "·", "Telegram Alerts", "·", "Equity Curve", "·", "Drawdown Control", "·", "Win Rate Analytics", "·"].map((item, j) => (
                <span
                  key={j}
                  className={`text-[13px] font-mono uppercase tracking-[0.2em] ${item === "·" ? "text-slate-700" : ""}`}
                  style={item !== "·" ? { color: "#A78BFA", opacity: 0.6 } : {}}
                >
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ─── FEATURE SECTIONS ─── */}
      <section className="px-6 lg:px-16 py-8 relative" style={{ zIndex: 1 }}>
        <div className="max-w-7xl mx-auto space-y-4">
          {[
            {
              num: "01",
              heading: "Backtest before\nyou bet.",
              body: "Test every strategy on real historical data before you risk a single dollar. Know your edge before the market does.",
              accent: "#38BDF8",
              tag: "Backtesting Lab",
              stats: [
                { val: "278", label: "Strategies tested" },
                { val: "94%", label: "Accuracy rate" },
              ],
              glowPos: "tl" as const,
            },
            {
              num: "02",
              heading: "Journal every\ndecision.",
              body: "Track your trades, tag your setups, review your psychology. Turn every loss into a lesson — automatically.",
              accent: "#4ADE80",
              tag: "Trading Journal",
              stats: [
                { val: "346", label: "Trades logged" },
                { val: "58%", label: "Win rate tracked" },
              ],
              glowPos: "tr" as const,
            },
            {
              num: "03",
              heading: "Never blow\nan account\nagain.",
              body: "Real-time risk monitoring. The moment you're about to do something stupid, RiskSent stops you. Hard blocks. Live alerts. Zero excuses.",
              accent: "#F87171",
              tag: "Risk Sentinel",
              stats: [
                { val: "< 1s", label: "Alert latency" },
                { val: "24/7", label: "Live monitoring" },
              ],
              glowPos: "bl" as const,
            },
            {
              num: "04",
              heading: "One alert.\nOne decision.",
              body: "When a rule is breached, you receive a single, documented notice via Telegram at the time of the event. No ambiguity — aligned with the risk parameters you set.",
              accent: "#FB923C",
              tag: "Live Alerts",
              stats: [
                { val: "∞", label: "Custom rules" },
                { val: "0", label: "Missed alerts" },
              ],
              glowPos: "br" as const,
            },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={false}
              whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 28 } }}
              whileTap={{ scale: 0.997 }}
              className="feature-section scan-card group relative overflow-hidden rounded-3xl p-6 sm:p-10 lg:p-16 transition-shadow duration-500 hover:shadow-[0_24px_80px_rgba(0,0,0,0.5)] cursor-pointer"
              style={{
                background: "rgba(14,14,18,0.85)",
                border: "1px solid rgba(255,255,255,0.06)",
                backdropFilter: "blur(20px)",
              }}
            >
              {/* Hover glow */}
              <div
                className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{ background: `radial-gradient(ellipse at ${feature.glowPos === "tl" ? "0% 0%" : feature.glowPos === "tr" ? "100% 0%" : feature.glowPos === "bl" ? "0% 100%" : "100% 100%"}, ${feature.accent}0d 0%, transparent 60%)` }}
              />

              <div className="relative flex flex-col gap-10">
                {i === 3 ? (
                  <>
                    <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
                      <div className="lg:w-3/5">
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
                            style={{ fontFamily: "var(--font-display)" }}
                          >
                            {feature.heading}
                          </h2>
                        </div>
                        <p className="feature-body mt-5 text-slate-400 max-w-lg leading-relaxed" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px" }}>
                          {feature.body}
                        </p>
                      </div>
                      <div className="flex gap-8 lg:flex-col lg:gap-6 lg:w-1/4">
                        {feature.stats.map((s, j) => (
                          <div key={j} className="stat-item">
                            <div
                              className="text-4xl font-black tracking-tight"
                              style={{ color: feature.accent, fontFamily: "var(--font-display)", textShadow: `0 0 30px ${feature.accent}60` }}
                            >
                              {s.val}
                            </div>
                            <div className="mt-1 text-[11px] font-mono uppercase tracking-[0.2em] text-slate-500">{s.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-center border-t border-white/[0.05] pt-12 lg:pt-14">
                      <HomeLiveAlertsPhone />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
                    <div className="lg:w-3/5">
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
                          style={{ fontFamily: "var(--font-display)" }}
                        >
                          {feature.heading}
                        </h2>
                      </div>
                      <p className="feature-body mt-5 text-slate-400 max-w-lg leading-relaxed" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px" }}>
                        {feature.body}
                      </p>
                    </div>
                    <div className="flex gap-8 lg:flex-col lg:gap-6 lg:w-1/4">
                      {feature.stats.map((s, j) => (
                        <div key={j} className="stat-item">
                          <div
                            className="text-4xl font-black tracking-tight"
                            style={{ color: feature.accent, fontFamily: "var(--font-display)", textShadow: `0 0 30px ${feature.accent}60` }}
                          >
                            {s.val}
                          </div>
                          <div className="mt-1 text-[11px] font-mono uppercase tracking-[0.2em] text-slate-500">{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── MODULES GRID ─── */}
      <section className="px-6 lg:px-16 py-24 relative overflow-hidden" style={{ zIndex: 1 }}>
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.04) 0%, transparent 60%)" }}
        />
        <div className="max-w-7xl mx-auto relative">
          <div className="mb-16 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-500 mb-3">Platform</p>
              <h2
                className="text-[clamp(40px,6vw,80px)] font-black leading-[0.95] tracking-[-0.03em] text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                One subscription.<br />
                <span className="text-slate-500">Everything included.</span>
              </h2>
            </div>
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition-colors hover:text-white cursor-pointer"
            >
              Start for free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="modules-grid grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Backtesting", desc: "Validate strategies on historical data before going live.", num: "01", color: "#38BDF8", href: "/backtest" },
              { title: "Journaling", desc: "Log every trade, tag setups, review your patterns.", num: "02", color: "#4ADE80", href: "/journaling" },
              { title: "Risk Sentinel", desc: "Live monitoring with hard blocks when rules are broken.", num: "03", color: "#F87171", href: "/risk-manager" },
              { title: "Live Alerts", desc: "Telegram alerts at the exact moment your rules are hit.", num: "04", color: "#FB923C", href: "/live-alerts" },
            ].map((m, i) => (
              <Link href={m.href} key={i} className="block cursor-pointer">
                <motion.div
                  initial={false}
                  whileHover={{ y: -8, transition: { type: "spring", stiffness: 420, damping: 24 } }}
                  whileTap={{ scale: 0.98 }}
                  className="module-card scan-card animated-border group relative overflow-hidden rounded-2xl p-6 transition-shadow duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                  style={{
                    background: "rgba(14,14,18,0.85)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    backdropFilter: "blur(16px)",
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
                        animate={{ scale: [1, 1.25, 1], opacity: [1, 0.8, 1] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
                      />
                    </div>
                    <h3
                      className="text-xl font-black tracking-tight text-white mb-2 group-hover:text-white transition-colors"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {m.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed group-hover:text-slate-400 transition-colors" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {m.desc}
                    </p>
                  </motion.div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="testimonials-section px-6 lg:px-16 py-16 border-y relative" style={{ zIndex: 1, borderColor: "rgba(255,255,255,0.05)" }}>
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "rgba(14,14,18,0.7)", backdropFilter: "blur(20px)" }}
        />
        <div className="max-w-7xl mx-auto relative">
          <p className="text-center text-[11px] font-mono uppercase tracking-[0.3em] text-slate-600 mb-12">
            From traders who made the switch
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { name: "Luca", role: "FTMO Trader", text: "I dropped 3 tools after moving to RiskSent. Everything feeds into my risk decisions now.", avatar: "L", color: "#38BDF8" },
              { name: "Sara", role: "Swing Trader", text: "One subscription. Test, journal, control risk. I never switch apps anymore.", avatar: "S", color: "#4ADE80" },
              { name: "Marco", role: "Prop Firm Coach", text: "The live alerts plus journaling history changed how I coach. Finally one process.", avatar: "M", color: "#6366F1" },
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={false}
                whileHover={{ y: -6, transition: { type: "spring", stiffness: 380, damping: 26 } }}
                className="testimonial-card scan-card rounded-2xl p-6 cursor-default"
                style={{
                  background: "rgba(14,14,18,0.8)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  backdropFilter: "blur(16px)",
                }}
              >
                <p className="text-sm text-slate-300 leading-relaxed mb-6">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <motion.div
                    className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-black cursor-default"
                    style={{ background: t.color, boxShadow: `0 0 14px ${t.color}50` }}
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
      <section className="final-cta px-6 lg:px-16 py-40 relative overflow-hidden" style={{ zIndex: 1 }}>
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "rgba(8,8,9,0.75)", backdropFilter: "blur(20px)" }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.012]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
        {/* Pulsing red glow */}
        <div
          className="pointer-events-none absolute inset-0 alarm-ring"
          style={{ borderRadius: 0 }}
        />

        <div className="final-cta-text relative max-w-7xl mx-auto text-center">
          <h2
            className="text-[clamp(36px,10vw,140px)] font-black leading-[0.9] tracking-[-0.04em] text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Your edge.<br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #6366F1 0%, #A78BFA 50%, #6366F1 100%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 2.4s infinite linear",
              }}
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
              className="group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-2xl px-10 py-5 text-base font-bold text-black transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #6366F1, #A78BFA)",
                boxShadow: "0 0 60px rgba(99,102,241,0.4), 0 1px 0 rgba(255,255,255,0.2) inset",
              }}
            >
              <span
                className="pointer-events-none absolute inset-0"
                style={{
                  background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.28) 50%, transparent 70%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 2.4s infinite linear",
                }}
              />
              Start for free
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/mock/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border px-10 py-5 text-base font-medium text-slate-300 transition-all hover:text-white hover:scale-[1.02] cursor-pointer"
              style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)", backdropFilter: "blur(12px)" }}
            >
              View live demo
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t px-6 py-8 lg:px-16 relative" style={{ zIndex: 1, borderColor: "rgba(255,255,255,0.05)", background: "rgba(8,8,9,0.95)", backdropFilter: "blur(20px)" }}>
        <div className="mx-auto max-w-7xl flex flex-col items-center justify-between gap-4 sm:flex-row">
          <span
            className="text-sm font-extrabold tracking-tight text-slate-300"
            style={{ fontFamily: "var(--font-display)" }}
          >
            RiskSent
          </span>
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
