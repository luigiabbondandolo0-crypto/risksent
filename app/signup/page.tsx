"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bell, Brain, Lock, Mail, Shield, User, Eye, EyeOff } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

function strengthLabel(pw: string): { text: string; color: string } {
  if (pw.length < 6) return { text: "Weak", color: "text-red-400" };
  const hasNum = /\d/.test(pw);
  const hasSpec = /[^a-zA-Z0-9]/.test(pw);
  if (pw.length >= 10 && hasNum && hasSpec) return { text: "Strong", color: "text-emerald-400" };
  if (pw.length >= 8 && (hasNum || hasSpec)) return { text: "Fair", color: "text-amber-400" };
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
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName.trim() }
        }
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // Supabase returns a fake user with empty identities if email already exists
      if (signUpData.user && signUpData.user.identities?.length === 0) {
        setError("An account with this email already exists. Please sign in instead.");
        setLoading(false);
        return;
      }

      if (signUpData.user && fullName.trim()) {
        try {
          await fetch("/api/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fullName: fullName.trim() })
          });
        } catch {
          /* non-fatal */
        }
      }

      if (signUpData.user) {
        try {
          await fetch("/api/send-welcome-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" }
          });
        } catch {
          /* ignore */
        }
      }

      setInfo("Account created! Redirecting to sign in…");
      setTimeout(() => router.push("/login"), 2500);
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
                  className="w-full rounded-lg border border-white/[0.1] bg-[#0e0e12] py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-[#ff3c3c] transition-colors"
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
                  className="w-full rounded-lg border border-white/[0.1] bg-[#0e0e12] py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-[#ff3c3c] transition-colors"
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
                  className="w-full rounded-lg border border-white/[0.1] bg-[#0e0e12] py-2.5 pl-10 pr-10 text-sm text-white outline-none focus:border-[#ff3c3c] transition-colors"
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
                            pwStrength.text === "Weak" && i < 1 ? "#ff3c3c" :
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
                className="w-full rounded-lg border border-white/[0.1] bg-[#0e0e12] py-2.5 px-3 text-sm text-white outline-none focus:border-[#ff3c3c] transition-colors"
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
                <span className="text-slate-300 hover:text-white cursor-pointer">
                  Terms of Service
                </span>{" "}
                and{" "}
                <span className="text-slate-300 hover:text-white cursor-pointer">
                  Privacy Policy
                </span>
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
              className="w-full rounded-xl py-3 text-sm font-semibold text-white shadow-[0_0_28px_rgba(255,60,60,0.25)] disabled:opacity-50 transition-opacity"
              style={{ background: "linear-gradient(135deg, #ff3c3c, #cc0000)" }}
            >
              {loading ? "Creating account…" : "Create account"}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-mono text-[#ff3c3c] hover:underline">
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
      <div className="relative flex flex-1 flex-col justify-center border-b border-white/[0.06] px-8 py-14 lg:basis-[55%] lg:border-b-0 lg:border-l lg:pl-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 70% 30%, rgba(255,60,60,0.2), transparent 55%), radial-gradient(ellipse 40% 40% at 20% 80%, rgba(255,140,0,0.1), transparent 50%), #080809"
          }}
        />
        <div className="relative z-10">
          <motion.h2
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            className="font-[family-name:var(--font-display)] text-2xl font-bold text-white lg:text-3xl"
          >
            Join thousands of disciplined traders
          </motion.h2>

          <ul className="mt-10 space-y-5">
            {[
              { icon: Shield, t: "Risk rules that protect your capital" },
              { icon: Brain, t: "AI Coach that analyzes your behavior" },
              { icon: Bell, t: "Real-time Telegram alerts" }
            ].map(({ icon: Icon, t }, i) => (
              <motion.li
                key={t}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="flex items-start gap-4"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.04] text-[#ff3c3c]">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="pt-2 text-sm font-[family-name:var(--font-mono)] text-slate-300">{t}</p>
              </motion.li>
            ))}
          </ul>

          <motion.blockquote
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-12 rounded-2xl border border-white/[0.08] bg-black/35 p-5 backdrop-blur-md"
          >
            <p className="text-sm italic leading-relaxed text-slate-300">
              &ldquo;RiskSent saved my FTMO challenge. The AI caught my revenge trading pattern before I blew the account.&rdquo;
            </p>
            <footer className="mt-3 text-xs font-mono text-slate-500">— Marco T., Prop Trader</footer>
          </motion.blockquote>
        </div>
      </div>
    </div>
  );
}