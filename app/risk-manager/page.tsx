"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Shield, AlertTriangle, X } from "lucide-react";
import AnimatedCounter from "@/components/ui/animated-counter";

gsap.registerPlugin(ScrollTrigger);

const ACCENT = "#ff3c3c";

// Animated drawdown gauge SVG
function DrawdownGauge({ value = 78 }: { value?: number }) {
  // Arc from -130° to 50°, covering 180°
  const R = 70;
  const cx = 90;
  const cy = 90;
  const startAngle = -210;
  const endAngle = 30;
  const totalArc = endAngle - startAngle;
  const fillArc = (value / 100) * totalArc;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const polarToXY = (deg: number) => ({
    x: cx + R * Math.cos(toRad(deg)),
    y: cy + R * Math.sin(toRad(deg)),
  });

  const bgStart = polarToXY(startAngle);
  const bgEnd = polarToXY(endAngle);
  const fillEnd = polarToXY(startAngle + fillArc);

  const bgPath = `M ${bgStart.x} ${bgStart.y} A ${R} ${R} 0 1 1 ${bgEnd.x} ${bgEnd.y}`;
  const fillPath = `M ${bgStart.x} ${bgStart.y} A ${R} ${R} 0 ${fillArc > 180 ? 1 : 0} 1 ${fillEnd.x} ${fillEnd.y}`;

  return (
    <svg viewBox="0 0 180 120" className="w-full max-w-xs mx-auto">
      {/* Track */}
      <path d={bgPath} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" strokeLinecap="round" />
      {/* Safe zone (green) 0-50% */}
      <path
        d={`M ${bgStart.x} ${bgStart.y} A ${R} ${R} 0 0 1 ${polarToXY(startAngle + totalArc * 0.5).x} ${polarToXY(startAngle + totalArc * 0.5).y}`}
        fill="none" stroke="rgba(0,230,118,0.25)" strokeWidth="10" strokeLinecap="round"
      />
      {/* Warning zone (orange) 50-75% */}
      <path
        d={`M ${polarToXY(startAngle + totalArc * 0.5).x} ${polarToXY(startAngle + totalArc * 0.5).y} A ${R} ${R} 0 0 1 ${polarToXY(startAngle + totalArc * 0.75).x} ${polarToXY(startAngle + totalArc * 0.75).y}`}
        fill="none" stroke="rgba(255,140,0,0.25)" strokeWidth="10" strokeLinecap="round"
      />
      {/* Danger zone (red) 75-100% */}
      <path
        d={`M ${polarToXY(startAngle + totalArc * 0.75).x} ${polarToXY(startAngle + totalArc * 0.75).y} A ${R} ${R} 0 0 1 ${bgEnd.x} ${bgEnd.y}`}
        fill="none" stroke="rgba(255,60,60,0.25)" strokeWidth="10" strokeLinecap="round"
      />
      {/* Fill */}
      <motion.path
        d={fillPath}
        fill="none"
        strokeWidth="10"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.8, ease: "easeOut", delay: 0.3 }}
        stroke={value > 75 ? ACCENT : value > 50 ? "#ff8c00" : "#00e676"}
        style={{ filter: `drop-shadow(0 0 8px ${value > 75 ? ACCENT : "#ff8c00"})` }}
      />
      {/* Needle */}
      <motion.line
        x1={cx} y1={cy}
        x2={cx + (R - 12) * Math.cos(toRad(startAngle + fillArc))}
        y2={cy + (R - 12) * Math.sin(toRad(startAngle + fillArc))}
        stroke="white" strokeWidth="2" strokeLinecap="round"
        initial={{ rotate: 0, originX: `${cx}px`, originY: `${cy}px` }}
      />
      <circle cx={cx} cy={cy} r="4" fill="white" style={{ filter: "drop-shadow(0 0 4px white)" }} />
      {/* Label */}
      <text x={cx} y={cy + 28} textAnchor="middle" fill={value > 75 ? ACCENT : "#ff8c00"}
        fontSize="20" fontWeight="900" fontFamily="'Syne', sans-serif">
        {value}%
      </text>
      <text x={cx} y={cy + 40} textAnchor="middle" fill="rgba(148,163,184,0.7)"
        fontSize="7" fontFamily="'JetBrains Mono', monospace" letterSpacing="2">
        DRAWDOWN
      </text>
    </svg>
  );
}

// Hard-block modal demo
function HardBlockDemo() {
  const [triggered, setTriggered] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!triggerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered) {
          setTimeout(() => setTriggered(true), 800);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(triggerRef.current);
    return () => observer.disconnect();
  }, [triggered]);

  return (
    <div ref={triggerRef} className="relative">
      {/* Blurred "trading screen" mockup behind */}
      <div
        className="rounded-2xl p-6 border"
        style={{
          background: "rgba(14,14,18,0.9)",
          borderColor: "rgba(255,255,255,0.07)",
          filter: triggered ? "blur(3px) brightness(0.4)" : "none",
          transition: "filter 0.4s ease",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono text-slate-400">MT4 — EURUSD</span>
          <span className="text-xs font-mono text-emerald-400">Bid: 1.08421</span>
        </div>
        {[["BUY", "1.08421", "0.5 lots"], ["SELL", "1.08419", "0.3 lots"]].map(([dir, price, size]) => (
          <div key={dir} className="flex items-center justify-between rounded-xl px-4 py-3 mb-2"
            style={{ background: dir === "BUY" ? "rgba(0,230,118,0.08)" : "rgba(255,60,60,0.08)" }}>
            <span className="text-sm font-bold" style={{ color: dir === "BUY" ? "#00e676" : "#ff3c3c" }}>{dir}</span>
            <span className="text-xs font-mono text-slate-400">{price}</span>
            <span className="text-xs font-mono text-slate-400">{size}</span>
          </div>
        ))}
        <button className="w-full mt-3 rounded-xl py-3 text-sm font-bold text-black"
          style={{ background: "linear-gradient(135deg, #ff3c3c, #ff8c00)" }}>
          Place Order
        </button>
      </div>

      {/* Hard-block overlay */}
      <AnimatePresence>
        {triggered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute inset-0 flex items-center justify-center z-10"
          >
            <div
              className="rounded-2xl p-6 w-full max-w-sm mx-auto text-center"
              style={{
                background: "rgba(10,6,6,0.97)",
                border: "1px solid rgba(255,60,60,0.4)",
                boxShadow: "0 0 60px rgba(255,60,60,0.2), 0 24px 80px rgba(0,0,0,0.7)",
              }}
            >
              <div className="flex items-center justify-center mb-4">
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="h-12 w-12 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(255,60,60,0.15)", border: "1px solid rgba(255,60,60,0.3)" }}
                >
                  <AlertTriangle className="h-6 w-6" style={{ color: ACCENT }} />
                </motion.div>
              </div>
              <h3 className="text-base font-black text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
                HARD BLOCK — TRADING HALTED
              </h3>
              <p className="text-xs text-slate-400 mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Daily drawdown limit reached: <span style={{ color: ACCENT }}>-5.0%</span><br />
                You cannot place new orders until 00:00 UTC.
              </p>
              <div className="text-[10px] font-mono text-slate-600 border-t border-white/[0.06] pt-3">
                RISKSENT SENTINEL · Rule #3 triggered · Apr 14 16:42 UTC
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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

      {/* HERO */}
      <section className="relative min-h-[85vh] flex flex-col justify-center px-6 pt-24 pb-20 lg:px-16 overflow-hidden">
        {/* Pulsing red alarm glow */}
        <div className="alarm-ring pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(255,60,60,0.09) 0%, transparent 65%)" }} />
          <div className="absolute bottom-0 right-0 w-[50vw] h-[50vw] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(255,140,0,0.05) 0%, transparent 65%)" }} />
        </div>
        <div className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,60,60,0.06) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
          }}
        />

        <div className="relative max-w-7xl mx-auto w-full">
          <div className="rm-fade mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-[0.2em]"
              style={{ color: ACCENT, borderColor: "rgba(255,60,60,0.3)", background: "rgba(255,60,60,0.08)" }}>
              <Shield className="h-3 w-3" />
              Risk Manager
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
              <span className="text-slate-300">Stop blowing accounts. Start following your rules.</span>
            </p>
            <div className="flex gap-3">
              <Link href="/signup"
                className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-black transition-all hover:scale-[1.03] cursor-pointer"
                style={{ background: "linear-gradient(135deg, #ff3c3c, #ff8c00)", boxShadow: "0 0 30px rgba(255,60,60,0.3)" }}>
                Protect your account <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="px-6 lg:px-16 py-12 border-y"
        style={{ borderColor: "rgba(255,60,60,0.1)", background: "rgba(14,14,18,0.9)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { staticLabel: "< 1s", label: "Alert latency",        color: ACCENT,    to: 1 },
            { staticLabel: "24/7", label: "Live monitoring",      color: "#ff8c00", to: 247 },
            { suffix: "%",         label: "Rule compliance rate", color: "#00e676", to: 99 },
            { suffix: "",          label: "Accounts protected",   color: ACCENT,    to: 843 },
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

      {/* GAUGE + HARD BLOCK DEMO */}
      <section className="px-6 lg:px-16 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="rm-reveal mb-12">
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-500 mb-3">In action</p>
            <h2 className="text-[clamp(36px,5vw,64px)] font-black leading-[0.95] tracking-[-0.03em] text-white"
              style={{ fontFamily: "'Syne', sans-serif" }}>
              See the breach<br /><span className="text-slate-500">before it happens.</span>
            </h2>
          </div>

          <div className="rm-reveal grid gap-6 lg:grid-cols-2">
            {/* Gauge */}
            <div className="rounded-2xl p-8 text-center alarm-ring"
              style={{
                background: "rgba(14,14,18,0.9)",
                border: "1px solid rgba(255,60,60,0.2)",
                backdropFilter: "blur(20px)",
              }}>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-500 mb-6">
                Daily Drawdown Monitor
              </p>
              <DrawdownGauge value={78} />
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                {[
                  { label: "Safe",    range: "0–50%",   color: "#00e676" },
                  { label: "Warning", range: "50–75%",  color: "#ff8c00" },
                  { label: "Danger",  range: "75–100%", color: ACCENT    },
                ].map((z) => (
                  <div key={z.label} className="rounded-xl py-2 px-3"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="text-[10px] font-bold mb-0.5" style={{ color: z.color }}>{z.label}</div>
                    <div className="text-[9px] font-mono text-slate-600">{z.range}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hard block demo */}
            <div className="rm-reveal">
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-500 mb-4">
                Hard-block system — live demo
              </p>
              <HardBlockDemo />
              <p className="mt-4 text-xs text-slate-600 font-mono">
                ↑ Watch what happens when your daily limit is hit. Scroll to trigger.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-6 lg:px-16 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="rm-reveal mb-12">
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-500 mb-3">Features</p>
            <h2 className="text-[clamp(36px,5vw,64px)] font-black leading-[0.95] tracking-[-0.03em] text-white"
              style={{ fontFamily: "'Syne', sans-serif" }}>
              Rules enforced.<br /><span className="text-slate-500">Not suggested.</span>
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Daily drawdown cap",   desc: "Set your max daily loss. When hit, trading access is revoked until the next session.", color: ACCENT },
              { title: "Max open positions",   desc: "Cap the number of simultaneous positions. Prevent overexposure on any single session.", color: "#ff8c00" },
              { title: "Pair-level limits",    desc: "Restrict your exposure per currency pair. No more doubling down on losing positions.", color: ACCENT },
              { title: "Win-streak rules",     desc: "Lock out trading after 3 consecutive wins. Protect your gains from euphoria trading.", color: "#00e676" },
              { title: "Session restrictions", desc: "Block trading during high-impact news events or sessions outside your edge window.", color: "#818cf8" },
              { title: "Telegram alerts",      desc: "Instant notification the moment a rule is triggered. Full context, zero ambiguity.", color: "#ff8c00" },
            ].map((f, i) => (
              <motion.div key={i} initial={false}
                whileHover={{ y: -8, scale: 1.01, transition: { type: "spring", stiffness: 400, damping: 26 } }}
                className="rm-reveal scan-card group relative overflow-hidden rounded-2xl p-6 cursor-default"
                style={{ background: "rgba(14,14,18,0.85)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(12px)" }}>
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(ellipse at 0% 0%, ${f.color}12 0%, transparent 65%)` }} />
                <div className="relative">
                  <div className="h-2 w-2 rounded-full mb-4 animate-alarm-pulse"
                    style={{ background: f.color, boxShadow: `0 0 12px ${f.color}` }} />
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
          <div className="rm-reveal relative overflow-hidden rounded-3xl p-px"
            style={{ background: "linear-gradient(135deg, rgba(255,60,60,0.5), rgba(255,140,0,0.3), rgba(255,255,255,0.03))" }}>
            <div className="relative overflow-hidden rounded-3xl px-8 py-16 text-center alarm-ring" style={{ background: "#0a0608" }}>
              <div className="pointer-events-none absolute inset-0"
                style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(255,60,60,0.1) 0%, transparent 60%)" }} />
              <h2 className="relative text-[clamp(36px,5vw,72px)] font-black leading-[0.95] tracking-[-0.03em] text-white"
                style={{ fontFamily: "'Syne', sans-serif" }}>
                Never blow<br />
                <span className="bg-clip-text text-transparent"
                  style={{ backgroundImage: "linear-gradient(135deg, #ff3c3c, #ff8c00)" }}>
                  an account again.
                </span>
              </h2>
              <p className="relative mt-4 text-slate-400 max-w-md mx-auto"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px" }}>
                Zero excuses. Hard blocks. Real protection.
              </p>
              <div className="relative mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link href="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-sm font-bold text-black transition-all hover:scale-[1.03] cursor-pointer"
                  style={{ background: "linear-gradient(135deg, #ff3c3c, #ff8c00)", boxShadow: "0 0 50px rgba(255,60,60,0.4)" }}>
                  Protect my account <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
