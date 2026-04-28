"use client";

import { motion } from "framer-motion";
import { Plug } from "lucide-react";
import type { ComponentType } from "react";

type Props = {
  title: string;
  description: string;
  ctaLabel: string;
  onCta: () => void;
  icon?: ComponentType<{ className?: string }>;
};

export function NoAccountState({ title, description, ctaLabel, onCta, icon: Icon = Plug }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex min-h-[min(70vh,560px)] w-full items-center justify-center px-4 py-12"
    >
      {/* Background glows */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute left-1/2 top-1/2 h-[min(480px,90vw)] w-[min(480px,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(99,102,241,0.14) 0%, rgba(99,102,241,0.04) 45%, transparent 70%)",
          }}
          animate={{ scale: [1, 1.07, 1], opacity: [0.6, 0.9, 0.6] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute left-1/2 top-1/2 h-[min(200px,50vw)] w-[min(200px,50vw)] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      <div
        className="relative z-[1] w-full max-w-lg overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 text-center shadow-[0_24px_80px_-24px_rgba(0,0,0,0.75)] backdrop-blur-xl sm:p-10"
        style={{ boxShadow: "0 0 0 1px rgba(99,102,241,0.12), 0 24px 80px -24px rgba(0,0,0,0.75)" }}
      >
        {/* Icon */}
        <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center">
          {/* Pulse ring */}
          <motion.div
            className="absolute inset-0 rounded-2xl border border-[#6366f1]/30"
            animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
          />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[#6366f1]/20 bg-gradient-to-br from-[#6366f1]/15 to-[#4f46e5]/5">
            <Icon className="h-7 w-7 text-[#818cf8]" />
          </div>
        </div>

        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-white sm:text-[1.65rem]">
          {title}
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-400 font-[family-name:var(--font-mono)]">
          {description}
        </p>

        <motion.button
          type="button"
          onClick={onCta}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mt-8 w-full rounded-xl px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition-shadow hover:shadow-[#6366f1]/30 sm:w-auto sm:min-w-[240px]"
          style={{
            background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
            boxShadow: "0 0 24px rgba(99,102,241,0.25)",
          }}
        >
          {ctaLabel}
        </motion.button>
      </div>
    </motion.div>
  );
}
