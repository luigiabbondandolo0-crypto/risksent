"use client";

import Link from "next/link";
import { RefreshCw, SlidersHorizontal, Sparkles, MessageCircle } from "lucide-react";

type QuickActionsProps = {
  onSyncTrades?: () => void;
  syncing?: boolean;
};

export function QuickActions({ onSyncTrades, syncing }: QuickActionsProps) {
  return (
    <section className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={onSyncTrades}
        disabled={syncing}
        className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/50 bg-cyan-500/20 px-4 py-2.5 text-sm font-medium text-cyan-300 hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
        Sync Trades Now
      </button>
      <Link
        href="/rules"
        className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/50 bg-cyan-500/20 px-4 py-2.5 text-sm font-medium text-cyan-300 hover:bg-cyan-500/30 transition-colors"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Edit Rules
      </Link>
      <Link
        href="/ai-coach"
        className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/50 bg-cyan-500/20 px-4 py-2.5 text-sm font-medium text-cyan-300 hover:bg-cyan-500/30 transition-colors"
      >
        <Sparkles className="h-4 w-4" />
        AI Coach Insight
      </Link>
      <Link
        href="/rules#telegram"
        className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/50 bg-cyan-500/20 px-4 py-2.5 text-sm font-medium text-cyan-300 hover:bg-cyan-500/30 transition-colors"
      >
        <MessageCircle className="h-4 w-4" />
        Telegram Alerts Setup
      </Link>
    </section>
  );
}
