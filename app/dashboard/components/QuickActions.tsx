"use client";

import Link from "next/link";
import { RefreshCw, SlidersHorizontal, Sparkles, MessageCircle, Send } from "lucide-react";

type QuickActionsProps = {
  onSyncTrades?: () => void;
  syncing?: boolean;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500/50";

export function QuickActions({ onSyncTrades, syncing }: QuickActionsProps) {
  return (
    <section className="flex flex-wrap gap-2.5 sm:gap-3">
      <button
        type="button"
        onClick={onSyncTrades}
        disabled={syncing}
        className={`${base} border-cyan-500/40 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <RefreshCw className={`h-4 w-4 shrink-0 ${syncing ? "animate-spin" : ""}`} />
        Sync trades
      </button>
      <Link
        href="/orders"
        className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/50 bg-cyan-500/20 px-4 py-2.5 text-sm font-medium text-cyan-300 hover:bg-cyan-500/30 transition-colors"
      >
        <Send className="h-4 w-4" />
        Open order
      </Link>
      <Link
        href="/rules"
        className={`${base} border-slate-600/80 bg-slate-900/40 text-slate-200 hover:border-slate-500 hover:bg-slate-800/70 hover:text-white`}
      >
        <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-400" />
        Edit rules
      </Link>
      <Link
        href="/ai-coach"
        className={`${base} border-slate-600/80 bg-slate-900/40 text-slate-200 hover:border-slate-500 hover:bg-slate-800/70 hover:text-white`}
      >
        <Sparkles className="h-4 w-4 shrink-0 text-slate-400" />
        AI Coach
      </Link>
      <Link
        href="/rules#telegram"
        className={`${base} border-slate-600/80 bg-slate-900/40 text-slate-200 hover:border-slate-500 hover:bg-slate-800/70 hover:text-white`}
      >
        <MessageCircle className="h-4 w-4 shrink-0 text-slate-400" />
        Telegram setup
      </Link>
    </section>
  );
}
