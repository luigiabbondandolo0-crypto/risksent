'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { ArrowRight, FlaskConical } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface Candle {
  open: number;
  close: number;
  high: number;
  low: number;
  bull: boolean;
}

/* 20 candles for chart */
const CANDLES_20: Candle[] = [
  { open: 60, close: 45, high: 65, low: 40, bull: false },
  { open: 45, close: 62, high: 67, low: 43, bull: true },
  { open: 62, close: 55, high: 68, low: 52, bull: false },
  { open: 55, close: 70, high: 75, low: 53, bull: true },
  { open: 70, close: 64, high: 73, low: 60, bull: false },
  { open: 64, close: 78, high: 82, low: 62, bull: true },
  { open: 78, close: 72, high: 81, low: 68, bull: false },
  { open: 72, close: 85, high: 89, low: 70, bull: true },
  { open: 85, close: 80, high: 88, low: 76, bull: false },
  { open: 80, close: 92, high: 95, low: 78, bull: true },
  { open: 92, close: 87, high: 96, low: 84, bull: false },
  { open: 87, close: 98, high: 102, low: 85, bull: true },
  { open: 98, close: 93, high: 101, low: 90, bull: false },
  { open: 93, close: 105, high: 108, low: 91, bull: true },
  { open: 105, close: 100, high: 109, low: 97, bull: false },
  { open: 100, close: 112, high: 115, low: 98, bull: true },
  { open: 112, close: 108, high: 116, low: 105, bull: false },
  { open: 108, close: 118, high: 122, low: 106, bull: true },
  { open: 118, close: 115, high: 121, low: 112, bull: false },
  { open: 115, close: 124, high: 127, low: 113, bull: true },
];

function scalePx(val: number, min: number, max: number, pxMax: number): number {
  return pxMax - ((val - min) / (max - min)) * pxMax;
}

/* Mini equity curve path */
function equityCurvePath(data: number[], w: number, h: number): string {
  const min = Math.min(...data);
  const max = Math.max(...data);
  return data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * h;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
}

const SESSION_EQUITY = {
  eurusd: [100, 102, 99, 105, 108, 106, 112, 115, 118, 115, 120, 118, 124],
  xauusd: [100, 103, 101, 105, 108, 106, 110, 112, 109, 112, 115, 113, 118],
  us30: [100, 102, 101, 104, 103, 106, 105, 108, 107, 109, 108, 111, 110],
};

export default function BacktestingPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      ScrollTrigger.refresh();
      if (!prefersReduced) {
        gsap.from('.bt-hero-word', {
          yPercent: 110, opacity: 0, duration: 1, stagger: 0.07, ease: 'expo.out', delay: 0.2,
        });
        gsap.from('.bt-fade', {
          opacity: 0, y: 20, duration: 0.8, stagger: 0.1, delay: 0.8, ease: 'power3.out',
        });
        gsap.utils.toArray<HTMLElement>('.bt-reveal').forEach((el) => {
          gsap.from(el, {
            opacity: 0, y: 40, duration: 0.8, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
          });
        });
        /* Candle scale animation */
        gsap.from('.candle-rect', {
          scaleY: 0, transformOrigin: 'bottom', stagger: 0.04, duration: 0.5, ease: 'back.out(1.4)',
          scrollTrigger: { trigger: '.replay-section', start: 'top 80%', toggleActions: 'play none none none' },
          delay: 0.2,
        });
        /* Session equity curves */
        gsap.utils.toArray<SVGPathElement>('.session-curve').forEach((path) => {
          const len = path.getTotalLength();
          gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
          gsap.to(path, {
            strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut',
            scrollTrigger: { trigger: '.sessions-section', start: 'top 80%', toggleActions: 'play none none none' },
          });
        });
        /* Main equity curve */
        const mainCurve = document.querySelector<SVGPathElement>('.main-equity-curve');
        if (mainCurve) {
          const len = mainCurve.getTotalLength();
          gsap.set(mainCurve, { strokeDasharray: len, strokeDashoffset: len });
          gsap.to(mainCurve, {
            strokeDashoffset: 0, duration: 2.5, ease: 'power2.inOut',
            scrollTrigger: { trigger: '.analytics-bt-section', start: 'top 80%', toggleActions: 'play none none none' },
          });
        }
      }
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const chartMin = 40;
  const chartMax = 127;
  const svgH = 160;
  const svgW = 400;
  const candleW = svgW / CANDLES_20.length;

  return (
    <div ref={containerRef} className="min-h-full overflow-x-hidden bg-[#080809]">
      <style>{`
        @keyframes float-bt { 0%,100% { transform: translateY(0px) } 50% { transform: translateY(-10px) } }
        .bt-float { animation: float-bt 3.5s ease-in-out infinite; }
      `}</style>

      {/* ─── HERO ─── */}
      <section className="relative min-h-[80vh] flex flex-col justify-center px-6 pt-24 pb-20 lg:px-16 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(34,211,238,0.07) 0%, transparent 65%)' }} />
          <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(129,140,248,0.04) 0%, transparent 65%)' }} />
        </div>

        <div className="relative max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-16">
            {/* LEFT */}
            <div className="lg:w-[55%]">
              <div className="bt-fade mb-6">
                <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-[0.2em]"
                  style={{ color: '#22d3ee', borderColor: 'rgba(34,211,238,0.3)', background: 'rgba(34,211,238,0.08)' }}>
                  <FlaskConical className="h-3 w-3" />
                  Backtesting Lab
                </span>
              </div>

              <h1 className="font-black leading-[0.9] tracking-[-0.04em] text-white"
                style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)', fontSize: 'clamp(40px, 6.5vw, 90px)' }}>
                {['Know', 'your', 'edge'].map((w, i) => (
                  <span key={i} className="inline-block overflow-hidden mr-[0.2em]" style={{ verticalAlign: 'bottom' }}>
                    <span className="bt-hero-word inline-block">{w}</span>
                  </span>
                ))}
                <br />
                {['before', 'the', 'market'].map((w, i) => (
                  <span key={i} className="inline-block overflow-hidden mr-[0.2em]" style={{ verticalAlign: 'bottom' }}>
                    <span className="bt-hero-word inline-block">{w}</span>
                  </span>
                ))}
                <br />
                <span className="inline-block overflow-hidden" style={{ verticalAlign: 'bottom' }}>
                  <span className="bt-hero-word inline-block bg-clip-text text-transparent"
                    style={{ backgroundImage: 'linear-gradient(135deg, #22d3ee, #818cf8)' }}>
                    tests it.
                  </span>
                </span>
              </h1>

              <p className="bt-fade mt-6 max-w-md text-slate-400 leading-relaxed"
                style={{ fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)', fontSize: '14px' }}>
                Replay any market. Test every strategy on real data.<br />
                <span className="text-slate-300">Find your edge before you risk a single dollar.</span>
              </p>

              <div className="bt-fade mt-8 flex flex-wrap gap-3">
                <Link href="/signup"
                  className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-black transition-all hover:scale-[1.03]"
                  style={{ background: 'linear-gradient(135deg, #22d3ee, #818cf8)', boxShadow: '0 0 30px rgba(34,211,238,0.25)' }}>
                  Start backtesting
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/mock/dashboard"
                  className="inline-flex items-center gap-2 rounded-2xl border px-6 py-3 text-sm font-medium text-slate-300 transition-all hover:text-white"
                  style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                  Live demo
                </Link>
              </div>
            </div>

            {/* RIGHT — floating candlestick chart */}
            <div className="hidden md:flex lg:w-[45%] justify-center">
              <div className="bt-float relative rounded-[20px] p-6 w-80"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
                }}>
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-3">EURUSD · M5 · 15 candles</p>
                <svg viewBox={`0 0 ${svgW} ${svgH + 20}`} className="w-full">
                  {CANDLES_20.slice(-15).map((c, i) => {
                    const x = i * (svgW / 15) + (svgW / 15 / 2);
                    const cW = (svgW / 15) * 0.6;
                    const top = scalePx(Math.max(c.open, c.close), chartMin, chartMax, svgH);
                    const bottom = scalePx(Math.min(c.open, c.close), chartMin, chartMax, svgH);
                    const wickTop = scalePx(c.high, chartMin, chartMax, svgH);
                    const wickBottom = scalePx(c.low, chartMin, chartMax, svgH);
                    const color = c.bull ? '#00e676' : '#ff3c3c';
                    return (
                      <g key={i}>
                        <line x1={x} y1={wickTop} x2={x} y2={wickBottom} stroke={color} strokeWidth="1" opacity="0.6" />
                        <rect x={x - cW / 2} y={top} width={cW} height={Math.max(bottom - top, 2)} fill={color} rx="1" opacity="0.85" />
                      </g>
                    );
                  })}
                </svg>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-mono text-slate-500">+18.4% return</span>
                  <span className="text-xs font-mono" style={{ color: '#22d3ee' }}>71% WR</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 1: Replay ─── */}
      <section className="replay-section py-24 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="bt-reveal mb-8">
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-500 mb-3">Strategy Replay</p>
            <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-black leading-[0.95] tracking-[-0.03em] text-white"
              style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)' }}>
              Replay. Refine.<br />
              <span className="text-slate-500">Repeat.</span>
            </h2>
          </div>

          <div className="bt-reveal rounded-[20px] p-8"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {/* Full 20-candle chart */}
            <svg viewBox={`0 0 ${svgW} ${svgH + 10}`} className="w-full max-h-48 mb-6">
              {CANDLES_20.map((c, i) => {
                const x = i * candleW + candleW / 2;
                const cW = candleW * 0.6;
                const top = scalePx(Math.max(c.open, c.close), chartMin, chartMax, svgH);
                const bottom = scalePx(Math.min(c.open, c.close), chartMin, chartMax, svgH);
                const wickTop = scalePx(c.high, chartMin, chartMax, svgH);
                const wickBottom = scalePx(c.low, chartMin, chartMax, svgH);
                const color = c.bull ? '#00e676' : '#ff3c3c';
                return (
                  <g key={i}>
                    <line x1={x} y1={wickTop} x2={x} y2={wickBottom} stroke={color} strokeWidth="1" opacity="0.5" />
                    <rect className="candle-rect" x={x - cW / 2} y={top} width={cW} height={Math.max(bottom - top, 2)} fill={color} rx="1" opacity="0.8" />
                  </g>
                );
              })}
            </svg>

            {/* Replay controls */}
            <div className="flex flex-wrap items-center gap-3">
              {[
                { label: '← Prev', active: false },
                { label: '▶ Play', active: true },
                { label: 'Next →', active: false },
                { label: 'Speed 2x', active: false },
              ].map((btn, i) => (
                <button key={i} type="button" className="rounded-xl px-4 py-2 text-xs font-mono transition-all hover:scale-[1.05]"
                  style={btn.active ? {
                    background: 'linear-gradient(135deg, #22d3ee, #818cf8)',
                    color: '#000',
                    fontWeight: 700,
                  } : {
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#94a3b8',
                  }}>
                  {btn.label}
                </button>
              ))}
              <div className="ml-auto flex gap-4 text-xs font-mono text-slate-500">
                <span>5,000 candles</span>
                <span className="text-slate-600">·</span>
                <span>M1 to D1</span>
                <span className="text-slate-600">·</span>
                <span>50+ symbols</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: Sessions ─── */}
      <section className="sessions-section py-24 px-6 lg:px-16" style={{ background: '#060607' }}>
        <div className="max-w-7xl mx-auto">
          <div className="bt-reveal mb-8">
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-500 mb-3">Saved Sessions</p>
            <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-black leading-[0.95] tracking-[-0.03em] text-white"
              style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)' }}>
              Every session.<br />
              <span className="text-slate-500">Analyzed and saved.</span>
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { name: 'EURUSD London Scalp', tf: 'M5', trades: 847, wr: '71%', ret: '+18.4%', color: '#22d3ee', equity: SESSION_EQUITY.eurusd },
              { name: 'XAUUSD H1 Trend', tf: 'H1', trades: 124, wr: '64%', ret: '+12.1%', color: '#818cf8', equity: SESSION_EQUITY.xauusd },
              { name: 'US30 NY Session', tf: 'M15', trades: 312, wr: '66%', ret: '+9.8%', color: '#00e676', equity: SESSION_EQUITY.us30 },
            ].map((s, i) => (
              <motion.div key={i}
                className="bt-reveal rounded-[20px] p-6 cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
                whileHover={{
                  y: -8,
                  boxShadow: `0 0 30px ${s.color}25`,
                  borderColor: `${s.color}40`,
                  transition: { type: 'spring', stiffness: 380, damping: 28 },
                }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-black text-white text-sm mb-1" style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)' }}>{s.name}</p>
                    <p className="text-[10px] font-mono text-slate-500">{s.tf} · {s.trades} trades</p>
                  </div>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-mono font-bold"
                    style={{ color: s.color, background: `${s.color}15`, border: `1px solid ${s.color}30` }}>
                    {s.ret}
                  </span>
                </div>
                {/* Mini equity curve */}
                <svg viewBox="0 0 120 40" className="w-full h-10 mb-3" fill="none">
                  <path className="session-curve"
                    d={equityCurvePath(s.equity, 120, 40)}
                    stroke={s.color} strokeWidth="2" strokeLinecap="round" fill="none" />
                </svg>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">Win rate</span>
                  <span style={{ color: s.color }}>{s.wr}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 3: Analytics ─── */}
      <section className="analytics-bt-section py-24 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="bt-reveal mb-8">
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-500 mb-3">Strategy Analytics</p>
            <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-black leading-[0.95] tracking-[-0.03em] text-white"
              style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)' }}>
              See your strategy&apos;s real performance<br />
              <span className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #22d3ee, #818cf8)' }}>
                across any market condition.
              </span>
            </h2>
          </div>

          <div className="bt-reveal rounded-[20px] p-8"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-4">Combined equity curve · EURUSD London Scalp</p>
            <svg viewBox="0 0 600 120" className="w-full h-28" fill="none">
              <defs>
                <linearGradient id="btGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path className="main-equity-curve"
                d="M0,110 L30,105 L60,100 L90,95 L120,88 L150,80 L180,75 L210,68 L240,60 L270,55 L300,48 L330,42 L360,36 L390,30 L420,24 L450,18 L480,14 L510,10 L540,7 L570,5 L600,3"
                stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M0,110 L30,105 L60,100 L90,95 L120,88 L150,80 L180,75 L210,68 L240,60 L270,55 L300,48 L330,42 L360,36 L390,30 L420,24 L450,18 L480,14 L510,10 L540,7 L570,5 L600,3 L600,120 L0,120Z"
                fill="url(#btGrad)" />
            </svg>
            <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              {[
                { label: 'Start Capital', val: '€10,000', color: '#fff' },
                { label: 'End Capital', val: '€11,840', color: '#22d3ee' },
                { label: 'Win Rate', val: '71%', color: '#00e676' },
                { label: 'Return', val: '+18.4%', color: '#22d3ee' },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <p className="text-lg font-black" style={{ color: s.color, fontFamily: 'var(--font-display, "Syne", sans-serif)' }}>{s.val}</p>
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="bt-reveal relative overflow-hidden rounded-3xl p-px"
            style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.4), rgba(129,140,248,0.2), rgba(255,255,255,0.03))' }}>
            <div className="relative overflow-hidden rounded-3xl px-8 py-16 text-center" style={{ background: '#0e0e12' }}>
              <div className="pointer-events-none absolute inset-0"
                style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(34,211,238,0.1) 0%, transparent 60%)' }} />
              <h2 className="relative text-[clamp(2rem,5vw,4rem)] font-black leading-[0.95] tracking-[-0.03em] text-white"
                style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)' }}>
                Start backtesting your<br />
                <span className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(135deg, #22d3ee, #818cf8)' }}>
                  strategy today.
                </span>
              </h2>
              <p className="relative mt-4 text-slate-400 max-w-md mx-auto"
                style={{ fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)', fontSize: '14px' }}>
                Stop guessing. Start knowing.
              </p>
              <div className="relative mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link href="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-sm font-bold text-black transition-all hover:scale-[1.03]"
                  style={{ background: 'linear-gradient(135deg, #22d3ee, #818cf8)', boxShadow: '0 0 40px rgba(34,211,238,0.3)' }}>
                  Start backtesting free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/mock/dashboard"
                  className="inline-flex items-center justify-center rounded-2xl border px-8 py-4 text-sm font-medium text-slate-300 transition-all hover:text-white"
                  style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
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
