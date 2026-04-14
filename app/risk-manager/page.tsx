'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { ArrowRight, Shield } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface Gauge {
  label: string;
  val: string;
  pct: number;
  limit: string;
  color: string;
}

const GAUGES: Gauge[] = [
  { label: 'Daily DD', val: '1.1%', pct: 0.55, limit: '2.0%', color: '#00e676' },
  { label: 'Max DD', val: '4.2%', pct: 0.525, limit: '8.0%', color: '#00e676' },
  { label: 'Open Trades', val: '2/3', pct: 0.67, limit: '3 max', color: '#00e676' },
  { label: 'Weekly Loss', val: '4.1%', pct: 0.82, limit: '5.0%', color: '#ff8c00' },
];

const RULES = [
  { name: 'Max Daily Loss 2%', status: 'ACTIVE', color: '#00e676' },
  { name: 'Max Position Size 1%', status: 'ACTIVE', color: '#00e676' },
  { name: 'No trading after 2 losses', status: 'ACTIVE', color: '#00e676' },
  { name: 'Max Open Trades 3', status: 'ACTIVE', color: '#00e676' },
  { name: 'Max Weekly Loss 5%', status: 'WARNING', color: '#ff8c00' },
];

export default function RiskManagerPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      ScrollTrigger.refresh();
      if (!prefersReduced) {
        gsap.from('.rm-hero-word', {
          yPercent: 110, opacity: 0, duration: 1, stagger: 0.07, ease: 'expo.out', delay: 0.2,
        });
        gsap.from('.rm-fade', {
          opacity: 0, y: 20, duration: 0.8, stagger: 0.1, delay: 0.8, ease: 'power3.out',
        });
        gsap.utils.toArray<HTMLElement>('.rm-reveal').forEach((el) => {
          gsap.from(el, {
            opacity: 0, y: 40, duration: 0.8, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
          });
        });
        /* Gauge arc animations */
        gsap.utils.toArray<SVGPathElement>('.gauge-arc').forEach((arc) => {
          const len = arc.getTotalLength();
          const pct = parseFloat(arc.getAttribute('data-pct') ?? '0.5');
          const arcLen = len * pct;
          gsap.fromTo(arc,
            { strokeDasharray: `0 ${len}` },
            {
              strokeDasharray: `${arcLen} ${len}`,
              duration: 1.2, ease: 'power2.out',
              scrollTrigger: { trigger: '.gauges-section', start: 'top 80%', toggleActions: 'play none none none' },
            }
          );
        });
        /* Rules stagger */
        gsap.from('.rule-row', {
          opacity: 0, x: -30, stagger: 0.1, duration: 0.6, ease: 'power3.out',
          scrollTrigger: { trigger: '.rules-section', start: 'top 80%', toggleActions: 'play none none none' },
        });
      }
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-full overflow-x-hidden bg-[#080809]">
      <style>{`
        @keyframes float-rm { 0%,100% { transform: translateY(0px) } 50% { transform: translateY(-10px) } }
        .rm-float { animation: float-rm 3.5s ease-in-out infinite; }
      `}</style>

      {/* ─── HERO ─── */}
      <section className="relative min-h-[80vh] flex flex-col justify-center px-6 pt-24 pb-20 lg:px-16 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(255,60,60,0.08) 0%, transparent 65%)' }} />
          <div className="absolute bottom-0 right-0 w-[50vw] h-[50vw] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(255,140,0,0.05) 0%, transparent 65%)' }} />
        </div>

        <div className="relative max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-16">
            {/* LEFT */}
            <div className="lg:w-[55%]">
              <div className="rm-fade mb-6">
                <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-[0.2em]"
                  style={{ color: '#ff3c3c', borderColor: 'rgba(255,60,60,0.3)', background: 'rgba(255,60,60,0.08)' }}>
                  <Shield className="h-3 w-3" />
                  Risk Manager
                </span>
              </div>

              <h1 className="font-black leading-[0.9] tracking-[-0.04em] text-white"
                style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)', fontSize: 'clamp(40px, 6.5vw, 90px)' }}>
                {['Hard', 'limits.'].map((w, i) => (
                  <span key={i} className="inline-block overflow-hidden mr-[0.2em]" style={{ verticalAlign: 'bottom' }}>
                    <span className="rm-hero-word inline-block">{w}</span>
                  </span>
                ))}
                <br />
                {['Real-time', 'alerts.'].map((w, i) => (
                  <span key={i} className="inline-block overflow-hidden mr-[0.2em]" style={{ verticalAlign: 'bottom' }}>
                    <span className="rm-hero-word inline-block">{w}</span>
                  </span>
                ))}
                <br />
                <span className="inline-block overflow-hidden" style={{ verticalAlign: 'bottom' }}>
                  <span className="rm-hero-word inline-block bg-clip-text text-transparent"
                    style={{ backgroundImage: 'linear-gradient(135deg, #ff3c3c, #ff8c00)' }}>
                    Zero excuses.
                  </span>
                </span>
              </h1>

              <p className="rm-fade mt-6 max-w-md text-slate-400 leading-relaxed"
                style={{ fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)', fontSize: '14px' }}>
                Real-time risk monitoring on your live account.<br />
                <span className="text-slate-300">Live alerts. Actionable guidance. Zero excuses.</span>
              </p>

              <div className="rm-fade mt-8 flex flex-wrap gap-3">
                <Link href="/signup"
                  className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-black transition-all hover:scale-[1.03]"
                  style={{ background: 'linear-gradient(135deg, #ff3c3c, #ff8c00)', boxShadow: '0 0 30px rgba(255,60,60,0.3)' }}>
                  Protect your account
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/mock/dashboard"
                  className="inline-flex items-center gap-2 rounded-2xl border px-6 py-3 text-sm font-medium text-slate-300 transition-all hover:text-white"
                  style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                  Live demo
                </Link>
              </div>
            </div>

            {/* RIGHT — risk dashboard widget */}
            <div className="hidden md:flex lg:w-[45%] justify-center">
              <div className="rm-float relative rounded-[20px] p-6 w-80"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
                }}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Risk Monitor · Live</p>
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-400" />
                    </span>
                    <span className="text-[9px] font-mono text-red-400 uppercase">Monitoring</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {GAUGES.slice(0, 4).map((g, i) => (
                    <div key={i} className="rounded-xl p-3 text-center"
                      style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${g.color}20` }}>
                      <p className="text-[9px] font-mono text-slate-500 uppercase mb-1">{g.label}</p>
                      <p className="text-base font-black" style={{ color: g.color, fontFamily: 'var(--font-display, "Syne", sans-serif)' }}>{g.val}</p>
                      <p className="text-[9px] font-mono text-slate-600">/ {g.limit}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-xl px-3 py-2"
                  style={{ background: 'rgba(255,140,0,0.08)', border: '1px solid rgba(255,140,0,0.25)' }}>
                  <p className="text-[10px] font-mono text-orange-300">⚠️ Weekly loss 4.1% — 0.9% remaining</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 1: Live Monitor / Gauges ─── */}
      <section className="gauges-section py-24 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="rm-reveal mb-8">
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-500 mb-3">Live Monitor</p>
            <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-black leading-[0.95] tracking-[-0.03em] text-white"
              style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)' }}>
              Stop losses before<br />
              <span className="text-slate-500">they happen.</span>
            </h2>
          </div>

          <div className="rm-reveal grid grid-cols-2 gap-5 lg:grid-cols-4">
            {GAUGES.map((g, i) => (
              <div key={i} className="rounded-[20px] p-6 flex flex-col items-center"
                style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${g.color}20` }}>
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-3">{g.label}</p>
                <svg viewBox="0 0 100 58" className="w-28 h-16">
                  {/* Background arc */}
                  <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round" />
                  {/* Colored fill arc */}
                  <path className="gauge-arc"
                    data-pct={g.pct}
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke={g.color}
                    strokeWidth="7"
                    strokeLinecap="round"
                    style={{ filter: `drop-shadow(0 0 6px ${g.color})` }}
                  />
                </svg>
                <p className="text-xl font-black font-mono mt-1" style={{ color: g.color }}>{g.val}</p>
                <p className="text-[10px] font-mono text-slate-500 mt-0.5">/ {g.limit}</p>
                {g.color === '#ff8c00' && (
                  <span className="mt-2 rounded-full px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider"
                    style={{ color: '#ff8c00', background: 'rgba(255,140,0,0.1)', border: '1px solid rgba(255,140,0,0.25)' }}>
                    Warning
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: Rules ─── */}
      <section className="rules-section py-24 px-6 lg:px-16" style={{ background: '#060607' }}>
        <div className="max-w-7xl mx-auto">
          <div className="rm-reveal mb-8">
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-500 mb-3">Risk Rulebook</p>
            <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-black leading-[0.95] tracking-[-0.03em] text-white"
              style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)' }}>
              Build your own risk rulebook.<br />
              <span className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #ff3c3c, #ff8c00)' }}>
                RiskSent enforces it.
              </span>
            </h2>
          </div>

          <div className="space-y-3 max-w-3xl">
            {RULES.map((rule, i) => (
              <motion.div
                key={i}
                className="rule-row flex items-center justify-between rounded-[20px] px-6 py-4"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid ${rule.color}20`,
                  borderLeft: `2px solid ${rule.color}`,
                }}
                whileHover={{ x: 4, transition: { type: 'spring', stiffness: 400, damping: 25 } }}>
                <div className="flex items-center gap-4">
                  <div className="relative flex h-2 w-2 shrink-0">
                    {rule.status === 'ACTIVE' ? (
                      <>
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-50" style={{ background: rule.color }} />
                        <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: rule.color }} />
                      </>
                    ) : (
                      <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: rule.color, boxShadow: `0 0 8px ${rule.color}` }} />
                    )}
                  </div>
                  <span className="text-sm font-mono text-slate-300">{rule.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase"
                    style={{ color: rule.color, background: `${rule.color}15`, border: `1px solid ${rule.color}30` }}>
                    {rule.status}
                  </span>
                  {/* Toggle visual */}
                  <div className="relative h-5 w-9 rounded-full" style={{ background: rule.status === 'ACTIVE' ? rule.color : 'rgba(255,255,255,0.1)' }}>
                    <span className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow"
                      style={{ left: rule.status === 'ACTIVE' ? 'calc(100% - 1.1rem)' : '0.1rem', transition: 'left 0.2s' }} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 3: Telegram alerts ─── */}
      <section className="py-24 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="rm-reveal mb-8">
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-500 mb-3">Real-Time Alerts</p>
            <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-black leading-[0.95] tracking-[-0.03em] text-white"
              style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)' }}>
              Get alerts before<br />
              <span className="text-slate-500">you break your rules.</span>
            </h2>
          </div>

          <div className="rm-reveal max-w-md mx-auto">
            {/* Telegram chat mockup */}
            <div className="rounded-3xl overflow-hidden"
              style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b"
                style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ background: 'linear-gradient(135deg, #2AABEE, #229ED9)' }}>
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.88 13.47l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.834.95l-.536-.861z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">RiskSent Alerts Bot</p>
                  <p className="text-[10px] font-mono text-slate-500">@RiskSentAlertsBot · online</p>
                </div>
              </div>

              {/* Messages */}
              <div className="px-4 py-5 space-y-3">
                <motion.div
                  className="max-w-xs rounded-2xl rounded-tl-sm px-4 py-3"
                  style={{ background: 'rgba(255,140,0,0.12)', border: '1px solid rgba(255,140,0,0.3)', borderLeft: '3px solid #ff8c00' }}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}>
                  <p className="text-xs text-orange-300 font-mono leading-relaxed">
                    🚨 <strong>RiskSent Alert</strong><br />
                    Daily drawdown 1.8% / 2% limit.<br />
                    1 more losing trade and you&apos;re locked out.
                  </p>
                  <p className="text-[9px] font-mono text-slate-600 mt-1 text-right">15:04 ✓✓</p>
                </motion.div>

                <motion.div
                  className="max-w-xs rounded-2xl rounded-tl-sm px-4 py-3"
                  style={{ background: 'rgba(255,60,60,0.08)', border: '1px solid rgba(255,60,60,0.25)', borderLeft: '3px solid #ff3c3c' }}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}>
                  <p className="text-xs text-red-300 font-mono leading-relaxed">
                    🔴 <strong>HIGH ALERT</strong><br />
                    Weekly loss 4.1% / 5% limit.<br />
                    Next step: Stop trading today.
                  </p>
                  <p className="text-[9px] font-mono text-slate-600 mt-1 text-right">15:06 ✓✓</p>
                </motion.div>

                <motion.div
                  className="ml-auto max-w-xs rounded-2xl rounded-tr-sm px-4 py-3"
                  style={{ background: 'rgba(42,171,238,0.15)', border: '1px solid rgba(42,171,238,0.25)' }}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.35 }}>
                  <p className="text-xs text-blue-300 font-mono">Ok, stopping for today. Thanks.</p>
                  <p className="text-[9px] font-mono text-slate-600 mt-1 text-right">15:07 ✓✓</p>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="rm-reveal relative overflow-hidden rounded-3xl p-px"
            style={{ background: 'linear-gradient(135deg, rgba(255,60,60,0.5), rgba(255,140,0,0.3), rgba(255,255,255,0.03))' }}>
            <div className="relative overflow-hidden rounded-3xl px-8 py-16 text-center" style={{ background: '#0e0e12' }}>
              <div className="pointer-events-none absolute inset-0"
                style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,60,60,0.1) 0%, transparent 60%)' }} />
              <h2 className="relative text-[clamp(2rem,5vw,4rem)] font-black leading-[0.95] tracking-[-0.03em] text-white"
                style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)' }}>
                Protect your account<br />
                <span className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(135deg, #ff3c3c, #ff8c00)' }}>
                  today.
                </span>
              </h2>
              <p className="relative mt-4 text-slate-400 max-w-md mx-auto"
                style={{ fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)', fontSize: '14px' }}>
                One rule broken can erase weeks of work.<br />
                RiskSent makes sure that never happens again.
              </p>
              <div className="relative mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link href="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-sm font-bold text-black transition-all hover:scale-[1.03]"
                  style={{ background: 'linear-gradient(135deg, #ff3c3c, #ff8c00)', boxShadow: '0 0 40px rgba(255,60,60,0.35)' }}>
                  Protect my account
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
