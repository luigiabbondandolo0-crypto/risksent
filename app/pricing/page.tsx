"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, Zap } from "lucide-react";

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const heroWordVariants = {
  hidden: { yPercent: 110, opacity: 0 },
  visible: (i: number) => ({
    yPercent: 0,
    opacity: 1,
    transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.15 + i * 0.07 },
  }),
};

const plans = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    annualTotal: 0,
    annualMonthly: 0,
    highlight: false,
    badge: null,
    dimmed: true,
    ctaLabel: "Get started free",
    ctaHref: "/signup",
    features: [
      "Basic dashboard",
      "1 backtesting session",
      "Journal (50 trades)",
      "Risk alerts (3 rules)",
    ],
  },
  {
    id: "new_trader",
    name: "New Trader",
    monthlyPrice: 25,
    annualTotal: 208,
    annualMonthly: 17.33,
    highlight: true,
    badge: "Most popular",
    dimmed: false,
    ctaLabel: "Start New Trader",
    ctaHref: "/signup?plan=new_trader",
    features: [
      "Everything in Free",
      "Unlimited backtesting",
      "Full journal (unlimited trades)",
      "10 risk rules",
      "AI Coach (50 reports/mo)",
      "Telegram alerts",
    ],
  },
  {
    id: "experienced",
    name: "Experienced",
    monthlyPrice: 39,
    annualTotal: 325,
    annualMonthly: 27.08,
    highlight: false,
    badge: null,
    dimmed: false,
    ctaLabel: "Start Experienced",
    ctaHref: "/signup?plan=experienced",
    features: [
      "Everything in New Trader",
      "Unlimited AI Coach",
      "Priority support",
      "Advanced analytics",
      "Custom risk rules",
      "API access",
    ],
  },
] as const;

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-full overflow-x-hidden bg-[#080809]">

      {/* Hero */}
      <section className="relative min-h-[56vh] flex flex-col justify-center px-6 pt-24 pb-14 lg:px-16 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[80vw] h-[60vw] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(255,60,60,0.07) 0%, transparent 65%)" }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mb-6"
          >
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-[0.2em]"
              style={{ color: "#ff8c00", borderColor: "rgba(255,140,0,0.3)", background: "rgba(255,140,0,0.08)" }}
            >
              <Zap className="h-3 w-3" />
              Pricing
            </span>
          </motion.div>

          <h1
            className="text-[clamp(48px,8vw,100px)] font-black leading-[0.9] tracking-[-0.04em] text-white mb-6"
            style={{ fontFamily: "var(--font-display, 'Syne', sans-serif)" }}
          >
            {["Simple", "plans."].map((w, i) => (
              <span key={i} className="inline-block overflow-hidden mr-[0.2em]">
                <motion.span
                  className="inline-block"
                  custom={i}
                  variants={heroWordVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {w}
                </motion.span>
              </span>
            ))}
            <br />
            <span className="inline-block overflow-hidden">
              <motion.span
                className="inline-block bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(135deg, #ff3c3c, #ff8c00)" }}
                custom={2}
                variants={heroWordVariants}
                initial="hidden"
                animate="visible"
              >
                Real results.
              </motion.span>
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="text-slate-400 max-w-lg mx-auto mb-10"
            style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", fontSize: "14px" }}
          >
            Three plans for every stage of your trading journey.<br />
            Start free — upgrade when you&rsquo;re ready.
          </motion.p>

          {/* Annual toggle */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="inline-flex items-center gap-3"
          >
            <span
              className={`text-sm font-mono transition-colors ${!annual ? "text-white" : "text-slate-500"}`}
            >
              Monthly
            </span>
            <button
              role="switch"
              aria-checked={annual}
              onClick={() => setAnnual((v) => !v)}
              className="relative h-7 w-14 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff3c3c]"
              style={{ background: annual ? "#ff3c3c" : "rgba(255,255,255,0.12)" }}
            >
              <motion.span
                layout
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                className="absolute top-1 h-5 w-5 rounded-full bg-white shadow"
                style={{ left: annual ? "calc(100% - 1.5rem)" : "0.25rem" }}
              />
            </button>
            <span
              className={`text-sm font-mono transition-colors ${annual ? "text-white" : "text-slate-500"}`}
            >
              Annual{" "}
              <span
                className="ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{ background: "rgba(0,230,118,0.15)", color: "#00e676" }}
              >
                2 months free
              </span>
            </span>
          </motion.div>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="px-6 lg:px-16 py-8">
        <motion.div
          className="max-w-5xl mx-auto grid gap-5 lg:grid-cols-3 lg:items-stretch"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {plans.map((plan) => {
            const isHighlight = plan.highlight;
            const price = annual && plan.monthlyPrice > 0
              ? plan.annualMonthly
              : plan.monthlyPrice;
            const priceLabel = plan.monthlyPrice === 0 ? "€0" : `€${price % 1 === 0 ? price : price.toFixed(2)}`;
            const billedLabel = annual && plan.monthlyPrice > 0
              ? `€${plan.annualTotal}/year`
              : null;

            return (
              <motion.div
                key={plan.id}
                variants={itemVariants}
                whileHover={{ y: -8, transition: { type: "spring", stiffness: 400, damping: 26 } }}
                whileTap={{ scale: 0.995 }}
                className="relative flex min-h-full overflow-hidden rounded-3xl p-px"
                style={{
                  opacity: plan.dimmed ? 0.72 : 1,
                  boxShadow: isHighlight
                    ? "0 0 40px rgba(255,60,60,0.1)"
                    : "0 12px 40px rgba(0,0,0,0.3)",
                  background: isHighlight
                    ? "linear-gradient(135deg, rgba(255,60,60,0.5), rgba(255,140,0,0.35), rgba(255,255,255,0.08))"
                    : "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))",
                  border: isHighlight ? "1px solid rgba(255,60,60,0.3)" : undefined,
                }}
              >
                <div
                  className="relative flex min-h-full flex-1 flex-col rounded-[22px] p-8 lg:p-9"
                  style={{ background: "#0e0e12" }}
                >
                  {/* Badge row */}
                  <div className="mb-4 h-[26px] flex items-center">
                    {plan.badge && (
                      <span
                        className="inline-flex rounded-full border px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-widest"
                        style={{ color: "#ff3c3c", borderColor: "rgba(255,60,60,0.35)", background: "rgba(255,60,60,0.08)" }}
                      >
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  <p
                    className="text-xl font-black text-white"
                    style={{ fontFamily: "var(--font-display, 'Syne', sans-serif)" }}
                  >
                    {plan.name}
                  </p>

                  {/* Price */}
                  <div className="mt-3 flex items-end gap-2">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={`${plan.id}-${annual}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="text-[52px] leading-none font-black text-white"
                        style={{ fontFamily: "var(--font-display, 'Syne', sans-serif)" }}
                      >
                        {priceLabel}
                      </motion.span>
                    </AnimatePresence>
                    <span className="mb-2 text-slate-500 font-mono text-sm">/mo</span>
                  </div>

                  {/* Annual billed label */}
                  <div className="mt-1 h-5">
                    <AnimatePresence>
                      {billedLabel && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-xs font-mono"
                          style={{ color: "#00e676" }}
                        >
                          {billedLabel} billed annually
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <Link
                    href={plan.ctaHref}
                    className="mt-6 flex items-center justify-center gap-2 w-full rounded-2xl py-3.5 text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.99]"
                    style={
                      isHighlight
                        ? {
                            background: "linear-gradient(135deg, #ff3c3c, #ff8c00)",
                            boxShadow: "0 0 28px rgba(255,60,60,0.3)",
                            color: "#000",
                          }
                        : {
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#e2e8f0",
                          }
                    }
                  >
                    {plan.ctaLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <div className="mt-6 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

                  <ul className="mt-6 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check
                          className="h-4 w-4 shrink-0 mt-0.5"
                          style={{ color: isHighlight ? "#ff3c3c" : "#00e676" }}
                        />
                        <span
                          className="text-slate-300 text-sm"
                          style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", fontSize: "13px" }}
                        >
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="max-w-5xl mx-auto mt-6 text-center"
        >
          <p className="text-[12px] font-mono text-slate-500 tracking-wide">
            🔒 Secure payment &middot; Stripe &middot; Cancel anytime
          </p>
        </motion.div>
      </section>

      {/* FAQ */}
      <section className="px-6 lg:px-16 py-24">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-12 text-center"
          >
            <h2
              className="text-[clamp(32px,4vw,52px)] font-black leading-[0.95] tracking-[-0.03em] text-white"
              style={{ fontFamily: "var(--font-display, 'Syne', sans-serif)" }}
            >
              Still have questions?
            </h2>
          </motion.div>

          <motion.div
            className="space-y-3"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
          >
            {[
              {
                q: "Is there a free trial?",
                a: "Yes — 7 days free, no credit card required. Try every feature before you pay.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Absolutely. Cancel in one click. No questions, no penalties.",
              },
              {
                q: "Does it work with FTMO and other prop firms?",
                a: "We focus on prop-style risk rules and dashboards. Broker account linking is being rebuilt with a new provider; check the product for current connectivity.",
              },
              {
                q: "What brokers are supported?",
                a: "Supported brokers depend on the live integration. We are not tied to a single legacy MetaTrader API anymore — scope will be announced as the new connection ships.",
              },
              {
                q: "Is my data safe?",
                a: "All data is encrypted. We use read-only access to your trading account — we can never place or close trades.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ y: -4, transition: { type: "spring", stiffness: 450, damping: 28 } }}
                className="rounded-2xl p-5 transition-shadow hover:shadow-lg hover:shadow-black/25"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <p
                  className="text-sm font-bold text-white mb-2"
                  style={{ fontFamily: "var(--font-display, 'Syne', sans-serif)" }}
                >
                  {item.q}
                </p>
                <p
                  className="text-sm text-slate-400"
                  style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", fontSize: "13px" }}
                >
                  {item.a}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 lg:px-16 py-24 relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(255,60,60,0.07) 0%, transparent 70%)" }}
        />
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative max-w-3xl mx-auto text-center"
        >
          <h2
            className="text-[clamp(40px,6vw,80px)] font-black leading-[0.9] tracking-[-0.04em] text-white"
            style={{ fontFamily: "var(--font-display, 'Syne', sans-serif)" }}
          >
            One tool.<br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #ff3c3c, #ff8c00)" }}
            >
              Zero excuses.
            </span>
          </h2>
          <p
            className="mt-6 text-slate-400 max-w-md mx-auto"
            style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", fontSize: "14px" }}
          >
            Start your 7-day free trial today.<br />
            No credit card. No commitment.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-2xl px-10 py-4 text-base font-bold text-black transition-all hover:scale-[1.03]"
              style={{ background: "linear-gradient(135deg, #ff3c3c, #ff8c00)", boxShadow: "0 0 40px rgba(255,60,60,0.3)" }}
            >
              Start free trial
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/mock/dashboard"
              className="inline-flex items-center justify-center rounded-2xl border px-10 py-4 text-base font-medium text-slate-300 transition-all hover:text-white"
              style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}
            >
              View demo first
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
