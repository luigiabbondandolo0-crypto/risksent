"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Zap, ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type Props = {
  open: boolean;
  action?: string;
  onClose: () => void;
};

export function DemoActionModal({ open, action, onClose }: Props) {
  const [trialLoading, setTrialLoading] = useState(false);

  const startTrial = async () => {
    setTrialLoading(true);
    try {
      const res = await fetch("/api/stripe/start-trial", { method: "POST" });
      if (res.ok) {
        window.location.reload();
      } else {
        const d = (await res.json()) as { error?: string };
        alert(d.error ?? "Could not start trial");
      }
    } finally {
      setTrialLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="relative w-full max-w-sm rounded-2xl border p-7 shadow-2xl"
              style={{
                background: "#0e0e12",
                borderColor: "rgba(255,140,0,0.2)",
                boxShadow: "0 0 60px rgba(255,60,60,0.12)",
              }}
            >
              <button
                onClick={onClose}
                className="absolute right-4 top-4 text-slate-500 hover:text-slate-300 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>

              <div
                className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ background: "rgba(255,140,0,0.12)", border: "1px solid rgba(255,140,0,0.25)" }}
              >
                <Zap className="h-5 w-5 text-amber-400" />
              </div>

              <h2
                className="text-lg font-black text-white"
                style={{ fontFamily: "var(--font-display, 'Syne', sans-serif)" }}
              >
                This is just a demo
              </h2>
              <p className="mt-2 text-sm font-mono text-slate-400 leading-relaxed">
                Start your 7-day free trial to{" "}
                <span className="text-slate-200">{action ?? "do this"}</span> for real.
                Full Experienced access, no credit card required.
              </p>

              <div className="mt-6 flex flex-col gap-2.5">
                <button
                  onClick={() => void startTrial()}
                  disabled={trialLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-black transition-all hover:scale-[1.02] disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #ff3c3c, #ff8c00)", boxShadow: "0 0 24px rgba(255,60,60,0.3)" }}
                >
                  {trialLoading ? "Starting…" : "Start free trial"}
                  {!trialLoading && <ArrowRight className="h-4 w-4" />}
                </button>
                <Link
                  href="/pricing"
                  onClick={onClose}
                  className="flex w-full items-center justify-center rounded-xl border py-3 text-sm font-medium text-slate-300 transition-all hover:text-white"
                  style={{ borderColor: "rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.03)" }}
                >
                  View plans
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
