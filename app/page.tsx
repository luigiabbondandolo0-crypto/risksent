'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown, Shield, BookOpen, FlaskConical, Zap } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

/* ─── Shimmer button ─── */
const shimmerStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #ff3c3c, #ff8c00, #ff3c3c)',
  backgroundSize: '200% auto',
};

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [counters, setCounters] = useState({ traders: 0, volume: 0, winrate: 0 });
  const countersTriggered = useRef(false);
  const [mouse, setMouse] = useState({ x: -999, y: -999 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouse({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      ScrollTrigger.refresh();

      if (!prefersReduced) {
        /* Hero words slam in via clip-path */
        gsap.from('.hw', {
          clipPath: 'inset(110% 0 0 0)',
          opacity: 0,
          stagger: 0.07,
          duration: 1.1,
          ease: 'expo.out',
          delay: 0.2,
        });

        gsap.from('.hero-sub', { opacity: 0, y: 18, duration: 0.8, delay: 0.9, ease: 'power3.out' });
        gsap.from('.hero-cta', { opacity: 0, y: 14, duration: 0.7, delay: 1.1, ease: 'power3.out' });
        gsap.from('.hero-trust', { opacity: 0, duration: 0.6, delay: 1.4 });
        gsap.from('.scroll-hint', { opacity: 0, y: -8, duration: 0.6, delay: 1.8 });

        /* Scroll indicator fade-out */
        gsap.to('.scroll-hint', {
          opacity: 0,
          scrollTrigger: { trigger: containerRef.current, start: '100px top', end: '220px top', scrub: true },
        });

        /* Problem section word-by-word via clip-path */
        gsap.utils.toArray<HTMLElement>('.prob-word').forEach((el) => {
          gsap.fromTo(el,
            { clipPath: 'inset(110% 0 0 0)', opacity: 0 },
            {
              clipPath: 'inset(0% 0 0 0)', opacity: 1,
              duration: 0.75, ease: 'expo.out',
              scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
            });
        });

        /* Pain cards */
        gsap.from('.pain-card', {
          opacity: 0, x: -28, stagger: 0.12, duration: 0.7, ease: 'power3.out',
          scrollTrigger: { trigger: '.pain-cards', start: 'top 80%', toggleActions: 'play none none none' },
        });

        /* Solution headline via clip-path */
        gsap.from('.sol-word', {
          clipPath: 'inset(110% 0 0 0)', opacity: 0, stagger: 0.05, duration: 0.9, ease: 'expo.out',
          scrollTrigger: { trigger: '.solution-section', start: 'top 80%', toggleActions: 'play none none none' },
        });

        /* Feature cards */
        const dirs = [
          { x: -50, y: -30 }, { x: 50, y: -30 },
          { x: -50, y: 30 }, { x: 50, y: 30 },
        ];
        gsap.utils.toArray<HTMLElement>('.feat-card').forEach((card, i) => {
          gsap.from(card, {
            ...dirs[i % 4], opacity: 0, duration: 0.9, ease: 'expo.out',
            scrollTrigger: { trigger: '.features-grid', start: 'top 80%', toggleActions: 'play none none none' },
            delay: i * 0.08,
          });
        });

        /* Backtesting candlesticks */
        gsap.from('.candle-body', {
          scaleY: 0, transformOrigin: 'bottom', stagger: 0.04, duration: 0.5, ease: 'power2.out',
          scrollTrigger: { trigger: '.bt-card', start: 'top 80%', toggleActions: 'play none none none' },
          delay: 0.25,
        });

        /* Dashboard headline via clip-path */
        gsap.from('.dash-headline', {
          clipPath: 'inset(110% 0 0 0)', opacity: 0, duration: 1.1, ease: 'expo.out',
          scrollTrigger: { trigger: '.dashboard-section', start: 'top 80%', toggleActions: 'play none none none' },
        });

        /* Equity curve path draw */
        const equityPath = document.querySelector<SVGPathElement>('.equity-path');
        if (equityPath) {
          const len = equityPath.getTotalLength();
          gsap.set(equityPath, { strokeDasharray: len, strokeDashoffset: len });
          gsap.to(equityPath, {
            strokeDashoffset: 0, duration: 2.2, ease: 'power2.inOut',
            scrollTrigger: { trigger: '.dashboard-section', start: 'top 70%', toggleActions: 'play none none none' },
          });
        }

        /* Final CTA via clip-path */
        gsap.from('.final-headline', {
          clipPath: 'inset(110% 0 0 0)', opacity: 0, duration: 1.2, ease: 'expo.out',
          scrollTrigger: { trigger: '.final-cta', start: 'top 80%', toggleActions: 'play none none none' },
        });
      }

      /* Counter trigger */
      ScrollTrigger.create({
        trigger: '.counters-section',
        start: 'top 80%',
        onEnter: () => {
          if (countersTriggered.current) return;
          countersTriggered.current = true;
          const duration = 2000;
          const steps = 60;
          const targets = { traders: 10000, volume: 42, winrate: 67 };
          let step = 0;
          const interval = setInterval(() => {
            step++;
            const pct = step / steps;
            const ease = 1 - Math.pow(1 - pct, 3);
            setCounters({
              traders: Math.round(targets.traders * ease),
              volume: Math.round(targets.volume * ease * 10) / 10,
              winrate: Math.round(targets.winrate * ease),
            });
            if (step >= steps) clearInterval(interval);
          }, duration / steps);
        },
      });

    }, containerRef);

    /* Mouse parallax on dashboard */
    const handleDashParallax = (e: MouseEvent) => {
      if (!dashboardRef.current) return;
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) return;
      const rect = dashboardRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const rx = ((e.clientY - cy) / window.innerHeight) * 5;
      const ry = -((e.clientX - cx) / window.innerWidth) * 5;
      gsap.to(dashboardRef.current, { rotateX: rx, rotateY: ry, duration: 0.6, ease: 'power2.out' });
    };
    window.addEventListener('mousemove', handleDashParallax);

    return () => {
      ctx.revert();
      window.removeEventListener('mousemove', handleDashParallax);
    };
  }, []);

  return (
    <div ref={containerRef} className="min-h-full overflow-x-hidden bg-[#080809]">

      {/* ─── CURSOR GLOW ─── */}
      <div
        className="pointer-events-none fixed z-[9999] rounded-full"
        style={{
          width: 480,
          height: 480,
          left: mouse.x - 240,
          top: mouse.y - 240,
          background: 'radial-gradient(circle, rgba(255,60,60,0.055) 0%, transparent 65%)',
          transition: 'left 0.12s ease-out, top 0.12s ease-out',
          willChange: 'left, top',
        }}
      />

      <style>{`
        @keyframes shimmer { from { background-position: -200% center } to { background-position: 200% center } }
        @keyframes float-widget { 0%,100% { transform: translateY(0px) } 50% { transform: translateY(-10px) } }
        @keyframes bounce-chevron { 0%,100% { transform: translateY(0) } 50% { transform: translateY(7px) } }
        @keyframes pulse-glow { 0%,100% { opacity:0.6; transform:scale(1) } 50% { opacity:1; transform:scale(1.05) } }
        @keyframes ticker-left { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes ticker-right { from { transform: translateX(-50%) } to { transform: translateX(0) } }
        @keyframes eq-draw { from { stroke-dashoffset: 320 } to { stroke-dashoffset: 0 } }
        @keyframes grain {
          0%,100% { transform: translate(0,0) }
          10% { transform: translate(-1%,-2%) }
          20% { transform: translate(2%,1%) }
          30% { transform: translate(-2%,2%) }
          40% { transform: translate(1%,-1%) }
          50% { transform: translate(-1%,2%) }
          60% { transform: translate(2%,-2%) }
          70% { transform: translate(-2%,1%) }
          80% { transform: translate(1%,2%) }
          90% { transform: translate(-1%,-1%) }
        }
        @keyframes card-shimmer-kf {
          from { transform: translateX(-120%) skewX(-15deg); }
          to { transform: translateX(320%) skewX(-15deg); }
        }
        .shimmer-btn:hover { animation: shimmer 1.5s linear infinite; }
        .widget-float { animation: float-widget 3s ease-in-out infinite; }
        .grain-overlay {
          position: fixed; inset: -50%; width: 200%; height: 200%;
          pointer-events: none; z-index: 1; opacity: 0.028;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-size: 180px 180px;
          animation: grain 0.8s steps(1) infinite;
        }
        .rs-hairline { border: none; border-top: 1px solid rgba(255,255,255,0.045); margin: 0; }
        .feat-card { position: relative; }
        .feat-card::after {
          content: '';
          position: absolute;
          inset: 0;
          width: 40%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
          transform: translateX(-120%) skewX(-15deg);
          pointer-events: none;
          border-radius: inherit;
        }
        .feat-card:hover::after { animation: card-shimmer-kf 0.6s ease forwards; }
        .pain-card { position: relative; overflow: hidden; }
        .pain-card::after {
          content: '';
          position: absolute;
          inset: 0;
          width: 40%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent);
          transform: translateX(-120%) skewX(-15deg);
          pointer-events: none;
          border-radius: inherit;
        }
        .pain-card:hover::after { animation: card-shimmer-kf 0.55s ease forwards; }
      `}</style>

      {/* Grain texture overlay */}
      <div className="grain-overlay" />

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex flex-col justify-center px-6 pt-24 pb-20 lg:px-16 overflow-hidden">
        {/* Dot grid */}
        <div className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.10) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
            maskImage: 'radial-gradient(ellipse 75% 75% at 50% 50%, black 30%, transparent 100%)',
          }} />

        {/* Ambient glow blobs — replacing particles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute" style={{ top: '15%', left: '10%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(255,60,60,0.06) 0%, transparent 70%)', filter: 'blur(48px)', animation: 'float-widget 7s ease-in-out infinite' }} />
          <div className="absolute" style={{ top: '40%', right: '8%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(255,140,0,0.05) 0%, transparent 70%)', filter: 'blur(56px)', animation: 'float-widget 9s ease-in-out infinite reverse' }} />
          <div className="absolute" style={{ bottom: '20%', left: '50%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(255,60,60,0.04) 0%, transparent 70%)', filter: 'blur(40px)', animation: 'float-widget 6s ease-in-out infinite 2s' }} />
        </div>

        {/* Red center glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[55vw] w-[55vw] rounded-full"
            style={{
              background: 'radial-gradient(ellipse, rgba(255,60,60,0.10) 0%, transparent 70%)',
              animation: 'pulse-glow 4.5s ease-in-out infinite',
            }} />
        </div>

        <div className="relative max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-12 lg:flex-row lg:items-center">

            {/* LEFT 60% */}
            <div className="lg:w-[60%]">
              {/* Tag badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-mono font-bold uppercase tracking-[0.2em]"
                style={{ background: 'rgba(255,60,60,0.08)', border: '1px solid rgba(255,60,60,0.2)', color: '#ff3c3c' }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#ff3c3c', boxShadow: '0 0 6px #ff3c3c' }} />
                Risk management platform
              </div>

              <h1 className="font-black leading-[0.9] tracking-[-0.05em] text-white"
                style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)', fontSize: 'clamp(76px, 9.5vw, 116px)' }}>
                {['Trade', 'with'].map((w, i) => (
                  <span key={i} className="inline-block overflow-hidden mr-[0.2em]" style={{ verticalAlign: 'bottom' }}>
                    <span className="hw inline-block">{w}</span>
                  </span>
                ))}
                <br />
                <span className="inline-block overflow-hidden" style={{ verticalAlign: 'bottom' }}>
                  <span className="hw inline-block">discipline.</span>
                </span>
              </h1>
              <h2 className="font-black leading-[0.9] tracking-[-0.04em] mt-2"
                style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)', fontSize: 'clamp(50px, 6.5vw, 76px)' }}>
                {['Protect', 'your'].map((w, i) => (
                  <span key={i} className="inline-block overflow-hidden mr-[0.2em] text-white" style={{ verticalAlign: 'bottom' }}>
                    <span className="hw inline-block">{w}</span>
                  </span>
                ))}
                <br />
                <span className="inline-block overflow-hidden" style={{ verticalAlign: 'bottom' }}>
                  <span className="hw inline-block bg-clip-text text-transparent"
                    style={{ backgroundImage: 'linear-gradient(135deg, #ff3c3c, #ff8c00)' }}>
                    capital.
                  </span>
                </span>
              </h2>

              <p className="hero-sub mt-7 max-w-md text-[#94a3b8]"
                style={{ fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)', fontSize: '13px', lineHeight: '1.8' }}>
                The risk management platform for serious traders.
              </p>

              <div className="hero-cta mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/signup"
                  className="shimmer-btn group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl px-8 py-4 text-sm font-bold text-black transition-all hover:scale-[1.03]"
                  style={{ ...shimmerStyle, backgroundSize: '200% auto', boxShadow: '0 0 40px rgba(255,60,60,0.3)' }}>
                  <span className="pointer-events-none absolute inset-0"
                    style={{
                      background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.22) 50%, transparent 70%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 2.4s infinite linear',
                    }} />
                  Start free trial
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/mock/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border px-8 py-4 text-sm font-medium text-slate-300 transition-all hover:text-white hover:scale-[1.02]"
                  style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                  Watch demo
                </Link>
              </div>

              <p className="hero-trust mt-5 text-xs text-[#94a3b8]"
                style={{ fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)' }}>
                7-day trial · No card required · Cancel anytime
              </p>
            </div>

            {/* RIGHT 40% — hero widget */}
            <div className="hidden md:flex lg:w-[40%] items-center justify-center relative">
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-96 w-96 rounded-full"
                  style={{ background: 'radial-gradient(ellipse, rgba(255,60,60,0.13) 0%, rgba(255,140,0,0.06) 40%, transparent 70%)', filter: 'blur(24px)' }} />
              </div>
              <div className="widget-float relative rounded-[22px] p-6 w-72"
                style={{
                  background: 'rgba(12,12,16,0.85)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  backdropFilter: 'blur(24px)',
                  boxShadow: '0 32px 80px rgba(0,0,0,0.55), 0 0 0 0.5px rgba(255,255,255,0.04) inset',
                }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Balance</p>
                    <p className="text-2xl font-black text-white mt-0.5"
                      style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)' }}>€12,450</p>
                  </div>
                  <div className="rounded-full px-2.5 py-1 text-xs font-mono font-bold"
                    style={{ background: 'rgba(0,230,118,0.12)', color: '#00e676', border: '1px solid rgba(0,230,118,0.25)' }}>
                    +€312.50
                  </div>
                </div>
                {/* Mini equity curve */}
                <svg viewBox="0 0 240 70" className="w-full mb-4" fill="none">
                  <defs>
                    <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ff3c3c" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#ff3c3c" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,65 L24,58 L48,52 L72,44 L96,36 L120,28 L144,20 L168,14 L192,8 L216,5 L240,2"
                    stroke="#ff3c3c" strokeWidth="2" strokeLinecap="round"
                    style={{ strokeDasharray: 320, strokeDashoffset: 0, animation: 'eq-draw 2s ease-out 1.4s both' }} />
                  <path d="M0,65 L24,58 L48,52 L72,44 L96,36 L120,28 L144,20 L168,14 L192,8 L216,5 L240,2 L240,70 L0,70Z"
                    fill="url(#wGrad)" />
                  <circle cx="240" cy="2" r="3" fill="#ff3c3c" style={{ filter: 'drop-shadow(0 0 4px #ff3c3c)' }} />
                </svg>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl p-3 text-center"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="text-xl font-black" style={{ color: '#00e676', fontFamily: 'var(--font-display, "Syne", sans-serif)' }}>68.4%</p>
                    <p className="text-[10px] font-mono text-slate-500 mt-0.5">Win Rate</p>
                  </div>
                  <div className="rounded-xl p-3 text-center"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="text-xl font-black text-white" style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)' }}>2.31</p>
                    <p className="text-[10px] font-mono text-slate-500 mt-0.5">Profit Factor</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="scroll-hint absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-slate-500">scroll</span>
          <ChevronDown className="h-5 w-5 text-slate-500" style={{ animation: 'bounce-chevron 1.8s ease-in-out infinite' }} />
        </div>
      </section>

      <hr className="rs-hairline" />

      {/* ─── TICKER ─── */}
      <div className="overflow-hidden py-5" style={{ background: 'rgba(255,255,255,0.015)' }}>
        {/* Row 1 → */}
        <div className="flex mb-3" style={{ overflow: 'hidden' }}>
          <div className="flex whitespace-nowrap" style={{ animation: 'ticker-left 22s linear infinite', width: 'max-content' }}>
            {[...Array(2)].map((_, rep) => (
              <div key={rep} className="flex">
                {['68.4% Win Rate', '€12,450 Balance', '2.31 Profit Factor', '94 Trades Logged', '4.2% Max DD', '1.92 Avg R:R'].map((item, j) => (
                  <span key={j} className="mx-8 text-[11px] font-mono uppercase tracking-[0.18em] text-slate-600">
                    {item} <span className="text-slate-800 mx-2">·</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
        {/* Row 2 ← */}
        <div className="flex" style={{ overflow: 'hidden' }}>
          <div className="flex whitespace-nowrap" style={{ animation: 'ticker-right 26s linear infinite', width: 'max-content', transform: 'translateX(-50%)' }}>
            {[...Array(2)].map((_, rep) => (
              <div key={rep} className="flex">
                {['Risk Manager', 'AI Coach', 'Backtesting Lab', 'Trading Journal', 'Live Alerts', 'Prop Firm Ready'].map((item, j) => (
                  <span key={j} className="mx-8 text-[11px] font-mono uppercase tracking-[0.18em]"
                    style={{ color: '#ff3c3c', opacity: 0.5 }}>
                    {item} <span className="text-slate-800 mx-2">·</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <hr className="rs-hairline" />

      {/* ─── PROBLEM ─── */}
      <section className="py-36 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto flex flex-col gap-16 lg:flex-row lg:items-start lg:gap-24">
          {/* Left — word-by-word */}
          <div className="lg:w-1/2">
            {[
              { text: "Most traders don't fail because of bad setups.", color: 'text-white' },
              { text: "They fail because they have no system.", color: 'text-[#94a3b8]' },
              { text: "No limits. No data. No discipline.", color: 'text-[#ff3c3c]' },
            ].map((line, li) => (
              <p key={li} className={`font-black leading-tight mb-4 ${line.color}`}
                style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)', fontSize: 'clamp(2rem, 4.2vw, 3.8rem)', letterSpacing: '-0.03em' }}>
                {line.text.split(' ').map((word, wi) => (
                  <span key={wi} className="inline-block overflow-hidden mr-[0.2em]" style={{ verticalAlign: 'bottom' }}>
                    <span className="prob-word inline-block">{word}</span>
                  </span>
                ))}
              </p>
            ))}
          </div>

          {/* Right — pain cards */}
          <div className="pain-cards lg:w-1/2 flex flex-col gap-4">
            {[
              { icon: <Shield className="h-5 w-5" />, title: 'No daily loss limit', desc: 'You keep trading after blowing your risk budget — and one bad day erases a week of gains.' },
              { icon: <Zap className="h-5 w-5" />, title: 'Revenge trading spiral', desc: "A loss triggers panic. You size up. You lose again. The spiral starts and you can't stop it." },
              { icon: <BookOpen className="h-5 w-5" />, title: 'No performance data', desc: "You have no idea which setups actually work for you. You're trading on gut feeling — not edge." },
            ].map((card, i) => (
              <motion.div
                key={i}
                className="pain-card rounded-[20px] p-6"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderLeft: '2px solid rgba(255,60,60,0.6)',
                }}
                whileHover={{
                  x: 5,
                  boxShadow: '0 0 36px rgba(255,60,60,0.10)',
                  transition: { type: 'spring', stiffness: 400, damping: 26 },
                }}>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: 'rgba(255,60,60,0.08)', color: '#ff3c3c' }}>
                    {card.icon}
                  </div>
                  <div>
                    <h3 className="font-black text-white mb-1" style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)' }}>
                      {card.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed" style={{ fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)' }}>
                      {card.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <hr className="rs-hairline" />

      {/* ─── SOLUTION / FEATURES ─── */}
      <section id="features" className="solution-section py-36 px-6 lg:px-16" style={{ background: '#060607' }}>
        <div className="max-w-7xl mx-auto">
          {/* Headline */}
          <div className="mb-20 overflow-hidden">
            <h2 className="font-black leading-[0.95] tracking-[-0.03em] text-white"
              style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)', fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>
              {'RiskSent gives you the infrastructure'.split(' ').map((w, i) => (
                <span key={i} className="inline-block overflow-hidden mr-[0.25em]" style={{ verticalAlign: 'bottom' }}>
                  <span className="sol-word inline-block">{w}</span>
                </span>
              ))}
              <br />
              {'to trade like a pro.'.split(' ').map((w, i) => (
                <span key={i} className="inline-block overflow-hidden mr-[0.25em]" style={{ verticalAlign: 'bottom' }}>
                  <span className="sol-word inline-block bg-clip-text text-transparent"
                    style={{ backgroundImage: 'linear-gradient(135deg, #ff3c3c, #ff8c00)' }}>{w}</span>
                </span>
              ))}
            </h2>
          </div>

          {/* 2x2 feature grid */}
          <div className="features-grid grid gap-5 md:grid-cols-2">

            {/* RISK MANAGER */}
            <motion.div className="feat-card group relative overflow-hidden rounded-[22px] p-8 cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
              whileHover={{ y: -6, boxShadow: '0 0 48px rgba(255,60,60,0.16)', transition: { type: 'spring', stiffness: 380, damping: 28 } }}>
              <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(255,60,60,0.10) 0%, transparent 70%)' }} />
              <div className="relative mb-6 flex justify-center">
                <svg viewBox="0 0 120 70" className="w-32 h-20">
                  <path d="M 15 60 A 45 45 0 0 1 105 60" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" strokeLinecap="round" />
                  <path d="M 15 60 A 45 45 0 0 1 105 60" fill="none" stroke="#ff3c3c" strokeWidth="7" strokeLinecap="round"
                    strokeDasharray="99 141" style={{ filter: 'drop-shadow(0 0 8px #ff3c3c)' }} />
                  <line x1="60" y1="60" x2="60" y2="22" stroke="#ff3c3c" strokeWidth="2.5" strokeLinecap="round"
                    style={{ transformOrigin: '60px 60px', transform: 'rotate(15deg)' }} />
                  <circle cx="60" cy="60" r="4" fill="#ff3c3c" />
                </svg>
              </div>
              <h3 className="font-black text-white text-lg mb-2" style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)' }}>
                Set hard limits. Get alerts. Never blow an account again.
              </h3>
              <p className="text-xs text-slate-500 font-mono">Max DD 4.2% · 5 active rules · 3 alerts today</p>
            </motion.div>

            {/* BACKTESTING LAB */}
            <motion.div className="bt-card feat-card group relative overflow-hidden rounded-[22px] p-8 cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
              whileHover={{ y: -6, boxShadow: '0 0 48px rgba(34,211,238,0.12)', transition: { type: 'spring', stiffness: 380, damping: 28 } }}>
              <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(34,211,238,0.08) 0%, transparent 70%)' }} />
              <div className="relative mb-6 flex items-end justify-center gap-1.5 h-20">
                {[
                  { h: 30, bull: false }, { h: 45, bull: true }, { h: 25, bull: true },
                  { h: 50, bull: false }, { h: 40, bull: true }, { h: 55, bull: true },
                  { h: 35, bull: false }, { h: 60, bull: true }, { h: 50, bull: true },
                  { h: 42, bull: false }, { h: 65, bull: true }, { h: 58, bull: true },
                ].map((c, i) => (
                  <div key={i} className="flex flex-col items-center gap-0.5">
                    <div className="w-0.5 h-2 rounded-full opacity-50" style={{ background: c.bull ? '#00e676' : '#ff3c3c' }} />
                    <div className="candle-body w-4 rounded-sm"
                      style={{ height: `${c.h}%`, background: c.bull ? '#00e676' : '#ff3c3c', opacity: 0.8, minHeight: 6 }} />
                    <div className="w-0.5 h-2 rounded-full opacity-50" style={{ background: c.bull ? '#00e676' : '#ff3c3c' }} />
                  </div>
                ))}
              </div>
              <h3 className="font-black text-white text-lg mb-2" style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)' }}>
                Replay any market. Know your edge before you risk it.
              </h3>
              <p className="text-xs text-slate-500 font-mono">847 candles · 71% WR · +18.4% return</p>
            </motion.div>

            {/* TRADING JOURNAL */}
            <motion.div className="feat-card group relative overflow-hidden rounded-[22px] p-8 cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
              whileHover={{ y: -6, boxShadow: '0 0 48px rgba(0,230,118,0.12)', transition: { type: 'spring', stiffness: 380, damping: 28 } }}>
              <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(0,230,118,0.08) 0%, transparent 70%)' }} />
              <div className="relative mb-5">
                <div className="flex gap-1 mb-1">
                  {['M','T','W','T','F','S','S'].map((d,i) => (
                    <div key={i} className="flex-1 text-center text-[8px] font-mono text-slate-600">{d}</div>
                  ))}
                </div>
                <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                  {[
                    { v: 0.6, pnl: '+€124' }, { v: 0.3, pnl: '+€67' }, { v: 0, pnl: null }, { v: -0.4, pnl: '-€85' }, { v: 0.8, pnl: '+€312' }, { v: 0, pnl: null }, { v: 0, pnl: null },
                    { v: 0, pnl: null }, { v: 0.5, pnl: '+€98' }, { v: -0.3, pnl: '-€45' }, { v: 0.7, pnl: '+€210' }, { v: 0, pnl: null }, { v: 0.4, pnl: '+€89' }, { v: 0, pnl: null },
                    { v: -0.2, pnl: '-€28' }, { v: 0, pnl: null }, { v: 0.3, pnl: '+€54' }, { v: 0, pnl: null }, { v: 0.5, pnl: '+€143' }, { v: -0.5, pnl: '-€112' }, { v: 0, pnl: null },
                    { v: 0.7, pnl: '+€195' }, { v: 0.4, pnl: '+€76' }, { v: 0, pnl: null }, { v: 0.6, pnl: '+€167' }, { v: 0, pnl: null }, { v: -0.3, pnl: '-€52' }, { v: 0, pnl: null },
                    { v: 0, pnl: null }, { v: 0.9, pnl: '+€420' }, { v: 0.3, pnl: '+€61' }, { v: 0, pnl: null }, { v: 0.7, pnl: '+€234' }, { v: 0.2, pnl: '+€38' }, { v: 0, pnl: null },
                  ].map((cell, i) => (
                    <motion.div key={i} className="relative aspect-square rounded-md group"
                      style={{ background: cell.v > 0 ? `rgba(0,230,118,${cell.v * 0.8})` : cell.v < 0 ? `rgba(255,60,60,${Math.abs(cell.v) * 0.65})` : 'rgba(255,255,255,0.035)' }}
                      whileHover={{ scale: 1.2, zIndex: 10, transition: { type: 'spring', stiffness: 500 } }}>
                      {cell.pnl && (
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:flex whitespace-nowrap rounded px-1.5 py-0.5 text-[8px] font-mono font-bold z-10"
                          style={{ background: '#1a1a1f', border: '1px solid rgba(255,255,255,0.08)', color: cell.v > 0 ? '#00e676' : '#ff3c3c' }}>
                          {cell.pnl}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
                <div className="mt-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[9px] font-mono text-slate-600">
                    <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm" style={{ background: 'rgba(0,230,118,0.7)' }} />Win</span>
                    <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm" style={{ background: 'rgba(255,60,60,0.6)' }} />Loss</span>
                  </div>
                  <span className="text-[9px] font-mono" style={{ color: '#00e676' }}>Best: +€420</span>
                </div>
              </div>
              <h3 className="font-black text-white text-lg mb-2" style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)' }}>
                Log every trade. Find patterns. Fix your weaknesses.
              </h3>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-mono text-slate-500">30 trades</span>
                <span className="text-slate-700">·</span>
                <span className="text-xs font-mono" style={{ color: '#00e676' }}>Best +€420</span>
                <span className="text-slate-700">·</span>
                <span className="text-xs font-mono" style={{ color: '#ff3c3c' }}>Worst -€112</span>
                <span className="text-slate-700">·</span>
                <span className="text-xs font-mono text-slate-500">Score 82%</span>
              </div>
            </motion.div>

            {/* AI COACH */}
            <motion.div className="feat-card group relative overflow-hidden rounded-[22px] p-8 cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
              whileHover={{ y: -6, boxShadow: '0 0 48px rgba(129,140,248,0.12)', transition: { type: 'spring', stiffness: 380, damping: 28 } }}>
              <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(129,140,248,0.08) 0%, transparent 70%)' }} />
              <div className="relative mb-5 space-y-2">
                <div className="rounded-xl p-3" style={{ background: 'rgba(129,140,248,0.07)', border: '1px solid rgba(129,140,248,0.12)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-slate-400">Weekly Score</span>
                    <span className="text-sm font-black" style={{ color: '#818cf8', fontFamily: 'var(--font-display)' }}>74/100</span>
                  </div>
                  {[
                    { label: 'Consistency', val: 82, color: '#00e676' },
                    { label: 'Risk Discipline', val: 91, color: '#00e676' },
                    { label: 'Execution', val: 67, color: '#ff8c00' },
                  ].map((m) => (
                    <div key={m.label} className="mb-1.5">
                      <div className="flex justify-between text-[9px] font-mono mb-0.5">
                        <span className="text-slate-500">{m.label}</span>
                        <span style={{ color: m.color }}>{m.val}%</span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <div className="h-full rounded-full" style={{ width: `${m.val}%`, background: m.color }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-start gap-2 rounded-xl px-3 py-2.5"
                  style={{ background: 'rgba(129,140,248,0.07)', border: '1px solid rgba(129,140,248,0.15)' }}>
                  <div className="h-1.5 w-1.5 rounded-full mt-1 shrink-0" style={{ background: '#818cf8' }} />
                  <span className="text-[10px] font-mono" style={{ color: '#c4b5fd' }}>🔁 Revenge trading detected — 3 trades in 8 min after loss</span>
                </div>
                <div className="flex items-start gap-2 rounded-xl px-3 py-2.5"
                  style={{ background: 'rgba(255,140,0,0.06)', border: '1px solid rgba(255,140,0,0.15)' }}>
                  <div className="h-1.5 w-1.5 rounded-full mt-1 shrink-0" style={{ background: '#ff8c00' }} />
                  <span className="text-[10px] font-mono text-orange-300">🎯 FTMO ready: 74/100 — reduce consecutive losses to pass</span>
                </div>
              </div>
              <h3 className="font-black text-white text-lg mb-2" style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)' }}>
                Your personal analyst. Pattern detection. Prop firm readiness.
              </h3>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-mono text-slate-500">Score 74/100</span>
                <span className="text-slate-700">·</span>
                <span className="text-xs font-mono" style={{ color: '#818cf8' }}>3 patterns found</span>
                <span className="text-slate-700">·</span>
                <span className="text-xs font-mono" style={{ color: '#00e676' }}>FTMO ready</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <hr className="rs-hairline" />

      {/* ─── AI COACH SECTION ─── */}
      <section className="py-36 px-6 lg:px-16 relative overflow-hidden" style={{ background: '#060607' }}>
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 55% 45% at 50% 50%, rgba(129,140,248,0.05) 0%, transparent 70%)' }} />

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-slate-500 mb-4">AI Coach</p>
            <h2 className="font-black leading-[0.95] tracking-[-0.03em] text-white"
              style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)', fontSize: 'clamp(2rem,4.5vw,3.8rem)' }}>
              Your personal trading analyst.<br />
              <span style={{ color: '#818cf8' }}>Available 24/7.</span>
            </h2>
            <p className="mt-5 max-w-lg mx-auto text-slate-400" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: '1.9' }}>
              Pattern detection, performance scoring, emotional bias analysis, prop firm readiness. All automated.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 items-center">
            {/* Left: chat preview */}
            <motion.div
              initial={{ opacity: 0, x: -36 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0 }}
              transition={{ duration: 0.7, ease: [0.22,1,0.36,1] }}
              className="rounded-[24px] overflow-hidden"
              style={{ background: '#0d0d11', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}
            >
              <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                <div className="flex h-9 w-9 items-center justify-center rounded-full text-white font-bold text-sm"
                  style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)' }}>AI</div>
                <div>
                  <p className="text-sm font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>RiskSent AI Coach</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="h-1.5 w-1.5 rounded-full" style={{ background: '#00e676', animation: 'pulse 2s infinite' }} />
                    <p className="text-[10px] font-mono text-slate-500">analyzing your trades...</p>
                  </div>
                </div>
                <div className="ml-auto rounded-full px-2 py-0.5 text-[9px] font-mono font-bold uppercase"
                  style={{ color: '#818cf8', background: 'rgba(129,140,248,0.10)', border: '1px solid rgba(129,140,248,0.2)' }}>
                  Score 74/100
                </div>
              </div>
              <div className="p-5 space-y-4 min-h-72">
                {[
                  { ai: true, text: '📊 Weekly report ready. Your win rate improved +3.2% to 68.4%. Best session: London Open.', delay: 0 },
                  { ai: false, text: 'Why do I lose more on Fridays?', delay: 0.15 },
                  { ai: true, text: '🔍 Detected: on Fridays you enter 2.3x more trades near end-of-day. Your Friday avg R:R is 0.8 vs 1.92 weekly avg. Recommendation: stop trading after 3pm on Fridays.', delay: 0.3 },
                  { ai: false, text: 'Am I ready for FTMO?', delay: 0.45 },
                  { ai: true, text: '✅ FTMO Readiness: 74/100. Strengths: consistency, risk per trade. To improve: reduce consecutive losses (currently 2.1 avg vs 1.5 FTMO standard).', delay: 0.6 },
                ].map((msg, i) => (
                  <motion.div key={i}
                    className={`flex ${msg.ai ? 'justify-start' : 'justify-end'}`}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0 }}
                    transition={{ duration: 0.4, delay: msg.delay }}
                  >
                    <div className="max-w-[85%] rounded-2xl px-4 py-3"
                      style={{
                        background: msg.ai ? 'rgba(129,140,248,0.07)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${msg.ai ? 'rgba(129,140,248,0.16)' : 'rgba(255,255,255,0.07)'}`,
                        borderBottomLeftRadius: msg.ai ? 4 : undefined,
                        borderBottomRightRadius: !msg.ai ? 4 : undefined,
                      }}>
                      <p className="text-xs font-mono leading-relaxed" style={{ color: msg.ai ? '#c4b5fd' : '#e2e8f0' }}>{msg.text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right: feature list */}
            <div className="flex flex-col gap-5">
              {[
                { icon: '🧠', color: '#818cf8', title: 'Pattern Detection', desc: 'Identifies revenge trading, overtrading, FOMO entries and other behavioral patterns automatically from your trade history.' },
                { icon: '📈', color: '#00e676', title: 'Performance Scoring', desc: 'Weekly score across 12 metrics: consistency, discipline, risk management, execution quality. Track your progress over time.' },
                { icon: '🎯', color: '#ff8c00', title: 'Prop Firm Readiness', desc: "FTMO, MyForexFunds, The5%ers — the AI benchmarks your stats against each firm's requirements and tells you what to fix." },
                { icon: '💬', color: '#22d3ee', title: 'Weekly Reports', desc: 'Automated deep-dive report every Sunday: best sessions, worst mistakes, P&L breakdown, actionable improvements.' },
              ].map((feat, i) => (
                <motion.div key={i}
                  className="flex items-start gap-4 rounded-[18px] p-5"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                  initial={{ opacity: 0, x: 36 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0 }}
                  transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22,1,0.36,1] }}
                  whileHover={{ x: 4, boxShadow: `0 8px 32px ${feat.color}14`, transition: { duration: 0.2 } }}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl text-xl flex-shrink-0"
                    style={{ background: `${feat.color}10`, border: `1px solid ${feat.color}20` }}>
                    {feat.icon}
                  </div>
                  <div>
                    <p className="font-black text-white mb-1" style={{ fontFamily: 'var(--font-display)', fontSize: '15px' }}>{feat.title}</p>
                    <p className="text-xs font-mono text-slate-400 leading-relaxed">{feat.desc}</p>
                  </div>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-2"
              >
                <Link href="/ai-coach"
                  className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-white transition-all hover:scale-[1.03]"
                  style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)', boxShadow: '0 0 28px rgba(129,140,248,0.22)' }}>
                  Explore AI Coach
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <hr className="rs-hairline" />

      {/* ─── DASHBOARD PREVIEW ─── */}
      <section className="dashboard-section py-36 px-6 lg:px-16 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 text-center overflow-hidden">
            <h2 className="dash-headline font-black text-white tracking-[-0.03em]"
              style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)', fontSize: 'clamp(2.5rem, 5vw, 5rem)' }}>
              Everything in one place.
            </h2>
          </div>

          <div className="relative">
            {/* Ambient glows */}
            <div className="pointer-events-none absolute -left-16 top-1/4 h-72 w-72 rounded-full"
              style={{ background: 'radial-gradient(ellipse, rgba(255,60,60,0.09) 0%, transparent 70%)', filter: 'blur(48px)' }} />
            <div className="pointer-events-none absolute -right-16 bottom-1/4 h-72 w-72 rounded-full"
              style={{ background: 'radial-gradient(ellipse, rgba(255,140,0,0.07) 0%, transparent 70%)', filter: 'blur(48px)' }} />

            {/* Dashboard mockup */}
            <div ref={dashboardRef} className="relative rounded-[22px] overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.015)',
                border: '1px solid rgba(255,255,255,0.06)',
                transformStyle: 'preserve-3d',
                perspective: '1400px',
              }}>
              {/* Window chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b"
                style={{ background: 'rgba(255,255,255,0.015)', borderColor: 'rgba(255,255,255,0.05)' }}>
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full" style={{ background: '#ff5f57' }} />
                  <div className="h-3 w-3 rounded-full" style={{ background: '#febc2e' }} />
                  <div className="h-3 w-3 rounded-full" style={{ background: '#28c840' }} />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="rounded-md px-4 py-1 text-[10px] font-mono text-slate-500"
                    style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    app.risksent.io/dashboard
                  </div>
                </div>
              </div>

              <div className="flex">
                {/* Sidebar */}
                <div className="hidden md:flex w-48 flex-col gap-1 p-4 border-r"
                  style={{ background: 'rgba(0,0,0,0.18)', borderColor: 'rgba(255,255,255,0.04)', minHeight: 400 }}>
                  <p className="text-sm font-black text-white mb-4" style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)' }}>
                    RiskSent
                  </p>
                  {[
                    { icon: '⚡', label: 'Dashboard', active: true },
                    { icon: '📊', label: 'Journal', active: false },
                    { icon: '🛡️', label: 'Risk Manager', active: false },
                    { icon: '🔬', label: 'Backtesting', active: false },
                    { icon: '🤖', label: 'AI Coach', active: false },
                  ].map((nav, i) => (
                    <div key={i} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-mono cursor-pointer"
                      style={{
                        background: nav.active ? 'rgba(255,60,60,0.10)' : 'transparent',
                        color: nav.active ? '#ff3c3c' : '#94a3b8',
                        border: nav.active ? '1px solid rgba(255,60,60,0.18)' : '1px solid transparent',
                      }}>
                      <span>{nav.icon}</span> {nav.label}
                    </div>
                  ))}
                </div>

                {/* Main */}
                <div className="flex-1 p-6">
                  <div className="grid grid-cols-2 gap-3 mb-6 lg:grid-cols-4">
                    {[
                      { label: 'Balance', val: '€12,450', color: '#fff' },
                      { label: 'Daily P&L', val: '+€312.50', color: '#00e676' },
                      { label: 'Win Rate', val: '68.4%', color: '#22d3ee' },
                      { label: 'Profit Factor', val: '2.31', color: '#818cf8' },
                    ].map((m, i) => (
                      <div key={i} className="rounded-xl p-4"
                        style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">{m.label}</p>
                        <p className="text-lg font-black mt-1" style={{ color: m.color, fontFamily: 'var(--font-display, "Syne", sans-serif)' }}>{m.val}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl p-4 mb-4"
                    style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.045)' }}>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-3">Equity curve · 3 months</p>
                    <svg viewBox="0 0 500 100" className="w-full h-24" fill="none">
                      <defs>
                        <linearGradient id="dashGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ff3c3c" stopOpacity="0.22" />
                          <stop offset="100%" stopColor="#ff3c3c" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path className="equity-path"
                        d="M0,90 L25,85 L50,80 L75,75 L100,72 L125,68 L150,62 L175,58 L200,54 L225,50 L250,44 L275,40 L300,36 L325,30 L350,25 L375,20 L400,16 L425,12 L450,9 L475,6 L500,4"
                        stroke="#ff3c3c" strokeWidth="2.5" strokeLinecap="round" />
                      <path d="M0,90 L25,85 L50,80 L75,75 L100,72 L125,68 L150,62 L175,58 L200,54 L225,50 L250,44 L275,40 L300,36 L325,30 L350,25 L375,20 L400,16 L425,12 L450,9 L475,6 L500,4 L500,100 L0,100Z"
                        fill="url(#dashGrad)" />
                    </svg>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3 lg:grid-cols-3">
                    {[
                      { label: 'Daily DD', val: '1.1%', limit: '2.0%', pct: 0.55, color: '#00e676' },
                      { label: 'Max DD', val: '4.2%', limit: '8.0%', pct: 0.525, color: '#00e676' },
                    ].map((g, i) => (
                      <div key={i} className="rounded-xl p-3 flex flex-col items-center"
                        style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.045)' }}>
                        <p className="text-[9px] font-mono uppercase tracking-widest text-slate-500 mb-2">{g.label}</p>
                        <svg viewBox="0 0 80 45" className="w-20 h-12">
                          <path d="M 8 40 A 32 32 0 0 1 72 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" strokeLinecap="round" />
                          <path d="M 8 40 A 32 32 0 0 1 72 40" fill="none" stroke={g.color} strokeWidth="6" strokeLinecap="round"
                            strokeDasharray={`${g.pct * 100} 100`} style={{ filter: `drop-shadow(0 0 4px ${g.color})` }} />
                        </svg>
                        <p className="text-sm font-black font-mono" style={{ color: g.color }}>{g.val}</p>
                        <p className="text-[9px] font-mono text-slate-600">limit {g.limit}</p>
                      </div>
                    ))}
                    <div className="hidden lg:flex rounded-xl p-3 flex-col justify-center col-span-1"
                      style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.045)' }}>
                      <p className="text-[9px] font-mono uppercase tracking-widest text-slate-500 mb-1">Open Trades</p>
                      <p className="text-2xl font-black text-white" style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)' }}>2/3</p>
                      <p className="text-[9px] font-mono text-slate-600 mt-1">max 3 open</p>
                    </div>
                  </div>

                  <div className="rounded-xl px-4 py-3 flex items-center gap-3"
                    style={{ background: 'rgba(255,140,0,0.06)', border: '1px solid rgba(255,140,0,0.2)' }}>
                    <span className="text-base">⚡</span>
                    <p className="text-xs font-mono text-orange-300">Daily loss limit approaching — €180 remaining</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="rs-hairline" />

      {/* ─── COUNTERS + TESTIMONIALS ─── */}
      <section className="counters-section py-36 px-6 lg:px-16" style={{ background: '#060607' }}>
        <div className="max-w-7xl mx-auto">
          {/* Counters */}
          <div className="grid grid-cols-3 gap-8 mb-24 text-center">
            {[
              { val: `${counters.traders.toLocaleString()}+`, label: 'Active Traders' },
              { val: `€${counters.volume}M+`, label: 'Volume Tracked' },
              { val: `${counters.winrate}%`, label: 'Avg Improvement' },
            ].map((c, i) => (
              <div key={i}>
                <p className="font-black bg-clip-text text-transparent"
                  style={{
                    fontFamily: 'var(--font-display, "Syne", sans-serif)',
                    fontSize: 'clamp(2.5rem, 6vw, 5rem)',
                    backgroundImage: 'linear-gradient(135deg, #ff3c3c, #ff8c00)',
                  }}>
                  {c.val}
                </p>
                <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mt-1">{c.label}</p>
              </div>
            ))}
          </div>

          {/* Testimonials */}
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { name: 'Luca M.', role: 'FTMO Trader', text: 'I dropped 3 tools after moving to RiskSent. Everything I need is in one place now. My drawdown is half what it was.', avatar: 'L', color: '#22d3ee', delay: 0 },
              { name: 'Sara K.', role: 'Swing Trader', text: 'The AI Coach caught my revenge trading pattern before I even realized I had it. This thing paid for itself in week one.', avatar: 'S', color: '#00e676', delay: 0.1 },
              { name: 'Marco T.', role: 'Prop Firm Coach', text: "My traders' rule compliance went from 58% to 91% after switching to RiskSent. The live alerts are non-negotiable now.", avatar: 'M', color: '#ff3c3c', delay: 0.2 },
            ].map((t, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0 }}
                transition={{ duration: 0.7, delay: t.delay }}
                whileHover={{ y: -5, transition: { type: 'spring', stiffness: 380, damping: 26 } }}
                className="relative rounded-[20px] p-7"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                {/* Decorative quote mark */}
                <div className="absolute top-4 left-5 font-black select-none pointer-events-none leading-none"
                  style={{ fontSize: '7rem', color: '#fff', opacity: 0.035, fontFamily: 'Georgia, serif', lineHeight: 1 }}>&ldquo;</div>
                <p className="text-sm text-slate-300 leading-relaxed mb-6 relative z-10">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-black"
                    style={{ background: t.color }}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <hr className="rs-hairline" />

      {/* ─── FINAL CTA ─── */}
      <section className="final-cta relative min-h-screen flex items-center justify-center px-6 py-36 overflow-hidden">
        {/* Pulsing glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[75vw] w-[75vw] max-h-[580px] max-w-[580px] rounded-full"
            style={{
              background: 'radial-gradient(ellipse, rgba(255,60,60,0.14) 0%, rgba(255,140,0,0.05) 40%, transparent 70%)',
              animation: 'pulse-glow 3.5s ease-in-out infinite',
            }} />
        </div>

        {/* Gradient border card */}
        <div className="relative w-full max-w-3xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255,60,60,0.35), rgba(255,140,0,0.25), rgba(255,60,60,0.2))',
            borderRadius: 32,
            padding: 1,
          }}>
          <div className="rounded-[31px] px-12 py-20 text-center"
            style={{ background: '#080809' }}>
            <h2 className="final-headline font-black text-white leading-[0.9] tracking-[-0.04em] overflow-hidden"
              style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)', fontSize: 'clamp(2.8rem, 7.5vw, 5.5rem)' }}>
              Ready to trade<br />
              <span className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #ff3c3c, #ff8c00)' }}>
                with discipline?
              </span>
            </h2>
            <p className="mt-6 text-[#94a3b8] max-w-md mx-auto"
              style={{ fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)', fontSize: '13px', lineHeight: '1.9' }}>
              Join thousands of traders who stopped guessing and started winning with data.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/signup"
                className="shimmer-btn group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl px-10 py-5 text-base font-bold text-black transition-all hover:scale-[1.03]"
                style={{ ...shimmerStyle, backgroundSize: '200% auto', boxShadow: '0 0 60px rgba(255,60,60,0.35), 0 0 120px rgba(255,60,60,0.15)', animation: 'pulse-glow 2s ease-in-out infinite' }}>
                <span className="pointer-events-none absolute inset-0"
                  style={{
                    background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.22) 50%, transparent 70%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2.4s infinite linear',
                  }} />
                Start free trial
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/mock/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border px-10 py-5 text-base font-medium text-slate-300 transition-all hover:text-white hover:scale-[1.02]"
                style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                View live demo
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-xs font-mono text-slate-600">
              {['7-day free trial', 'No credit card', 'Cancel anytime', 'Prop firm ready', 'FTMO compatible'].map((badge, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <span style={{ color: '#00e676' }}>✓</span> {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t px-6 py-8 lg:px-16" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="mx-auto max-w-7xl flex flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="text-sm font-extrabold tracking-tight text-slate-300"
            style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)' }}>RiskSent</span>
          <p className="text-[11px] text-slate-600 font-mono">© {new Date().getFullYear()} RiskSent · All-in-one trading platform</p>
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
