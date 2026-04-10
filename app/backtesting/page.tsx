"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, BarChart3, CheckCircle2 } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function BacktestingPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.refresh();
      gsap.from(".bt-hero-word", {
        yPercent: 110, opacity: 0, duration: 1, stagger: 0.07, ease: "expo.out", delay: 0.2,
      });
      gsap.from(".bt-fade", {
        opacity: 0, y: 20, duration: 0.8, stagger: 0.1, delay: 0.8, ease: "power3.out",
      });
      gsap.utils.toArray<HTMLElement>(".bt-reveal").forEach((el) => {
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

      {/* Hero */}
      <section className="relative min-h-[80vh] flex flex-col justify-center px-6 pt-24 pb-20 lg:px-16 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(34,211,238,0.07) 0%, transparent 65%)" }} />
          <div className="absolute bottom-0 right-0 w-[50vw] h-[50vw] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.05) 0%, transparent 65%)" }} />
        </div>

        <div className="relative max-w-7xl mx-auto w-full">
          <div className="bt-fade mb-6 flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-[0.2em]"
              style={{ color: "#22d3ee", borderColor: "rgba(34,211,238,0.3)", background: "rgba(34,211,238,0.08)" }}>
              <BarChart3 className="h-3 w-3" />
              Backtesting Lab
            </span>
          </div>

          <h1 className="text-[clamp(48px,8vw,120px)] font-black leading-[0.9] tracking-[-0.04em] text-white mb-8"
            style={{ fontFamily: "'Syne', sans-serif" }}>
            {["Know", "your", "edge"].map((w, i) => (
              <span key={i} className="inline-block overflow-hidden mr-[0.2em]">
                <span className="bt-hero-word inline-block">{w}</span>
              </span>
            ))}
            <br />
            {["before", "the"].map((w, i) => (
              <span key={i} className="inline-block overflow-hidden mr-[0.2em]">
                <span className="bt-hero-word inline-block">{w}</span>
              </span>
            ))}
            <span className="inline-block overflow-hidden">
              <span className="bt-hero-word inline-block bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(135deg, #22d3ee, #6366f1)" }}>
                market does.
              </span>
            </span>
          </h1>

          <div className="bt-fade flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <p className="max-w-lg text-slate-400 leading-relaxed"
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px" }}>
              Test every strategy on real historical data<br />
              before you risk a single dollar.<br />
              <span className="text-slate-300">If it doesn&apos;t work in backtest, it won&apos;t work live.</span>
            </p>
            <div className="flex gap-3">
              <Link href="/signup"
                className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-black transition-all hover:scale-[1.03]"
                style={{ background: "linear-gradient(135deg, #22d3ee, #6366f1)", boxShadow: "0 0 30px rgba(34,211,238,0.25)" }}>
                Start backtesting
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/mock/dashboard"
                className="inline-flex items-center gap-2 rounded-2xl border px-6 py-3 text-sm font-medium text-slate-300 transition-all hover:text-white"
                style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                Live demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard preview */}
      <section className="px-6 lg:px-16 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="bt-reveal relative overflow-hidden rounded-3xl p-px"
            style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.3), rgba(99,102,241,0.2), rgba(255,255,255,0.05))" }}>
            <div className="rounded-3xl p-8 lg:p-12" style={{ background: "#0e0e12" }}>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Backtesting Dashboard</p>
                  <p className="text-lg font-bold text-white mt-1" style={{ fontFamily: "'Syne', sans-serif" }}>Strategy Performance Overview</p>
                </div>
                <span className="rounded-full px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-widest"
                  style={{ color: "#22d3ee", background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)" }}>
                  Live data
                </span>
              </div>

              {/* Mock stats */}
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mb-6">
                {[
                  { label: "Total tests", val: "278", color: "#22d3ee" },
                  { label: "Win rate", val: "58.2%", color: "#00e676" },
                  { label: "Avg R:R", val: "1.35", color: "#818cf8" },
                  { label: "Max DD", val: "-4.8%", color: "#ff3c3c" },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl p-4"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">{s.label}</p>
                    <p className="mt-2 text-2xl font-black" style={{ color: s.color, fontFamily: "'Syne', sans-serif", textShadow: `0 0 20px ${s.color}50` }}>{s.val}</p>
                  </div>
                ))}
              </div>

              {/* Mock chart */}
              <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-4">Equity curve — strategy vs benchmark</p>
                <svg viewBox="0 0 800 160" className="w-full" fill="none">
                  <defs>
                    <linearGradient id="btGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="btGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Benchmark */}
                  <path d="M0 120 C100 115 200 110 300 105 C400 100 500 95 600 92 C700 89 750 88 800 86" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4 4" fill="none" opacity="0.5" />
                  {/* Strategy */}
                  <path d="M0 130 C50 125 100 118 150 108 C200 98 250 105 300 95 C350 85 400 75 450 65 C500 55 550 48 600 40 C650 32 720 28 800 22" stroke="#22d3ee" strokeWidth="2.5" fill="none" />
                  <path d="M0 130 C50 125 100 118 150 108 C200 98 250 105 300 95 C350 85 400 75 450 65 C500 55 550 48 600 40 C650 32 720 28 800 22 L800 160 L0 160 Z" fill="url(#btGrad)" />
                  {/* Grid lines */}
                  {[0, 40, 80, 120, 160].map(y => (
                    <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                  ))}
                </svg>
                <div className="mt-3 flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="h-0.5 w-6 rounded-full" style={{ background: "#22d3ee" }} />
                    <span className="text-[10px] font-mono text-slate-500">Your strategy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-0.5 w-6 rounded-full opacity-50" style={{ background: "#6366f1", borderTop: "1px dashed #6366f1" }} />
                    <span className="text-[10px] font-mono text-slate-500">Benchmark</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 lg:px-16 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="bt-reveal mb-12">
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-500 mb-3">Features</p>
            <h2 className="text-[clamp(36px,5vw,64px)] font-black leading-[0.95] tracking-[-0.03em] text-white"
              style={{ fontFamily: "'Syne', sans-serif" }}>
              Everything you need<br />
              <span className="text-slate-500">to validate a strategy.</span>
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Historical replay", desc: "Replay market conditions tick by tick. See exactly how your strategy would have performed.", color: "#22d3ee" },
              { title: "Multi-timeframe", desc: "Test across M1, M5, M15, H1, H4 and D1. Find the timeframe where your edge is strongest.", color: "#6366f1" },
              { title: "Risk simulation", desc: "Simulate different position sizes and risk % to see how they affect your equity curve.", color: "#00e676" },
              { title: "Win rate analysis", desc: "Break down wins and losses by session, day, pair and setup tag.", color: "#22d3ee" },
              { title: "Drawdown tracking", desc: "See your max drawdown, consecutive losses and recovery time for every tested period.", color: "#ff8c00" },
              { title: "Export results", desc: "Export full backtest reports as CSV or PDF. Share with mentors or prop firms.", color: "#818cf8" },
            ].map((f, i) => (
              <div key={i} className="bt-reveal group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02]"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(ellipse at 0% 100%, ${f.color}10 0%, transparent 70%)` }} />
                <div className="relative">
                  <div className="h-2 w-2 rounded-full mb-4" style={{ background: f.color, boxShadow: `0 0 8px ${f.color}` }} />
                  <h3 className="text-base font-black text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>{f.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 lg:px-16 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="bt-reveal relative overflow-hidden rounded-3xl p-px"
            style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.4), rgba(99,102,241,0.2), rgba(255,255,255,0.03))" }}>
            <div className="relative overflow-hidden rounded-3xl px-8 py-16 text-center" style={{ background: "#0e0e12" }}>
              <div className="pointer-events-none absolute inset-0"
                style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(34,211,238,0.08) 0%, transparent 60%)" }} />
              <h2 className="relative text-[clamp(36px,5vw,72px)] font-black leading-[0.95] tracking-[-0.03em] text-white"
                style={{ fontFamily: "'Syne', sans-serif" }}>
                Test it before<br />
                <span className="bg-clip-text text-transparent"
                  style={{ backgroundImage: "linear-gradient(135deg, #22d3ee, #6366f1)" }}>
                  you bet it.
                </span>
              </h2>
              <p className="relative mt-4 text-slate-400 max-w-md mx-auto" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px" }}>
                Your first live trade should already be based on data.
              </p>
              <div className="relative mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link href="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-sm font-bold text-black transition-all hover:scale-[1.03]"
                  style={{ background: "linear-gradient(135deg, #22d3ee, #6366f1)", boxShadow: "0 0 40px rgba(34,211,238,0.3)" }}>
                  Start for free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/mock/dashboard"
                  className="inline-flex items-center justify-center rounded-2xl border px-8 py-4 text-sm font-medium text-slate-300 transition-all hover:text-white"
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
"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, BarChart3, CheckCircle2 } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function BacktestingPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.refresh();
      gsap.from(".bt-hero-word", {
        yPercent: 110, opacity: 0, duration: 1, stagger: 0.07, ease: "expo.out", delay: 0.2,
      });
      gsap.from(".bt-fade", {
        opacity: 0, y: 20, duration: 0.8, stagger: 0.1, delay: 0.8, ease: "power3.out",
      });
      gsap.utils.toArray<HTMLElement>(".bt-reveal").forEach((el) => {
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

      {/* Hero */}
      <section className="relative min-h-[80vh] flex flex-col justify-center px-6 pt-24 pb-20 lg:px-16 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(34,211,238,0.07) 0%, transparent 65%)" }} />
          <div className="absolute bottom-0 right-0 w-[50vw] h-[50vw] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.05) 0%, transparent 65%)" }} />
        </div>

        <div className="relative max-w-7xl mx-auto w-full">
          <div className="bt-fade mb-6 flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-[0.2em]"
              style={{ color: "#22d3ee", borderColor: "rgba(34,211,238,0.3)", background: "rgba(34,211,238,0.08)" }}>
              <BarChart3 className="h-3 w-3" />
              Backtesting Lab
            </span>
          </div>

          <h1 className="text-[clamp(48px,8vw,120px)] font-black leading-[0.9] tracking-[-0.04em] text-white mb-8"
            style={{ fontFamily: "'Syne', sans-serif" }}>
            {["Know", "your", "edge"].map((w, i) => (
              <span key={i} className="inline-block overflow-hidden mr-[0.2em]">
                <span className="bt-hero-word inline-block">{w}</span>
              </span>
            ))}
            <br />
            {["before", "the"].map((w, i) => (
              <span key={i} className="inline-block overflow-hidden mr-[0.2em]">
                <span className="bt-hero-word inline-block">{w}</span>
              </span>
            ))}
            <span className="inline-block overflow-hidden">
              <span className="bt-hero-word inline-block bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(135deg, #22d3ee, #6366f1)" }}>
                market does.
              </span>
            </span>
          </h1>

          <div className="bt-fade flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <p className="max-w-lg text-slate-400 leading-relaxed"
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px" }}>
              Test every strategy on real historical data<br />
              before you risk a single dollar.<br />
              <span className="text-slate-300">If it doesn&apos;t work in backtest, it won&apos;t work live.</span>
            </p>
            <div className="flex gap-3">
              <Link href="/signup"
                className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-black transition-all hover:scale-[1.03]"
                style={{ background: "linear-gradient(135deg, #22d3ee, #6366f1)", boxShadow: "0 0 30px rgba(34,211,238,0.25)" }}>
                Start backtesting
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/mock/dashboard"
                className="inline-flex items-center gap-2 rounded-2xl border px-6 py-3 text-sm font-medium text-slate-300 transition-all hover:text-white"
                style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                Live demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard preview */}
      <section className="px-6 lg:px-16 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="bt-reveal relative overflow-hidden rounded-3xl p-px"
            style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.3), rgba(99,102,241,0.2), rgba(255,255,255,0.05))" }}>
            <div className="rounded-3xl p-8 lg:p-12" style={{ background: "#0e0e12" }}>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Backtesting Dashboard</p>
                  <p className="text-lg font-bold text-white mt-1" style={{ fontFamily: "'Syne', sans-serif" }}>Strategy Performance Overview</p>
                </div>
                <span className="rounded-full px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-widest"
                  style={{ color: "#22d3ee", background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)" }}>
                  Live data
                </span>
              </div>

              {/* Mock stats */}
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mb-6">
                {[
                  { label: "Total tests", val: "278", color: "#22d3ee" },
                  { label: "Win rate", val: "58.2%", color: "#00e676" },
                  { label: "Avg R:R", val: "1.35", color: "#818cf8" },
                  { label: "Max DD", val: "-4.8%", color: "#ff3c3c" },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl p-4"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">{s.label}</p>
                    <p className="mt-2 text-2xl font-black" style={{ color: s.color, fontFamily: "'Syne', sans-serif", textShadow: `0 0 20px ${s.color}50` }}>{s.val}</p>
                  </div>
                ))}
              </div>

              {/* Mock chart */}
              <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-4">Equity curve — strategy vs benchmark</p>
                <svg viewBox="0 0 800 160" className="w-full" fill="none">
                  <defs>
                    <linearGradient id="btGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="btGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Benchmark */}
                  <path d="M0 120 C100 115 200 110 300 105 C400 100 500 95 600 92 C700 89 750 88 800 86" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4 4" fill="none" opacity="0.5" />
                  {/* Strategy */}
                  <path d="M0 130 C50 125 100 118 150 108 C200 98 250 105 300 95 C350 85 400 75 450 65 C500 55 550 48 600 40 C650 32 720 28 800 22" stroke="#22d3ee" strokeWidth="2.5" fill="none" />
                  <path d="M0 130 C50 125 100 118 150 108 C200 98 250 105 300 95 C350 85 400 75 450 65 C500 55 550 48 600 40 C650 32 720 28 800 22 L800 160 L0 160 Z" fill="url(#btGrad)" />
                  {/* Grid lines */}
                  {[0, 40, 80, 120, 160].map(y => (
                    <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                  ))}
                </svg>
                <div className="mt-3 flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="h-0.5 w-6 rounded-full" style={{ background: "#22d3ee" }} />
                    <span className="text-[10px] font-mono text-slate-500">Your strategy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-0.5 w-6 rounded-full opacity-50" style={{ background: "#6366f1", borderTop: "1px dashed #6366f1" }} />
                    <span className="text-[10px] font-mono text-slate-500">Benchmark</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 lg:px-16 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="bt-reveal mb-12">
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-500 mb-3">Features</p>
            <h2 className="text-[clamp(36px,5vw,64px)] font-black leading-[0.95] tracking-[-0.03em] text-white"
              style={{ fontFamily: "'Syne', sans-serif" }}>
              Everything you need<br />
              <span className="text-slate-500">to validate a strategy.</span>
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Historical replay", desc: "Replay market conditions tick by tick. See exactly how your strategy would have performed.", color: "#22d3ee" },
              { title: "Multi-timeframe", desc: "Test across M1, M5, M15, H1, H4 and D1. Find the timeframe where your edge is strongest.", color: "#6366f1" },
              { title: "Risk simulation", desc: "Simulate different position sizes and risk % to see how they affect your equity curve.", color: "#00e676" },
              { title: "Win rate analysis", desc: "Break down wins and losses by session, day, pair and setup tag.", color: "#22d3ee" },
              { title: "Drawdown tracking", desc: "See your max drawdown, consecutive losses and recovery time for every tested period.", color: "#ff8c00" },
              { title: "Export results", desc: "Export full backtest reports as CSV or PDF. Share with mentors or prop firms.", color: "#818cf8" },
            ].map((f, i) => (
              <div key={i} className="bt-reveal group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02]"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(ellipse at 0% 100%, ${f.color}10 0%, transparent 70%)` }} />
                <div className="relative">
                  <div className="h-2 w-2 rounded-full mb-4" style={{ background: f.color, boxShadow: `0 0 8px ${f.color}` }} />
                  <h3 className="text-base font-black text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>{f.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 lg:px-16 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="bt-reveal relative overflow-hidden rounded-3xl p-px"
            style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.4), rgba(99,102,241,0.2), rgba(255,255,255,0.03))" }}>
            <div className="relative overflow-hidden rounded-3xl px-8 py-16 text-center" style={{ background: "#0e0e12" }}>
              <div className="pointer-events-none absolute inset-0"
                style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(34,211,238,0.08) 0%, transparent 60%)" }} />
              <h2 className="relative text-[clamp(36px,5vw,72px)] font-black leading-[0.95] tracking-[-0.03em] text-white"
                style={{ fontFamily: "'Syne', sans-serif" }}>
                Test it before<br />
                <span className="bg-clip-text text-transparent"
                  style={{ backgroundImage: "linear-gradient(135deg, #22d3ee, #6366f1)" }}>
                  you bet it.
                </span>
              </h2>
              <p className="relative mt-4 text-slate-400 max-w-md mx-auto" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px" }}>
                Your first live trade should already be based on data.
              </p>
              <div className="relative mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link href="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-sm font-bold text-black transition-all hover:scale-[1.03]"
                  style={{ background: "linear-gradient(135deg, #22d3ee, #6366f1)", boxShadow: "0 0 40px rgba(34,211,238,0.3)" }}>
                  Start for free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/mock/dashboard"
                  className="inline-flex items-center justify-center rounded-2xl border px-8 py-4 text-sm font-medium text-slate-300 transition-all hover:text-white"
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
