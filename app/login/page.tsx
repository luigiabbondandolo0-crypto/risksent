"use client";

import { FormEvent, Suspense, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = useMemo(
    () => searchParams.get("redirectedFrom") ?? "/dashboard",
    [searchParams]
  );

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Basic validation
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (signInError) {
        // Better error messages
        let errorMessage = signInError.message;
        if (signInError.message.includes("Invalid login credentials")) {
          errorMessage = "Invalid email or password. Please try again.";
        } else if (signInError.message.includes("Email not confirmed")) {
          errorMessage = "Please confirm your email address before logging in.";
        }
        setError(errorMessage);
        setLoading(false);
        return;
      }

      // Successful login - redirect immediately
      if (data?.user) {
        router.push(redirectTo);
        // Don't set loading to false here - we're redirecting
      } else {
        setError("Login failed. Please try again.");
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unexpected error. Please try again.";
      setError(errorMessage);
      setLoading(false);
    }
  }, [email, password, redirectTo, router]);

  return (
    <div className="flex flex-col items-center mt-12">
      <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-surface/80 p-6 shadow-lg shadow-black/40">
        <h1 className="text-lg font-semibold text-slate-50 mb-1">
          Log in to RiskSent
        </h1>
        <p className="text-xs text-slate-500 mb-6">
          Mock auth using Supabase email + password. Privacy first: investor
          passwords are encrypted at rest.
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
            <label className="block text-xs text-slate-400" htmlFor="password">
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

          {error && (
            <p className="text-xs text-danger bg-danger/10 border border-danger/40 rounded-md px-2 py-1">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-emerald-500 px-3 py-2 text-sm font-medium text-black hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-4 text-[11px] text-slate-500 leading-relaxed">
          By logging in you accept the{" "}
          <span className="text-slate-300">privacy disclaimer</span>: RiskSent
          reads investor-password-only access, does not execute trades, and is
          for risk analytics only.
        </p>

        <p className="mt-3 text-[11px] text-slate-500">
          No account yet?{" "}
          <Link
            href="/signup"
            className="text-slate-200 hover:text-emerald-300"
          >
            Create one here
          </Link>
          .{" "}
          <Link
            href="/reset-password"
            className="text-slate-200 hover:text-emerald-300"
          >
            Forgot password?
          </Link>
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

