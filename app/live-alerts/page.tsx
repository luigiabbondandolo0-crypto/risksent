"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { ArrowRight, Bell } from "lucide-react";
import { HomeLiveAlertsPhone } from "@/components/home/HomeLiveAlertsPhone";

gsap.registerPlugin(ScrollTrigger);

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

      {/* Hero */}
      <section className="relative min-h-[80vh] flex flex-col justify-center px-6 pt-24 pb-20 lg:px-16 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(255,140,0,0.07) 0%, transparent 65%)" }} />
          <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(255,60,60,0.04) 0%, transparent 65%)" }} />
        </div>

        <div className="relative max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
            <div className="min-w-0 flex-1">
              <div className="la-fade mb-6">
                <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-[0.2em]"
                  style={{ color: "#ff8c00", borderColor: "rgba(255,140,0,0.3)", background: "rgba(255,140,0,0.08)" }}>
                  <Bell className="h-3 w-3" />
                  Live Alerts
                </span>
              </div>

              <h1 className="text-[clamp(48px,8vw,120px)] font-black leading-[0.9] tracking-[-0.04em] text-white mb-8"
                style={{ fontFamily: "'Syne', sans-serif" }}>
                {["The", "right"].map((w, i) => (
                  <span key={i} className="inline-block overflow-hidden mr-[0.2em]">
                    <span className="la-hero-word inline-block">{w}</span>
                  </span>
                ))}
                <br />
                {["alert", "at", "the"].map((w, i) => (
                  <span key={i} className="inline-block overflow-hidden mr-[0.2em]">
                    <span className="la-hero-word inline-block">{w}</span>
                  </span>
                ))}
                <br />
                <span className="inline-block overflow-hidden">
                  <span className="la-hero-word inline-block bg-clip-text text-transparent"
                    style={{ backgroundImage: "linear-gradient(135deg, #ff8c00, #ff3c3c)" }}>
                    right moment.
                  </span>
                </span>
              </h1>

              <div className="la-fade flex flex-col gap-6">
                <p className="max-w-lg text-slate-400 leading-relaxed"
                  style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px" }}>
                  One blunt Telegram ping the instant a rule breaks — not after the damage, not when it&apos;s convenient.<br />
                  <span className="text-slate-300">Treat it like a floor call: you comply, or you stand down.</span>
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/signup"
                    className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-black transition-all hover:scale-[1.03]"
                    style={{ background: "linear-gradient(135deg, #ff8c00, #ff3c3c)", boxShadow: "0 0 30px rgba(255,140,0,0.3)" }}>
                    Set up alerts
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

            <div className="la-fade flex shrink-0 justify-center pt-20 lg:justify-end lg:pt-8">
              <HomeLiveAlertsPhone />
            </div>
          </div>
        </div>
      </section>

      {/* Preview */}
      <section className="px-6 lg:px-16 py-16">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={false}
            whileHover={{ y: -4, transition: { type: "spring", stiffness: 380, damping: 28 } }}
            className="la-reveal relative overflow-hidden rounded-3xl p-px shadow-lg shadow-black/25 transition-shadow hover:shadow-[0_28px_70px_rgba(0,0,0,0.45)]"
            style={{ background: "linear-gradient(135deg, rgba(255,140,0,0.4), rgba(255,60,60,0.2), rgba(255,255,255,0.05))" }}>
            <div className="rounded-3xl p-8 lg:p-12" style={{ background: "#0e0e12" }}>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Live Alerts Dashboard</p>
                  <p className="text-lg font-bold text-white mt-1" style={{ fontFamily: "'Syne', sans-serif" }}>Risk alerts · Today</p>
                </div>
                <span className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-widest"
                  style={{ color: "#ff8c00", background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.2)" }}>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-orange-400" />
                  </span>
                  2 active
                </span>
              </div>

              <div className="space-y-3 mb-6">
                {[
                  { severity: "HIGH", color: "#ff3c3c", msg: "Exposure above comfort zone vs your plan", solution: "Close or hedge one position before adding size.", time: "15:04" },
                  { severity: "WATCH", color: "#ff8c00", msg: "Daily loss approaching limit (2.8% of 3%)", solution: "Reduce size or pause until tomorrow.", time: "14:58" },
                ].map((a, i) => (
                  <div key={i} className="relative overflow-hidden rounded-2xl p-4"
                    style={{
                      background: `rgba(${a.color === "#ff3c3c" ? "255,60,60" : "255,140,0"},0.06)`,
                      border: `1px solid ${a.color}30`,
                      borderLeft: `4px solid ${a.color}`,
                    }}>
                    {a.severity === "HIGH" && (
                      <div className="pointer-events-none absolute inset-0 animate-[glow-pulse_2s_ease-in-out_infinite] rounded-2xl" />
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest"
                        style={{ color: a.color, background: `${a.color}15`, border: `1px solid ${a.color}30` }}>
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                            style={{ background: a.color }} />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: a.color }} />
                        </span>
                        {a.severity}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">10/04/26, {a.time}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-100 mb-1">{a.msg}</p>
                    <p className="text-xs text-slate-500">
                      <span className="text-slate-600">Next step: </span>{a.solution}
                    </p>
                  </div>
                ))}
              </div>

              {/* Telegram mock */}
              <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ background: "linear-gradient(135deg, #2AABEE, #229ED9)" }}>
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.88 13.47l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.834.95l-.536-.861z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">RiskSent Alerts Bot</p>
                    <p className="text-[10px] font-mono text-slate-500">@RiskSentAlertsBot</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { text: "⚠️ HIGH ALERT\nExposure above comfort zone vs your plan\nNext step: Close or hedge one position before adding size.", time: "15:04", color: "#ff3c3c" },
                    { text: "👁 WATCH\nDaily loss approaching limit (2.8% of 3%)\nNext step: Reduce size or pause until tomorrow.", time: "14:58", color: "#ff8c00" },
                  ].map((m, i) => (
                    <div key={i} className="rounded-xl px-3 py-2.5 max-w-xs"
                      style={{ background: "rgba(255,255,255,0.05)", borderLeft: `3px solid ${m.color}` }}>
                      <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">{m.text}</p>
                      <p className="text-[9px] font-mono text-slate-600 mt-1 text-right">{m.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 lg:px-16 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="la-reveal mb-12">
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-500 mb-3">Features</p>
            <h2 className="text-[clamp(36px,5vw,64px)] font-black leading-[0.95] tracking-[-0.03em] text-white"
              style={{ fontFamily: "'Syne', sans-serif" }}>
              Alerts that actually<br />
              <span className="text-slate-500">make you stop.</span>
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Telegram alerts", desc: "Instant alerts on your phone via Telegram. The moment a rule is broken, you know.", color: "#ff8c00" },
              { title: "Severity levels", desc: "WATCH alerts warn you early. HIGH alerts demand immediate action. Zero confusion.", color: "#ff3c3c" },
              { title: "Next step guidance", desc: "Every alert includes a specific next step. No panic — just clear action.", color: "#ff8c00" },
              { title: "Custom rules", desc: "Set unlimited custom rules. Daily loss, exposure, revenge trades, time-based blocks.", color: "#ff3c3c" },
              { title: "Alert history", desc: "Full log of every alert with timestamp. Review your patterns and improve your discipline.", color: "#ff8c00" },
              { title: "Zero missed alerts", desc: "RiskSent monitors your account 24/7. Even when you're not watching, it is.", color: "#ff3c3c" },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={false}
                whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 26 } }}
                whileTap={{ scale: 0.99 }}
                className="la-reveal group relative overflow-hidden rounded-2xl p-6 transition-shadow hover:shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(ellipse at 0% 100%, ${f.color}10 0%, transparent 70%)` }} />
                <div className="relative">
                  <motion.div
                    className="h-2 w-2 rounded-full mb-4"
                    style={{ background: f.color, boxShadow: `0 0 8px ${f.color}` }}
                    animate={{ scale: [1, 1.15, 1], opacity: [1, 0.85, 1] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.12 }}
                  />
                  <h3 className="text-base font-black text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>{f.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{f.desc}</p>
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
            style={{ background: "linear-gradient(135deg, rgba(255,140,0,0.5), rgba(255,60,60,0.3), rgba(255,255,255,0.03))" }}>
            <div className="relative overflow-hidden rounded-3xl px-8 py-16 text-center" style={{ background: "#0e0e12" }}>
              <div className="pointer-events-none absolute inset-0"
                style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(255,140,0,0.1) 0%, transparent 60%)" }} />
              <h2 className="relative text-[clamp(36px,5vw,72px)] font-black leading-[0.95] tracking-[-0.03em] text-white"
                style={{ fontFamily: "'Syne', sans-serif" }}>
                Never miss<br />
                <span className="bg-clip-text text-transparent"
                  style={{ backgroundImage: "linear-gradient(135deg, #ff8c00, #ff3c3c)" }}>
                  a critical moment.
                </span>
              </h2>
              <p className="relative mt-4 text-slate-400 max-w-md mx-auto"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px" }}>
                Set your rules once. RiskSent watches forever.
              </p>
              <div className="relative mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link href="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-sm font-bold text-black transition-all hover:scale-[1.03]"
                  style={{ background: "linear-gradient(135deg, #ff8c00, #ff3c3c)", boxShadow: "0 0 40px rgba(255,140,0,0.35)" }}>
                  Set up alerts free
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
