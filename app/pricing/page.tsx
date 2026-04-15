"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, Zap, ChevronDown } from "lucide-react";
import { useRefreshSubscription, useSubscription } from "@/lib/subscription/SubscriptionContext";

// ─── Animation variants ────────────────────────────────────────────────────────
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const itemVariants = {
  hidden:   { opacity: 0, y: 32 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};
const heroWordVariants = {
  hidden:   { yPercent: 110, opacity: 0 },
  visible:  (i: number) => ({
    yPercent: 0,
    opacity: 1,
    transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] as [number, number, number, number], delay: 0.15 + i * 0.07 },
  }),
};

// ─── Plans data (UNTOUCHED) ────────────────────────────────────────────────────
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

// ─── Simple accordion FAQ item ─────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      variants={itemVariants}
      className="rounded-2xl overflow-hidden cursor-pointer"
      style={{ background: "rgba(14,14,18,0.85)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(12px)" }}
      onClick={() => setOpen((v) => !v)}
    >
      <div className="flex items-center justify-between px-5 py-4 gap-4">
        <p className="text-sm font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>{q}</p>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
        </motion.div>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <p className="px-5 pb-4 text-sm text-slate-400"
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px" }}>
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Component (all business logic UNTOUCHED) ──────────────────────────────────
export default function PricingPage() {
  const router = useRouter();
  const subscription = useSubscription();
  const refreshSubscription = useRefreshSubscription();
  const [annual, setAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingDirectPlan, setLoadingDirectPlan] = useState<string | null>(null);
  const [ctaError, setCtaError] = useState<string | null>(null);

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

      {/* ── HERO ── */}
      <section className="relative min-h-[52vh] flex flex-col justify-center px-6 pt-24 pb-10 lg:px-16 overflow-hidden">
        {/* Subtle particle field */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[80vw] h-[60vw] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(255,60,60,0.07) 0%, transparent 65%)" }} />
          {/* Tiny decorative dots */}
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div key={i}
              className="absolute rounded-full"
              style={{
                width: 2 + (i % 3),
                height: 2 + (i % 3),
                left: `${8 + (i * 7.5) % 84}%`,
                top: `${10 + (i * 11) % 80}%`,
                background: i % 3 === 0 ? "#ff3c3c" : i % 3 === 1 ? "#ff8c00" : "#22d3ee",
                opacity: 0.3,
              }}
              animate={{ y: [0, -8, 0], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
            />
          ))}
        </div>

        <div className="relative max-w-4xl mx-auto w-full text-center">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }} className="mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-[0.2em]"
              style={{ color: "#ff8c00", borderColor: "rgba(255,140,0,0.3)", background: "rgba(255,140,0,0.08)" }}>
              <Zap className="h-3 w-3" />
              Pricing
            </span>
          </motion.div>

          <h1 className="text-[clamp(48px,8vw,100px)] font-black leading-[0.9] tracking-[-0.04em] text-white mb-6"
            style={{ fontFamily: "var(--font-display, 'Syne', sans-serif)" }}>
            {["Simple", "plans."].map((w, i) => (
              <span key={i} className="inline-block overflow-hidden mr-[0.2em]">
                <motion.span className="inline-block" custom={i} variants={heroWordVariants}
                  initial="hidden" animate="visible">{w}</motion.span>
              </span>
            ))}
            <br />
            <span className="inline-block overflow-hidden">
              <motion.span className="inline-block bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(135deg, #ff3c3c, #ff8c00)" }}
                custom={2} variants={heroWordVariants} initial="hidden" animate="visible">
                Real results.
              </motion.span>
            </span>
          </h1>

          <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="text-slate-400 max-w-lg mx-auto mb-10"
            style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", fontSize: "14px" }}>
            Subscribe to a plan when you&rsquo;re ready, or start a separate 7-day trial first with full Experienced access.<br />
            No credit card for the trial · Cancel anytime.
          </motion.p>

          {/* Annual toggle */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }} className="inline-flex items-center gap-3">
            <span className={`text-sm font-mono transition-colors ${!annual ? "text-white" : "text-slate-500"}`}>Monthly</span>
            <button role="switch" aria-checked={annual} onClick={() => setAnnual((v) => !v)}
              className="relative h-7 w-14 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff3c3c] cursor-pointer"
              style={{ background: annual ? "#ff3c3c" : "rgba(255,255,255,0.12)" }}>
              <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 35 }}
                className="absolute top-1 h-5 w-5 rounded-full bg-white shadow"
                style={{ left: annual ? "calc(100% - 1.5rem)" : "0.25rem" }} />
            </button>
            <span className={`text-sm font-mono transition-colors ${annual ? "text-white" : "text-slate-500"}`}>
              Annual{" "}
              <span className="ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{ background: "rgba(0,230,118,0.15)", color: "#00e676" }}>
                2 months free
              </span>
            </span>
          </motion.div>

          {ctaError && (
            <p className="mt-6 max-w-lg mx-auto rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-center text-sm font-mono text-red-200"
              role="alert">{ctaError}</p>
          )}
        </div>
      </section>

      {/* ── PLAN CARDS ── */}
      <section className="px-6 lg:px-16 py-8">
        <motion.div
          className="max-w-3xl mx-auto grid gap-5 lg:grid-cols-2 lg:items-stretch"
          variants={containerVariants} initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {plans.map((plan) => {
            const isHighlight = plan.highlight;
            const price = annual ? plan.annualMonthly : plan.monthlyPrice;
            const priceLabel = `€${price % 1 === 0 ? price : price.toFixed(2)}`;
            const billedLabel = annual ? `€${plan.annualTotal}/year` : null;
            const subLoading = subscription === null;
            const ctaBusy = loadingPlan === plan.id || loadingDirectPlan === plan.id;

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
              <motion.div key={plan.id} variants={itemVariants}
                whileHover={{ y: -8, transition: { type: "spring", stiffness: 400, damping: 26 } }}
                className={`relative flex min-h-full overflow-hidden rounded-3xl p-px animated-border ${isHighlight ? "" : ""}`}
                style={{
                  boxShadow: isHighlight ? "0 0 50px rgba(255,60,60,0.12)" : "0 12px 40px rgba(0,0,0,0.3)",
                  background: isHighlight
                    ? "linear-gradient(135deg, rgba(255,60,60,0.5), rgba(255,140,0,0.35), rgba(255,255,255,0.08))"
                    : "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))",
                }}>
                <div className="relative flex min-h-full flex-1 flex-col rounded-[22px] p-8 lg:p-9"
                  style={{ background: "#0e0e12" }}>

                  {/* Badge */}
                  <div className="mb-4 h-[26px] flex items-center">
                    {isHighlight && (
                      <span className="inline-flex rounded-full border px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-widest"
                        style={{ color: "#ff3c3c", borderColor: "rgba(255,60,60,0.35)", background: "rgba(255,60,60,0.08)" }}>
                        Most popular
                      </span>
                    )}
                  </div>

                  <p className="text-xl font-black text-white" style={{ fontFamily: "var(--font-display, 'Syne', sans-serif)" }}>
                    {plan.name}
                  </p>

                  {/* Price — animated counter */}
                  <div className="mt-3 flex items-end gap-2">
                    <AnimatePresence mode="wait">
                      <motion.span key={`${plan.id}-${annual}`}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
                        className="text-[52px] leading-none font-black text-white"
                        style={{ fontFamily: "var(--font-display, 'Syne', sans-serif)" }}>
                        {priceLabel}
                      </motion.span>
                    </AnimatePresence>
                    <span className="mb-2 text-slate-500 font-mono text-sm">/mo</span>
                  </div>

                  <div className="mt-1 h-5">
                    <AnimatePresence>
                      {billedLabel && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="text-xs font-mono" style={{ color: "#00e676" }}>
                          {billedLabel} billed annually
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Primary CTA — Subscribe now (Stripe checkout) */}
                  <button type="button" onClick={() => void subscribeDirect(plan.id)}
                    disabled={subLoading || ctaBusy}
                    className="mt-6 flex items-center justify-center gap-2 w-full rounded-2xl py-3.5 text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                    style={
                      isHighlight
                        ? { background: "linear-gradient(135deg, #ff3c3c, #ff8c00)", boxShadow: "0 0 28px rgba(255,60,60,0.3)", color: "#000" }
                        : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" }
                    }>
                    {subLoading ? "Checking…" : loadingDirectPlan === plan.id ? "Opening checkout…" : "Subscribe now"}
                    {!(subLoading || loadingDirectPlan === plan.id) && <ArrowRight className="h-4 w-4" />}
                  </button>

                  {/* Secondary — 7-day trial (Experienced only) */}
                  {showTrialInsteadLink && plan.id === "experienced" && (
                    <button type="button" onClick={() => void startTrial(plan.id)}
                      disabled={subLoading || ctaBusy}
                      className="mt-2 w-full rounded-2xl py-2.5 text-center text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-40 cursor-pointer">
                      {loadingPlan === plan.id ? "Starting trial…" : "Start 7-day free trial instead →"}
                    </button>
                  )}

                  <div className="mt-4 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

                  <ul className="mt-6 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f.text} className="flex items-start gap-2.5">
                        <Check className="h-4 w-4 shrink-0 mt-0.5"
                          style={{ color: f.included ? (isHighlight ? "#ff3c3c" : "#00e676") : "#334155" }} />
                        <span className={`text-sm ${f.included ? "text-slate-300" : "text-slate-600 line-through"}`}
                          style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", fontSize: "13px" }}>
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
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }} className="max-w-3xl mx-auto mt-6 text-center">
          <p className="text-[12px] font-mono text-slate-500 tracking-wide">
            Optional 7-day trial · No card for trial · Subscribe directly anytime
          </p>
        </motion.div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-6 lg:px-16 py-24">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7 }} className="mb-12 text-center">
            <h2 className="text-[clamp(32px,4vw,52px)] font-black leading-[0.95] tracking-[-0.03em] text-white"
              style={{ fontFamily: "var(--font-display, 'Syne', sans-serif)" }}>
              Still have questions?
            </h2>
          </motion.div>

          <motion.div className="space-y-3" variants={containerVariants} initial="hidden"
            whileInView="visible" viewport={{ once: true, margin: "-40px" }}>
            {[
              { q: "What do I get during the trial?", a: "Full Experienced access for 7 days — AI Coach, Risk Manager, unlimited backtesting, everything. No credit card needed." },
              { q: "What happens after the trial?", a: "You choose a paid plan or your account reverts to demo mode with sample data. We'll remind you 2 days before the trial ends." },
              { q: "Can I cancel anytime?", a: "Absolutely. Cancel in one click. No questions, no penalties." },
              { q: "What's the difference between New Trader and Experienced?", a: "New Trader gives you the journal, backtesting (2 sessions), and basic alerts. Experienced adds AI Coach, Risk Manager, and removes all limits." },
              { q: "Is my data safe?", a: "All data is encrypted. We use read-only access to your trading account — we can never place or close trades." },
            ].map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="px-6 lg:px-16 py-24 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(255,60,60,0.07) 0%, transparent 70%)" }} />
        <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.8 }}
          className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-[clamp(40px,6vw,80px)] font-black leading-[0.9] tracking-[-0.04em] text-white"
            style={{ fontFamily: "var(--font-display, 'Syne', sans-serif)" }}>
            One tool.<br />
            <span className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #ff3c3c, #ff8c00)" }}>
              Zero excuses.
            </span>
          </h2>
          <p className="mt-6 text-slate-400 max-w-md mx-auto"
            style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", fontSize: "14px" }}>
            Start your 7-day free trial today.<br />No credit card. No commitment.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button type="button" onClick={() => void startTrial("experienced")}
              disabled={subscription === null || loadingPlan === "experienced"}
              className="inline-flex items-center justify-center gap-2 rounded-2xl px-10 py-4 text-base font-bold text-black transition-all hover:scale-[1.03] disabled:opacity-60 cursor-pointer"
              style={{ background: "linear-gradient(135deg, #ff3c3c, #ff8c00)", boxShadow: "0 0 40px rgba(255,60,60,0.3)" }}>
              {subscription === null ? "Checking…" : loadingPlan === "experienced" ? "Loading…" : "Start free trial"}
              {subscription !== null && loadingPlan !== "experienced" && <ArrowRight className="h-5 w-5" />}
            </button>
            <Link href="/mock/dashboard"
              className="inline-flex items-center justify-center rounded-2xl border px-10 py-4 text-base font-medium text-slate-300 transition-all hover:text-white cursor-pointer"
              style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}>
              View demo first
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
