"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      setInfo(
        "Account created. Check your inbox for a confirmation link or log in if email confirmations are disabled."
      );

      // Soft redirect to login after a short delay
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      setError("Unexpected error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center mt-12">
      <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-surface/80 p-6 shadow-lg shadow-black/40">
        <h1 className="text-lg font-semibold text-slate-50 mb-1">
          Create your RiskSent account
        </h1>
        <p className="text-xs text-slate-500 mb-6">
          Email + password signup powered by Supabase Auth. You can switch this
          to magic links or OAuth later.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
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
          <div className="space-y-1">
            <label
              className="block text-xs text-slate-400"
              htmlFor="password"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-slate-800 bg-black/40 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            />
          </div>
          <div className="space-y-1">
            <label
              className="block text-xs text-slate-400"
              htmlFor="confirmPassword"
            >
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
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
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="mt-3 text-[11px] text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="text-slate-200 hover:text-emerald-300">
            Log in
          </Link>
          .
        </p>

        <div className="mt-4 flex justify-between text-[11px] text-slate-500">
          <Link href="/" className="hover:text-slate-300">
            Back to landing
          </Link>
          <span className="text-slate-600">v0.1 mock</span>
        </div>
      </div>
    </div>
  );
}

