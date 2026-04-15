'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Bell } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const ALERT_CARDS = [
  {
    icon: '⚠️',
    title: 'Daily DD Alert',
    desc: 'Daily loss 1.8% — 0.2% remaining',
    badge: 'HIGH',
    badgeColor: '#ff8c00',
    time: '15:04',
  },
  {
    icon: '📊',
    title: 'Position Size',
    desc: 'Position 1.4% — above 1% limit',
    badge: 'MEDIUM',
    badgeColor: '#febc2e',
    time: '14:58',
  },
  {
    icon: '🔴',
    title: 'Consecutive Loss',
    desc: '2 consecutive losses — cooling off?',
    badge: 'HIGH',
    badgeColor: '#ff3c3c',
    time: '14:51',
  },
  {
    icon: '📉',
    title: 'Weekly Risk',
    desc: 'Weekly loss 4.1% — approaching 5% limit',
    badge: 'HIGH',
    badgeColor: '#ff8c00',
    time: '14:30',
  },
];

const TELEGRAM_MSGS = [
  { from: 'user', text: '/start' },
  { from: 'bot', text: 'Welcome to RiskSent! Send me your Chat ID to connect your account.' },
  { from: 'user', text: 'Chat ID: 123456789' },
  { from: 'bot', text: '✅ Connected! You\'ll now receive real-time risk alerts directly here.' },
];

const AI_ALERTS = [
  {
    icon: '🔁',
    title: 'Revenge trading detected',
    desc: '3 trades in 8 min after a loss. Your average is 1 trade per 25 min.',
    color: '#818cf8',
  },
  {
    icon: '📈',
    title: 'Overtrading alert',
    desc: '40% above your daily average. You usually trade 5 times before noon.',
    color: '#818cf8',
  },
  {
    icon: '😰',
    title: 'FOMO pattern detected',
    desc: 'Entered 3 trades in trending market without a setup match.',
    color: '#818cf8',
  },
];

export default function LiveAlertsPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      ScrollTrigger.refresh();
      if (!prefersReduced) {
        gsap.from('.la-hero-word', {
          yPercent: 110, opacity: 0, duration: 1, stagger: 0.07, ease: 'expo.out', delay: 0.2,
        });
        gsap.from('.la-fade', {
          opacity: 0, y: 20, duration: 0.8, stagger: 0.1, delay: 0.8, ease: 'power3.out',
        });
        // la-reveal sections now use Framer Motion whileInView directly
      }
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-full overflow-x-hidden bg-[#080809]">
      <style>{`
        @keyframes float-la { 0%,100% { transform: translateY(0px) } 50% { transform: translateY(-10px) } }
        .la-float { animation: float-la 3.5s ease-in-out infinite; }
        @keyframes blink-dot { 0%,80%,100% { opacity:1 } 40% { opacity:0.2 } }
      `}</style>

      {/* ─── HERO ─── */}
      <section className="relative min-h-[80vh] flex flex-col justify-center px-6 pt-24 pb-20 lg:px-16 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(255,140,0,0.07) 0%, transparent 65%)' }} />
          <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(255,60,60,0.04) 0%, transparent 65%)' }} />
        </div>

        <div className="relative max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-16">
            {/* LEFT */}
            <div className="lg:w-[55%]">
              <div className="la-fade mb-6">
                <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-[0.2em]"
                  style={{ color: '#ff8c00', borderColor: 'rgba(255,140,0,0.3)', background: 'rgba(255,140,0,0.08)' }}>
                  <Bell className="h-3 w-3" />
                  Live Alerts
                </span>
              </div>

              <h1 className="font-black leading-[0.9] tracking-[-0.04em] text-white"
                style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)', fontSize: 'clamp(40px, 6.5vw, 90px)' }}>
                {['Never', 'miss'].map((w, i) => (
                  <span key={i} className="inline-block overflow-hidden mr-[0.2em]" style={{ verticalAlign: 'bottom' }}>
                    <span className="la-hero-word inline-block">{w}</span>
                  </span>
                ))}
                <br />
                {['a', 'risk', 'alert.'].map((w, i) => (
                  <span key={i} className="inline-block overflow-hidden mr-[0.2em]" style={{ verticalAlign: 'bottom' }}>
                    <span className="la-hero-word inline-block">{w}</span>
                  </span>
                ))}
                <br />
                <span className="inline-block overflow-hidden" style={{ verticalAlign: 'bottom' }}>
                  <span className="la-hero-word inline-block bg-clip-text text-transparent"
                    style={{ backgroundImage: 'linear-gradient(135deg, #ff8c00, #ff3c3c)' }}>
                    Never again.
                  </span>
                </span>
              </h1>

              <p className="la-fade mt-6 max-w-md text-slate-400 leading-relaxed"
                style={{ fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)', fontSize: '14px' }}>
                A formal Telegram notice is delivered the moment a configured rule is breached.<br />
                <span className="text-slate-300">Timestamped. Actionable. Designed for discipline.</span>
              </p>

              <div className="la-fade mt-8 flex flex-wrap gap-3">
                <Link href="/signup"
                  className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-black transition-all hover:scale-[1.03]"
                  style={{ background: 'linear-gradient(135deg, #ff8c00, #ff3c3c)', boxShadow: '0 0 30px rgba(255,140,0,0.3)' }}>
                  Set up alerts
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/mock/dashboard"
                  className="inline-flex items-center gap-2 rounded-2xl border px-6 py-3 text-sm font-medium text-slate-300 transition-all hover:text-white"
                  style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                  Live demo
                </Link>
              </div>
            </div>

            {/* RIGHT — Telegram phone mockup */}
            <div className="hidden md:flex lg:w-[45%] justify-center">
              <div className="la-float relative w-64"
                style={{
                  background: '#0d1117',
                  borderRadius: '2.5rem',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '12px',
                  boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
                  minHeight: 320,
                }}>
                {/* Phone notch */}
                <div className="mx-auto mb-3 h-4 w-24 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
                {/* Mini chat */}
                <div className="rounded-2xl overflow-hidden" style={{ background: '#1c1c1e' }}>
                  <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div className="flex h-6 w-6 items-center justify-center rounded-full"
                      style={{ background: 'linear-gradient(135deg, #2AABEE, #229ED9)' }}>
                      <svg viewBox="0 0 24 24" className="h-3 w-3 fill-white">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.88 13.47l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.834.95l-.536-.861z" />
                      </svg>
                    </div>
                    <p className="text-[10px] font-bold text-white">RiskSent Bot</p>
                  </div>
                  <div className="p-2 space-y-2">
                    {[
                      { text: '🚨 HIGH ALERT\nDaily loss 1.8% / 2% limit', color: '#ff3c3c', time: '15:04' },
                      { text: '⚠️ WATCH\nWeekly risk at 82% of limit', color: '#ff8c00', time: '14:58' },
                    ].map((m, i) => (
                      <div key={i} className="rounded-xl px-2.5 py-2"
                        style={{ background: 'rgba(255,255,255,0.05)', borderLeft: `2px solid ${m.color}` }}>
                        <p className="text-[9px] font-mono text-slate-300 whitespace-pre-line leading-relaxed">{m.text}</p>
                        <p className="text-[8px] font-mono text-slate-600 text-right mt-0.5">{m.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Phone home bar */}
                <div className="mx-auto mt-3 h-1 w-20 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 1: Alert Types ─── */}
      <section className="py-24 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <motion.div className="mb-8" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0 }} transition={{ duration: 0.8, ease: [0.22,1,0.36,1] }}>
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-500 mb-3">Alert Types</p>
            <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-black leading-[0.95] tracking-[-0.03em] text-white"
              style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)' }}>
              Alerts that actually<br />
              <span className="text-slate-500">make you stop.</span>
            </h2>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-2">
            {ALERT_CARDS.map((alert, i) => (
              <motion.div key={i}
                className="rounded-[20px] p-6"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderLeft: `2px solid ${alert.badgeColor}`,
                }}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 25 } }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{alert.icon}</span>
                    <div>
                      <p className="font-black text-white text-sm" style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)' }}>
                        {alert.title}
                      </p>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">{alert.desc}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="rounded-full px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider"
                      style={{ color: alert.badgeColor, background: `${alert.badgeColor}15`, border: `1px solid ${alert.badgeColor}30` }}>
                      {alert.badge}
                    </span>
                    <span className="text-[9px] font-mono text-slate-600">{alert.time}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: Telegram Integration ─── */}
      <section className="py-24 px-6 lg:px-16" style={{ background: '#060607' }}>
        <div className="max-w-7xl mx-auto">
          <motion.div className="mb-8 text-center" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0 }} transition={{ duration: 0.8, ease: [0.22,1,0.36,1] }}>
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-500 mb-3">Setup</p>
            <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-black leading-[0.95] tracking-[-0.03em] text-white"
              style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)' }}>
              Connect in 30 seconds.<br />
              <span className="text-slate-500">No API keys. No coding.</span>
            </h2>
          </motion.div>

          <motion.div className="max-w-sm mx-auto" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0 }} transition={{ duration: 0.8, ease: [0.22,1,0.36,1] }}>
            {/* Phone mockup */}
            <div className="rounded-[2.5rem] overflow-hidden"
              style={{ background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 32px 100px rgba(0,0,0,0.6)' }}>
              {/* Status bar */}
              <div className="flex items-center justify-between px-6 pt-3 pb-2">
                <span className="text-[10px] font-mono text-slate-400">9:41</span>
                <div className="w-16 h-4 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div className="flex gap-1">
                  <div className="h-2 w-4 rounded-sm" style={{ background: 'rgba(255,255,255,0.3)' }} />
                </div>
              </div>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-2 border-b"
                style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ background: 'linear-gradient(135deg, #2AABEE, #229ED9)' }}>
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.88 13.47l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.834.95l-.536-.861z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">RiskSent Alerts Bot</p>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full" style={{ background: '#00e676', animation: 'blink-dot 1.5s infinite' }} />
                    <p className="text-[10px] font-mono text-slate-500">online</p>
                  </div>
                </div>
              </div>
              {/* Messages */}
              <div className="px-4 py-4 space-y-3 min-h-64">
                {TELEGRAM_MSGS.map((msg, i) => (
                  <motion.div key={i}
                    className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.2 }}>
                    <div className="max-w-[80%] rounded-2xl px-3 py-2.5"
                      style={{
                        background: msg.from === 'user' ? 'rgba(42,171,238,0.25)' : 'rgba(255,255,255,0.06)',
                        border: `1px solid ${msg.from === 'user' ? 'rgba(42,171,238,0.3)' : 'rgba(255,255,255,0.08)'}`,
                        borderBottomRightRadius: msg.from === 'user' ? 4 : undefined,
                        borderBottomLeftRadius: msg.from === 'bot' ? 4 : undefined,
                      }}>
                      <p className="text-xs font-mono text-slate-200 leading-relaxed">{msg.text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              {/* Bottom bar */}
              <div className="px-4 py-3 border-t flex items-center gap-2"
                style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex-1 rounded-full px-3 py-2 text-[10px] font-mono text-slate-600"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  Message
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ background: 'rgba(42,171,238,0.25)' }}>
                  <ArrowRight className="h-3 w-3 text-blue-400" />
                </div>
              </div>
              {/* Home bar */}
              <div className="flex justify-center py-2">
                <div className="h-1 w-24 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── SECTION 3: AI Smart Alerts ─── */}
      <section className="py-24 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <motion.div className="mb-8" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0 }} transition={{ duration: 0.8, ease: [0.22,1,0.36,1] }}>
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-500 mb-3">AI-Powered Alerts</p>
            <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-black leading-[0.95] tracking-[-0.03em] text-white"
              style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)' }}>
              Smarter alerts.<br />
              <span style={{ color: '#818cf8' }}>Behavioral detection.</span>
            </h2>
          </motion.div>

          <div className="space-y-4">
            {AI_ALERTS.map((alert, i) => (
              <motion.div key={i}
                className="flex items-start gap-5 rounded-[20px] p-6"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderLeft: `2px solid ${alert.color}`,
                }}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ x: 4, transition: { type: 'spring', stiffness: 400, damping: 25 } }}>
                <span className="text-2xl shrink-0 mt-0.5">{alert.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-black text-white" style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)' }}>
                      {alert.title}
                    </p>
                    <span className="rounded-full px-2 py-0.5 text-[9px] font-mono font-bold uppercase"
                      style={{ color: alert.color, background: `${alert.color}15`, border: `1px solid ${alert.color}30` }}>
                      AI
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-400 leading-relaxed">{alert.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <motion.div className="relative overflow-hidden rounded-3xl p-px" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0 }} transition={{ duration: 0.8, ease: [0.22,1,0.36,1] }}
            style={{ background: 'linear-gradient(135deg, rgba(255,140,0,0.5), rgba(255,60,60,0.3), rgba(255,255,255,0.03))' }}>
            <div className="relative overflow-hidden rounded-3xl px-8 py-16 text-center" style={{ background: '#0e0e12' }}>
              <div className="pointer-events-none absolute inset-0"
                style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,140,0,0.1) 0%, transparent 60%)' }} />
              <h2 className="relative text-[clamp(2rem,5vw,4rem)] font-black leading-[0.95] tracking-[-0.03em] text-white"
                style={{ fontFamily: 'var(--font-display, "Syne", sans-serif)' }}>
                Connect your Telegram<br />
                <span className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(135deg, #ff8c00, #ff3c3c)' }}>
                  today.
                </span>
              </h2>
              <p className="relative mt-4 text-slate-400 max-w-md mx-auto"
                style={{ fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)', fontSize: '14px' }}>
                Set your rules once. RiskSent watches forever.
              </p>
              <div className="relative mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link href="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-sm font-bold text-black transition-all hover:scale-[1.03]"
                  style={{ background: 'linear-gradient(135deg, #ff8c00, #ff3c3c)', boxShadow: '0 0 40px rgba(255,140,0,0.35)' }}>
                  Set up alerts free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/mock/dashboard"
                  className="inline-flex items-center justify-center rounded-2xl border px-8 py-4 text-sm font-medium text-slate-300 transition-all hover:text-white"
                  style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                  View demo
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
