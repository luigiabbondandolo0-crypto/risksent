"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-[#080810] p-6 text-center">
      <p className="font-mono text-5xl font-bold text-red-400">500</p>
      <h1 className="text-xl font-semibold text-white">Something went wrong</h1>
      <p className="max-w-sm text-sm text-slate-400">
        An unexpected error occurred. If the problem persists, contact{" "}
        <a href="mailto:support@risksent.com" className="text-indigo-400 hover:underline">
          support@risksent.com
        </a>
        .
      </p>
      {error.digest && (
        <p className="font-mono text-xs text-slate-600">Error ID: {error.digest}</p>
      )}
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-sm text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-sm text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
