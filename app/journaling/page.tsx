"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, TrendingUp } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

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

      {/* Hero */}
      <section className="relative min-h-[80vh] flex flex-col justify-center px-6 pt-24 pb-20 lg:px-16 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(0,230,118,0.07) 0%, transparent 65%)" }} />
          <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(34,211,238,0.04) 0%, transparent 65%)" }} />
        </div>

        <div className="relative max-w-7xl mx-auto w-full">
          <div className="jn-fade mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-[0.2em]"
              style={{ color: "#00e676", borderColor: "rgba(0,230,118,0.3)", background: "rgba(0,230,118,0.08)" }}>
              <TrendingUp className="h-3 w-3" />
              Trading Journal
            </span>
          </div>

          <h1 className="text-[clamp(48px,8vw,120px)] font-black leading-[0.9] tracking-[-0.04em] text-white mb-8"
            style={{ fontFamily: "'Syne', sans-serif" }}>
            {["Every", "trade"].map((w, i) => (
              <span key={i} className="inline-block overflow-hidden mr-[0.2em]">
                <span className="jn-hero-word inline-block">{w}</span>
              </span>
            ))}
            <br />
            {["tells", "a"].map((w, i) => (
              <span key={i} className="inline-block overflow-hidden mr-[0.2em]">
                <span className="jn-hero-word inline-block">{w}</span>
              </span>
            ))}
            <span className="inline-block overflow-hidden">
              <span className="jn-hero-word inline-block bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(135deg, #00e676, #22d3ee)" }}>
                story.
              </span>
            </span>
          </h1>

          <div className="jn-fade flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <p className="max-w-lg text-slate-400 leading-relaxed"
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px" }}>
              Log every trade. Tag every setup. Review your psychology.<br />
              <span className="text-slate-300">Turn every loss into data — and every pattern into profit.</span>
            </p>
            <div className="flex gap-3">
              <Link href="/signup"
                className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-black transition-all hover:scale-[1.03]"
                style={{ background: "linear-gradient(135deg, #00e676, #22d3ee)", boxShadow: "0 0 30px rgba(0,230,118,0.25)" }}>
                Start journaling
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
          <div className="jn-reveal relative overflow-hidden rounded-3xl p-px"
            style={{ background: "linear-gradient(135deg, rgba(0,230,118,0.3), rgba(34,211,238,0.2), rgba(255,255,255,0.05))" }}>
            <div className="rounded-3xl p-8 lg:p-12" style={{ background: "#0e0e12" }}>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Journal Dashboard</p>
                  <p className="text-lg font-bold text-white mt-1" style={{ fontFamily: "'Syne', sans-serif" }}>April 2026</p>
                </div>
                <span className="rounded-full px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-widest"
                  style={{ color: "#00e676", background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.2)" }}>
                  22 trades logged
                </span>
              </div>

              {/* Calendar heatmap mock */}
              <div className="rounded-2xl p-6 mb-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-4">Monthly activity</p>
                <div className="grid grid-cols-7 gap-1.5">
                  {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
                    <div key={d} className="text-center text-[9px] font-mono text-slate-600 pb-1">{d}</div>
                  ))}
                  {[...Array(3)].map((_, i) => <div key={`pad-${i}`} />)}
                  {[
                    null, null, {p:0.04,w:2}, null, {p:0.20,w:3}, {p:-0.12,w:4},
                    null, null, {p:0.09,w:2}, null, null, {p:0.31,w:5}, {p:-0.08,w:5},
                    {p:-0.04,w:6}, null, null, null, {p:0.12,w:3}, null, {p:0.20,w:4},
                    null, null, null, null, null, null, null,
                  ].map((d, i) => (
                    <div key={i} className="aspect-square rounded-lg flex flex-col items-center justify-center text-[9px] font-mono"
                      style={{
                        background: d ? (d.p >= 0 ? "rgba(0,230,118,0.15)" : "rgba(255,60,60,0.15)") : "rgba(255,255,255,0.03)",
                        border: d ? `1px solid ${d.p >= 0 ? "rgba(0,230,118,0.3)" : "rgba(255,60,60,0.3)"}` : "1px solid rgba(255,255,255,0.05)",
                        color: d ? (d.p >= 0 ? "#00e676" : "#ff3c3c") : "#334155",
                      }}>
                      {d ? `${d.p >= 0 ? "+" : ""}${d.p.toFixed(2)}%` : String(i + 1 - 3 <= 0 ? "" : i - 2)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent trades */}
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Recent trades</p>
                </div>
                {[
                  { pair: "EURUSD", dir: "LONG", pl: "+420.50", pct: "+0.41%", tag: "Breakout", win: true },
                  { pair: "GBPJPY", dir: "SHORT", pl: "-280.00", pct: "-0.28%", tag: "Reversal", win: false },
                  { pair: "XAUUSD", dir: "LONG", pl: "+310.00", pct: "+0.31%", tag: "Trend", win: true },
                ].map((t, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3 border-b last:border-0"
                    style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full" style={{ background: t.win ? "#00e676" : "#ff3c3c" }} />
                      <span className="text-sm font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>{t.pair}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                        style={{ color: t.dir === "LONG" ? "#00e676" : "#ff3c3c", background: t.dir === "LONG" ? "rgba(0,230,118,0.1)" : "rgba(255,60,60,0.1)" }}>
                        {t.dir}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(255,255,255,0.04)" }}>
                        {t.tag}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold font-mono" style={{ color: t.win ? "#00e676" : "#ff3c3c" }}>{t.pl}</p>
                      <p className="text-[10px] font-mono text-slate-500">{t.pct}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 lg:px-16 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="jn-reveal mb-12">
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-500 mb-3">Features</p>
            <h2 className="text-[clamp(36px,5vw,64px)] font-black leading-[0.95] tracking-[-0.03em] text-white"
              style={{ fontFamily: "'Syne', sans-serif" }}>
              Stop guessing.<br />
              <span className="text-slate-500">Start reviewing.</span>
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Trade logging", desc: "Log every trade automatically or manually. Entry, exit, size, P&L — all in one place.", color: "#00e676" },
              { title: "Setup tagging", desc: "Tag every trade by setup type, session, pair and emotional state. Find your best patterns.", color: "#22d3ee" },
              { title: "Calendar heatmap", desc: "See your P&L across every trading day at a glance. Spot your best and worst days instantly.", color: "#818cf8" },
              { title: "Psychology notes", desc: "Write notes on every trade. Review your mindset patterns — the ones that cost you money.", color: "#00e676" },
              { title: "Win/loss breakdown", desc: "Break down your performance by pair, session, setup and time. Know where your edge lives.", color: "#ff8c00" },
              { title: "Streak tracking", desc: "Track your consecutive winning and losing days. Gamify your discipline.", color: "#22d3ee" },
            ].map((f, i) => (
              <div key={i} className="jn-reveal group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02]"
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
          <div className="jn-reveal relative overflow-hidden rounded-3xl p-px"
            style={{ background: "linear-gradient(135deg, rgba(0,230,118,0.4), rgba(34,211,238,0.2), rgba(255,255,255,0.03))" }}>
            <div className="relative overflow-hidden rounded-3xl px-8 py-16 text-center" style={{ background: "#0e0e12" }}>
              <div className="pointer-events-none absolute inset-0"
                style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(0,230,118,0.08) 0%, transparent 60%)" }} />
              <h2 className="relative text-[clamp(36px,5vw,72px)] font-black leading-[0.95] tracking-[-0.03em] text-white"
                style={{ fontFamily: "'Syne', sans-serif" }}>
                Your trades are<br />
                <span className="bg-clip-text text-transparent"
                  style={{ backgroundImage: "linear-gradient(135deg, #00e676, #22d3ee)" }}>
                  trying to teach you.
                </span>
              </h2>
              <p className="relative mt-4 text-slate-400 max-w-md mx-auto"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px" }}>
                Are you listening?
              </p>
              <div className="relative mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link href="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-sm font-bold text-black transition-all hover:scale-[1.03]"
                  style={{ background: "linear-gradient(135deg, #00e676, #22d3ee)", boxShadow: "0 0 40px rgba(0,230,118,0.3)" }}>
                  Start journaling free
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
