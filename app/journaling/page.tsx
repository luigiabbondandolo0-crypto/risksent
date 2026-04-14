'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

/* 84 cells: 12 weeks × 7 days */
const HEATMAP_CELLS: number[] = [
  0, 0.2, 0, -0.3, 0.6, 0, 0.1,
  0.4, 0, 0.5, 0, -0.2, 0.7, 0,
  0, 0.3, -0.4, 0.8, 0, 0.2, 0.5,
  -0.3, 0.6, 0, 0.4, 0.3, 0, -0.2,
  0.7, 0, 0.2, -0.5, 0.8, 0, 0.4,
  0, 0.5, 0.3, 0, 0.6, -0.2, 0.1,
  0.4, -0.3, 0.7, 0, 0.5, 0.2, 0,
  0, 0.6, 0, -0.4, 0.8, 0.3, 0,
  0.5, 0, 0.4, 0.2, 0, -0.3, 0.7,
  0, 0.3, -0.2, 0.6, 0, 0.5, 0.4,
  0.8, 0, 0.3, -0.5, 0.7, 0, 0.2,
  0, 0.4, 0.6, 0, 0.3, -0.2, 0.5,
];

const TRADES = [
  { pair: 'EURUSD', dir: 'BUY', pl: '+€124', rr: '2.1', win: true },
  { pair: 'XAUUSD', dir: 'SELL', pl: '-€45', rr: '0.8', win: false },
  { pair: 'US30', dir: 'BUY', pl: '+€312', rr: '3.2', win: true },
  { pair: 'GBPUSD', dir: 'BUY', pl: '+€89', rr: '1.8', win: true },
  { pair: 'EURUSD', dir: 'SELL', pl: '+€67', rr: '1.4', win: true },
  { pair: 'XAUUSD', dir: 'BUY', pl: '-€28', rr: '0.6', win: false },
  { pair: 'US30', dir: 'SELL', pl: '+€195', rr: '2.8', win: true },
  { pair: 'GBPJPY', dir: 'BUY', pl: '+€143', rr: '2.3', win: true },
];

export default function JournalingPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      ScrollTrigger.refresh();
      if (!prefersReduced) {
        gsap.from('.jn-hero-word', {
          yPercent: 110, opacity: 0, duration: 1, stagger: 0.07, ease: 'expo.out', delay: 0.2,
        });
        gsap.from('.jn-fade', {
          opacity: 0, y: 20, duration: 0.8, stagger: 0.1, delay: 0.8, ease: 'power3.out',
        });
        gsap.utils.toArray<HTMLElement>('.jn-reveal').forEach((el) => {
          gsap.from(el, {
            opacity: 0, y: 40, duration: 0.8, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
          });
        });
        /* Bar chart animations */
        gsap.from('.bar-day', {
          scaleY: 0, transformOrigin: 'bottom', stagger: 0.08, duration: 0.7, ease: 'power2.out',
          scrollTrigger: { trigger: '.analytics-section', start: 'top 80%', toggleActions: 'play none none none' },
        });
        gsap.from('.bar-sym', {
          scaleX: 0, transformOrigin: 'left', stagger: 0.1, duration: 0.7, ease: 'power2.out',
          scrollTrigger: { trigger: '.analytics-section', start: 'top 80%', toggleActions: 'play none none none' },
          delay: 0.2,
        });
      }
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-full overflow-x-hidden bg-[#080809]">
      <style>{`
        @keyframes float-jn { 0%,100% { transform: translateY(0px) } 50% { transform: translateY(-10px) } }
        .jn-widget-float { animation: float-jn 3.5s ease-in-out infinite; }
      `}</style>

      {/* ─── HERO ─── */}
      <section className="relative min-h-[80vh] flex flex-col justify-center px-6 pt-24 pb-20 lg:px-16 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(0,230,118,0.07) 0%, transparent 65%)' }} />
          <div className="absolute bottom-0 right-0 w-[50vw] h-[50vw] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(34,211,238,0.04) 0%, transparent 65%)' }} />
        </div>

        <div className="relative max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-16">
            {/* LEFT */}
            <div className="lg:w-[55%]">
              <div className="jn-fade mb-6">
                <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-[0.2em]"
                  style={{ color: '#00e676', borderColor: 'rgba(0,230,118,0.3)', background: 'rgba(0,230,118,0.08)' }}>
                  <TrendingUp className="h-3 w-3" />
                  Trading Journal
                </span>
              </div>

              <h1 className="font-black leading-[0.9] tracking-[-0.04em] text-white"
                style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)', fontSize: 'clamp(48px, 7vw, 100px)' }}>
                {['Know', 'every'].map((w, i) => (
                  <span key={i} className="inline-block overflow-hidden mr-[0.2em]" style={{ verticalAlign: 'bottom' }}>
                    <span className="jn-hero-word inline-block">{w}</span>
                  </span>
                ))}
                <br />
                {['trade.'].map((w, i) => (
                  <span key={i} className="inline-block overflow-hidden mr-[0.2em]" style={{ verticalAlign: 'bottom' }}>
                    <span className="jn-hero-word inline-block">{w}</span>
                  </span>
                ))}
                <br />
                {['Master', 'every'].map((w, i) => (
                  <span key={i} className="inline-block overflow-hidden mr-[0.2em]" style={{ verticalAlign: 'bottom' }}>
                    <span className="jn-hero-word inline-block">{w}</span>
                  </span>
                ))}
                <span className="inline-block overflow-hidden" style={{ verticalAlign: 'bottom' }}>
                  <span className="jn-hero-word inline-block bg-clip-text text-transparent"
                    style={{ backgroundImage: 'linear-gradient(135deg, #00e676, #22d3ee)' }}>
                    pattern.
                  </span>
                </span>
              </h1>

              <p className="jn-fade mt-6 max-w-md text-slate-400 leading-relaxed"
                style={{ fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)', fontSize: '14px' }}>
                Log every trade. Tag every setup. Review your psychology.<br />
                <span className="text-slate-300">Turn every loss into data — and every pattern into profit.</span>
              </p>

              <div className="jn-fade mt-8 flex flex-wrap gap-3">
                <Link href="/signup"
                  className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-black transition-all hover:scale-[1.03]"
                  style={{ background: 'linear-gradient(135deg, #00e676, #22d3ee)', boxShadow: '0 0 30px rgba(0,230,118,0.25)' }}>
                  Start journaling
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/mock/dashboard"
                  className="inline-flex items-center gap-2 rounded-2xl border px-6 py-3 text-sm font-medium text-slate-300 transition-all hover:text-white"
                  style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                  Live demo
                </Link>
              </div>
            </div>

            {/* RIGHT — floating journal widget */}
            <div className="hidden md:flex lg:w-[45%] justify-center">
              <div className="jn-widget-float relative rounded-[20px] p-5 w-80"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
                }}>
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-3">April 2026</p>
                <div className="grid gap-1 mb-4" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                  {['S','M','T','W','T','F','S'].map((d, i) => (
                    <div key={i} className="text-center text-[9px] font-mono text-slate-600 pb-1">{d}</div>
                  ))}
                  {[0.5, -0.2, 0.8, 0, 0.3, 0.6, 0,
                    0, 0.4, -0.3, 0.7, 0, 0.5, 0.2,
                    0.6, 0, 0.3, -0.4, 0.8, 0, 0.4,
                    0, 0.7, 0.2, 0, 0.5, -0.2, 0.6,
                  ].map((v, i) => (
                    <div key={i} className="aspect-square rounded"
                      style={{
                        background: v > 0 ? `rgba(0,230,118,${v * 0.8})` : v < 0 ? `rgba(255,60,60,${Math.abs(v) * 0.6})` : 'rgba(255,255,255,0.04)',
                      }} />
                  ))}
                </div>
                <div className="space-y-2">
                  {[
                    { pair: 'EURUSD', pl: '+€124', win: true },
                    { pair: 'US30', pl: '+€312', win: true },
                    { pair: 'XAUUSD', pl: '-€45', win: false },
                  ].map((t, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span className="text-xs font-bold text-white">{t.pair}</span>
                      <span className="text-xs font-mono font-bold" style={{ color: t.win ? '#00e676' : '#ff3c3c' }}>{t.pl}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 1: Large heatmap ─── */}
      <section className="py-24 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="jn-reveal mb-8">
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-500 mb-3">Performance Heatmap</p>
            <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-black leading-[0.95] tracking-[-0.03em] text-white"
              style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)' }}>
              See every trading day<br />
              <span className="text-slate-500">at a glance.</span>
            </h2>
          </div>

          <div className="jn-reveal rounded-[20px] p-8"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {/* Day labels */}
            <div className="grid mb-2 gap-1" style={{ gridTemplateColumns: '60px repeat(12, 1fr)' }}>
              <div />
              {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                <div key={i} className="text-[9px] font-mono text-slate-600 text-center">{m}</div>
              ))}
            </div>
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day, di) => (
              <div key={di} className="grid gap-1 mb-1" style={{ gridTemplateColumns: '60px repeat(12, 1fr)' }}>
                <div className="text-[9px] font-mono text-slate-600 self-center">{day}</div>
                {HEATMAP_CELLS.slice(di * 12, di * 12 + 12).map((v, ci) => {
                  const vn = v as number;
                  return (
                    <motion.div key={ci}
                      className="aspect-square rounded-md cursor-pointer"
                      style={{
                        width: '100%',
                        background: vn > 0 ? `rgba(0,230,118,${vn * 0.8})` : vn < 0 ? `rgba(255,60,60,${Math.abs(vn) * 0.6})` : 'rgba(255,255,255,0.04)',
                        minHeight: 24,
                      }}
                      whileHover={{ scale: 1.15, transition: { type: 'spring', stiffness: 500 } }}
                      title={vn !== 0 ? `${vn > 0 ? '+' : ''}${(vn * 200).toFixed(0)}€` : 'No trades'} />
                  );
                })}
              </div>
            ))}

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              {[
                { label: 'Best Month', val: '+€1,240', color: '#00e676' },
                { label: 'Best Day', val: '+€420', color: '#22d3ee' },
                { label: 'Consistency', val: '82%', color: '#818cf8' },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <p className="text-xl font-black" style={{ color: s.color, fontFamily: 'var(--font-display, "Syne", sans-serif)' }}>{s.val}</p>
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: Trades Table ─── */}
      <section className="py-24 px-6 lg:px-16" style={{ background: '#060607' }}>
        <div className="max-w-7xl mx-auto">
          <div className="jn-reveal mb-8">
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-500 mb-3">Trade Log</p>
            <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-black leading-[0.95] tracking-[-0.03em] text-white"
              style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)' }}>
              50+ data points<br />
              <span className="text-slate-500">per trade.</span>
            </h2>
          </div>

          <div className="jn-reveal rounded-[20px] overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {/* Table header */}
            <div className="grid grid-cols-5 px-6 py-3 border-b text-[10px] font-mono uppercase tracking-widest text-slate-500"
              style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
              <span>Pair</span>
              <span>Direction</span>
              <span>P&amp;L</span>
              <span>R:R</span>
              <span>Result</span>
            </div>
            {TRADES.map((t, i) => (
              <motion.div key={i}
                className="grid grid-cols-5 px-6 py-4 border-b items-center"
                style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                whileHover={{ background: 'rgba(255,255,255,0.02)' }}>
                <span className="text-sm font-black text-white" style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)' }}>{t.pair}</span>
                <span className="inline-flex">
                  <span className="rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase"
                    style={{
                      color: t.dir === 'BUY' ? '#00e676' : '#ff3c3c',
                      background: t.dir === 'BUY' ? 'rgba(0,230,118,0.1)' : 'rgba(255,60,60,0.1)',
                      border: `1px solid ${t.dir === 'BUY' ? 'rgba(0,230,118,0.3)' : 'rgba(255,60,60,0.3)'}`,
                    }}>
                    {t.dir}
                  </span>
                </span>
                <span className="text-sm font-mono font-bold" style={{ color: t.win ? '#00e676' : '#ff3c3c' }}>{t.pl}</span>
                <span className="text-sm font-mono text-slate-400">{t.rr}</span>
                <span className="inline-flex">
                  <span className="rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase"
                    style={{
                      color: t.win ? '#00e676' : '#ff3c3c',
                      background: t.win ? 'rgba(0,230,118,0.08)' : 'rgba(255,60,60,0.08)',
                    }}>
                    {t.win ? 'Win' : 'Loss'}
                  </span>
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 3: Analytics ─── */}
      <section className="analytics-section py-24 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="jn-reveal mb-8">
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-500 mb-3">Analytics</p>
            <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-black leading-[0.95] tracking-[-0.03em] text-white"
              style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)' }}>
              Find your best session,<br />
              <span className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #00e676, #22d3ee)' }}>
                setup, and symbol.
              </span>
            </h2>
          </div>

          <div className="jn-reveal grid gap-5 md:grid-cols-2">
            {/* P&L by day of week */}
            <div className="rounded-[20px] p-6"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-4">P&L by day of week</p>
              <div className="flex items-end gap-3 h-36">
                {[
                  { day: 'Mon', pct: 65, val: '+€86' },
                  { day: 'Tue', pct: 85, val: '+€112' },
                  { day: 'Wed', pct: 45, val: '+€59' },
                  { day: 'Thu', pct: 100, val: '+€132' },
                  { day: 'Fri', pct: 70, val: '+€92' },
                ].map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] font-mono text-slate-500">{d.val}</span>
                    <div className="bar-day w-full rounded-t-md"
                      style={{
                        height: `${d.pct}%`,
                        background: 'linear-gradient(180deg, #00e676, rgba(0,230,118,0.4))',
                        minHeight: 8,
                      }} />
                    <span className="text-[10px] font-mono text-slate-500">{d.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* P&L by symbol */}
            <div className="rounded-[20px] p-6"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-4">P&L by symbol</p>
              <div className="space-y-3">
                {[
                  { sym: 'US30', pct: 90, val: '+€507' },
                  { sym: 'EURUSD', pct: 70, val: '+€191' },
                  { sym: 'GBPJPY', pct: 55, val: '+€143' },
                  { sym: 'GBPUSD', pct: 35, val: '+€89' },
                  { sym: 'XAUUSD', pct: 20, val: '-€73' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400 w-16 shrink-0">{s.sym}</span>
                    <div className="flex-1 rounded-full h-3"
                      style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="bar-sym h-full rounded-full"
                        style={{
                          width: `${s.pct}%`,
                          background: s.pct > 25 ? 'linear-gradient(90deg, #00e676, rgba(0,230,118,0.5))' : 'linear-gradient(90deg, #ff3c3c, rgba(255,60,60,0.5))',
                        }} />
                    </div>
                    <span className="text-xs font-mono w-16 text-right shrink-0"
                      style={{ color: s.pct > 25 ? '#00e676' : '#ff3c3c' }}>{s.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="jn-reveal relative overflow-hidden rounded-3xl p-px"
            style={{ background: 'linear-gradient(135deg, rgba(0,230,118,0.4), rgba(34,211,238,0.2), rgba(255,255,255,0.03))' }}>
            <div className="relative overflow-hidden rounded-3xl px-8 py-16 text-center" style={{ background: '#0e0e12' }}>
              <div className="pointer-events-none absolute inset-0"
                style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,230,118,0.1) 0%, transparent 60%)' }} />
              <h2 className="relative text-[clamp(2rem,5vw,4rem)] font-black leading-[0.95] tracking-[-0.03em] text-white"
                style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)' }}>
                Start journaling your<br />
                <span className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(135deg, #00e676, #22d3ee)' }}>
                  trades today.
                </span>
              </h2>
              <p className="relative mt-4 text-slate-400 max-w-md mx-auto"
                style={{ fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)', fontSize: '14px' }}>
                Your trades are trying to teach you. Are you listening?
              </p>
              <div className="relative mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link href="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-sm font-bold text-black transition-all hover:scale-[1.03]"
                  style={{ background: 'linear-gradient(135deg, #00e676, #22d3ee)', boxShadow: '0 0 40px rgba(0,230,118,0.3)' }}>
                  Start journaling free
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
