"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, ArrowRight, X } from "lucide-react";
import Link from "next/link";

export function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3"
      style={{
        borderColor: "rgba(99,102,241,0.3)",
        background: "linear-gradient(90deg, rgba(99,102,241,0.08) 0%, rgba(129,140,248,0.05) 100%)",
      }}
    >
      <div className="flex items-center gap-2 font-mono text-sm">
        <Zap className="h-4 w-4 shrink-0 text-[#818cf8]" />
        <span className="font-semibold text-slate-200">
          Preview mode — sample data only.
        </span>
        <span className="hidden text-slate-500 sm:inline">
          Start a free trial to connect your live account.
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/pricing"
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs font-bold text-white transition-all hover:scale-[1.03]"
          style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)" }}
        >
          Start free trial
          <ArrowRight className="h-3 w-3" />
        </Link>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
