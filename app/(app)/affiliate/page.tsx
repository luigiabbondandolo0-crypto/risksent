"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Gift, Users, DollarSign, TrendingUp, ArrowRight, Sparkles } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

const PREVIEW_CARDS = [
  {
    icon: Users,
    title: "Refer traders",
    description: "Share your unique link. Every signup you refer is tracked automatically.",
    color: "#6366f1",
    bg: "rgba(99,102,241,0.08)",
    border: "rgba(99,102,241,0.2)",
  },
  {
    icon: DollarSign,
    title: "Earn commission",
    description: "Get a percentage of every subscription payment from your referrals.",
    color: "#00e676",
    bg: "rgba(0,230,118,0.07)",
    border: "rgba(0,230,118,0.18)",
  },
  {
    icon: TrendingUp,
    title: "Track earnings",
    description: "Real-time dashboard showing clicks, signups, and payouts.",
    color: "#ff8c00",
    bg: "rgba(255,140,0,0.07)",
    border: "rgba(255,140,0,0.18)",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.38 } },
};

export default function AffiliatePage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login?redirectedFrom=/app/affiliate");
        return;
      }
      setAuthChecked(true);
    };
    checkAuth();
  }, [router]);

  if (!authChecked) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    // Fire-and-forget — no backend yet
    await new Promise(r => setTimeout(r, 600));
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center px-4 py-16">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mx-auto w-full max-w-lg text-center"
      >
        {/* Badge */}
        <motion.div variants={item} className="mb-6 flex justify-center">
          <span
            className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest"
            style={{
              borderColor: "rgba(255,140,0,0.3)",
              background: "rgba(255,140,0,0.07)",
              color: "#ff8c00",
            }}
          >
            <Sparkles className="h-3 w-3" />
            Coming soon
          </span>
        </motion.div>

        {/* Icon */}
        <motion.div variants={item} className="mb-5 flex justify-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{
              background: "linear-gradient(135deg, rgba(255,60,60,0.15), rgba(255,140,0,0.15))",
              border: "1px solid rgba(255,140,0,0.25)",
            }}
          >
            <Gift className="h-8 w-8" style={{ color: "#ff8c00" }} />
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={item}
          className="mb-3 text-3xl font-black tracking-tight text-white sm:text-4xl"
        >
          Affiliate Program
        </motion.h1>
        <motion.p variants={item} className="mb-10 text-sm leading-relaxed text-slate-500">
          Earn real money by sharing RiskSent with other traders.
          <br />
          We&apos;re building the program — be first in line.
        </motion.p>

        {/* Preview cards */}
        <motion.div variants={item} className="mb-10 grid gap-3 sm:grid-cols-3">
          {PREVIEW_CARDS.map(card => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="rounded-xl border p-4 text-left"
                style={{ background: card.bg, borderColor: card.border }}
              >
                <Icon className="mb-2.5 h-5 w-5" style={{ color: card.color }} />
                <p className="mb-1 text-[13px] font-semibold text-slate-100">{card.title}</p>
                <p className="text-[11px] leading-relaxed text-slate-500">{card.description}</p>
              </div>
            );
          })}
        </motion.div>

        {/* Waitlist form */}
        <motion.div variants={item}>
          {submitted ? (
            <div
              className="rounded-xl border px-5 py-4 text-sm font-semibold"
              style={{
                borderColor: "rgba(0,230,118,0.25)",
                background: "rgba(0,230,118,0.07)",
                color: "#00e676",
              }}
            >
              You&apos;re on the list — we&apos;ll notify you when it launches.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="min-w-0 flex-1 rounded-xl border bg-transparent px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-colors focus:border-white/20"
                style={{ borderColor: "rgba(255,255,255,0.1)" }}
              />
              <button
                type="submit"
                disabled={loading}
                className="flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-black transition-all hover:scale-[1.02] disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #ff3c3c, #ff8c00)" }}
              >
                {loading ? "…" : (
                  <>
                    Notify me
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
