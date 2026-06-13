"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bell, Brain, Lock, Mail, Shield, User, Eye, EyeOff } from "lucide-react";

function strengthLabel(pw: string): { text: string; color: string } {
  if (pw.length < 10) return { text: "Weak", color: "text-red-400" };
  const hasUpper = /[A-Z]/.test(pw);
  const hasLower = /[a-z]/.test(pw);
  const hasNum = /\d/.test(pw);
  const hasSpec = /[^a-zA-Z0-9]/.test(pw);
  if (pw.length >= 12 && hasUpper && hasLower && hasNum && hasSpec) {
    return { text: "Strong", color: "text-emerald-400" };
  }
  if (hasUpper && hasLower && (hasNum || hasSpec)) return { text: "Fair", color: "text-amber-400" };
  return { text: "Weak", color: "text-red-400" };
}

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const pwStrength = useMemo(() => strengthLabel(password), [password]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!terms) {
      setError("Please accept the Terms of Service and Privacy Policy.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const signUpRes = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          password
        })
      });

      const signUpData = (await signUpRes.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      if (!signUpRes.ok) {
        setError(signUpData.error ?? "Unable to create account.");
        setLoading(false);
        return;
      }
      setInfo(signUpData.message ?? "Account created! Please verify your email before signing in.");
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("Unexpected error. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col-reverse bg-[#080809] lg:flex-row">
      {/* Form LEFT */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 lg:basis-[45%]">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8 backdrop-blur-xl"
        >
          <h1 className="font-[family-name:var(--font-display)] text-[26px] font-bold text-white">
            Create your account
          </h1>
          <p className="mt-2 text-sm font-mono text-slate-500">
            Start protecting your capital with RiskSent.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-mono text-slate-500" htmlFor="fullName">
                Full name
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="fullName"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.1] bg-[#0e0e12] py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-[#6366f1] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-mono text-slate-500" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.1] bg-[#0e0e12] py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-[#6366f1] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-mono text-slate-500" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.1] bg-[#0e0e12] py-2.5 pl-10 pr-10 text-sm text-white outline-none focus:border-[#6366f1] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-white transition-colors"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex flex-1 gap-1">
                    {["Weak", "Fair", "Strong"].map((level, i) => (
                      <div
                        key={level}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{
                          background:
                            pwStrength.text === "Strong" ? "#00e676" :
                            pwStrength.text === "Fair" && i < 2 ? "#ff8c00" :
                            pwStrength.text === "Weak" && i < 1 ? "#F87171" :
                            "rgba(255,255,255,0.08)"
                        }}
                      />
                    ))}
                  </div>
                  <p className={`text-[10px] font-mono ${pwStrength.color}`}>
                    {pwStrength.text}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-mono text-slate-500" htmlFor="confirm">
                Confirm password
              </label>
              <input
                id="confirm"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-white/[0.1] bg-[#0e0e12] py-2.5 px-3 text-sm text-white outline-none focus:border-[#6366f1] transition-colors"
              />
              {confirmPassword && confirmPassword !== password && (
                <p className="mt-1 text-[10px] font-mono text-red-400">Passwords do not match</p>
              )}
              {confirmPassword && confirmPassword === password && (
                <p className="mt-1 text-[10px] font-mono text-emerald-400">Passwords match ✓</p>
              )}
            </div>

            <label className="flex cursor-pointer items-start gap-2 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                className="mt-0.5 rounded border-white/20 bg-[#0e0e12]"
              />
              <span>
                I agree to{" "}
                <Link href="/terms" className="text-slate-300 hover:text-white underline underline-offset-2">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-slate-300 hover:text-white underline underline-offset-2">
                  Privacy Policy
                </Link>
              </span>
            </label>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-mono text-red-300"
              >
                {error}
              </motion.p>
            )}
            {info && !error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-mono text-emerald-200"
              >
                {info}
              </motion.p>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white shadow-[0_0_28px_rgba(99,102,241,0.25)] disabled:opacity-50 transition-opacity"
              style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
            >
              {loading ? "Creating account…" : "Create account"}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-mono text-[#a78bfa] hover:underline">
              Sign in
            </Link>
          </p>
          <div className="mt-4 text-center">
            <Link href="/" className="text-xs font-mono text-slate-600 hover:text-slate-400 transition-colors">
              Back to landing
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Visual RIGHT */}
      <div className="relative flex flex-1 flex-col justify-center overflow-hidden border-b border-white/[0.06] px-6 py-8 sm:px-8 sm:py-12 lg:basis-[55%] lg:border-b-0 lg:border-l lg:pl-14 lg:py-14">
        {/* Background layers */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 55% at 75% 20%, rgba(99,102,241,0.22), transparent 55%), radial-gradient(ellipse 50% 45% at 15% 85%, rgba(167,139,250,0.12), transparent 50%), radial-gradient(ellipse 40% 35% at 90% 90%, rgba(34,211,238,0.07), transparent 55%), #070710"
          }}
        />
        {/* Subtle grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "48px 48px"
          }}
        />
        {/* Glowing orb top-right */}
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.6), transparent 70%)", filter: "blur(40px)" }}
        />
        {/* Glowing orb bottom-left */}
        <div
          className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, rgba(167,139,250,0.5), transparent 70%)", filter: "blur(32px)" }}
        />

        <div className="relative z-10">
          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <p className="mb-2 text-xs font-mono tracking-[0.18em] uppercase text-[#a78bfa]">Trusted by prop traders worldwide</p>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white lg:text-3xl">
              Trade with{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(135deg, #a78bfa, #6366f1)" }}
              >
                discipline.
              </span>{" "}
              Finally.
            </h2>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mt-8 grid grid-cols-3 gap-3"
          >
            {[
              { val: "4,200+", label: "Active traders" },
              { val: "94%", label: "Challenge pass rate" },
              { val: "7-day", label: "Free trial" },
            ].map(({ val, label }) => (
              <div key={label} className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-3 text-center">
                <p className="font-[family-name:var(--font-display)] text-lg font-bold text-white">{val}</p>
                <p className="mt-0.5 text-[10px] font-mono text-slate-500">{label}</p>
              </div>
            ))}
          </motion.div>

          {/* Feature list */}
          <ul className="mt-7 space-y-4">
            {[
              { icon: Shield, t: "Risk rules", sub: "Hard limits protect you even when emotions override logic" },
              { icon: Brain, t: "AI Coach", sub: "Spots revenge trading, overtrading, and psychological bias patterns" },
              { icon: Bell, t: "Telegram alerts", sub: "Real-time breach alerts before the broker margin-calls you" }
            ].map(({ icon: Icon, t, sub }, i) => (
              <motion.li
                key={t}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.18 + i * 0.08 }}
                className="flex items-start gap-4"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#6366f1]/30 bg-[#6366f1]/10 text-[#a78bfa]">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{t}</p>
                  <p className="mt-0.5 text-xs font-mono leading-relaxed text-slate-500">{sub}</p>
                </div>
              </motion.li>
            ))}
          </ul>

          {/* Testimonials */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mt-8 space-y-3"
          >
            {/* Primary testimonial */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6366f1] to-[#a78bfa] text-xs font-bold text-white">
                  MT
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">Marco T.</span>
                    <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-400">FTMO Passed</span>
                  </div>
                  <div className="mt-0.5 flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="h-3 w-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm italic leading-relaxed text-slate-300">
                &ldquo;RiskSent saved my FTMO challenge. The AI caught my revenge trading pattern before I blew the account. Best investment I made as a prop trader.&rdquo;
              </p>
            </div>

            {/* Secondary testimonial — compact */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#22d3ee] to-[#6366f1] text-[10px] font-bold text-white">
                  SL
                </div>
                <p className="text-xs italic text-slate-400">
                  &ldquo;Passed two $100k challenges back-to-back. The daily loss alert is a game changer.&rdquo;
                </p>
              </div>
              <div className="mt-1.5 pl-10 flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-600">Sofia L. · Futures Trader</span>
                <span className="rounded-full border border-[#6366f1]/25 bg-[#6366f1]/10 px-1.5 py-0.5 text-[10px] font-mono text-[#a78bfa]">$200k funded</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}