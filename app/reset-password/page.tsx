"use client";

import { FormEvent, Suspense, useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [step, setStep] = useState<"request" | "reset">("request");

  // Check if we're in reset mode (from Supabase password reset link)
  useEffect(() => {
    const checkResetMode = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      // If we have a session and we're on the reset page, we're in reset mode
      // (Supabase sets a session when user clicks password reset link)
      if (session) {
        setStep("reset");
      }
    };
    
    checkResetMode();
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
        {
          redirectTo: `${window.location.origin}/reset-password?type=recovery`
        }
      );

      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }

      setInfo(
        "Password reset link sent! Check your email and click the link to reset your password."
      );
      setLoading(false);
    } catch (err) {
      setError("Unexpected error. Please try again.");
      setLoading(false);
    }
  }, [email]);

  const handleResetPassword = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
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

      setInfo("Password updated successfully! Redirecting to login...");
      
      // Sign out and redirect to login
      await supabase.auth.signOut();
      
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      setError("Unexpected error. Please try again.");
      setLoading(false);
    }
  }, [newPassword, confirmPassword, router]);

  if (step === "reset") {
    return (
      <div className="flex flex-col items-center mt-12">
        <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-surface/80 p-6 shadow-lg shadow-black/40">
          <h1 className="text-lg font-semibold text-slate-50 mb-1">
            Reset your password
          </h1>
          <p className="text-xs text-slate-500 mb-6">
            Enter your new password below.
          </p>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs text-slate-400" htmlFor="newPassword">
                New password
              </label>
              <input
                id="newPassword"
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-md border border-slate-800 bg-black/40 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs text-slate-400" htmlFor="confirmPassword">
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-md border border-slate-800 bg-black/40 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
              />
            </div>

            {error && (
              <p className="text-xs text-danger bg-danger/10 border border-danger/40 rounded-md px-2 py-1">
                {error}
              </p>
            )}
            {info && !error && (
              <p className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/40 rounded-md px-2 py-1">
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-emerald-500 px-3 py-2 text-sm font-medium text-black hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Updating password..." : "Update password"}
            </button>
          </form>

          <p className="mt-3 text-[11px] text-slate-500">
            Remember your password?{" "}
            <Link href="/login" className="text-slate-200 hover:text-emerald-300">
              Log in
            </Link>
            .
          </p>

          <div className="mt-4 flex justify-between text-[11px] text-slate-500">
            <Link href="/" className="hover:text-slate-300">
              Back to landing
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center mt-12">
      <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-surface/80 p-6 shadow-lg shadow-black/40">
        <h1 className="text-lg font-semibold text-slate-50 mb-1">
          Reset your password
        </h1>
        <p className="text-xs text-slate-500 mb-6">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleRequestReset} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs text-slate-400" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-800 bg-black/40 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            />
          </div>

          {error && (
            <p className="text-xs text-danger bg-danger/10 border border-danger/40 rounded-md px-2 py-1">
              {error}
            </p>
          )}
          {info && !error && (
            <p className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/40 rounded-md px-2 py-1">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-emerald-500 px-3 py-2 text-sm font-medium text-black hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Sending reset link..." : "Send reset link"}
          </button>
        </form>

        <p className="mt-3 text-[11px] text-slate-500">
          Remember your password?{" "}
          <Link href="/login" className="text-slate-200 hover:text-emerald-300">
            Log in
          </Link>
          .
        </p>

        <div className="mt-4 flex justify-between text-[11px] text-slate-500">
          <Link href="/" className="hover:text-slate-300">
            Back to landing
          </Link>
        </div>
      </div>
    </div>
  );
}
