"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";

type Props = {
  feature: string;
  description?: string;
};

export function PlanGateWall({ feature, description }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex min-h-[min(70vh,560px)] w-full items-center justify-center px-4 py-12"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute left-1/2 top-1/2 h-[min(400px,90vw)] w-[min(400px,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(99,102,241,0.12) 0%, rgba(99,102,241,0.03) 50%, transparent 70%)",
          }}
          animate={{ scale: [1, 1.06, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div
        className="relative z-[1] w-full max-w-lg overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 text-center shadow-[0_24px_80px_-24px_rgba(0,0,0,0.75)] backdrop-blur-xl sm:p-10"
        style={{ boxShadow: "0 0 0 1px rgba(99,102,241,0.12), 0 24px 80px -24px rgba(0,0,0,0.75)" }}
      >
        <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center">
          <motion.div
            className="absolute inset-0 rounded-2xl border border-[#6366f1]/30"
            animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
          />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[#6366f1]/20 bg-gradient-to-br from-[#6366f1]/15 to-[#4f46e5]/5">
            <Lock className="h-7 w-7 text-[#818cf8]" />
          </div>
        </div>

        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-white sm:text-[1.65rem]">
          {feature} requires Experienced
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-400 font-[family-name:var(--font-mono)]">
          {description ?? `Upgrade to the Experienced plan to unlock ${feature} and get full access to all premium features.`}
        </p>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mt-8 inline-block sm:min-w-[240px] w-full sm:w-auto"
        >
          <Link
            href="/app/billing"
            className="block w-full rounded-xl px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition-shadow hover:shadow-[#6366f1]/30"
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              boxShadow: "0 0 24px rgba(99,102,241,0.25)",
            }}
          >
            Upgrade to Experienced
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
