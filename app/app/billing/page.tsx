"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CreditCard, Clock, AlertCircle, CheckCircle, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";
import type { SubscriptionRow } from "@/app/api/stripe/subscription/route";

const PLAN_LABELS: Record<string, string> = {
  user: "Demo",
  trial: "Free Trial",
  new_trader: "New Trader",
  experienced: "Experienced",
};

const PLAN_PRICES: Record<string, number> = {
  user: 0,
  trial: 0,
  new_trader: 25,
  experienced: 39,
};

const PLAN_COLOR: Record<string, string> = {
  user: "text-slate-400 bg-slate-500/15 border-slate-500/30",
  trial: "text-amber-300 bg-amber-500/15 border-amber-500/30",
  new_trader: "text-cyan-300 bg-cyan-500/15 border-cyan-500/30",
  experienced: "text-[#ff3c3c] bg-[#ff3c3c]/10 border-[#ff3c3c]/30",
};

const STATUS_COLOR: Record<string, string> = {
  active: "text-emerald-300 bg-emerald-500/15",
  trialing: "text-amber-300 bg-amber-500/15",
  past_due: "text-orange-300 bg-orange-500/15",
  canceled: "text-red-300 bg-red-500/15",
  incomplete: "text-slate-300 bg-slate-500/15",
};

function TrialActiveNotice() {
  const searchParams = useSearchParams();
  if (searchParams.get("notice") !== "trial-active") return null;
  return (
    <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm font-mono text-amber-200">
      You already have an active trial.
    </div>
  );
}

const DIRECT_PLANS = [
  {
    id: "new_trader" as const,
    name: "NEW TRADER",
    price: 25,
    features: ["1 broker account", "2 backtesting sessions", "Full journal"],
    highlight: false,
  },
  {
    id: "experienced" as const,
    name: "EXPERIENCED",
    price: 39,
    features: ["Unlimited everything", "AI Coach", "Risk Manager"],
    highlight: true,
  },
];

const planGridContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const planGridItem = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

function PlanChoiceGrid({
  upgradeLoading,
  onCheckout,
  buttonLabel,
}: {
  upgradeLoading: string | null;
  onCheckout: (plan: string) => Promise<void>;
  buttonLabel: string;
}) {
  return (
    <motion.div
      className="grid gap-4 md:grid-cols-2"
      variants={planGridContainer}
      initial="hidden"
      animate="visible"
    >
      {DIRECT_PLANS.map((p) => {
        const loading = upgradeLoading === p.id;
        return (
          <motion.div
            key={p.id}
            variants={planGridItem}
            whileHover={{ y: -4, transition: { type: "spring", stiffness: 420, damping: 26 } }}
            className={`flex flex-col rounded-2xl border p-5 backdrop-blur-sm ${
              p.highlight
                ? "border-[#ff3c3c]/30 bg-[#ff3c3c]/[0.06]"
                : "border-white/[0.08] bg-white/[0.03]"
            }`}
          >
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <p className="font-[family-name:var(--font-display)] text-base font-bold tracking-wide text-white">
                {p.name}
              </p>
              {p.highlight && (
                <span className="rounded-full border border-[#ff3c3c]/40 bg-[#ff3c3c]/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-[#ff3c3c]">
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
            <button
              type="button"
              onClick={() => void onCheckout(p.id)}
              disabled={upgradeLoading !== null}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-black transition-all hover:scale-[1.02] active:scale-[0.99] disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #ff3c3c, #ff8c00)",
                boxShadow: p.highlight ? "0 0 22px rgba(255,60,60,0.25)" : "0 0 16px rgba(255,60,60,0.12)",
              }}
            >
              {loading ? "Loading…" : buttonLabel}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export default function BillingPage() {
  const [sub, setSub] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [trialLoading, setTrialLoading] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/stripe/subscription")
      .then((r) => r.json())
      .then((d: { subscription?: SubscriptionRow }) => {
        setSub(d.subscription ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const d = (await res.json()) as { url?: string; error?: string };
      if (d.url) {
        window.location.href = d.url;
      } else {
        alert(d.error ?? "Could not open portal");
      }
    } finally {
      setPortalLoading(false);
    }
  };

  const startTrial = async () => {
    setTrialLoading(true);
    try {
      const res = await fetch("/api/stripe/start-trial", { method: "POST" });
      if (res.ok) {
        window.location.reload();
      } else {
        const d = (await res.json()) as { error?: string };
        alert(d.error ?? "Could not start trial");
      }
    } finally {
      setTrialLoading(false);
    }
  };

  const startCheckout = async (plan: string) => {
    setCheckoutError(null);
    setUpgradeLoading(plan);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const d = (await res.json()) as { url?: string; error?: string };
      if (d.url) {
        window.location.href = d.url;
      } else {
        setCheckoutError(d.error ?? "Could not start checkout.");
      }
    } catch {
      setCheckoutError("Could not start checkout. Check your connection and try again.");
    } finally {
      setUpgradeLoading(null);
    }
  };

  const plan = sub?.plan ?? "user";

  // Trial days remaining
  const trialDaysLeft =
    sub?.current_period_end && (plan === "trial" || sub.status === "trialing")
      ? Math.max(0, Math.ceil((new Date(sub.current_period_end).getTime() - Date.now()) / 86_400_000))
      : null;

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="font-mono text-sm text-slate-500">Loading billing…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-16">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-amber-400" />
          Billing
        </h1>
        <p className="mt-1 text-sm font-mono text-slate-500">
          Manage your subscription and payment details.
        </p>
      </header>

      <Suspense fallback={null}>
        <TrialActiveNotice />
      </Suspense>

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
              <span
                className={`rounded-full border px-3 py-0.5 text-sm font-semibold ${PLAN_COLOR[plan] ?? ""}`}
              >
                {PLAN_LABELS[plan] ?? plan}
              </span>
              {sub?.status && sub.status !== "trialing" && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-mono ${STATUS_COLOR[sub.status] ?? ""}`}
                >
                  {sub.status}
                </span>
              )}
            </div>
            <p className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold text-white">
              €{PLAN_PRICES[plan] ?? 0}
              <span className="text-base font-normal text-slate-500">/mo</span>
            </p>
          </div>

          {/* Manage button for paid plans */}
          {(plan === "new_trader" || plan === "experienced") && sub?.stripe_customer_id && (
            <button
              onClick={() => void openPortal()}
              disabled={portalLoading}
              className="flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-200 transition-all hover:border-slate-600 hover:bg-white/[0.06] disabled:opacity-50"
            >
              {portalLoading ? "Opening…" : "Manage subscription"}
            </button>
          )}
        </div>

        {/* Trial countdown */}
        {trialDaysLeft !== null && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            <Zap className="h-4 w-4 shrink-0 text-amber-400" />
            <span>
              Free trial active —{" "}
              <strong>{trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} remaining</strong>
              {sub?.current_period_end && (
                <> · Ends {new Date(sub.current_period_end).toLocaleDateString()}</>
              )}
            </span>
          </div>
        )}

        {/* Renewal / cancellation notice */}
        {sub?.current_period_end && plan !== "trial" && sub.status !== "trialing" && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 text-sm text-slate-400">
            <Clock className="h-4 w-4 shrink-0 text-slate-500" />
            {sub.cancel_at_period_end
              ? `Cancels on ${new Date(sub.current_period_end).toLocaleDateString()}`
              : `Renews on ${new Date(sub.current_period_end).toLocaleDateString()}`}
          </div>
        )}

        {sub?.status === "past_due" && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/10 px-4 py-3 text-sm text-orange-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Payment failed. Please update your payment method.
          </div>
        )}
      </motion.div>

      {/* Demo — start trial CTA + direct subscribe */}
      {plan === "user" && (
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
            Start your 7-day free trial to access all features with your real trading data.
            No credit card required.
          </p>
          <button
            type="button"
            onClick={() => void startTrial()}
            disabled={trialLoading}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-black transition-all hover:scale-[1.02] disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #ff8c00, #ff3c3c)", boxShadow: "0 0 20px rgba(255,140,0,0.2)" }}
          >
            {trialLoading ? "Starting…" : "Start free trial"}
            {!trialLoading && <ArrowRight className="h-4 w-4" />}
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/[0.08]" />
            <span className="shrink-0 text-[11px] font-mono uppercase tracking-widest text-slate-500">
              or choose a plan directly
            </span>
            <div className="h-px flex-1 bg-white/[0.08]" />
          </div>

          {checkoutError && (
            <p className="mb-4 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs font-mono text-red-200" role="alert">
              {checkoutError}
            </p>
          )}

          <PlanChoiceGrid
            upgradeLoading={upgradeLoading}
            onCheckout={startCheckout}
            buttonLabel="Subscribe now"
          />

          <p className="mt-4 text-center text-xs font-mono text-slate-600">
            <Link href="/pricing" className="underline underline-offset-2 hover:text-slate-400 transition-colors">
              Full plan comparison →
            </Link>
          </p>
        </motion.div>
      )}

      {/* Trial — upgrade grid */}
      {(plan === "trial" || sub?.status === "trialing") && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          {trialDaysLeft !== null && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-amber-500/30 bg-amber-500/[0.08] px-4 py-3 text-sm font-mono text-amber-100 backdrop-blur-sm"
            >
              {trialDaysLeft === 0
                ? "Your trial ends today."
                : `Your trial ends in ${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"}.`}
            </motion.div>
          )}

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 backdrop-blur-sm">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-white mb-1">
              Choose a plan
            </h2>
            <p className="font-mono text-xs text-slate-500 mb-4">
              Upgrade before your trial ends to keep full access.
            </p>

            {checkoutError && (
              <p className="mb-4 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs font-mono text-red-200" role="alert">
                {checkoutError}
              </p>
            )}

            <PlanChoiceGrid
              upgradeLoading={upgradeLoading}
              onCheckout={startCheckout}
              buttonLabel="Upgrade to this plan"
            />

            <p className="mt-4 text-center text-xs font-mono text-slate-600">
              <Link href="/pricing" className="underline underline-offset-2 hover:text-slate-400 transition-colors">
                Full plan comparison →
              </Link>
            </p>
          </div>
        </motion.div>
      )}

      {/* new_trader — upgrade to experienced */}
      {plan === "new_trader" && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6"
        >
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-white mb-4">
            Upgrade to Experienced
          </h2>
          <UpgradeCard
            name="Experienced"
            price={39}
            features={["Unlimited AI Coach", "Risk Manager", "Priority support", "Unlimited backtesting"]}
            plan="experienced"
            onCheckout={startCheckout}
            loading={upgradeLoading === "experienced"}
            highlight
          />
        </motion.div>
      )}

      {/* experienced — you have everything */}
      {plan === "experienced" && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-[#ff3c3c]/20 bg-[#ff3c3c]/[0.04] p-6"
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-[#ff3c3c]" />
            <p className="font-semibold text-slate-200">
              You have the full RiskSent experience
            </p>
          </div>
          <p className="text-sm text-slate-400 font-mono">
            Unlimited AI Coach, Risk Manager, priority support, advanced analytics, and everything else.
          </p>
        </motion.div>
      )}

      <p className="text-center text-xs font-mono text-slate-600">
        Secure payment · Stripe · Cancel anytime via the portal above
      </p>
    </div>
  );
}

function UpgradeCard({
  name,
  price,
  features,
  plan,
  onCheckout,
  loading,
  highlight,
}: {
  name: string;
  price: number;
  features: string[];
  plan: string;
  onCheckout: (plan: string) => Promise<void>;
  loading: boolean;
  highlight: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 transition-all ${
        highlight
          ? "border-[#ff3c3c]/30 bg-[#ff3c3c]/[0.05]"
          : "border-white/[0.07] bg-white/[0.02]"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-white">{name}</p>
            {highlight && (
              <span className="rounded-full border border-[#ff3c3c]/40 bg-[#ff3c3c]/10 px-2 py-0.5 text-[10px] font-mono text-[#ff3c3c]">
                Most popular
              </span>
            )}
          </div>
          <p className="mt-1 font-mono text-sm text-slate-400">€{price}/month</p>
          <ul className="mt-2 space-y-1">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                <CheckCircle className="h-3 w-3 shrink-0 text-emerald-400" />
                {f}
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={() => void onCheckout(plan)}
          disabled={loading}
          className="flex shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-black transition-all hover:scale-[1.02] disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, #ff3c3c, #ff8c00)",
            boxShadow: highlight ? "0 0 20px rgba(255,60,60,0.2)" : "none",
          }}
        >
          {loading ? "Loading…" : `Upgrade to ${name}`}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
