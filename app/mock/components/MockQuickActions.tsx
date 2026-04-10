"use client";

import Link from "next/link";
import { RefreshCw, SlidersHorizontal, Sparkles, MessageCircle } from "lucide-react";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors";

export function MockQuickActions() {
  return (
    <section className="flex flex-wrap gap-2.5 sm:gap-3">
      <span
        className={`${base} cursor-not-allowed border-slate-700 bg-slate-800/50 text-slate-500`}
        title="Disabilitato in mock"
      >
        <RefreshCw className="h-4 w-4 shrink-0" />
        Sync trades
      </span>
      <Link
        href="/mock/risk-manager"
        className={`${base} border-slate-600/80 bg-slate-900/40 text-slate-200 hover:border-slate-500 hover:bg-slate-800/70 hover:text-white`}
      >
        <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-400" />
        Edit rules
      </Link>
      <Link
        href="/mock/ai-coach"
        className={`${base} border-slate-600/80 bg-slate-900/40 text-slate-200 hover:border-slate-500 hover:bg-slate-800/70 hover:text-white`}
      >
        <Sparkles className="h-4 w-4 shrink-0 text-slate-400" />
        AI Coach
      </Link>
      <Link
        href="/mock/risk-manager"
        className={`${base} border-slate-600/80 bg-slate-900/40 text-slate-200 hover:border-slate-500 hover:bg-slate-800/70 hover:text-white`}
      >
        <MessageCircle className="h-4 w-4 shrink-0 text-slate-400" />
        Telegram setup
      </Link>
    </section>
  );
}
