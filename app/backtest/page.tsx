"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3 } from "lucide-react";
import { HomeBacktestingDashboardPreview } from "@/components/home/HomeBacktestingShowcase";
import AnimatedCounter from "@/components/ui/animated-counter";
import TerminalList from "@/components/ui/terminal-list";

gsap.registerPlugin(ScrollTrigger);

const ACCENT = "#22d3ee";

const CANDLES = Array.from({ length: 40 }, (_, i) => {
  const open = 50 + Math.sin(i * 0.7) * 20 + (i % 7) * 1.5;
  const close = open + ((i % 3 === 0 ? -1 : 1) * (8 + (i % 5) * 2.5));
  const high = Math.max(open, close) + (i % 4) * 2;
  const low = Math.min(open, close) - (i % 3) * 2;
  return { open, close, high, low, bull: close >= open };
});

const TERMINAL_ITEMS = [
  { text: "Load historical data (EURUSD, 2018–2024)", value: "✓ done", accent: ACCENT },
  { text: "Apply strategy: Breakout + ATR filter", value: "✓ done", accent: ACCENT },
  { text: "Run 6y backtest, 4h timeframe", value: "✓ 2,184 trades", accent: ACCENT },
  { text: "Calculate win rate", value: "62.4%", accent: "#00e676" },
  { text: "Max drawdown check", value: "-8.2%", accent: "#ff8c00" },
  { text: "Profit factor", value: "2.14", accent: "#00e676" },
  { text: "Sharpe ratio", value: "1.87", accent: "#00e676" },
  { text: "Export report", value: "✓ ready", accent: ACCENT },
];

export default function BacktestMarketingPage() {
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

      {/* HERO */}
      <section className="relative min-h-[85vh] flex flex-col justify-center px-6 pt-24 pb-20 lg:px-16 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-15%] left-[-10%] w-[70vw] h-[70vw] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(34,211,238,0.07) 0%, transparent 65%)" }} />
          <div className="absolute bottom-0 right-0 w-[50vw] h-[50vw] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.05) 0%, transparent 65%)" }} />
        </div>

        {/* Candlestick bg decoration */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-48 overflow-hidden opacity-[0.09]">
          <svg viewBox="0 0 800 180" preserveAspectRatio="none" className="w-full h-full">
            {CANDLES.map((c, i) => {
              const x = i * 20 + 10;
              const sc = 2.5;
              const cy = 90;
              const openY  = cy - (c.open  - 50) * sc;
              const closeY = cy - (c.close - 50) * sc;
              const highY  = cy - (c.high  - 50) * sc;
              const lowY   = cy - (c.low   - 50) * sc;
              const color = c.bull ? ACCENT : "#ff3c3c";
              return (
                <g key={i}>
                  <line x1={x} y1={highY} x2={x} y2={lowY} stroke={color} strokeWidth="1" />
                  <rect x={x - 4} y={Math.min(openY, closeY)} width={8}
                    height={Math.max(Math.abs(closeY - openY), 2)} fill={color} />
                </g>
              );
            })}
          </svg>
        </div>

        <div className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(34,211,238,0.05) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
          }}
        />

        <div className="relative max-w-7xl mx-auto w-full">
          <div className="bt-fade mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-[0.2em]"
              style={{ color: ACCENT, borderColor: "rgba(34,211,238,0.3)", background: "rgba(34,211,238,0.08)" }}>
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
              Replay years of market data. Validate every rule.<br />
              <span className="text-slate-300">Ship only strategies that have proven themselves.</span>
            </p>
            <div className="flex gap-3">
              <Link href="/signup"
                className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-black transition-all hover:scale-[1.03] cursor-pointer"
                style={{ background: "linear-gradient(135deg, #22d3ee, #6366f1)", boxShadow: "0 0 30px rgba(34,211,238,0.25)" }}>
                Start backtesting <ArrowRight className="h-4 w-4" />
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
            { to: 278,  suffix: "+", label: "Strategies tested",    color: ACCENT },
            { to: 94,   suffix: "%", label: "Win rate achievable",  color: "#00e676" },
            { to: 6,    suffix: "y", label: "Historical data depth",color: ACCENT },
            { to: 2184, suffix: "",  label: "Trades backtested",    color: "#6366f1" },
          ].map((s, i) => (
            <div key={i} className="stat-item text-center">
              <div className="text-[clamp(32px,4vw,56px)] font-black tracking-tight mb-1"
                style={{ fontFamily: "'Syne', sans-serif", color: s.color, textShadow: `0 0 30px ${s.color}50` }}>
                <AnimatedCounter to={s.to} suffix={s.suffix} glowColor={s.color} duration={1400} />
              </div>
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TERMINAL DEMO */}
      <section className="px-6 lg:px-16 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="bt-reveal mb-10">
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-500 mb-2">Live output</p>
            <h2 className="text-[clamp(32px,4vw,56px)] font-black leading-[0.95] tracking-[-0.03em] text-white"
              style={{ fontFamily: "'Syne', sans-serif" }}>
              Run in seconds.<br /><span className="text-slate-500">Results in milliseconds.</span>
            </h2>
          </div>
          <div className="bt-reveal rounded-2xl p-6 lg:p-8 crt-overlay"
            style={{
              background: "rgba(6,6,10,0.98)",
              border: `1px solid rgba(34,211,238,0.15)`,
              boxShadow: `0 0 60px rgba(34,211,238,0.05), 0 24px 80px rgba(0,0,0,0.5)`,
            }}>
            <div className="flex items-center gap-2 mb-6 pb-4 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <div className="flex gap-1.5">
                {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                  <div key={c} className="h-3 w-3 rounded-full" style={{ background: c }} />
                ))}
              </div>
              <span className="ml-3 text-[11px] font-mono text-slate-600 terminal-cursor">
                risksent backtest --pair EURUSD --tf 4h --from 2018 --to 2024
              </span>
            </div>
            <TerminalList items={TERMINAL_ITEMS} stagger={180} accentColor={ACCENT} />
          </div>
        </div>
      </section>

      {/* DASHBOARD PREVIEW */}
      <section className="px-6 lg:px-16 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="bt-reveal relative overflow-hidden rounded-3xl p-px"
            style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.3), rgba(99,102,241,0.2), rgba(255,255,255,0.04))" }}>
            <div className="rounded-3xl p-6 lg:p-8" style={{ background: "#0a0a10" }}>
              <HomeBacktestingDashboardPreview />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-6 lg:px-16 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="bt-reveal mb-12">
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-500 mb-3">Features</p>
            <h2 className="text-[clamp(36px,5vw,64px)] font-black leading-[0.95] tracking-[-0.03em] text-white"
              style={{ fontFamily: "'Syne', sans-serif" }}>
              Every metric.<br /><span className="text-slate-500">Every answer.</span>
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Historical replay", desc: "Replay any pair, any timeframe, any date range. Tick by tick or candle by candle.", color: ACCENT },
              { title: "Multi-strategy compare", desc: "Run A/B tests simultaneously. See which setup outperforms in real conditions.", color: "#6366f1" },
              { title: "Drawdown analysis", desc: "Live equity curve with max drawdown markers, recovery time, and underwater periods.", color: "#ff8c00" },
              { title: "Trade tagging", desc: "Every backtest trade tagged by setup, session, and entry model. Filter to your best.", color: ACCENT },
              { title: "Risk/reward matrix", desc: "Visualize every trade's R:R. Optimize target/stop placement scientifically.", color: "#00e676" },
              { title: "Export & share", desc: "Export full backtest reports as PDF. Share with prop firm evaluators or mentors.", color: "#6366f1" },
            ].map((f, i) => (
              <motion.div key={i} initial={false}
                whileHover={{ y: -6, transition: { type: "spring", stiffness: 380, damping: 26 } }}
                className="bt-reveal scan-card group relative overflow-hidden rounded-2xl p-6 cursor-default"
                style={{ background: "rgba(14,14,18,0.85)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(12px)" }}>
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(ellipse at 0% 100%, ${f.color}10 0%, transparent 70%)` }} />
                <div className="relative">
                  <div className="h-2 w-2 rounded-full mb-4" style={{ background: f.color, boxShadow: `0 0 10px ${f.color}` }} />
                  <h3 className="text-base font-black text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>{f.title}</h3>
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
          <div className="bt-reveal relative overflow-hidden rounded-3xl p-px"
            style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.4), rgba(99,102,241,0.25), rgba(255,255,255,0.03))" }}>
            <div className="relative overflow-hidden rounded-3xl px-8 py-16 text-center" style={{ background: "#0a0a10" }}>
              <div className="pointer-events-none absolute inset-0"
                style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(34,211,238,0.08) 0%, transparent 60%)" }} />
              <h2 className="relative text-[clamp(36px,5vw,72px)] font-black leading-[0.95] tracking-[-0.03em] text-white"
                style={{ fontFamily: "'Syne', sans-serif" }}>
                Your strategy is only<br />
                <span className="bg-clip-text text-transparent"
                  style={{ backgroundImage: "linear-gradient(135deg, #22d3ee, #6366f1)" }}>
                  as good as its data.
                </span>
              </h2>
              <p className="relative mt-4 text-slate-400 max-w-md mx-auto"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px" }}>Stop guessing. Start knowing.</p>
              <div className="relative mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link href="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-sm font-bold text-black transition-all hover:scale-[1.03] cursor-pointer"
                  style={{ background: "linear-gradient(135deg, #22d3ee, #6366f1)", boxShadow: "0 0 40px rgba(34,211,238,0.3)" }}>
                  Start backtesting free <ArrowRight className="h-4 w-4" />
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
