"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Lightbulb } from "lucide-react";

type Props = { basePath: string };

export function BacktestingStrategyNew({ basePath }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    const res = await fetch("/api/backtesting/strategies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: description.trim() })
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error ?? "Failed");
      return;
    }
    router.push(basePath);
    router.refresh();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-xl"
    >
      <Link
        href={basePath}
        className="mb-6 inline-flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to dashboard
      </Link>

      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#6366f1]/30 bg-[#6366f1]/10">
          <BookOpen className="h-5 w-5 text-[#818cf8]" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-white">
            New strategy
          </h1>
          <p className="mt-0.5 text-sm font-mono text-slate-500">
            Define a trading approach to test across multiple sessions.
          </p>
        </div>
      </div>

      <form onSubmit={(e) => void submit(e)} className="space-y-4">
        {err && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-mono text-red-300">
            {err}
          </div>
        )}

        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-mono font-medium uppercase tracking-wider text-slate-500">
              Strategy name *
            </label>
            <input
              className="w-full rounded-xl border border-white/[0.08] bg-[#0c0c0e] px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-[#6366f1]/40 focus:ring-2 focus:ring-[#6366f1]/20 font-mono placeholder:text-slate-700"
              placeholder="e.g. ICT London Breakout"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-mono font-medium uppercase tracking-wider text-slate-500">
              Description
            </label>
            <textarea
              className="w-full rounded-xl border border-white/[0.08] bg-[#0c0c0e] px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-[#6366f1]/40 focus:ring-2 focus:ring-[#6366f1]/20 font-mono placeholder:text-slate-700 resize-y min-h-[100px]"
              placeholder="Rules, entry criteria, timeframes, risk parameters…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.06] px-4 py-3 flex items-start gap-3">
          <Lightbulb className="h-4 w-4 text-amber-400/70 mt-0.5 shrink-0" />
          <p className="text-xs font-mono text-amber-400/70">
            Be specific — include entry rules, SL/TP logic, session times, and any filters. Clearer rules = more consistent backtesting results.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f46e5] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#6366f1]/20 transition hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save strategy"}
          </button>
          <Link
            href={basePath}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-200"
          >
            Cancel
          </Link>
        </div>
      </form>
    </motion.div>
  );
}
