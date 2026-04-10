"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { ArrowRight, Check, X, Zap } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function PricingPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.refresh();
      gsap.from(".pr-hero-word", {
        yPercent: 110, opacity: 0, duration: 1, stagger: 0.07, ease: "expo.out", delay: 0.2,
      });
      gsap.from(".pr-fade", {
        opacity: 0, y: 20, duration: 0.8, stagger: 0.1, delay: 0.8, ease: "power3.out",
      });
      gsap.utils.toArray<HTMLElement>(".pr-reveal").forEach((el) => {
        gsap.from(el, {
          opacity: 0, y: 40, duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none none" },
        });
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const plans = [
    {
      name: "New Trader",
      price: "€25",
      cta: "Start New Trader",
      highlight: false,
      features: [
        { label: "Max 1 account", included: true },
        { label: "3 Backtesting sessions", included: true },
        { label: "Trading Journal", included: false },
        { label: "Risk Sentinel", included: false },
        { label: "Live alerts", included: false },
      ],
    },
    {
      name: "Experienced Trader",
      price: "€39",
      cta: "Start Experienced Trader",
      highlight: true,
      features: [
        { label: "Unlimited Accounts", included: true },
        { label: "Unlimited backtesting", included: true },
        { label: "Trading Journal", included: true },
        { label: "Risk Sentinel", included: true },
        { label: "Live alerts", included: true },
      ],
    },
  ] as const;

  return (
    <div ref={containerRef} className="min-h-full overflow-x-hidden bg-[#080809]">

      {/* Hero */}
      <section className="relative min-h-[60vh] flex flex-col justify-center px-6 pt-24 pb-16 lg:px-16 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[80vw] h-[60vw] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(255,60,60,0.07) 0%, transparent 65%)" }} />
        </div>

        <div className="relative max-w-4xl mx-auto w-full text-center">
          <div className="pr-fade mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-[0.2em]"
              style={{ color: "#ff8c00", borderColor: "rgba(255,140,0,0.3)", background: "rgba(255,140,0,0.08)" }}>
              <Zap className="h-3 w-3" />
              Pricing
            </span>
          </div>

          <h1 className="text-[clamp(48px,8vw,100px)] font-black leading-[0.9] tracking-[-0.04em] text-white mb-6"
            style={{ fontFamily: "'Syne', sans-serif" }}>
            {["One", "price."].map((w, i) => (
              <span key={i} className="inline-block overflow-hidden mr-[0.2em]">
                <span className="pr-hero-word inline-block">{w}</span>
              </span>
            ))}
            <br />
            <span className="inline-block overflow-hidden">
              <span className="pr-hero-word inline-block bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(135deg, #ff3c3c, #ff8c00)" }}>
                Everything.
              </span>
            </span>
          </h1>

          <p className="pr-fade text-slate-400 max-w-lg mx-auto"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px" }}>
            Choose the profile that matches your level.<br />
            Simple pricing, monthly.
          </p>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="px-6 lg:px-16 py-8">
        <div className="max-w-5xl mx-auto grid gap-5 lg:grid-cols-2">
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              initial={false}
              whileHover={{ y: -8, transition: { type: "spring", stiffness: 400, damping: 26 } }}
              whileTap={{ scale: 0.995 }}
              className="pr-reveal relative overflow-hidden rounded-3xl p-px shadow-lg shadow-black/20 transition-shadow hover:shadow-[0_28px_70px_rgba(0,0,0,0.45)]"
              style={{ background: plan.highlight ? "linear-gradient(135deg, rgba(255,60,60,0.5), rgba(255,140,0,0.35), rgba(255,255,255,0.08))" : "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.06))" }}>
              <div className="relative rounded-3xl p-8 lg:p-9" style={{ background: "#0e0e12" }}>
                {plan.highlight && (
                  <div className="mb-4 inline-flex rounded-full border px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-widest"
                    style={{ color: "#ff8c00", borderColor: "rgba(255,140,0,0.35)", background: "rgba(255,140,0,0.08)" }}>
                    Most complete
                  </div>
                )}
                <p className="text-xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>{plan.name}</p>
                <div className="mt-3 flex items-end gap-2">
                  <span className="text-[56px] leading-none font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>{plan.price}</span>
                  <span className="mb-2 text-slate-500 font-mono">/ month</span>
                </div>
                <Link href="/signup"
                  className="mt-6 flex items-center justify-center gap-2 w-full rounded-2xl py-3.5 text-sm font-bold text-black transition-all hover:scale-[1.02]"
                  style={{ background: "linear-gradient(135deg, #ff3c3c, #ff8c00)", boxShadow: "0 0 30px rgba(255,60,60,0.25)" }}>
                  {plan.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <div className="mt-6 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                <div className="mt-6 space-y-2.5">
                  {plan.features.map((f) => (
                    <div key={f.label} className="flex items-start gap-2.5">
                      {f.included ? (
                        <Check className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#00e676" }} />
                      ) : (
                        <X className="h-4 w-4 shrink-0 mt-0.5 text-slate-600" aria-hidden />
                      )}
                      <span
                        className={`text-sm ${f.included ? "text-slate-300" : "text-slate-500"}`}
                        style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px" }}
                      >
                        {f.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="max-w-5xl mx-auto mt-4 text-center">
          <p className="text-[11px] font-mono text-slate-600">Monthly plans · cancel anytime</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 lg:px-16 py-24">
        <div className="max-w-3xl mx-auto">
          <div className="pr-reveal mb-12 text-center">
            <h2 className="text-[clamp(32px,4vw,52px)] font-black leading-[0.95] tracking-[-0.03em] text-white"
              style={{ fontFamily: "'Syne', sans-serif" }}>
              Still have questions?
            </h2>
          </div>
          <div className="space-y-3">
            {[
              { q: "Is there a free trial?", a: "Yes — 7 days free, no credit card required. Try every feature before you pay." },
              { q: "Can I cancel anytime?", a: "Absolutely. Cancel in one click. No questions, no penalties." },
              { q: "Does it work with FTMO and other prop firms?", a: "Yes. RiskSent connects to any MT4/MT5 account — FTMO, MyForexFunds, E8 and more." },
              { q: "What brokers are supported?", a: "Any broker that uses MT4 or MT5. If your broker supports MetaTrader, RiskSent works." },
              { q: "Is my data safe?", a: "All data is encrypted. We use read-only access to your trading account — we can never place or close trades." },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={false}
                whileHover={{ y: -4, transition: { type: "spring", stiffness: 450, damping: 28 } }}
                className="pr-reveal rounded-2xl p-5 transition-shadow hover:shadow-lg hover:shadow-black/25"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-sm font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>{item.q}</p>
                <p className="text-sm text-slate-400" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px" }}>{item.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 lg:px-16 py-24 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(255,60,60,0.07) 0%, transparent 70%)" }} />
        <div className="pr-reveal relative max-w-3xl mx-auto text-center">
          <h2 className="text-[clamp(40px,6vw,80px)] font-black leading-[0.9] tracking-[-0.04em] text-white"
            style={{ fontFamily: "'Syne', sans-serif" }}>
            One tool.<br />
            <span className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #ff3c3c, #ff8c00)" }}>
              Zero excuses.
            </span>
          </h2>
          <p className="mt-6 text-slate-400 max-w-md mx-auto"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px" }}>
            Start your 7-day free trial today.<br />
            No credit card. No commitment.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-2xl px-10 py-4 text-base font-bold text-black transition-all hover:scale-[1.03]"
              style={{ background: "linear-gradient(135deg, #ff3c3c, #ff8c00)", boxShadow: "0 0 40px rgba(255,60,60,0.3)" }}>
              Start free trial
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/mock/dashboard"
              className="inline-flex items-center justify-center rounded-2xl border px-10 py-4 text-base font-medium text-slate-300 transition-all hover:text-white"
              style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}>
              View demo first
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
