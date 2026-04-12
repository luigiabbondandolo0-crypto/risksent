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
      className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3"
      style={{
        borderColor: "rgba(255,140,0,0.25)",
        background: "linear-gradient(90deg, rgba(255,140,0,0.08) 0%, rgba(255,60,60,0.06) 100%)",
      }}
    >
      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2 text-sm font-mono">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 shrink-0 text-amber-400" />
          <span className="text-amber-200 font-semibold">
            You&rsquo;re exploring RiskSent with a sample Experienced account.
          </span>
        </div>
        <span className="text-slate-400 ml-6 sm:ml-0">
          Buy a plan to connect your real trading data.{" "}
          <Link
            href="/pricing"
            className="text-slate-400 underline underline-offset-2 hover:text-slate-200 transition-colors"
          >
            View plans
          </Link>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/pricing"
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-black transition-all hover:scale-[1.03]"
          style={{ background: "linear-gradient(135deg, #ff8c00, #ff3c3c)" }}
        >
          Buy a plan
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
