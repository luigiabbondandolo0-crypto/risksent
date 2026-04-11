"use client";

import { motion } from "framer-motion";
import { Plug } from "lucide-react";

type Props = {
  title: string;
  description: string;
  ctaLabel: string;
  onCta: () => void;
};

export function NoAccountState({ title, description, ctaLabel, onCta }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex min-h-[min(70vh,560px)] w-full items-center justify-center px-4 py-12"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="h-[min(420px,55vw)] w-[min(420px,85vw)] rounded-full blur-[100px]"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(255,60,60,0.18) 0%, rgba(255,60,60,0.04) 45%, transparent 70%)"
          }}
          animate={{ scale: [1, 1.06, 1], opacity: [0.7, 0.95, 0.7] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      <div className="rs-card relative z-[1] w-full max-w-lg p-8 sm:p-10 text-center shadow-[0_24px_80px_-24px_rgba(0,0,0,0.75)]">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-black/30 text-slate-400">
          <Plug className="h-7 w-7" strokeWidth={1.5} />
        </div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-[1.65rem]">{title}</h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-400 font-[family-name:var(--font-mono)]">
          {description}
        </p>
        <motion.button
          type="button"
          onClick={onCta}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mt-8 w-full rounded-xl bg-gradient-to-r from-[#ff3c3c] to-[#c92a2a] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#ff3c3c]/20 transition-shadow hover:shadow-[#ff3c3c]/30 sm:w-auto sm:min-w-[240px]"
        >
          {ctaLabel}
        </motion.button>
      </div>
    </motion.div>
  );
}
