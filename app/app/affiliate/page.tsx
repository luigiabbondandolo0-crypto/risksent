"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useAnimationFrame } from "framer-motion";
import { Gift, ArrowRight } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

/* ─── Floating dot ─── */
function Dot({ x, y, size, opacity, delay }: { x: string; y: string; size: number; opacity: number; delay: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ left: x, top: y, width: size, height: size, background: `rgba(255,140,0,${opacity})` }}
      animate={{ y: [0, -18, 0], opacity: [opacity, opacity * 1.8, opacity] }}
      transition={{ duration: 4 + delay, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}

const DOTS = [
  { x: "8%",  y: "20%", size: 4,  opacity: 0.18, delay: 0   },
  { x: "18%", y: "70%", size: 3,  opacity: 0.12, delay: 0.8 },
  { x: "75%", y: "15%", size: 5,  opacity: 0.14, delay: 1.3 },
  { x: "85%", y: "60%", size: 3,  opacity: 0.20, delay: 0.4 },
  { x: "55%", y: "82%", size: 4,  opacity: 0.10, delay: 2.1 },
  { x: "30%", y: "88%", size: 2,  opacity: 0.15, delay: 1.7 },
  { x: "92%", y: "35%", size: 3,  opacity: 0.11, delay: 0.6 },
];

/* ─── Orbiting ring ─── */
function OrbitRing({ radius, duration, dotColor, dotSize = 5, reverse = false }: {
  radius: number; duration: number; dotColor: string; dotSize?: number; reverse?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useAnimationFrame((t) => {
    if (!ref.current) return;
    const angle = ((t / 1000 / duration) * Math.PI * 2) * (reverse ? -1 : 1);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    ref.current.style.transform = `translate(${x}px, ${y}px)`;
  });
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: dotSize,
        height: dotSize,
        background: dotColor,
        boxShadow: `0 0 8px ${dotColor}`,
        left: "50%",
        top: "50%",
        marginLeft: -dotSize / 2,
        marginTop: -dotSize / 2,
      }}
      ref={ref}
    />
  );
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

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
    await new Promise(r => setTimeout(r, 700));
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <div className="relative flex min-h-[calc(100vh-56px)] flex-col items-center justify-center overflow-hidden px-4 py-16">

      {/* Background dots */}
      {DOTS.map((d, i) => <Dot key={i} {...d} />)}

      {/* Background radial glow */}
      <div className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 60% 55% at 50% 50%, rgba(255,140,0,0.06) 0%, transparent 70%)" }} />

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="relative mx-auto w-full max-w-md text-center"
      >
        {/* Badge */}
        <motion.div variants={fadeUp} className="mb-8 flex justify-center">
          <span
            className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em]"
            style={{ borderColor: "rgba(255,140,0,0.3)", background: "rgba(255,140,0,0.07)", color: "#ff8c00" }}
          >
            Affiliate Program
          </span>
        </motion.div>

        {/* Animated icon with orbiting rings */}
        <motion.div variants={fadeUp} className="mb-8 flex justify-center">
          <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
            {/* Orbit circles (decorative) */}
            <div className="absolute rounded-full border border-white/[0.06]"
              style={{ width: 100, height: 100 }} />
            <div className="absolute rounded-full border border-white/[0.04]"
              style={{ width: 120, height: 120 }} />

            {/* Orbiting dots */}
            <OrbitRing radius={50} duration={5} dotColor="#ff8c00" dotSize={5} />
            <OrbitRing radius={60} duration={8} dotColor="rgba(255,60,60,0.7)" dotSize={4} reverse />
            <OrbitRing radius={42} duration={11} dotColor="rgba(0,230,118,0.6)" dotSize={3} />

            {/* Center icon box */}
            <motion.div
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{
                background: "linear-gradient(135deg, rgba(255,60,60,0.18), rgba(255,140,0,0.18))",
                border: "1px solid rgba(255,140,0,0.3)",
                boxShadow: "0 0 32px rgba(255,140,0,0.15)",
              }}
            >
              <Gift className="h-7 w-7" style={{ color: "#ff8c00" }} />
            </motion.div>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fadeUp}
          className="mb-3 text-4xl font-black tracking-tight text-white sm:text-5xl"
          style={{ fontFamily: "var(--font-display)", lineHeight: 1 }}
        >
          Earn with<br />
          <span style={{ color: "#ff8c00" }}>RiskSent</span>
        </motion.h1>

        <motion.p variants={fadeUp} className="mb-3 text-[13px] leading-relaxed text-slate-400"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Share RiskSent. Earn recurring commission on every subscription.
        </motion.p>

        {/* Stats row */}
        <motion.div variants={fadeUp} className="mb-8 flex justify-center gap-4">
          {[
            { label: "Commission", value: "Up to 30%" },
            { label: "Cookie", value: "60 days" },
            { label: "Payout", value: "Monthly" },
          ].map(stat => (
            <div key={stat.label} className="flex flex-col items-center">
              <span className="text-[17px] font-black tracking-tight" style={{ color: "#ff8c00", fontFamily: "var(--font-display)" }}>
                {stat.value}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-slate-600">{stat.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Coming soon pill */}
        <motion.div variants={fadeUp} className="mb-6 flex justify-center">
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.15em]"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#64748b" }}
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400" />
            Program launching soon
          </span>
        </motion.div>

        {/* Waitlist form */}
        <motion.div variants={fadeUp}>
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl border px-5 py-4 text-sm font-semibold"
              style={{ borderColor: "rgba(0,230,118,0.25)", background: "rgba(0,230,118,0.06)", color: "#00e676" }}
            >
              You&apos;re on the waitlist — we&apos;ll notify you at launch.
            </motion.div>
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
                {loading ? "…" : <><span>Notify me</span><ArrowRight className="h-3.5 w-3.5" /></>}
              </button>
            </form>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
