'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { ArrowRight, Brain } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const CHAT_MESSAGES = [
  { ai: true,  text: '📊 Weekly report ready. Win rate improved +3.2% → 68.4%. Best session: London Open (+€890). Worst session: Friday NY close (−€112).' },
  { ai: false, text: 'Why am I losing more on Fridays?' },
  { ai: true,  text: '🔍 On Fridays you enter 2.3× more trades after 3pm. Friday avg R:R: 0.8 vs your weekly avg 1.92. Simple fix: stop trading at 3pm on Fridays.' },
  { ai: false, text: 'Am I ready for FTMO?' },
  { ai: true,  text: '✅ FTMO Readiness Score: 74/100. Strong: consistency (82%), position sizing (91%). To pass: reduce avg consecutive losses from 2.1 → 1.5. You\'re close.' },
];

const PATTERNS = [
  {
    icon: '🔁',
    label: 'Revenge Trading',
    badge: '2 this week',
    badgeColor: '#ff3c3c',
    desc: '3 trades opened within 8 min of a loss. Your average gap is 25 min. Emotional override detected.',
  },
  {
    icon: '📊',
    label: 'Overtrading',
    badge: 'Tue 9:30–11am',
    badgeColor: '#ff8c00',
    desc: '8 trades in 90 min — 3× your usual pace. Win rate in this window: 25% vs your avg 68.4%.',
  },
  {
    icon: '😰',
    label: 'FOMO Entry',
    badge: '3 this month',
    badgeColor: '#818cf8',
    desc: 'Entered 3 trending markets without setup confirmation. All 3 hit stop loss within 15 min.',
  },
  {
    icon: '✅',
    label: 'Session Discipline',
    badge: 'Improving',
    badgeColor: '#00e676',
    desc: 'You respected your daily loss limit 8 out of 10 sessions this week. Up from 4/10 last month.',
  },
];

const SCORE_METRICS = [
  { label: 'Consistency',      val: 82, color: '#00e676' },
  { label: 'Risk Discipline',  val: 91, color: '#00e676' },
  { label: 'Execution Quality', val: 67, color: '#ff8c00' },
  { label: 'Emotional Control', val: 58, color: '#ff8c00' },
  { label: 'FTMO Readiness',   val: 74, color: '#818cf8' },
  { label: 'Avg R:R',          val: 78, color: '#22d3ee' },
];

const PROP_FIRMS = [
  { name: 'FTMO',         score: 74, color: '#818cf8', status: 'Close' },
  { name: 'MyForexFunds', score: 81, color: '#00e676', status: 'Ready' },
  { name: 'The5%ers',     score: 69, color: '#ff8c00', status: 'Almost' },
];

export default function AICoachPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      if (prefersReduced) return;

      gsap.from('.aic-hero-word', {
        yPercent: 110, opacity: 0, duration: 1.1, stagger: 0.08, ease: 'expo.out', delay: 0.2,
      });
      gsap.from('.aic-fade', {
        opacity: 0, y: 22, duration: 0.9, stagger: 0.1, delay: 0.85, ease: 'power3.out',
      });

      // Bar scale-in on scroll
      ScrollTrigger.create({
        trigger: '.aic-bars',
        start: 'top 80%',
        onEnter: () => gsap.to('.aic-bar-fill', {
          scaleX: 1, duration: 1.2, stagger: 0.08, ease: 'power3.out',
        }),
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-full overflow-x-hidden bg-[#080809]">
      <style>{`
        @keyframes float-aic  { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-10px) } }
        @keyframes blink-aic  { 0%,80%,100% { opacity:1 } 40% { opacity:0.2 } }
        .aic-float { animation: float-aic 3.5s ease-in-out infinite; }
        .aic-bar-fill { transform-origin:left; transform:scaleX(0); }
      `}</style>

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="relative min-h-[88vh] flex flex-col justify-center px-6 pt-24 pb-20 lg:px-16 overflow-hidden">
        {/* Dot grid */}
        <div className="pointer-events-none absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px', opacity: 0.12,
        }} />
        {/* Glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-10%] right-[-5%] w-[65vw] h-[65vw] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(129,140,248,0.1) 0%, transparent 65%)' }} />
          <div className="absolute bottom-[-5%] left-0 w-[40vw] h-[40vw] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(167,139,250,0.05) 0%, transparent 65%)' }} />
        </div>

        <div className="relative max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-16">

            {/* LEFT */}
            <div className="lg:w-[55%]">
              <div className="aic-fade mb-6">
                <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-[0.2em]"
                  style={{ color: '#818cf8', borderColor: 'rgba(129,140,248,0.3)', background: 'rgba(129,140,248,0.08)' }}>
                  <Brain className="h-3 w-3" />
                  AI Coach
                </span>
              </div>

              <h1 className="font-black leading-[0.9] tracking-[-0.04em] text-white"
                style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)', fontSize: 'clamp(40px,6.5vw,90px)' }}>
                {['Your', 'personal'].map((w, i) => (
                  <span key={i} className="inline-block overflow-hidden mr-[0.22em]" style={{ verticalAlign: 'bottom' }}>
                    <span className="aic-hero-word inline-block">{w}</span>
                  </span>
                ))}
                <br />
                {['trading'].map((w, i) => (
                  <span key={i} className="inline-block overflow-hidden mr-[0.22em]" style={{ verticalAlign: 'bottom' }}>
                    <span className="aic-hero-word inline-block">{w}</span>
                  </span>
                ))}
                <br />
                <span className="inline-block overflow-hidden" style={{ verticalAlign: 'bottom' }}>
                  <span className="aic-hero-word inline-block bg-clip-text text-transparent"
                    style={{ backgroundImage: 'linear-gradient(135deg, #818cf8, #a78bfa)' }}>
                    analyst.
                  </span>
                </span>
              </h1>

              <p className="aic-fade mt-6 max-w-md text-slate-400 leading-relaxed"
                style={{ fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)', fontSize: '14px' }}>
                Pattern detection, performance scoring, prop firm readiness.<br />
                <span className="text-slate-300">The AI that watches your trades so you can improve them.</span>
              </p>

              {/* Quick stats */}
              <div className="aic-fade mt-6 flex flex-wrap gap-3">
                {[
                  { label: 'Score', val: '74/100', color: '#818cf8' },
                  { label: 'Patterns found', val: '3', color: '#ff8c00' },
                  { label: 'FTMO Ready', val: '74%', color: '#00e676' },
                  { label: 'Win rate', val: '68.4%', color: '#22d3ee' },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl px-3 py-2"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <p className="text-[9px] font-mono uppercase tracking-wider text-slate-500">{s.label}</p>
                    <p className="text-base font-black mt-0.5" style={{ color: s.color, fontFamily: 'var(--font-display)' }}>{s.val}</p>
                  </div>
                ))}
              </div>

              <div className="aic-fade mt-8 flex flex-wrap gap-3">
                <Link href="/signup"
                  className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-white transition-all hover:scale-[1.03]"
                  style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)', boxShadow: '0 0 30px rgba(129,140,248,0.3)' }}>
                  Get AI insights free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/mock/ai-coach"
                  className="inline-flex items-center gap-2 rounded-2xl border px-6 py-3 text-sm font-medium text-slate-300 transition-all hover:text-white"
                  style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                  Live demo
                </Link>
              </div>
            </div>

            {/* RIGHT — floating score card */}
            <div className="hidden md:flex lg:w-[45%] justify-center">
              <div className="aic-float w-72 rounded-[24px] p-5"
                style={{ background: '#0e0e12', border: '1px solid rgba(129,140,248,0.2)', boxShadow: '0 24px 80px rgba(129,140,248,0.1)' }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full text-white font-bold text-sm"
                    style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)' }}>AI</div>
                  <div>
                    <p className="text-sm font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>AI Coach Report</p>
                    <p className="text-[10px] font-mono text-slate-500">Week 14 · Apr 2025</p>
                  </div>
                  <div className="ml-auto">
                    <p className="text-2xl font-black" style={{ color: '#818cf8', fontFamily: 'var(--font-display)' }}>74</p>
                    <p className="text-[9px] font-mono text-slate-500 text-right">/100</p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  {[
                    { label: 'Consistency', val: 82, color: '#00e676' },
                    { label: 'Risk Discipline', val: 91, color: '#00e676' },
                    { label: 'Execution', val: 67, color: '#ff8c00' },
                    { label: 'FTMO Ready', val: 74, color: '#818cf8' },
                  ].map((m) => (
                    <div key={m.label}>
                      <div className="flex justify-between text-[10px] font-mono mb-1">
                        <span className="text-slate-500">{m.label}</span>
                        <span style={{ color: m.color }}>{m.val}/100</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${m.val}%`, background: m.color }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl px-3 py-2.5 mb-2"
                  style={{ background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.15)' }}>
                  <p className="text-[10px] font-mono" style={{ color: '#c4b5fd' }}>
                    💡 Stop trading Fridays after 3pm. Win rate drops to 28%.
                  </p>
                </div>
                <div className="rounded-xl px-3 py-2.5"
                  style={{ background: 'rgba(255,140,0,0.07)', border: '1px solid rgba(255,140,0,0.2)' }}>
                  <p className="text-[10px] font-mono text-orange-300">
                    🔁 Revenge trading detected — 3 trades in 8 min after loss
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 1: Chat Interface ────────────────── */}
      <section className="py-24 px-6 lg:px-16" style={{ background: '#060607' }}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-center">
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-500 mb-3">AI Analysis</p>
            <h2 className="font-black leading-[0.95] tracking-[-0.03em] text-white"
              style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)', fontSize: 'clamp(2rem,4vw,3.5rem)' }}>
              Ask anything about<br />
              <span style={{ color: '#818cf8' }}>your trading.</span>
            </h2>
            <p className="mt-3 max-w-md mx-auto text-slate-500"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
              The AI analyses 94 trades, detects patterns, and gives actionable answers — not generic advice.
            </p>
          </div>

          <div className="max-w-2xl mx-auto rounded-[24px] overflow-hidden"
            style={{ background: '#0e0e12', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 32px 100px rgba(0,0,0,0.5)' }}>
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="flex h-9 w-9 items-center justify-center rounded-full text-white font-bold text-sm"
                style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)' }}>AI</div>
              <div>
                <p className="text-sm font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>RiskSent AI Coach</p>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full" style={{ background: '#00e676', animation: 'blink-aic 1.5s infinite' }} />
                  <p className="text-[10px] font-mono text-slate-500">analyzing 94 trades...</p>
                </div>
              </div>
              <div className="ml-auto rounded-full px-2 py-0.5 text-[9px] font-mono font-bold"
                style={{ color: '#818cf8', background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.25)' }}>
                74/100
              </div>
            </div>

            {/* Messages */}
            <div className="p-6 space-y-4">
              {CHAT_MESSAGES.map((msg, i) => (
                <motion.div key={i}
                  className={`flex ${msg.ai ? 'justify-start' : 'justify-end'}`}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                  <div className="max-w-[85%] rounded-2xl px-4 py-3"
                    style={{
                      background: msg.ai ? 'rgba(129,140,248,0.08)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${msg.ai ? 'rgba(129,140,248,0.2)' : 'rgba(255,255,255,0.08)'}`,
                      borderBottomLeftRadius: msg.ai ? 4 : undefined,
                      borderBottomRightRadius: !msg.ai ? 4 : undefined,
                    }}>
                    <p className="text-xs font-mono leading-relaxed" style={{ color: msg.ai ? '#c4b5fd' : '#e2e8f0' }}>{msg.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Input bar */}
            <div className="px-5 py-4 border-t flex items-center gap-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="flex-1 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-600"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                Ask your AI coach anything...
              </div>
              <button className="flex h-9 w-9 items-center justify-center rounded-xl transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)' }}>
                <ArrowRight className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: Pattern Detection ─────────────── */}
      <section className="py-24 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-500 mb-3">Behavioral Analysis</p>
            <h2 className="font-black leading-[0.95] tracking-[-0.03em] text-white"
              style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)', fontSize: 'clamp(2rem,4vw,3.5rem)' }}>
              Patterns you can&apos;t see.<br />
              <span style={{ color: '#818cf8' }}>The AI sees everything.</span>
            </h2>
            <p className="mt-3 max-w-lg text-slate-500"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
              Automatically detected from your actual trade history. No manual tagging. No guesswork.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {PATTERNS.map((p, i) => (
              <motion.div key={i}
                className="rounded-[20px] p-6"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderLeft: `2px solid ${p.badgeColor}`,
                }}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ x: 4, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
              >
                <div className="flex items-start gap-4">
                  <span className="text-2xl shrink-0 mt-0.5">{p.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3 mb-1.5 flex-wrap">
                      <p className="font-black text-white" style={{ fontFamily: 'var(--font-display)' }}>{p.label}</p>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full whitespace-nowrap"
                        style={{ color: p.badgeColor, background: `${p.badgeColor}15`, border: `1px solid ${p.badgeColor}30` }}>
                        {p.badge}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-slate-400 leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: Performance Score ─────────────── */}
      <section className="py-24 px-6 lg:px-16" style={{ background: '#060607' }}>
        <div className="max-w-7xl mx-auto grid gap-12 lg:grid-cols-2 items-center">

          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-500 mb-3">Performance Score</p>
            <h2 className="font-black leading-[0.95] tracking-[-0.03em] text-white mb-4"
              style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)', fontSize: 'clamp(2rem,4vw,3.5rem)' }}>
              Know exactly where<br />
              <span style={{ color: '#818cf8' }}>you stand.</span>
            </h2>
            <p className="text-slate-400 max-w-md leading-relaxed mb-6"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '14px' }}>
              12 metrics scored weekly. Compare against prop firm benchmarks. Track your improvement month over month with full history.
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                { label: '94 trades analysed', color: '#818cf8' },
                { label: '3 months of data', color: '#94a3b8' },
                { label: 'Updated weekly', color: '#94a3b8' },
              ].map((t) => (
                <span key={t.label} className="text-xs font-mono px-3 py-1.5 rounded-full"
                  style={{ color: t.color, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  {t.label}
                </span>
              ))}
            </div>
          </div>

          <div className="aic-bars rounded-[24px] p-6"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="font-black text-white" style={{ fontFamily: 'var(--font-display)' }}>Weekly Score</p>
                <p className="text-[10px] font-mono text-slate-500">Week 14 · Apr 2025</p>
              </div>
              <span className="text-4xl font-black" style={{ color: '#818cf8', fontFamily: 'var(--font-display)' }}>74</span>
            </div>
            <div className="space-y-4">
              {SCORE_METRICS.map((m) => (
                <div key={m.label}>
                  <div className="flex justify-between text-xs font-mono mb-1.5">
                    <span className="text-slate-400">{m.label}</span>
                    <span style={{ color: m.color }}>{m.val}/100</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="aic-bar-fill h-full rounded-full"
                      style={{ width: `${m.val}%`, background: m.color, boxShadow: `0 0 8px ${m.color}50` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: Prop Firm Readiness ───────────── */}
      <section className="py-24 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-center">
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-500 mb-3">Prop Firm Readiness</p>
            <h2 className="font-black leading-[0.95] tracking-[-0.03em] text-white"
              style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)', fontSize: 'clamp(2rem,4vw,3.5rem)' }}>
              Are you ready to pass<br />
              <span style={{ color: '#818cf8' }}>your challenge?</span>
            </h2>
            <p className="mt-3 max-w-md mx-auto text-slate-500"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
              The AI benchmarks your stats against FTMO, MyForexFunds and The5%ers — and tells you exactly what to fix.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3 mb-10">
            {PROP_FIRMS.map((firm, i) => (
              <motion.div key={i}
                className="rounded-[20px] p-6 text-center"
                style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${firm.color}20` }}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                whileHover={{ y: -6, boxShadow: `0 20px 50px ${firm.color}15`, transition: { type: 'spring', stiffness: 380, damping: 26 } }}
              >
                <p className="font-black text-white text-lg mb-1" style={{ fontFamily: 'var(--font-display)' }}>{firm.name}</p>
                <p className="text-4xl font-black mb-2" style={{ color: firm.color, fontFamily: 'var(--font-display)' }}>
                  {firm.score}<span className="text-lg text-slate-500">/100</span>
                </p>
                <span className="inline-block text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider"
                  style={{ color: firm.color, background: `${firm.color}12`, border: `1px solid ${firm.color}25` }}>
                  {firm.status}
                </span>
              </motion.div>
            ))}
          </div>

          {/* What to improve */}
          <div className="rounded-[20px] p-6"
            style={{ background: 'rgba(129,140,248,0.05)', border: '1px solid rgba(129,140,248,0.15)' }}>
            <p className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-4">To pass FTMO — AI recommendations</p>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                { icon: '📉', text: 'Reduce avg consecutive losses: 2.1 → 1.5', done: false },
                { icon: '⏱️', text: 'Stop trading after 3pm Fridays (win rate 28%)', done: false },
                { icon: '✅', text: 'Risk per trade ≤1%: already compliant', done: true },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-base shrink-0 mt-0.5">{item.icon}</span>
                  <p className="text-xs font-mono leading-relaxed" style={{ color: item.done ? '#00e676' : '#94a3b8' }}>
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section className="py-24 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl p-px"
            style={{ background: 'linear-gradient(135deg, rgba(129,140,248,0.5), rgba(167,139,250,0.3), rgba(255,255,255,0.03))' }}>
            <div className="relative overflow-hidden rounded-3xl px-8 py-16 text-center" style={{ background: '#0e0e12' }}>
              <div className="pointer-events-none absolute inset-0"
                style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(129,140,248,0.1) 0%, transparent 60%)' }} />
              <h2 className="relative font-black leading-[0.95] tracking-[-0.03em] text-white"
                style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)', fontSize: 'clamp(2rem,5vw,4rem)' }}>
                Start improving your<br />
                <span className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(135deg, #818cf8, #a78bfa)' }}>
                  trading today.
                </span>
              </h2>
              <p className="relative mt-4 text-slate-400 max-w-md mx-auto"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '14px' }}>
                AI Coach is included in the Experienced plan. 7-day free trial, no credit card required.
              </p>
              <div className="relative mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link href="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-sm font-bold text-white transition-all hover:scale-[1.03]"
                  style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)', boxShadow: '0 0 40px rgba(129,140,248,0.3)' }}>
                  Get AI insights free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/mock/ai-coach"
                  className="inline-flex items-center justify-center rounded-2xl border px-8 py-4 text-sm font-medium text-slate-300 transition-all hover:text-white"
                  style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                  View demo
                </Link>
              </div>
              <div className="relative mt-6 flex flex-wrap justify-center gap-5 text-xs font-mono text-slate-600">
                {['7-day free trial', 'No credit card', 'Cancel anytime'].map((b) => (
                  <span key={b} className="flex items-center gap-1.5">
                    <span style={{ color: '#00e676' }}>✓</span> {b}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
