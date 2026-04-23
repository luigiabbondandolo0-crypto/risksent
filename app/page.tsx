"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronRight, Brain } from "lucide-react";
import { HomeLiveAlertsPhone } from "@/components/home/HomeLiveAlertsPhone";

// Three.js canvas — SSR disabled
const HorizonCanvas = dynamic(() => import("@/components/ui/horizon-canvas"), {
  ssr: false,
  loading: () => null,
});

gsap.registerPlugin(ScrollTrigger);

/** Framer `whileInView` — reliable on mobile (early trigger + root margin). */
const LANDING_IN_VIEW = {
  once: true,
  amount: 0.12,
  margin: "0px 0px -120px 0px",
} as const;

/** Deeper negative margin for nested previews (AI Coach chat bubbles). */
const LANDING_IN_VIEW_DEEP = {
  once: true,
  amount: 0.05,
  margin: "0px 0px -240px 0px",
} as const;

// Scroll-section labels
const SECTIONS = [
  { id: "CONTROL", sub: "Chaos without discipline" },
  { id: "EDGE",    sub: "Your strategy, validated" },
  { id: "EXECUTE", sub: "Discipline at every entry" },
];

/** iOS (any browser) uses WebKit; full-viewport WebGL + fixed layers causes white flicker during scroll/composite. */
function isIOSDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  // iPadOS 13+ desktop UA
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

const HOME_STATIC_BACKDROP_STYLE: CSSProperties = {
  zIndex: 0,
  backgroundColor: "#070710",
  backgroundImage: [
    "radial-gradient(ellipse 90% 60% at 50% -15%, rgba(99, 102, 241, 0.14), transparent 65%)",
    "radial-gradient(ellipse 50% 40% at 100% 0%, rgba(167, 139, 250, 0.07), transparent 55%)",
    "radial-gradient(ellipse 40% 30% at 0% 100%, rgba(99, 102, 241, 0.05), transparent 50%)",
  ].join(", "),
};

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [useWebGLBackdrop, setUseWebGLBackdrop] = useState(false);

  useEffect(() => {
    setUseWebGLBackdrop(!isIOSDevice());
  }, []);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const mm = gsap.matchMedia();

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

      if (reduced) {
        gsap.set(
          ".hero-word, .hero-sub, .hero-cta, .feature-num, .feature-heading, .feature-body, .stat-item, .module-card, .final-cta-text, .scroll-section-label, .testimonial-card, .marquee-inner, .hero-content",
          {
            opacity: 1,
            x: 0,
            y: 0,
            xPercent: 0,
            yPercent: 0,
            scale: 1
          }
        );
        return;
      }

      const runHeroIntro = () => {
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
      };

      const runMarquee = () => {
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
      };

      // Desktop: scrubbed parallax + scroll-linked reveals (fine on large viewports).
      mm.add("(min-width: 768px)", () => {
        runHeroIntro();
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
        runMarquee();

        gsap.utils.toArray<HTMLElement>(".feature-section").forEach((section) => {
          const heading = section.querySelector(".feature-heading");
          const body = section.querySelector(".feature-body");
          const num = section.querySelector(".feature-num");

          if (num) {
            gsap.fromTo(num,
              { opacity: 0, x: -40 },
              {
                opacity: 1, x: 0,
                scrollTrigger: { trigger: section, start: "top 88%", end: "top 55%", scrub: 0.6 },
              }
            );
          }
          if (heading) {
            gsap.fromTo(heading,
              { yPercent: 50, opacity: 0 },
              {
                yPercent: 0, opacity: 1,
                scrollTrigger: { trigger: section, start: "top 85%", end: "top 45%", scrub: 0.8 },
              }
            );
          }
          if (body) {
            gsap.fromTo(body,
              { opacity: 0, y: 28 },
              {
                opacity: 1, y: 0,
                scrollTrigger: { trigger: section, start: "top 78%", end: "top 38%", scrub: 0.7 },
              }
            );
          }
        });

        gsap.utils.toArray<HTMLElement>(".stat-item").forEach((el) => {
          gsap.fromTo(el,
            { opacity: 0, y: 30 },
            {
              opacity: 1, y: 0,
              scrollTrigger: { trigger: el, start: "top 92%", end: "top 65%", scrub: 0.5 },
            }
          );
        });

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

        gsap.fromTo(".final-cta-text",
          { yPercent: 25, opacity: 0 },
          {
            yPercent: 0, opacity: 1,
            scrollTrigger: { trigger: ".final-cta", start: "top 85%", end: "top 45%", scrub: 0.9 },
          }
        );

        gsap.utils.toArray<HTMLElement>(".scroll-section-label").forEach((el) => {
          gsap.fromTo(el,
            { opacity: 0, scale: 0.88, y: 40 },
            {
              opacity: 1, scale: 1, y: 0,
              scrollTrigger: { trigger: el, start: "top 80%", end: "top 40%", scrub: 0.7 },
            }
          );
        });

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

        return () => {};
      });

      // Mobile: hero + marquee only — no scroll-scrub opacity on copy (iOS/WebKit leaves partial alphas + white backdrop bugs).
      mm.add("(max-width: 767px)", () => {
        runHeroIntro();
        gsap.set(".hero-content", { opacity: 1 });
        runMarquee();
        gsap.set(
          ".feature-num, .feature-heading, .feature-body, .stat-item, .module-card, .final-cta-text, .scroll-section-label, .testimonial-card",
          { opacity: 1, x: 0, y: 0, xPercent: 0, yPercent: 0, scale: 1, clearProps: "transform" }
        );
        gsap.delayedCall(2.8, () => {
          gsap.set(".hero-word, .hero-sub, .hero-cta", {
            opacity: 1,
            y: 0,
            yPercent: 0,
            clearProps: "transform",
          });
        });
        return () => {};
      });

    }, containerRef);

    return () => {
      mm.revert();
      ctx.revert();
    };
  }, []);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const scheduleRefresh = () => {
      if (t) clearTimeout(t);
      t = setTimeout(() => ScrollTrigger.refresh(), 120);
    };
    window.addEventListener("resize", scheduleRefresh);
    window.addEventListener("orientationchange", scheduleRefresh);
    return () => {
      if (t) clearTimeout(t);
      window.removeEventListener("resize", scheduleRefresh);
      window.removeEventListener("orientationchange", scheduleRefresh);
    };
  }, []);

  return (
    <div ref={containerRef} className="rs-landing min-h-full overflow-x-hidden" style={{ background: "#070710" }}>

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

      {/* ── BACKGROUND: CSS always (stable on iOS); WebGL only off-iOS ── */}
      <div
        className="pointer-events-none fixed inset-0 h-full w-full"
        style={HOME_STATIC_BACKDROP_STYLE}
        aria-hidden
      />
      {useWebGLBackdrop ? <HorizonCanvas accentColor="#6366F1" /> : null}

      {/* ─── HERO ─── */}
      <section className="hero-section relative min-h-screen flex flex-col justify-center overflow-hidden px-4 pt-20 pb-16 sm:px-6 sm:pt-24 sm:pb-20 lg:px-16" style={{ zIndex: 1 }}>
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
            <span className="text-[11px] font-mono font-medium uppercase tracking-[0.25em] text-slate-300">
              All-in-one trading platform · risk and execution discipline
            </span>
          </div>

          {/* Headline */}
          <h1
            className="break-words text-[clamp(36px,9vw,130px)] font-black leading-[0.9] tracking-[-0.04em] text-white mb-8"
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
                className="hero-word inline-block text-[#c4b5fd] md:bg-clip-text md:text-transparent"
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
              <p className="max-w-md text-lg text-slate-300 sm:text-slate-400 leading-relaxed" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px" }}>
                One subscription. Backtesting, Journaling,<br />
                Risk Manager, Live Alerts, AI Coach.<br />
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
          className="relative flex min-h-[60vh] items-center justify-center px-4 sm:px-6 lg:px-16"
          style={{ zIndex: 1 }}
        >
          <div className="scroll-section-label text-center">
            <p className="text-[11px] font-mono uppercase tracking-[0.35em] text-slate-400 mb-4">
              {String(i + 1).padStart(2, "0")} / 03
            </p>
            <h2
              className="break-words text-[clamp(36px,10vw,140px)] font-black leading-none tracking-[-0.04em]"
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
              tag: "Risk Manager",
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
            {
              num: "05",
              heading: "Your AI.\nYour edge.\nDecoded.",
              body: "Ask anything about your trades. The AI Coach reads your entire journal, finds your patterns, and tells you exactly where your edge is strongest — and where you're self-sabotaging.",
              accent: "#a855f7",
              tag: "AI Coach",
              stats: [
                { val: "67%", label: "Avg win rate lift" },
                { val: "<1s", label: "Post-trade feedback" },
              ],
              glowPos: "tl" as const,
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
                        <p className="feature-body mt-5 text-slate-300 sm:text-slate-400 max-w-lg leading-relaxed" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px" }}>
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
                ) : i === 4 ? (
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
                        <p className="feature-body mt-5 text-slate-300 sm:text-slate-400 max-w-lg leading-relaxed" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px" }}>
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
                    {/* AI Coach chat preview */}
                    <div className="flex justify-center border-t border-white/[0.05] pt-12 lg:pt-14">
                      <div className="w-full max-w-lg">
                        <div
                          className="rounded-2xl overflow-hidden"
                          style={{
                            background: "rgba(10,10,16,0.95)",
                            border: "1px solid rgba(168,85,247,0.25)",
                            boxShadow: "0 0 60px rgba(168,85,247,0.12), 0 0 0 1px rgba(255,255,255,0.03) inset",
                          }}
                        >
                          {/* Chat header */}
                          <div
                            className="px-4 py-3 border-b flex items-center gap-3"
                            style={{ borderColor: "rgba(168,85,247,0.15)", background: "rgba(168,85,247,0.07)" }}
                          >
                            <motion.div
                              className="h-2 w-2 rounded-full"
                              style={{ background: "#a855f7" }}
                              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                            />
                            <Brain className="h-3.5 w-3.5 text-purple-400" />
                            <span className="text-[11px] font-mono text-purple-400">AI Coach · analyzing your journal</span>
                            <span className="ml-auto text-[9px] font-mono text-slate-600 uppercase tracking-widest">live</span>
                          </div>
                          {/* Messages */}
                          <div className="p-5 space-y-3">
                            {[
                              { role: "user", text: "Why do I keep losing on GBPJPY Fridays?" },
                              { role: "ai", text: "Win rate drops to 31% on Fridays — lower liquidity pre-weekend. Best GBPJPY window: Tues–Weds, London open." },
                              { role: "user", text: "What's my actual edge?" },
                              { role: "ai", text: "EURUSD breakout · 4H · London open · RR ≥ 2.0 → 67.4% win rate across 84 trades. That's your A+ setup." },
                            ].map((msg, mi) => (
                              <motion.div
                                key={mi}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={LANDING_IN_VIEW_DEEP}
                                transition={{ delay: mi * 0.18, duration: 0.45, ease: "easeOut" }}
                                className={`flex rs-m-home ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                              >
                                <div
                                  className="max-w-[82%] rounded-xl px-3 py-2.5 text-xs font-mono leading-relaxed"
                                  style={
                                    msg.role === "user"
                                      ? { background: "rgba(168,85,247,0.22)", color: "#e2e8f0", border: "1px solid rgba(168,85,247,0.35)" }
                                      : { background: "rgba(255,255,255,0.04)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.07)" }
                                  }
                                >
                                  {msg.role === "ai" && (
                                    <span className="block text-[9px] text-purple-400 mb-1.5 uppercase tracking-widest">AI Coach</span>
                                  )}
                                  {msg.text}
                                </div>
                              </motion.div>
                            ))}
                            {/* Typing indicator */}
                            <motion.div
                              className="flex justify-start rs-m-home"
                              initial={{ opacity: 0 }}
                              whileInView={{ opacity: 1 }}
                              viewport={LANDING_IN_VIEW_DEEP}
                              transition={{ delay: 0.9, duration: 0.4 }}
                            >
                              <div
                                className="rounded-xl px-3 py-2.5 flex gap-1.5 items-center"
                                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                              >
                                {[0, 1, 2].map((di) => (
                                  <motion.div
                                    key={di}
                                    className="h-1.5 w-1.5 rounded-full"
                                    style={{ background: "#a855f7" }}
                                    animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                                    transition={{ duration: 1.1, repeat: Infinity, delay: di * 0.22, ease: "easeInOut" }}
                                  />
                                ))}
                              </div>
                            </motion.div>
                          </div>
                        </div>
                      </div>
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
                      <p className="feature-body mt-5 text-slate-300 sm:text-slate-400 max-w-lg leading-relaxed" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px" }}>
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
              <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-400 mb-3">Platform</p>
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

          <div className="modules-grid grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {[
              { title: "Backtesting", desc: "Validate strategies on historical data before going live.", num: "01", color: "#38BDF8", href: "/backtest" },
              { title: "Journaling", desc: "Log every trade, tag setups, review your patterns.", num: "02", color: "#4ADE80", href: "/journaling" },
              { title: "Risk Manager", desc: "Live monitoring with hard blocks when rules are broken.", num: "03", color: "#F87171", href: "/risk-manager" },
              { title: "Live Alerts", desc: "Telegram alerts at the exact moment your rules are hit.", num: "04", color: "#FB923C", href: "/live-alerts" },
              { title: "AI Coach", desc: "AI pattern detection, psychology coaching, and setup scoring.", num: "05", color: "#a855f7", href: "/ai-coach" },
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
      <section className="testimonials-section px-6 lg:px-16 py-24 border-y relative" style={{ zIndex: 1, borderColor: "rgba(255,255,255,0.05)" }}>
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "rgba(14,14,18,0.7)", backdropFilter: "blur(20px)" }}
        />
        <div className="max-w-7xl mx-auto relative">

          {/* Header */}
          <div className="mb-14">
            <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-slate-400 mb-3">Traders who made the switch</p>
            <h2
              className="text-[clamp(32px,5vw,64px)] font-black leading-[0.95] tracking-[-0.03em] text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Real results.<br />
              <span className="text-slate-500">Real traders.</span>
            </h2>
          </div>

          {/* Featured testimonial */}
          <motion.div
            initial={false}
            whileHover={{ y: -4, transition: { type: "spring", stiffness: 380, damping: 26 } }}
            className="testimonial-card mb-5 rounded-3xl p-8 lg:p-10 relative overflow-hidden cursor-default"
            style={{
              background: "rgba(14,14,18,0.9)",
              border: "1px solid rgba(99,102,241,0.18)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 0 80px rgba(99,102,241,0.06)",
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 rounded-3xl"
              style={{ background: "radial-gradient(ellipse at 0% 100%, rgba(99,102,241,0.1) 0%, transparent 55%)" }}
            />
            <div className="relative">
              {/* Stars */}
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, si) => (
                  <svg key={si} className="h-4 w-4" fill="#6366F1" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p
                className="text-slate-200 leading-relaxed mb-8 max-w-3xl"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "15px" }}
              >
                &ldquo;RiskSent replaced four tools I was paying for separately. The backtesting validates my edge, the journal catches my emotional trades, and the live alerts literally stopped me from blowing my funded account last month. One platform. That&apos;s it.&rdquo;
              </p>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-black"
                    style={{ background: "linear-gradient(135deg, #6366F1, #A78BFA)", boxShadow: "0 0 20px rgba(99,102,241,0.45)" }}
                  >
                    A
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Alessandro M.</p>
                    <p className="text-[11px] text-slate-500 font-mono">FTMO Funded Trader · €100k account</p>
                  </div>
                </div>
                <span
                  className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full"
                  style={{ color: "#4ADE80", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)" }}
                >
                  ✓ Verified trader
                </span>
              </div>
            </div>
          </motion.div>

          {/* Three cards */}
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                name: "Luca T.",
                role: "FTMO Trader",
                text: "I stopped using 3 separate tools the week I found RiskSent. Everything feeds into one risk process. My drawdown dropped from 6% to 1.8% in the first month.",
                avatar: "L",
                color: "#38BDF8",
                metric: "−4.2% DD",
              },
              {
                name: "Sara V.",
                role: "Swing Trader",
                text: "The AI Coach found a pattern I never would have spotted — I lose 78% of my trades on Mondays. One insight, weeks of losses avoided.",
                avatar: "S",
                color: "#4ADE80",
                metric: "+23% WR",
              },
              {
                name: "Marco R.",
                role: "Prop Firm Coach",
                text: "I coach 12 traders. RiskSent gives them all a shared process — journal, alerts, risk controls. One tool. No more excuses about missed rules.",
                avatar: "M",
                color: "#A78BFA",
                metric: "12 traders",
              },
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={false}
                whileHover={{ y: -6, transition: { type: "spring", stiffness: 380, damping: 26 } }}
                className="testimonial-card scan-card rounded-2xl p-6 cursor-default relative overflow-hidden"
                style={{
                  background: "rgba(14,14,18,0.8)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  backdropFilter: "blur(16px)",
                }}
              >
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, si) => (
                    <svg key={si} className="h-3 w-3" fill={t.color} viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed mb-6" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center justify-between">
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
                  <span className="text-[11px] font-mono font-bold" style={{ color: t.color }}>{t.metric}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COMPARISON ─── */}
      <section className="px-6 lg:px-16 py-24 relative overflow-hidden" style={{ zIndex: 1, background: "#080809" }}>
        <div className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(255,60,60,0.06) 0%, transparent 65%)" }} />
        <div className="max-w-5xl mx-auto relative">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={LANDING_IN_VIEW} transition={{ duration: 0.7 }}
            className="mb-14 text-center rs-m-home"
          >
            <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-slate-400 mb-3">Why switch</p>
            <h2
              className="text-[clamp(32px,5vw,64px)] font-black leading-[0.95] tracking-[-0.03em] text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Why traders switch<br />
              <span className="text-slate-500">to RiskSent</span>
            </h2>
          </motion.div>

          {/* Table — horizontal scroll on mobile */}
          <div className="overflow-x-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={LANDING_IN_VIEW}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="rs-m-home"
            >
            <table
              className="w-full min-w-[640px] border-collapse"
            >
              <thead>
                <tr>
                  <th className="text-left pb-4 pr-4 text-[12px] font-mono uppercase tracking-[0.18em] text-slate-500 font-normal w-[36%]">
                    Feature
                  </th>
                  {[
                    { name: "RiskSent", highlight: true },
                    { name: "FXReplay", highlight: false },
                    { name: "Tradezella", highlight: false },
                  ].map((col) => (
                    <th key={col.name}
                      className="pb-4 px-3 text-center text-[13px] font-black tracking-tight"
                      style={{
                        fontFamily: "var(--font-display)",
                        color: col.highlight ? "#fff" : "#e2e8f0",
                      }}
                    >
                      {col.highlight && (
                        <span
                          className="block mb-1 text-[9px] font-mono font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full mx-auto w-fit"
                          style={{ color: "#ff3c3c", background: "rgba(255,60,60,0.12)", border: "1px solid rgba(255,60,60,0.25)" }}
                        >
                          You're here
                        </span>
                      )}
                      {col.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Backtesting",         rs: true,     fx: true,     tz: true  },
                  { feature: "Trading Journal",      rs: true,     fx: false,    tz: true  },
                  { feature: "Risk Manager",         rs: true,     fx: false,    tz: false },
                  { feature: "Live Telegram Alerts", rs: true,     fx: false,    tz: false },
                  { feature: "AI Coach",             rs: true,     fx: false,    tz: false },
                  { feature: "Real-time Risk Blocks",rs: true,     fx: false,    tz: false },
                  { feature: "Price",                rs: "$45/mo", fx: "$35/mo", tz: "$49/mo" },
                  { feature: "Free Trial",           rs: "7 days", fx: "Limited",tz: "7 days" },
                  { feature: "All-in-one",           rs: true,     fx: false,    tz: "Partial" },
                ].map((row, ri) => (
                  <motion.tr
                    key={row.feature}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={LANDING_IN_VIEW}
                    transition={{ duration: 0.45, delay: 0.06 * ri, ease: "easeOut" }}
                    className="group cursor-default rs-m-home"
                  >
                    <td className="py-3 pr-4 text-[13px] font-mono text-slate-200 border-t border-white/[0.06] transition-colors group-hover:bg-white/[0.025] group-hover:text-white rounded-l-lg pl-3">
                      {row.feature}
                    </td>
                    {[row.rs, row.fx, row.tz].map((val, ci) => (
                      <td key={ci}
                        className="py-3 px-3 text-center border-t border-white/[0.06] transition-colors group-hover:bg-white/[0.025]"
                        style={
                          ci === 0
                            ? {
                                background: "rgba(255,60,60,0.06)",
                                boxShadow: "inset 1px 0 0 rgba(255,60,60,0.18), inset -1px 0 0 rgba(255,60,60,0.18)",
                              }
                            : undefined
                        }
                      >
                        {val === true ? (
                          <span className="inline-flex items-center justify-center">
                            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
                              <circle cx="8" cy="8" r="7" fill="rgba(0,230,118,0.12)" stroke="rgba(0,230,118,0.3)" strokeWidth="1"/>
                              <path d="M5 8l2 2 4-4" stroke="#00e676" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </span>
                        ) : val === false ? (
                          <span className="inline-flex items-center justify-center">
                            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
                              <circle cx="8" cy="8" r="7" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
                              <path d="M6 10l4-4M10 10L6 6" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                          </span>
                        ) : val === "Partial" ? (
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full"
                            style={{ color: "#ff8c00", background: "rgba(255,140,0,0.1)" }}>
                            Partial
                          </span>
                        ) : (
                          <span className="text-[12px] font-mono" style={{ color: ci === 0 ? "#ff8c00" : "#cbd5e1" }}>
                            {val as string}
                          </span>
                        )}
                      </td>
                    ))}
                  </motion.tr>
                ))}
              </tbody>
            </table>
            </motion.div>
          </div>

          {/* Below table CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={LANDING_IN_VIEW} transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 text-center rs-m-home"
          >
            <p className="text-slate-500 font-mono text-[13px] mb-6">
              One subscription. Everything included.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-bold text-black transition-all hover:scale-[1.03]"
              style={{ background: "linear-gradient(135deg, #ff3c3c, #ff8c00)", boxShadow: "0 0 32px rgba(255,60,60,0.25)" }}
            >
              See pricing
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── AFFILIATE ─── */}
      <section className="px-6 lg:px-16 py-28 relative overflow-hidden" style={{ zIndex: 1 }}>
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 70% 55% at 50% 50%, rgba(255,140,0,0.055) 0%, transparent 70%)" }} />
        {/* Subtle grid */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }} />

        <div className="relative max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={LANDING_IN_VIEW} transition={{ duration: 0.65 }}
            className="mb-16 text-center rs-m-home"
          >
            <p className="text-[11px] font-mono uppercase tracking-[0.3em] mb-4"
              style={{ color: "#ff8c00" }}>
              Affiliate Program
            </p>
            <h2
              className="text-[clamp(34px,5.5vw,72px)] font-black leading-[0.92] tracking-[-0.03em] text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Share RiskSent.<br />
              <span style={{ color: "#ff8c00" }}>Get paid.</span>
            </h2>
            <p className="mt-5 text-slate-500 max-w-lg mx-auto text-[14px] leading-relaxed"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Recommend RiskSent to other traders and earn a recurring commission on every subscription they pay. No cap.
            </p>
          </motion.div>

          {/* Steps row */}
          <div className="mb-14 grid gap-4 sm:grid-cols-3">
            {[
              {
                n: "01",
                title: "Get your link",
                body: "Sign up for the program and receive a unique referral URL tied to your account.",
                color: "#ff3c3c",
                delay: 0.1,
              },
              {
                n: "02",
                title: "Share & refer",
                body: "Post it anywhere — Twitter, Discord, Telegram, your trading community. We track every click.",
                color: "#ff8c00",
                delay: 0.22,
              },
              {
                n: "03",
                title: "Earn monthly",
                body: "Collect a percentage of every recurring payment from traders you refer. For as long as they subscribe.",
                color: "#00e676",
                delay: 0.34,
              },
            ].map((step) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={LANDING_IN_VIEW}
                transition={{ duration: 0.5, delay: step.delay }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="relative rounded-2xl border p-6 rs-m-home"
                style={{
                  background: "rgba(14,14,18,0.9)",
                  borderColor: "rgba(255,255,255,0.07)",
                  boxShadow: `0 0 40px ${step.color}10`,
                }}
              >
                {/* Step number */}
                <span
                  className="mb-4 block text-[11px] font-mono font-bold tracking-[0.2em]"
                  style={{ color: step.color }}
                >
                  {step.n}
                </span>
                {/* Glowing dot */}
                <div
                  className="mb-3 h-2 w-2 rounded-full"
                  style={{ background: step.color, boxShadow: `0 0 10px ${step.color}` }}
                />
                <h3 className="mb-2 text-[17px] font-black tracking-tight text-white"
                  style={{ fontFamily: "var(--font-display)" }}>
                  {step.title}
                </h3>
                <p className="text-[13px] leading-relaxed text-slate-500"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {step.body}
                </p>
                {/* Bottom accent line */}
                <div
                  className="absolute bottom-0 left-0 h-[2px] rounded-b-2xl"
                  style={{
                    width: "40%",
                    background: `linear-gradient(90deg, ${step.color}, transparent)`,
                  }}
                />
              </motion.div>
            ))}
          </div>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={LANDING_IN_VIEW} transition={{ duration: 0.55, delay: 0.15 }}
            className="mb-12 flex flex-wrap justify-center gap-px overflow-hidden rounded-2xl border rs-m-home"
            style={{ borderColor: "rgba(255,255,255,0.07)" }}
          >
            {[
              { label: "Commission", value: "Up to 30%", color: "#ff8c00" },
              { label: "Cookie window", value: "60 days", color: "#6366f1" },
              { label: "Payout", value: "Monthly", color: "#00e676" },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="flex flex-1 min-w-[130px] flex-col items-center justify-center px-6 py-5"
                style={{
                  background: i % 2 === 0 ? "rgba(14,14,18,0.95)" : "rgba(18,18,24,0.95)",
                }}
              >
                <span className="text-[22px] font-black tracking-tight" style={{ color: stat.color, fontFamily: "var(--font-display)" }}>
                  {stat.value}
                </span>
                <span className="mt-1 text-[11px] font-mono uppercase tracking-[0.15em] text-slate-600">
                  {stat.label}
                </span>
              </div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={LANDING_IN_VIEW} transition={{ duration: 0.55, delay: 0.25 }}
            className="text-center rs-m-home"
          >
            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center gap-2.5 rounded-2xl px-8 py-4 text-[14px] font-black text-black opacity-80"
              style={{
                background: "linear-gradient(135deg, #ff8c00, #ff3c3c)",
                boxShadow: "0 0 40px rgba(255,140,0,0.18), 0 0 0 1px rgba(255,140,0,0.12)",
                fontFamily: "var(--font-display)",
              }}
            >
              Coming soon
            </button>
            <p className="mt-4 text-[12px] text-slate-600" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Free to join. No minimum traffic required.
            </p>
          </motion.div>
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

    </div>
  );
}
