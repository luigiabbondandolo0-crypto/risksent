"use client";

import Link from "next/link";
import { RefreshCw, SlidersHorizontal, Sparkles, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

type QuickActionsProps = {
  onSyncTrades?: () => void;
  syncing?: boolean;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500/50 hover:scale-[1.03] active:scale-[0.98]";

const buttons = [
  { type: "sync" },
  { href: "/app/risk-manager", icon: SlidersHorizontal, label: "Edit rules" },
  { href: "/app/ai-coach", icon: Sparkles, label: "AI Coach" },
  { href: "/app/risk-manager#telegram", icon: MessageCircle, label: "Telegram setup" },
];

export function QuickActions({ onSyncTrades, syncing }: QuickActionsProps) {
  return (
    <section className="flex flex-wrap gap-2.5 sm:gap-3">
      {/* Sync button */}
      <motion.button
        type="button"
        onClick={onSyncTrades}
        disabled={syncing}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className={`${base} border-cyan-500/40 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <RefreshCw className={`h-4 w-4 shrink-0 ${syncing ? "animate-spin" : ""}`} />
        Sync trades
      </motion.button>

      {/* Edit rules */}
      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
        <Link
          href="/app/risk-manager"
          className={`${base} border-slate-600/80 bg-slate-900/40 text-slate-200 hover:border-slate-500 hover:bg-slate-800/70 hover:text-white`}
        >
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-400" />
          Edit rules
        </Link>
      </motion.div>

      {/* AI Coach */}
      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
        <Link
          href="/app/ai-coach"
          className={`${base} border-slate-600/80 bg-slate-900/40 text-slate-200 hover:border-slate-500 hover:bg-slate-800/70 hover:text-white`}
        >
          <Sparkles className="h-4 w-4 shrink-0 text-slate-400" />
          AI Coach
        </Link>
      </motion.div>

      {/* Telegram */}
      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
        <Link
          href="/app/risk-manager#telegram"
          className={`${base} border-slate-600/80 bg-slate-900/40 text-slate-200 hover:border-slate-500 hover:bg-slate-800/70 hover:text-white`}
        >
          <MessageCircle className="h-4 w-4 shrink-0 text-slate-400" />
          Telegram setup
        </Link>
      </motion.div>
    </section>
  );
}