"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import type { SubscriptionRow } from "@/app/api/stripe/subscription/route";

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  new_trader: "New Trader",
  experienced: "Experienced",
};

const PLAN_PRICES: Record<string, number> = {
  free: 0,
  new_trader: 25,
  experienced: 39,
};

const PLAN_COLOR: Record<string, string> = {
  free: "text-slate-400 bg-slate-500/15 border-slate-500/30",
  new_trader: "text-cyan-300 bg-cyan-500/15 border-cyan-500/30",
  experienced: "text-amber-300 bg-amber-500/15 border-amber-500/30",
};

const STATUS_COLOR: Record<string, string> = {
  active: "text-emerald-300 bg-emerald-500/15",
  trialing: "text-cyan-300 bg-cyan-500/15",
  past_due: "text-orange-300 bg-orange-500/15",
  canceled: "text-red-300 bg-red-500/15",
  incomplete: "text-slate-300 bg-slate-500/15",
};

export default function BillingPage() {
  const [sub, setSub] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null);

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

  const startCheckout = async (plan: string) => {
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
        alert(d.error ?? "Could not start checkout");
      }
    } finally {
      setUpgradeLoading(null);
    }
  };

  const plan = sub?.plan ?? "free";
  const price = PLAN_PRICES[plan] ?? 0;

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
              {sub?.status && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-mono ${STATUS_COLOR[sub.status] ?? ""}`}
                >
                  {sub.status}
                </span>
              )}
            </div>
            <p className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold text-white">
              €{price}
              <span className="text-base font-normal text-slate-500">/mo</span>
            </p>
          </div>
          {plan !== "free" && sub?.stripe_customer_id && (
            <button
              onClick={() => void openPortal()}
              disabled={portalLoading}
              className="flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-200 transition-all hover:border-slate-600 hover:bg-white/[0.06] disabled:opacity-50"
            >
              {portalLoading ? "Opening…" : "Manage subscription"}
            </button>
          )}
        </div>

        {sub?.current_period_end && (
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

      {/* Upgrade section (only on free or new_trader) */}
      {plan !== "experienced" && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6"
        >
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-white mb-4">
            Upgrade your plan
          </h2>
          <div className="space-y-3">
            {plan === "free" && (
              <UpgradeCard
                name="New Trader"
                price={25}
                features={[
                  "Unlimited backtesting",
                  "Full journal",
                  "10 risk rules",
                  "AI Coach (50 reports/mo)",
                  "Telegram alerts",
                ]}
                plan="new_trader"
                onCheckout={startCheckout}
                loading={upgradeLoading === "new_trader"}
                highlight={false}
              />
            )}
            <UpgradeCard
              name="Experienced"
              price={39}
              features={[
                "Unlimited AI Coach",
                "Priority support",
                "Advanced analytics",
                "Custom risk rules",
                "API access",
              ]}
              plan="experienced"
              onCheckout={startCheckout}
              loading={upgradeLoading === "experienced"}
              highlight
            />
          </div>
        </motion.div>
      )}

      {/* Features list for current plan */}
      {plan === "experienced" && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-5 w-5 text-amber-400" />
            <p className="font-semibold text-amber-200">
              You have the full RiskSent experience
            </p>
          </div>
          <p className="text-sm text-slate-400 font-mono">
            Unlimited AI Coach, priority support, advanced analytics, API
            access, and everything else.
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
          <p className="mt-1 font-mono text-sm text-slate-400">
            €{price}/month
          </p>
          <ul className="mt-2 space-y-1">
            {features.map((f) => (
              <li
                key={f}
                className="flex items-center gap-1.5 text-xs text-slate-400 font-mono"
              >
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
          {loading ? "Loading…" : `Start ${name}`}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
