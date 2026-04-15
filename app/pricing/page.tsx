"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, Zap, ChevronDown } from "lucide-react";
import { useRefreshSubscription, useSubscription } from "@/lib/subscription/SubscriptionContext";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const heroWordVariants = {
  hidden: { yPercent: 110, opacity: 0 },
  visible: (i: number) => ({
    yPercent: 0,
    opacity: 1,
    transition: {
      duration: 0.85,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      delay: 0.15 + i * 0.07,
    },
  }),
};

const plans = [
  {
    id: "new_trader",
    name: "New Trader",
    monthlyPrice: 25,
    annualTotal: 208,
    annualMonthly: 17.33,
    highlight: false,
    features: [
      { text: "1 broker account", included: true },
      { text: "2 backtesting sessions", included: true },
      { text: "Full journal (unlimited trades)", included: true },
      { text: "Basic Telegram alerts", included: true },
      { text: "AI Coach", included: false },
      { text: "Risk Manager", included: false },
    ],
  },
  {
    id: "experienced",
    name: "Experienced",
    monthlyPrice: 39,
    annualTotal: 325,
    annualMonthly: 27.08,
    highlight: true,
    features: [
      { text: "Unlimited broker accounts", included: true },
      { text: "Unlimited backtesting", included: true },
      { text: "Full journal (unlimited trades)", included: true },
      { text: "Advanced Telegram alerts", included: true },
      { text: "AI Coach (unlimited)", included: true },
      { text: "Risk Manager", included: true },
    ],
  },
] as const;

const FAQ_ITEMS = [
  {
    q: "What do I get during the trial?",
    a: "Full Experienced access for 7 days — AI Coach, Risk Manager, unlimited backtesting, everything. No credit card needed.",
  },
  {
    q: "What happens after the trial?",
    a: "You choose a paid plan or your account reverts to demo mode with sample data. We'll remind you 2 days before the trial ends.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. Cancel in one click. No questions, no penalties.",
  },
  {
    q: "What's the difference between New Trader and Experienced?",
    a: "New Trader gives you the journal, backtesting (2 sessions), and basic alerts. Experienced adds AI Coach, Risk Manager, and removes all limits.",
  },
  {
    q: "Is my data safe?",
    a: "All data is encrypted. We use read-only access to your trading account — we can never place or close trades.",
  },
];

const COMPARISON_FEATURES = [
  { label: "Broker accounts", new_trader: "1", experienced: "Unlimited" },
  { label: "Backtesting sessions", new_trader: "2", experienced: "Unlimited" },
  { label: "Journal trades", new_trader: "Unlimited", experienced: "Unlimited" },
  { label: "Telegram alerts", new_trader: "Basic", experienced: "Advanced" },
  { label: "AI Coach", new_trader: "—", experienced: "✓ Unlimited" },
  { label: "Risk Manager", new_trader: "—", experienced: "✓ Full access" },
  { label: "Prop firm readiness score", new_trader: "—", experienced: "✓ FTMO ready" },
  { label: "Priority support", new_trader: "—", experienced: "✓" },
];

export default function PricingPage() {
  const router = useRouter();
  const subscription = useSubscription();
  const refreshSubscription = useRefreshSubscription();
  const [annual, setAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingDirectPlan, setLoadingDirectPlan] = useState<string | null>(null);
  const [ctaError, setCtaError] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const startTrial = async (planId: string) => {
    setCtaError(null);
    if (!subscription) return;

    if (subscription.subscriptionFetchFailed) {
      setCtaError("We couldn't verify your account. Please refresh and try again.");
      return;
    }

    if (subscription.authenticated === false) {
      router.push("/signup");
      return;
    }

    const isActive =
      subscription.isAdmin === true ||
      subscription.plan === "admin" ||
      subscription.status === "trialing" ||
      subscription.plan === "trial" ||
      subscription.isTrialing ||
      subscription.plan === "new_trader" ||
      subscription.plan === "experienced";

    if (isActive) {
      router.push("/app/billing");
      return;
    }

    if (subscription.plan === "user") {
      setLoadingPlan(planId);
      try {
        const trialRes = await fetch("/api/stripe/start-trial", { method: "POST" });
        const data = (await trialRes.json().catch(() => ({}))) as { error?: string };
        if (trialRes.ok) {
          await refreshSubscription();
          router.push("/app/dashboard");
          return;
        }
        setCtaError(typeof data.error === "string" ? data.error : "Could not start trial.");
      } catch {
        setCtaError("Connection error. Try again.");
      } finally {
        setLoadingPlan(null);
      }
      return;
    }

    setCtaError("Open billing to manage your subscription.");
  };

  const subscribeDirect = async (planId: string) => {
    setCtaError(null);
    if (!subscription) return;

    if (subscription.authenticated === false) {
      router.push("/signup");
      return;
    }

    setLoadingDirectPlan(planId);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setCtaError(data.error ?? "Could not open checkout.");
      }
    } catch {
      setCtaError("Connection error. Try again.");
    } finally {
      setLoadingDirectPlan(null);
    }
  };

  return (
    <div className="min-h-full overflow-x-hidden bg-[#080809]">
      <style>{`
        @keyframes shimmer-price { from { background-position: -200% center } to { background-position: 200% center } }
        @keyframes pulse-badge { 0%,100% { box-shadow: 0 0 0 0 rgba(255,60,60,0.4) } 50% { box-shadow: 0 0 0 6px rgba(255,60,60,0) } }
        .popular-badge { animation: pulse-badge 2s ease-in-out infinite; }
        .card-3d { transition: transform 0.3s ease; transform-style: preserve-3d; perspective: 1000px; }
      `}</style>

      {/* Dot grid background */}
      <div className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%)',
          zIndex: 0,
        }} />

      {/* Hero */}
      <section className="relative min-h-[52vh] flex flex-col justify-center px-6 pt-24 pb-10 lg:px-16 overflow-hidden" style={{ zIndex: 1 }}>
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[80vw] h-[60vw] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(255,60,60,0.1) 0%, transparent 65%)" }}
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
            className="text-slate-400 max-w-lg mx-auto mb-4"
            style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", fontSize: "14px" }}
          >
            Subscribe to a plan when you&rsquo;re ready, or start a separate 7-day trial first with full Experienced access.<br />
            No credit card for the trial · Cancel anytime.
          </motion.p>

          {/* Social proof line */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-xs font-mono mb-8"
            style={{ color: '#ff8c00' }}
          >
            Most traders choose Experienced — the full platform, zero limits.
          </motion.p>

          {/* Annual toggle */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="inline-flex items-center gap-3"
          >
            <span className={`text-sm font-mono transition-colors ${!annual ? "text-white" : "text-slate-500"}`}>
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
            <span className={`text-sm font-mono transition-colors ${annual ? "text-white" : "text-slate-500"}`}>
              Annual{" "}
              <span
                className="ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{ background: "rgba(0,230,118,0.15)", color: "#00e676" }}
              >
                2 months free
              </span>
            </span>
          </motion.div>

          {ctaError && (
            <p
              className="mt-6 max-w-lg mx-auto rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-center text-sm font-mono text-red-200"
              role="alert"
            >
              {ctaError}
            </p>
          )}
        </div>
      </section>

      {/* Cards */}
      <section className="relative px-6 lg:px-16 py-8" style={{ zIndex: 1 }}>
        <motion.div
          className="max-w-3xl mx-auto grid gap-5 lg:grid-cols-2 lg:items-stretch"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0 }}
        >
          {plans.map((plan) => {
            const isHighlight = plan.highlight;
            const price = annual ? plan.annualMonthly : plan.monthlyPrice;
            const priceLabel = `€${price % 1 === 0 ? price : price.toFixed(2)}`;
            const billedLabel = annual ? `€${plan.annualTotal}/year` : null;
            const subLoading = subscription === null;
            const ctaBusy = loadingPlan === plan.id || loadingDirectPlan === plan.id;
            const isHovered = hoveredCard === plan.id;

            const isSubscribedOrTrialing =
              subscription != null &&
              (subscription.isAdmin === true ||
                subscription.plan === "admin" ||
                subscription.status === "trialing" ||
                subscription.plan === "trial" ||
                subscription.isTrialing ||
                subscription.plan === "new_trader" ||
                subscription.plan === "experienced");

            const showTrialInsteadLink =
              subscription != null &&
              !subscription.subscriptionFetchFailed &&
              !isSubscribedOrTrialing &&
              subscription.plan === "user";

            return (
              <motion.div
                key={plan.id}
                variants={itemVariants}
                className="card-3d relative flex min-h-full overflow-hidden rounded-3xl p-px"
                style={{
                  boxShadow: isHighlight
                    ? "0 0 40px rgba(255,60,60,0.12)"
                    : "0 12px 40px rgba(0,0,0,0.3)",
                  background: isHighlight
                    ? "linear-gradient(135deg, rgba(255,60,60,0.5), rgba(255,140,0,0.35), rgba(255,255,255,0.08))"
                    : "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))",
                  transform: isHovered
                    ? `rotateY(${isHighlight ? -4 : 4}deg) rotateX(2deg)`
                    : 'rotateY(0deg) rotateX(0deg)',
                }}
                onMouseEnter={() => setHoveredCard(plan.id)}
                onMouseLeave={() => setHoveredCard(null)}
                whileTap={{ scale: 0.995 }}
              >
                <div
                  className="relative flex min-h-full flex-1 flex-col rounded-[22px] p-8 lg:p-9"
                  style={{ background: "#0e0e12" }}
                >
                  {/* Badge */}
                  <div className="mb-4 h-[26px] flex items-center">
                    {isHighlight && (
                      <span
                        className="popular-badge inline-flex rounded-full border px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-widest"
                        style={{ color: "#ff3c3c", borderColor: "rgba(255,60,60,0.35)", background: "rgba(255,60,60,0.08)" }}
                      >
                        Most popular
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

                  {/* Primary CTA — Subscribe now (Stripe checkout) */}
                  <button
                    type="button"
                    onClick={() => void subscribeDirect(plan.id)}
                    disabled={subLoading || ctaBusy}
                    className="mt-6 flex items-center justify-center gap-2 w-full rounded-2xl py-3.5 text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.99] disabled:opacity-60"
                    style={
                      isHighlight
                        ? {
                            background: "linear-gradient(135deg, #ff3c3c, #ff8c00)",
                            backgroundSize: "200% auto",
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
                    {subLoading ? "Checking…" : loadingDirectPlan === plan.id ? "Opening checkout…" : "Subscribe now"}
                    {!(subLoading || loadingDirectPlan === plan.id) && <ArrowRight className="h-4 w-4" />}
                  </button>

                  {/* Secondary — full Experienced trial only on Experienced card */}
                  {showTrialInsteadLink && plan.id === "experienced" && (
                    <button
                      type="button"
                      onClick={() => void startTrial(plan.id)}
                      disabled={subLoading || ctaBusy}
                      className="mt-2 w-full rounded-2xl py-2.5 text-center text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-40"
                    >
                      {loadingPlan === plan.id ? "Starting trial…" : "Start 7-day free trial instead →"}
                    </button>
                  )}

                  <div className="mt-4 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

                  <ul className="mt-6 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f.text} className="flex items-start gap-2.5">
                        <Check
                          className="h-4 w-4 shrink-0 mt-0.5"
                          style={{ color: f.included ? (isHighlight ? "#ff3c3c" : "#00e676") : "#334155" }}
                        />
                        <span
                          className={`text-sm ${f.included ? "text-slate-300" : "text-slate-600 line-through"}`}
                          style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", fontSize: "13px" }}
                        >
                          {f.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Trust */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="max-w-3xl mx-auto mt-6 text-center"
        >
          <p className="text-[12px] font-mono text-slate-500 tracking-wide">
            Optional 7-day trial · No card for trial · Subscribe directly anytime
          </p>
        </motion.div>

        {/* Feature comparison toggle */}
        <div className="max-w-3xl mx-auto mt-8 text-center">
          <button
            type="button"
            onClick={() => setShowComparison((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-mono text-slate-400 transition-all hover:text-white hover:border-white/20"
            style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}
          >
            Compare all features
            <motion.span animate={{ rotate: showComparison ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="h-4 w-4" />
            </motion.span>
          </button>

          <AnimatePresence>
            {showComparison && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden mt-4"
              >
                <div className="rounded-[20px] overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="grid grid-cols-3 px-6 py-3 border-b text-[10px] font-mono uppercase tracking-widest text-slate-500"
                    style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                    <span>Feature</span>
                    <span className="text-center">New Trader</span>
                    <span className="text-center" style={{ color: '#ff3c3c' }}>Experienced</span>
                  </div>
                  {COMPARISON_FEATURES.map((feat, i) => (
                    <div key={i} className="grid grid-cols-3 px-6 py-3 border-b last:border-0 items-center"
                      style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      <span className="text-xs font-mono text-slate-400">{feat.label}</span>
                      <span className="text-center text-xs font-mono"
                        style={{ color: feat.new_trader === '—' ? '#334155' : '#94a3b8' }}>
                        {feat.new_trader}
                      </span>
                      <span className="text-center text-xs font-mono font-bold"
                        style={{ color: feat.experienced.startsWith('✓') ? '#ff3c3c' : '#94a3b8' }}>
                        {feat.experienced}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative px-6 lg:px-16 py-24" style={{ zIndex: 1 }}>
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0 }}
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
            viewport={{ once: true, amount: 0 }}
          >
            {FAQ_ITEMS.map((item, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="rounded-2xl overflow-hidden"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
                >
                  <p
                    className="text-sm font-bold text-white"
                    style={{ fontFamily: "var(--font-display, 'Syne', sans-serif)" }}
                  >
                    {item.q}
                  </p>
                  <motion.span
                    animate={{ rotate: openFaq === i ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0 ml-4"
                  >
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </motion.span>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p
                        className="px-5 pb-4 text-sm text-slate-400"
                        style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", fontSize: "13px" }}
                      >
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative px-6 lg:px-16 py-24 overflow-hidden" style={{ zIndex: 1 }}>
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(255,60,60,0.08) 0%, transparent 70%)" }}
        />
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0 }}
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
            <button
              type="button"
              onClick={() => void startTrial("experienced")}
              disabled={subscription === null || loadingPlan === "experienced"}
              className="inline-flex items-center justify-center gap-2 rounded-2xl px-10 py-4 text-base font-bold text-black transition-all hover:scale-[1.03] disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #ff3c3c, #ff8c00)", boxShadow: "0 0 40px rgba(255,60,60,0.3)" }}
            >
              {subscription === null
                ? "Checking…"
                : loadingPlan === "experienced"
                  ? "Loading…"
                  : "Start free trial"}
              {subscription !== null && loadingPlan !== "experienced" && <ArrowRight className="h-5 w-5" />}
            </button>
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
