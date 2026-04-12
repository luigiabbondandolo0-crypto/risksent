"use client";

import { FormEvent, Suspense, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080809]" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function passwordStrength(pw: string): "weak" | "fair" | "strong" {
  if (pw.length < 6) return "weak";
  const hasNum = /\d/.test(pw);
  const hasSpecial = /[^a-zA-Z0-9]/.test(pw);
  const long = pw.length >= 10;
  if (long && hasNum && hasSpecial) return "strong";
  if (pw.length >= 8 && (hasNum || hasSpecial)) return "fair";
  return "weak";
}

const inputClass =
  "w-full rounded-lg border border-white/[0.1] bg-[#0e0e12] px-3 py-2.5 text-sm text-slate-100 outline-none transition-colors focus:border-[#ff3c3c] font-[family-name:var(--font-mono)]";

function ResetPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [step, setStep] = useState<"request" | "reset" | "done">("request");

  const strength = passwordStrength(newPassword);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    setStep("request");

    // Controlla subito l'hash nell'URL
    const hash = window.location.hash;
    if (hash && hash.includes("type=recovery")) {
      setStep("reset");
    }

    // Ascolta sempre l'evento PASSWORD_RECOVERY come fallback
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setStep("reset");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleRequestReset = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: `${window.location.origin}/reset-password` }
      );
      if (resetError) {
        setError(resetError.message);
      } else {
        setInfo("Check your email — we sent you a reset link.");
      }
    } catch {
      setError("Unexpected error. Please try again.");
    }
    setLoading(false);
  }, [email]);

  const handleResetPassword = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }
      await supabase.auth.signOut();
      setStep("done");
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("Unexpected error. Please try again.");
    }
    setLoading(false);
  }, [newPassword, confirmPassword, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080809] px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <p className="font-[family-name:var(--font-display)] text-2xl font-black text-white">
              RiskSent
            </p>
          </Link>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8 backdrop-blur-xl">

          {/* STEP: done */}
          {step === "done" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 py-4 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
              >
                <CheckCircle className="h-14 w-14 text-[#00e676]" />
              </motion.div>
              <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">
                Password updated
              </h1>
              <p className="font-[family-name:var(--font-mono)] text-sm text-slate-400">
                Redirecting to login…
              </p>
            </motion.div>
          )}

          {/* STEP: reset (from email link) */}
          {step === "reset" && (
            <>
              <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">
                Set new password
              </h1>
              <p className="mt-2 font-[family-name:var(--font-mono)] text-sm text-slate-500">
                Choose a strong password for your account.
              </p>

              <form onSubmit={handleResetPassword} className="mt-8 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-mono text-slate-500">
                    New password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showPw ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`${inputClass} pl-10 pr-10`}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-white"
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {newPassword && (
                    <p className={`mt-1 text-[10px] font-mono ${
                      strength === "strong" ? "text-[#00e676]" :
                      strength === "fair" ? "text-[#ff8c00]" : "text-[#ff3c3c]"
                    }`}>
                      {strength === "strong" ? "Strong" : strength === "fair" ? "Fair" : "Weak"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-mono text-slate-500">
                    Confirm new password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`${inputClass} pl-10 pr-10`}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-white"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                  className="w-full rounded-xl py-3 text-sm font-semibold text-white shadow-[0_0_28px_rgba(255,60,60,0.25)] disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #ff3c3c, #cc0000)" }}
                >
                  {loading ? "Updating…" : "Update password"}
                </motion.button>
              </form>
            </>
          )}

          {/* STEP: request (default) */}
          {step === "request" && (
            <>
              <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">
                Reset password
              </h1>
              <p className="mt-2 font-[family-name:var(--font-mono)] text-sm text-slate-500">
                Enter your email and we'll send you a reset link.
              </p>

              <form onSubmit={handleRequestReset} className="mt-8 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-mono text-slate-500">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`${inputClass} pl-10`}
                      autoComplete="email"
                    />
                  </div>
                </div>

                {error && (
                  <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                    {error}
                  </p>
                )}
                {info && !error && (
                  <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                    {info}
                  </p>
                )}

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full rounded-xl py-3 text-sm font-semibold text-white shadow-[0_0_28px_rgba(255,60,60,0.25)] disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #ff3c3c, #cc0000)" }}
                >
                  {loading ? "Sending…" : "Send reset link"}
                </motion.button>
              </form>

              <div className="mt-6 flex items-center justify-between text-xs font-mono text-slate-500">
                <Link href="/login" className="hover:text-white transition-colors">
                  ← Back to login
                </Link>
                <Link href="/" className="hover:text-white transition-colors">
                  risksent.com
                </Link>
              </div>
            </>
          )}

        </div>
      </motion.div>
    </div>
  );
}