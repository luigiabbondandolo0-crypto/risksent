"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Check, Zap } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function PricingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [annual, setAnnual] = useState(false);

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

  const monthlyPrice = 19;
  const annualPrice = 12;
  const price = annual ? annualPrice : monthlyPrice;

  const features = [
    "Backtesting lab — unlimited tests",
    "Trading journal — unlimited trades",
    "Risk Sentinel — live monitoring",
    "Live alerts — Telegram integration",
    "AI Coach — coming soon",
    "All future features included",
    "MT4 & MT5 support",
    "Multiple accounts",
    "Export reports (CSV / PDF)",
    "Priority support",
  ];

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
            No tiers. No feature gating. No BS.<br />
            One subscription unlocks the entire platform.
          </p>
        </div>
      </section>

      {/* Pricing card */}
      <section className="px-6 lg:px-16 py-8">
        <div className="max-w-2xl mx-auto">

          {/* Toggle */}
          <div className="pr-reveal flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm font-mono ${!annual ? "text-white" : "text-slate-500"}`}>Monthly</span>
            <button
              type="button"
              onClick={() => setAnnual(!annual)}
              className="relative h-6 w-12 rounded-full transition-all duration-300"
              style={{ background: annual ? "linear-gradient(135deg, #ff3c3c, #ff8c00)" : "rgba(255,255,255,0.1)" }}
            >
              <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 ${annual ? "left-6" : "left-0.5"}`} />
            </button>
            <span className={`text-sm font-mono ${annual ? "text-white" : "text-slate-500"}`}>
              Annual
              <span className="ml-2 text-[10px] font-bold text-orange-400">-37%</span>
            </span>
          </div>

          {/* Card */}
          <div className="pr-reveal relative overflow-hidden rounded-3xl p-px"
            style={{ background: "linear-gradient(135deg, rgba(255,60,60,0.5), rgba(255,140,0,0.3), rgba(255,255,255,0.05))" }}>
            <div className="relative rounded-3xl p-8 lg:p-10" style={{ background: "#0e0e12" }}>
              <div className="pointer-events-none absolute inset-0"
                style={{ background: "radial-gradient(ellipse at 50% -20%, rgba(255,60,60,0.08) 0%, transparent 60%)" }} />

              <div className="relative">
                {/* Price */}
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-[clamp(48px,8vw,80px)] font-black leading-none text-white"
                    style={{ fontFamily: "'Syne', sans-serif" }}>
                    €{price}
                  </span>
                  <span className="text-slate-500 font-mono mb-3">/ month</span>
                </div>
                {annual && (
                  <p className="text-sm font-mono text-orange-400 mb-1">Billed €{annualPrice * 12}/year — save €{(monthlyPrice - annualPrice) * 12}</p>
                )}
                <p className="text-slate-500 font-mono text-sm mb-8">
                  {annual ? "Annual plan · cancel anytime" : "Monthly plan · cancel anytime"}
                </p>

                {/* CTA */}
                <Link href="/signup"
                  className="flex items-center justify-center gap-2 w-full rounded-2xl py-4 text-base font-bold text-black transition-all hover:scale-[1.02] mb-8"
                  style={{ background: "linear-gradient(135deg, #ff3c3c, #ff8c00)", boxShadow: "0 0 40px rgba(255,60,60,0.3)" }}>
                  Start for free
                  <ArrowRight className="h-5 w-5" />
                </Link>

                <p className="text-center text-[11px] font-mono text-slate-600 mb-8">
                  No credit card required · 7-day free trial
                </p>

                {/* Divider */}
                <div className="h-px mb-8" style={{ background: "rgba(255,255,255,0.06)" }} />

                {/* Features */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {features.map((f, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Check className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#00e676" }} />
                      <span className="text-sm text-slate-300" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px" }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
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
              <div key={i} className="pr-reveal rounded-2xl p-5"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-sm font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>{item.q}</p>
                <p className="text-sm text-slate-400" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px" }}>{item.a}</p>
              </div>
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
