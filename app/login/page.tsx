"use client";

import { FormEvent, Suspense, useState } from "react";
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

  const redirectTo = searchParams.get("redirectedFrom") ?? "/dashboard";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      router.push(redirectTo);
    } catch (err) {
      setError("Unexpected error. Please try again.");
      setLoading(false);
    }
  };

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
          No account yet? Create one from the Supabase dashboard or we&apos;ll
          add a signup flow later.
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

