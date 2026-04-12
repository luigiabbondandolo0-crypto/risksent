"use client";

import { FormEvent, Suspense, useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function ChangePasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080809]" />}>
      <ChangePasswordForm />
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

function ChangePasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const strength = useMemo(() => passwordStrength(newPassword), [newPassword]);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?redirectedFrom=/change-password");
        return;
      }
      setEmail(user.email ?? "");
      setCheckingAuth(false);
    };
    void checkAuth();
  }, [router]);

  const handleChangePassword = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("New password must be different from current password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();

      // Step 1: verifica password corrente
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword
      });

      if (signInError) {
        setError("Current password is incorrect.");
        setLoading(false);
        return;
      }

      // Step 2: aggiorna con nuova password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      setDone(true);
      setTimeout(() => router.push("/app/dashboard"), 3000);
    } catch {
      setError("Unexpected error. Please try again.");
    }
    setLoading(false);
  }, [currentPassword, newPassword, confirmPassword, email, router]);

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080809]">
        <p className="font-mono text-sm text-slate-500">Loading…</p>
      </div>
    );
  }

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
          <Link href="/">
            <p className="font-[family-name:var(--font-display)] text-2xl font-black text-white">
              RiskSent
            </p>
          </Link>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8 backdrop-blur-xl">

          {done ? (
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
                Redirecting to dashboard…
              </p>
            </motion.div>
          ) : (
            <>
              <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">
                Change password
              </h1>
              <p className="mt-2 font-[family-name:var(--font-mono)] text-sm text-slate-500">
                Enter your current password to set a new one.
              </p>

              <form onSubmit={handleChangePassword} className="mt-8 space-y-4">
                {/* Current password */}
                <div>
                  <label className="mb-1 block text-xs font-mono text-slate-500">
                    Current password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className={`${inputClass} pl-10 pr-10`}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-white"
                    >
                      {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div>
                  <label className="mb-1 block text-xs font-mono text-slate-500">
                    New password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`${inputClass} pl-10 pr-10`}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-white"
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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

                {/* Confirm password */}
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

              <div className="mt-6 flex items-center justify-between text-xs font-mono text-slate-500">
                <Link href="/app/dashboard" className="hover:text-white transition-colors">
                  ← Back to dashboard
                </Link>
                <Link href="/profile" className="hover:text-white transition-colors">
                  Profile settings
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}