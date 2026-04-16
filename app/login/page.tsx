"use client";

import { FormEvent, Suspense, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080809]" />}>
      <LoginForm />
    </Suspense>
  );
}

const stats = [
  { label: "10,000+ traders protected" },
  { label: "avg −2.3% drawdown reduction" },
  { label: "$4.2M in losses prevented" }
];

function CandleStrip() {
  const bars = Array.from({ length: 24 }, (_, i) => {
    const up = i % 3 !== 0;
    const h = 20 + (i * 7) % 45;
    return (
      <div key={i} className="flex flex-col items-center justify-end gap-0.5" style={{ height: 56 }}>
        <div
          className="w-[3px] rounded-sm"
          style={{
            height: h,
            background: up ? "linear-gradient(180deg,#22c55e,#15803d)" : "linear-gradient(180deg,#ef4444,#991b1b)"
          }}
        />
      </div>
    );
  });
  return (
    <div className="relative mt-auto h-16 w-full overflow-hidden border-t border-white/[0.06] opacity-80">
      <div className="rs-candle-scroll flex gap-[5px] px-2 pt-2" style={{ width: "max-content" }}>
        {bars}
        {bars}
      </div>
    </div>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  const redirectTo = useMemo(
    () => searchParams.get("redirectedFrom") ?? "/app/dashboard",
    [searchParams]
  );
  const sessionExpired = searchParams.get("sessionExpired") === "1";

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(null);
      if (!email.trim() || !password.trim()) {
        setError("Please fill in all fields.");
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setError("Please enter a valid email address.");
        return;
      }
      setLoading(true);
      try {
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            password
          })
        });

        const loginData = (await loginRes.json().catch(() => ({}))) as { error?: string };
        if (!loginRes.ok) {
          setError(loginData.error ?? "Unable to sign in. Please try again.");
          setLoading(false);
          return;
        }

        try {
          const roleRes = await fetch("/api/admin/check-role");
          if (roleRes.ok) {
            const roleData = await roleRes.json();
            if (roleData.isAdmin) {
              setIsAdmin(true);
              setLoading(false);
              return;
            }
          }
        } catch {
          /* continue */
        }

        window.location.href = redirectTo;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error.");
        setLoading(false);
      }
    },
    [email, password, redirectTo]
  );

  if (isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080809] px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8 backdrop-blur-xl"
        >
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-white">Choose area</h1>
          <p className="mt-1 text-xs font-mono text-slate-500">Signed in as an administrator.</p>
          <div className="mt-6 space-y-3">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                window.location.href = "/app/dashboard";
              }}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
            >
              User area
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                window.location.href = "/admin";
              }}
              className="w-full rounded-xl border border-amber-500/40 bg-amber-500/10 py-3 text-sm font-semibold text-amber-200"
            >
              Admin area
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#080809] lg:flex-row">
      {/* LEFT visual */}
      <div className="relative hidden min-h-[320px] flex-1 flex-col overflow-hidden lg:flex lg:min-h-screen lg:basis-[60%]">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 30% 20%, rgba(99,102,241,0.2), transparent 55%), radial-gradient(ellipse 50% 50% at 80% 60%, rgba(167,139,250,0.1), transparent 50%), #070710"
          }}
        />
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-10 py-12">
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl text-lg font-black text-white shadow-[0_0_48px_rgba(99,102,241,0.35)]"
            style={{ background: "linear-gradient(135deg, #6366f1, #a78bfa)" }}
          >
            RS
          </motion.div>
          <h2 className="text-center font-[family-name:var(--font-display)] text-3xl font-bold text-white">
            RiskSent
          </h2>
          <p className="mt-3 max-w-md text-center text-sm font-[family-name:var(--font-mono)] text-slate-400">
            Trade with discipline. Protect your capital.
          </p>
          <div className="mt-10 grid w-full max-w-lg gap-3">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 24 }}
                animate={{
                  opacity: 1,
                  y: [0, -6, 0]
                }}
                transition={{
                  opacity: { delay: 0.15 + i * 0.1, duration: 0.45 },
                  y: {
                    delay: 0.6 + i * 0.15,
                    duration: 4 + i * 0.4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
                className="rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-center text-sm font-[family-name:var(--font-mono)] text-slate-200 backdrop-blur-md"
              >
                {s.label}
              </motion.div>
            ))}
          </div>
        </div>
        <CandleStrip />
      </div>

      {/* RIGHT form */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 lg:basis-[40%]">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8 shadow-2xl backdrop-blur-xl"
        >
          <h1
            className="font-[family-name:var(--font-display)] text-[28px] font-bold leading-tight text-white"
          >
            Welcome back
          </h1>
          <p className="mt-2 text-sm font-[family-name:var(--font-mono)] text-slate-500">
            Sign in to your RiskSent account
          </p>
          {sessionExpired && (
            <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              Session expired due to inactivity. Please sign in again.
            </p>
          )}
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-xs font-mono text-slate-500">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.1] bg-[#0e0e12] py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-[#6366f1]"
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-mono text-slate-500">
                  Password
                </label>
                <Link
                  href="/reset-password"
                  className="text-xs font-mono text-slate-500 hover:text-[#a78bfa]"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.1] bg-[#0e0e12] py-2.5 pl-10 pr-10 text-sm text-white outline-none focus:border-[#6366f1]"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-white"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {error}
              </p>
            )}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white shadow-[0_0_28px_rgba(99,102,241,0.25)] transition-shadow hover:shadow-[0_0_36px_rgba(99,102,241,0.4)] disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </motion.button>
          </form>
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/[0.08]" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-600">or</span>
            <div className="h-px flex-1 bg-white/[0.08]" />
          </div>
          <Link
            href="/signup"
            className="block w-full rounded-xl border border-white/[0.2] py-3 text-center text-sm font-semibold text-white transition-colors hover:border-white/[0.35] hover:bg-white/[0.04]"
          >
            Create account
          </Link>
          <p className="mt-6 text-center text-[11px] leading-relaxed text-slate-600">
            By signing in you accept our{" "}
            <span className="text-slate-400">Terms of Service</span> and{" "}
            <span className="text-slate-400">Privacy Policy</span>.
          </p>
          <div className="mt-4 text-center">
            <Link href="/" className="text-xs font-mono text-slate-500 hover:text-[#a78bfa]">
              ← Back to landing
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
