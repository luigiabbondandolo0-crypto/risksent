"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Bell } from "lucide-react";
import { HomeLiveAlertsPhone } from "@/components/home/HomeLiveAlertsPhone";
import AnimatedCounter from "@/components/ui/animated-counter";

gsap.registerPlugin(ScrollTrigger);

const ACCENT = "#ff8c00";

// Mock Telegram alert notifications
const ALERTS = [
  { icon: "🛑", title: "HARD BLOCK", msg: "Daily DD limit -5% reached. Trading halted.", time: "16:42", color: "#ff3c3c", bold: true },
  { icon: "⚠️", title: "WARNING",    msg: "Open positions exceed limit (4/3). Close one.", time: "14:21", color: ACCENT, bold: false },
  { icon: "✅", title: "RULE OK",    msg: "Win streak 3/3 — consider reducing size.", time: "11:05", color: "#00e676", bold: false },
  { icon: "📊", title: "SESSION",    msg: "London session started. Your rules are active.", time: "08:00", color: "#22d3ee", bold: false },
];

function AlertsDemo() {
  const [visibleCount, setVisibleCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && visibleCount === 0) {
          let count = 0;
          const id = setInterval(() => {
            count++;
            setVisibleCount(count);
            if (count >= ALERTS.length) clearInterval(id);
          }, 600);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [visibleCount]);

  return (
    <div ref={containerRef} className="space-y-3">
      <AnimatePresence>
        {ALERTS.slice(0, visibleCount).map((a, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, x: -32, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="flex items-start gap-3 rounded-2xl px-4 py-3"
            style={{
              background: "rgba(14,14,18,0.95)",
              border: `1px solid ${a.color}25`,
              backdropFilter: "blur(12px)",
              boxShadow: a.bold ? `0 0 20px ${a.color}15` : undefined,
            }}>
            <div className="shrink-0 h-8 w-8 rounded-xl flex items-center justify-center text-sm"
              style={{ background: `${a.color}15`, border: `1px solid ${a.color}30` }}>
              {a.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="text-[11px] font-mono font-bold uppercase tracking-widest"
                  style={{ color: a.color }}>{a.title}</span>
                <span className="text-[10px] font-mono text-slate-600 shrink-0">{a.time}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>{a.msg}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default function LiveAlertsPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.refresh();
      gsap.from(".la-hero-word", {
        yPercent: 110, opacity: 0, duration: 1, stagger: 0.07, ease: "expo.out", delay: 0.2,
      });
      gsap.from(".la-fade", {
        opacity: 0, y: 20, duration: 0.8, stagger: 0.1, delay: 0.8, ease: "power3.out",
      });
      gsap.utils.toArray<HTMLElement>(".la-reveal").forEach((el) => {
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
          <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(255,140,0,0.08) 0%, transparent 65%)" }} />
          <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(255,60,60,0.04) 0%, transparent 65%)" }} />
        </div>
        <div className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,140,0,0.05) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
          }}
        />

        <div className="relative max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
            <div className="min-w-0 flex-1">
              <div className="la-fade mb-6">
                <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-[0.2em]"
                  style={{ color: ACCENT, borderColor: "rgba(255,140,0,0.3)", background: "rgba(255,140,0,0.08)" }}>
                  <Bell className="h-3 w-3" />
                  Live Alerts
                </span>
              </div>

              <h1 className="text-[clamp(48px,8vw,120px)] font-black leading-[0.9] tracking-[-0.04em] text-white mb-8"
                style={{ fontFamily: "'Syne', sans-serif" }}>
                {["One", "alert."].map((w, i) => (
                  <span key={i} className="inline-block overflow-hidden mr-[0.2em]">
                    <span className="la-hero-word inline-block">{w}</span>
                  </span>
                ))}
                <br />
                {["One"].map((w, i) => (
                  <span key={i} className="inline-block overflow-hidden mr-[0.2em]">
                    <span className="la-hero-word inline-block">{w}</span>
                  </span>
                ))}
                <span className="inline-block overflow-hidden">
                  <span className="la-hero-word inline-block bg-clip-text text-transparent"
                    style={{ backgroundImage: "linear-gradient(135deg, #ff8c00, #ff3c3c)" }}>
                    decision.
                  </span>
                </span>
              </h1>

              <p className="la-fade max-w-lg text-slate-400 leading-relaxed mb-8"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px" }}>
                When a rule is breached, you receive a single documented notice via Telegram at the time of the event.<br />
                <span className="text-slate-300">No ambiguity. No delay. No excuses.</span>
              </p>

              <div className="la-fade flex gap-3">
                <Link href="/signup"
                  className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-black transition-all hover:scale-[1.03] cursor-pointer"
                  style={{ background: "linear-gradient(135deg, #ff8c00, #ff3c3c)", boxShadow: "0 0 30px rgba(255,140,0,0.3)" }}>
                  Set up alerts <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Phone mockup */}
            <div className="la-fade shrink-0 flex justify-center lg:justify-end">
              <HomeLiveAlertsPhone />
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="px-6 lg:px-16 py-12 border-y"
        style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(14,14,18,0.9)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { staticLabel: "< 1s", label: "Alert latency",      color: ACCENT,    to: 1 },
            { suffix: "",          label: "Missed alerts",       color: "#00e676", to: 0 },
            { staticLabel: "∞",    label: "Custom rules",        color: ACCENT,    to: 999 },
            { staticLabel: "24/7", label: "Active monitoring",   color: "#22d3ee", to: 247 },
          ].map((s, i) => (
            <div key={i} className="stat-item text-center">
              <div className="text-[clamp(32px,4vw,56px)] font-black tracking-tight mb-1"
                style={{ fontFamily: "'Syne', sans-serif", color: s.color, textShadow: `0 0 30px ${s.color}50` }}>
                <AnimatedCounter
                  to={s.to}
                  suffix={s.suffix ?? ""}
                  staticLabel={s.staticLabel}
                  glowColor={s.color}
                  duration={1400}
                />
              </div>
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ALERTS DEMO */}
      <section className="px-6 lg:px-16 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="la-reveal mb-12 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-500 mb-3">Alert stream</p>
              <h2 className="text-[clamp(36px,5vw,64px)] font-black leading-[0.95] tracking-[-0.03em] text-white"
                style={{ fontFamily: "'Syne', sans-serif" }}>
                Every breach.<br /><span className="text-slate-500">Documented instantly.</span>
              </h2>
            </div>
            <p className="text-sm text-slate-500 font-mono max-w-xs">
              Scroll into view to watch the alerts arrive in real time.
            </p>
          </div>

          <div className="la-reveal grid gap-6 lg:grid-cols-2 lg:items-start">
            <AlertsDemo />
            <div className="la-reveal rounded-2xl p-6 lg:p-8"
              style={{ background: "rgba(14,14,18,0.85)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(12px)" }}>
              <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-slate-500 mb-4">How it works</p>
              {[
                { step: "01", title: "You set the rules", desc: "Define drawdown limits, position caps, session restrictions, and more." },
                { step: "02", title: "We monitor 24/7", desc: "RiskSent connects to your broker via read-only API and watches every position in real time." },
                { step: "03", title: "Alert fires instantly", desc: "The moment a rule is breached, a Telegram message lands in your phone in under 1 second." },
                { step: "04", title: "You decide", desc: "The notice is documented, timestamped, and aligned with your trading plan. Action is yours." },
              ].map((s) => (
                <div key={s.step} className="flex gap-4 mb-5 last:mb-0">
                  <span className="text-[10px] font-mono font-bold shrink-0 mt-0.5"
                    style={{ color: ACCENT }}>{s.step}</span>
                  <div>
                    <p className="text-sm font-bold text-white mb-0.5" style={{ fontFamily: "'Syne', sans-serif" }}>{s.title}</p>
                    <p className="text-xs text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-6 lg:px-16 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="la-reveal mb-12">
            <h2 className="text-[clamp(36px,5vw,64px)] font-black leading-[0.95] tracking-[-0.03em] text-white"
              style={{ fontFamily: "'Syne', sans-serif" }}>
              Every rule you set.<br /><span className="text-slate-500">Every breach you catch.</span>
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Telegram delivery",    desc: "Alerts land in your private Telegram chat. No apps to install, no email to check.", color: ACCENT },
              { title: "< 1s latency",         desc: "From breach detection to your phone in under one second. Every single time.", color: "#22d3ee" },
              { title: "Full context",          desc: "Every alert includes rule name, account state, time, and suggested action.", color: ACCENT },
              { title: "Timestamped log",       desc: "Every alert is logged and searchable. Your compliance trail is always complete.", color: "#00e676" },
              { title: "Custom thresholds",     desc: "Set any rule you need — DD, position count, pair, session, streak, and more.", color: "#818cf8" },
              { title: "Multi-account",         desc: "Monitor multiple broker accounts simultaneously. One Telegram channel, all alerts.", color: ACCENT },
            ].map((f, i) => (
              <motion.div key={i} initial={false}
                whileHover={{ y: -6, transition: { type: "spring", stiffness: 380, damping: 26 } }}
                className="la-reveal scan-card group relative overflow-hidden rounded-2xl p-6 cursor-default"
                style={{ background: "rgba(14,14,18,0.85)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(12px)" }}>
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(ellipse at 0% 100%, ${f.color}10 0%, transparent 70%)` }} />
                <div className="relative">
                  <div className="h-2 w-2 rounded-full mb-4" style={{ background: f.color, boxShadow: `0 0 8px ${f.color}` }} />
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
          <div className="la-reveal relative overflow-hidden rounded-3xl p-px"
            style={{ background: "linear-gradient(135deg, rgba(255,140,0,0.45), rgba(255,60,60,0.3), rgba(255,255,255,0.03))" }}>
            <div className="relative overflow-hidden rounded-3xl px-8 py-16 text-center" style={{ background: "#0c0906" }}>
              <div className="pointer-events-none absolute inset-0"
                style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(255,140,0,0.08) 0%, transparent 60%)" }} />
              <h2 className="relative text-[clamp(36px,5vw,72px)] font-black leading-[0.95] tracking-[-0.03em] text-white"
                style={{ fontFamily: "'Syne', sans-serif" }}>
                Rules without alerts<br />
                <span className="bg-clip-text text-transparent"
                  style={{ backgroundImage: "linear-gradient(135deg, #ff8c00, #ff3c3c)" }}>
                  are just wishes.
                </span>
              </h2>
              <p className="relative mt-4 text-slate-400 max-w-md mx-auto"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px" }}>
                Set your rules once. Get alerted the moment they matter.
              </p>
              <div className="relative mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link href="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-sm font-bold text-black transition-all hover:scale-[1.03] cursor-pointer"
                  style={{ background: "linear-gradient(135deg, #ff8c00, #ff3c3c)", boxShadow: "0 0 40px rgba(255,140,0,0.35)" }}>
                  Set up alerts free <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
