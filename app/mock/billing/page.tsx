"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CreditCard, ArrowRight, CheckCircle, Zap } from "lucide-react";

const DIRECT_PLANS = [
  {
    id: "new_trader",
    name: "NEW TRADER",
    price: 25,
    features: ["1 broker account", "2 backtesting sessions", "Full journal"],
    highlight: false,
  },
  {
    id: "experienced",
    name: "EXPERIENCED",
    price: 39,
    features: ["Unlimited everything", "AI Coach", "Risk Manager"],
    highlight: true,
  },
] as const;

export default function MockBillingPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-16">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-amber-400" />
          Billing
        </h1>
        <p className="mt-1 text-sm font-mono text-slate-500">
          Demo mode — preview of the live billing page. No charges.
        </p>
      </header>

      {/* Current plan card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-slate-500">
              Current plan
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-full border border-slate-500/30 bg-slate-500/15 px-3 py-0.5 text-sm font-semibold text-slate-400">
                Demo
              </span>
            </div>
            <p className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold text-white">
              €0
              <span className="text-base font-normal text-slate-500">/mo</span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Trial + plans */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-6 backdrop-blur-sm"
      >
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-5 w-5 text-amber-400" />
          <p className="font-semibold text-amber-200">You&rsquo;re in demo mode</p>
        </div>
        <p className="text-sm text-slate-400 font-mono mb-4">
          Start your 7-day free trial to access all features with real trading data.
          No credit card required.
        </p>

        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-black transition-all hover:scale-[1.02]"
          style={{
            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
            boxShadow: "0 0 20px rgba(99,102,241,0.2)",
          }}
        >
          Start free trial
          <ArrowRight className="h-4 w-4" />
        </Link>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/[0.08]" />
          <span className="shrink-0 text-[11px] font-mono uppercase tracking-widest text-slate-500">
            or choose a plan directly
          </span>
          <div className="h-px flex-1 bg-white/[0.08]" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {DIRECT_PLANS.map((p) => (
            <div
              key={p.id}
              className={`flex flex-col rounded-2xl border p-5 backdrop-blur-sm ${
                p.highlight
                  ? "border-[#6366f1]/30 bg-[#6366f1]/[0.06]"
                  : "border-white/[0.08] bg-white/[0.03]"
              }`}
            >
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <p className="font-[family-name:var(--font-display)] text-base font-bold tracking-wide text-white">
                  {p.name}
                </p>
                {p.highlight && (
                  <span className="rounded-full border border-[#6366f1]/40 bg-[#6366f1]/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-[#6366f1]">
                    Most popular
                  </span>
                )}
              </div>
              <p className="font-[family-name:var(--font-display)] text-2xl font-black text-white">
                €{p.price}
                <span className="text-sm font-normal text-slate-500">/mo</span>
              </p>
              <ul className="mt-3 flex-1 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs font-mono text-slate-400">
                    <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/pricing"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-black transition-all hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                  boxShadow: p.highlight ? "0 0 22px rgba(99,102,241,0.25)" : "0 0 16px rgba(99,102,241,0.12)",
                }}
              >
                Subscribe now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-4 text-center text-xs font-mono text-slate-600">
          <Link href="/pricing" className="underline underline-offset-2 hover:text-slate-400 transition-colors">
            Full plan comparison →
          </Link>
        </p>
      </motion.div>

      <p className="text-center text-xs font-mono text-slate-600">
        Secure payment · Stripe · Cancel anytime
      </p>
    </div>
  );
}
