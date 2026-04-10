"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Shield } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function RiskManagerPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.refresh();
      gsap.from(".rm-hero-word", {
        yPercent: 110, opacity: 0, duration: 1, stagger: 0.07, ease: "expo.out", delay: 0.2,
      });
      gsap.from(".rm-fade", {
        opacity: 0, y: 20, duration: 0.8, stagger: 0.1, delay: 0.8, ease: "power3.out",
      });
      gsap.utils.toArray<HTMLElement>(".rm-reveal").forEach((el) => {
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
            style={{ background: "radial-gradient(ellipse, rgba(255,60,60,0.08) 0%, transparent 65%)" }} />
          <div className="absolute bottom-0 right-0 w-[50vw] h-[50vw] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(255,140,0,0.05) 0%, transparent 65%)" }} />
        </div>

        <div className="relative max-w-7xl mx-auto w-full">
          <div className="rm-fade mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-[0.2em]"
              style={{ color: "#ff3c3c", borderColor: "rgba(255,60,60,0.3)", background: "rgba(255,60,60,0.08)" }}>
              <Shield className="h-3 w-3" />
              Risk Sentinel
            </span>
          </div>

          <h1 className="text-[clamp(48px,8vw,120px)] font-black leading-[0.9] tracking-[-0.04em] text-white mb-8"
            style={{ fontFamily: "'Syne', sans-serif" }}>
            {["The", "floor"].map((w, i) => (
              <span key={i} className="inline-block overflow-hidden mr-[0.2em]">
                <span className="rm-hero-word inline-block">{w}</span>
              </span>
            ))}
            <br />
            {["manager", "you"].map((w, i) => (
              <span key={i} className="inline-block overflow-hidden mr-[0.2em]">
                <span className="rm-hero-word inline-block">{w}</span>
              </span>
            ))}
            <br />
            <span className="inline-block overflow-hidden">
              <span className="rm-hero-word inline-block bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(135deg, #ff3c3c, #ff8c00)" }}>
                never had.
              </span>
            </span>
          </h1>

          <div className="rm-fade flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <p className="max-w-lg text-slate-400 leading-relaxed"
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px" }}>
              Real-time risk monitoring on your live account.<br />
              Live alerts. Actionable guidance. Zero excuses.<br />
              <span className="text-slate-300">RiskSent does not block your trading: it warns you while you are making mistakes.</span>
            </p>
            <div className="flex gap-3">
              <Link href="/signup"
                className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-black transition-all hover:scale-[1.03]"
                style={{ background: "linear-gradient(135deg, #ff3c3c, #ff8c00)", boxShadow: "0 0 30px rgba(255,60,60,0.3)" }}>
                Protect your account
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
          <div className="rm-reveal relative overflow-hidden rounded-3xl p-px"
            style={{ background: "linear-gradient(135deg, rgba(255,60,60,0.4), rgba(255,140,0,0.2), rgba(255,255,255,0.05))" }}>
            <div className="rounded-3xl p-8 lg:p-12" style={{ background: "#0e0e12" }}>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Risk Sentinel — Live</p>
                  <p className="text-lg font-bold text-white mt-1" style={{ fontFamily: "'Syne', sans-serif" }}>Account · FTMO Demo</p>
                </div>
                <span className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-widest"
                  style={{ color: "#ff3c3c", background: "rgba(255,60,60,0.1)", border: "1px solid rgba(255,60,60,0.2)" }}>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-400" />
                  </span>
                  Monitoring
                </span>
              </div>

              {/* Risk rules */}
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mb-6">
                {[
                  { label: "Daily loss", val: "3%", current: "-1.20%", status: "watch", color: "#ff8c00" },
                  { label: "Risk/trade", val: "1%", current: "0.80%", status: "safe", color: "#00e676" },
                  { label: "Exposure", val: "6%", current: "+3.40%", status: "safe", color: "#00e676" },
                  { label: "Revenge", val: "3 losses", current: "1 loss", status: "safe", color: "#00e676" },
                ].map((r) => (
                  <div key={r.label} className="rounded-2xl p-4"
                    style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${r.color}25` }}>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">{r.label}</p>
                    <p className="mt-2 text-lg font-black" style={{ color: r.color, fontFamily: "'Syne', sans-serif" }}>{r.current}</p>
                    <p className="text-[10px] font-mono text-slate-600 mt-1">limit {r.val}</p>
                  </div>
                ))}
              </div>

              {/* Gauges */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { label: "Daily DD", val: -1.20, limit: 3, color: "#ff8c00" },
                  { label: "Exposure", val: 3.40, limit: 6, color: "#00e676" },
                ].map((g) => (
                  <div key={g.label} className="rounded-2xl p-6 flex flex-col items-center"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-4">{g.label}</p>
                    <svg viewBox="0 0 100 50" className="w-32 h-16">
                      <path d="M 10 45 A 40 40 0 0 1 90 45" fill="none" stroke="#1e1e1e" strokeWidth="10" strokeLinecap="round" />
                      <path d="M 10 45 A 40 40 0 0 1 90 45" fill="none" stroke={g.color} strokeWidth="6" strokeLinecap="round"
                        strokeDasharray={`${(Math.abs(g.val) / g.limit) * 125} 125`}
                        style={{ filter: `drop-shadow(0 0 6px ${g.color})` }} />
                    </svg>
                    <p className="text-xl font-black font-mono mt-1" style={{ color: g.color }}>
                      {g.val >= 0 ? "+" : ""}{g.val.toFixed(2)}%
                    </p>
                    <p className="text-[10px] font-mono text-slate-600 mt-1">limit {g.limit}%</p>
                  </div>
                ))}
              </div>

              {/* Alert */}
              <div className="rounded-2xl p-4"
                style={{ background: "rgba(255,140,0,0.06)", border: "1px solid rgba(255,140,0,0.25)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-400" />
                  </span>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-orange-300">Watch</span>
                  <span className="ml-auto text-[10px] font-mono text-slate-500">10/04/26, 15:04</span>
                </div>
                <p className="text-sm text-slate-200 font-medium">Daily loss approaching limit (2.8% of 3%)</p>
                <p className="text-xs text-slate-500 mt-1">Next step: Reduce size or pause until tomorrow.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rules builder */}
      <section className="px-6 lg:px-16 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="rm-reveal relative overflow-hidden rounded-3xl p-px"
            style={{ background: "linear-gradient(135deg, rgba(255,60,60,0.35), rgba(255,140,0,0.2), rgba(255,255,255,0.05))" }}>
            <div className="rounded-3xl p-8 lg:p-10" style={{ background: "#0e0e12" }}>
              <div className="mb-6">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Rules Builder</p>
                <p className="mt-1 text-lg font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Set your rules and save them</p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-4">Custom limits</p>
                  <div className="space-y-3">
                    {[
                      { label: "Max daily loss", value: "3.0%" },
                      { label: "Max risk per trade", value: "1.0%" },
                      { label: "Max total exposure", value: "6.0%" },
                      { label: "Consecutive losses alert", value: "3 losses" },
                    ].map((rule) => (
                      <div key={rule.label} className="flex items-center justify-between rounded-xl px-3 py-2"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <span className="text-xs text-slate-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{rule.label}</span>
                        <span className="text-xs font-bold text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{rule.value}</span>
                      </div>
                    ))}
                  </div>
                  <button type="button" className="mt-4 w-full rounded-xl px-4 py-2.5 text-xs font-bold text-black"
                    style={{ background: "linear-gradient(135deg, #ff3c3c, #ff8c00)" }}>
                    Save rules
                  </button>
                </div>

                <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-4">How RiskSent helps</p>
                  <div className="space-y-3 text-xs text-slate-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    <p>1) Detects rule breaches in real time while you trade.</p>
                    <p>2) Sends immediate guidance: what to do now, when to stop, and how to avoid repeating the mistake.</p>
                    <p>3) Logs violations so you can review patterns and improve execution.</p>
                  </div>
                  <div className="mt-4 rounded-xl p-3"
                    style={{ background: "rgba(255,140,0,0.08)", border: "1px solid rgba(255,140,0,0.25)" }}>
                    <p className="text-[11px] text-orange-300" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      Note: RiskSent does not execute or block trades on your account. It acts as a real-time risk coach.
                    </p>
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
          <div className="rm-reveal mb-12">
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-500 mb-3">Features</p>
            <h2 className="text-[clamp(36px,5vw,64px)] font-black leading-[0.95] tracking-[-0.03em] text-white"
              style={{ fontFamily: "'Syne', sans-serif" }}>
              Your rules.<br />
              <span className="text-slate-500">Enforced in real time.</span>
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Saved risk rules", desc: "Create your own rules and save presets for each account or challenge phase.", color: "#ff3c3c" },
              { title: "Action guidance", desc: "When a rule is close to breach, you get a precise suggestion: reduce size, stop, or review.", color: "#ff8c00" },
              { title: "Daily loss tracking", desc: "Set your max daily drawdown and get alerted before and at the limit.", color: "#ff3c3c" },
              { title: "Exposure control", desc: "Define your max open exposure. RiskSent alerts you before you add too much risk.", color: "#ff8c00" },
              { title: "Revenge detection", desc: "3 consecutive losses? RiskSent flags the behavior and suggests a stop protocol.", color: "#ff3c3c" },
              { title: "Violation log", desc: "Every violation is tracked with timestamp and context so you can improve from evidence.", color: "#ff8c00" },
            ].map((f, i) => (
              <div key={i} className="rm-reveal group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02]"
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
          <div className="rm-reveal relative overflow-hidden rounded-3xl p-px"
            style={{ background: "linear-gradient(135deg, rgba(255,60,60,0.5), rgba(255,140,0,0.3), rgba(255,255,255,0.03))" }}>
            <div className="relative overflow-hidden rounded-3xl px-8 py-16 text-center" style={{ background: "#0e0e12" }}>
              <div className="pointer-events-none absolute inset-0"
                style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(255,60,60,0.1) 0%, transparent 60%)" }} />
              <h2 className="relative text-[clamp(36px,5vw,72px)] font-black leading-[0.95] tracking-[-0.03em] text-white"
                style={{ fontFamily: "'Syne', sans-serif" }}>
                Stop blowing<br />
                <span className="bg-clip-text text-transparent"
                  style={{ backgroundImage: "linear-gradient(135deg, #ff3c3c, #ff8c00)" }}>
                  your accounts.
                </span>
              </h2>
              <p className="relative mt-4 text-slate-400 max-w-md mx-auto"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px" }}>
                One rule broken can erase weeks of work.<br />
                RiskSent makes sure that never happens again.
              </p>
              <div className="relative mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link href="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-sm font-bold text-black transition-all hover:scale-[1.03]"
                  style={{ background: "linear-gradient(135deg, #ff3c3c, #ff8c00)", boxShadow: "0 0 40px rgba(255,60,60,0.35)" }}>
                  Protect my account
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
