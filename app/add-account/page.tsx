"use client";

import Link from "next/link";

export default function AddAccountPage() {
  return (
    <div className="mt-4 max-w-xl space-y-4">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-50">Add trading account</h1>
          <p className="mt-1 text-sm text-slate-400">
            Broker linking is temporarily unavailable while we integrate a new data provider. Your existing accounts
            stay on file; live stats will resume once the new connection is ready.
          </p>
        </div>
        <Link href="/app/dashboard" className="shrink-0 text-xs text-slate-400 hover:text-slate-200">
          Back to dashboard
        </Link>
      </header>

      <div className="rounded-xl border border-slate-800 bg-surface p-6 text-sm text-slate-300">
        <p className="text-slate-200 font-medium mb-2">What happens next</p>
        <p className="text-slate-400 leading-relaxed">
          We removed the previous MetaTrader API integration. When the replacement provider is wired in, you will
          connect accounts again from this page. No action is required from you right now.
        </p>
      </div>
    </div>
  );
}
