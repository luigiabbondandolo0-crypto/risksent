"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Layers } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (strategy: { id: string; name: string }) => void;
};

export function CreateStrategyModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setErr("Name is required"); return; }
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/backtesting/strategies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
      });
      const json = await res.json() as { strategy?: { id: string; name: string }; error?: string };
      if (!res.ok) { setErr(json.error ?? "Failed to create strategy"); return; }
      onCreated(json.strategy!);
      setName("");
      setDescription("");
      onClose();
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.18 }}
            className="relative z-10 w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0d0d18] p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6366f1]/20">
                  <Layers className="h-4 w-4 text-[#818cf8]" />
                </div>
                <h2 className="font-display text-lg font-bold text-white">New Strategy</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={(e) => void submit(e)} className="space-y-4">
              <div>
                <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate-500">
                  Strategy Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. London Breakout v2"
                  maxLength={100}
                  className="rs-input w-full max-w-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate-500">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your strategy rules, setup criteria..."
                  maxLength={500}
                  rows={3}
                  className="rs-input w-full max-w-none resize-none"
                />
              </div>

              {err && (
                <p className="rounded-lg bg-red-500/10 px-3 py-2 font-mono text-[12px] text-red-400">
                  {err}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-white/[0.08] py-2.5 font-mono text-sm text-slate-400 transition-colors hover:border-white/[0.15] hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-[#6366f1] py-2.5 font-mono text-sm font-semibold text-white transition-all hover:bg-[#4f46e5] disabled:opacity-50"
                >
                  {loading ? "Creating…" : "Create Strategy"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
