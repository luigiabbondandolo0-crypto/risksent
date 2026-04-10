"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { bt } from "./btClasses";

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-lg space-y-6">
      <Link href={basePath} className="text-xs text-slate-500 hover:text-slate-300 font-mono">
        ← Back
      </Link>
      <h1 className={bt.h1}>New strategy</h1>
      <form onSubmit={(e) => void submit(e)} className={`${bt.card} space-y-4`}>
        {err && <p className="text-sm text-red-400 font-mono">{err}</p>}
        <div>
          <label className={bt.label}>Name</label>
          <input className={bt.input} value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className={bt.label}>Description</label>
          <textarea
            className={`${bt.input} min-h-[100px] resize-y`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <button type="submit" disabled={saving} className={bt.btnPrimary}>
          {saving ? "Saving…" : "Save strategy"}
        </button>
      </form>
    </motion.div>
  );
}
