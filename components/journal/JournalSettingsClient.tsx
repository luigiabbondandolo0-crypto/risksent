"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ArrowUp, ArrowDown, Settings2 } from "lucide-react";
import { jn } from "@/lib/journal/jnClasses";
import type {
  JournalChecklistItem,
  JournalRule,
  JournalStrategy,
} from "@/lib/journal/journalTypes";

type Tab = "strategies" | "checklist" | "rules";

// ─── Strategy Manager ─────────────────────────────────────────────────────────

function StrategyManager() {
  const [strategies, setStrategies] = useState<JournalStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/journal/strategies");
    if (res.ok) {
      const j = await res.json();
      setStrategies(j.strategies ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const add = async () => {
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    try {
      const res = await fetch("/api/journal/strategies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: newDesc.trim() || null }),
      });
      if (res.ok) {
        const j = await res.json();
        setStrategies((prev) => [...prev, j.strategy]);
        setNewName("");
        setNewDesc("");
      }
    } finally {
      setAdding(false);
    }
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/journal/strategies/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setStrategies((prev) => prev.filter((s) => s.id !== id));
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-600 font-mono">Loading…</p>;
  }

  const strategyRowStyle = {
    background: "rgba(167,139,250,0.04)",
    borderColor: "rgba(167,139,250,0.2)",
    boxShadow: "0 0 22px rgba(167,139,250,0.08)",
  };
  const strategyBlob = "#a78bfa";

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {strategies.map((s) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8, height: 0 }}
            className="relative flex items-center justify-between overflow-hidden rounded-xl border px-4 py-3 backdrop-blur-xl"
            style={strategyRowStyle}
          >
            <div
              className="pointer-events-none absolute right-0 top-0 h-16 w-16 rounded-full opacity-20 blur-2xl"
              style={{ background: `radial-gradient(circle, ${strategyBlob}, transparent)` }}
            />
            <div className="relative z-10 flex min-w-0 flex-1 items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-200">{s.name}</p>
                {s.description && (
                  <p className="mt-0.5 text-xs text-slate-500">{s.description}</p>
                )}
              </div>
              <button
                type="button"
                className="shrink-0 rounded-lg p-1.5 text-slate-600 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                onClick={() => void remove(s.id)}
                aria-label="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {strategies.length === 0 && (
        <p className="text-sm text-slate-600 font-mono">
          No strategies yet. Add your first one below.
        </p>
      )}

      {/* Add form */}
      <div className={`${jn.cardSm} space-y-2 border-dashed`}>
        <p className={jn.label}>New strategy</p>
        <input
          className={jn.input}
          placeholder="Strategy name…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void add()}
        />
        <input
          className={jn.input}
          placeholder="Description (optional)…"
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
        />
        <button
          type="button"
          className={jn.btnPrimary}
          disabled={adding || !newName.trim()}
          onClick={() => void add()}
        >
          <Plus className="h-4 w-4" />
          {adding ? "Adding…" : "Add strategy"}
        </button>
      </div>
    </div>
  );
}

// ─── Ordered List Manager (shared for checklist + rules) ─────────────────────

type OrderedItem = { id: string; text: string; order_index: number };

function OrderedListManager({
  fetchUrl,
  postUrl,
  deleteUrl,
  itemKey,
  placeholder,
}: {
  fetchUrl: string;
  postUrl: string;
  deleteUrl: (id: string) => string;
  itemKey: string;
  placeholder: string;
}) {
  const [items, setItems] = useState<OrderedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState("");
  const [adding, setAdding] = useState(false);

  const rowGlassDef =
    fetchUrl.includes("checklist")
      ? {
          background: "rgba(56,189,248,0.04)",
          borderColor: "rgba(56,189,248,0.2)",
          boxShadow: "0 0 20px rgba(56,189,248,0.07)",
          blob: "#38bdf8",
        }
      : fetchUrl.includes("rules")
        ? {
            background: "rgba(245,158,11,0.04)",
            borderColor: "rgba(245,158,11,0.2)",
            boxShadow: "0 0 22px rgba(245,158,11,0.07)",
            blob: "#f59e0b",
          }
        : {
            background: "rgba(99,102,241,0.04)",
            borderColor: "rgba(99,102,241,0.2)",
            boxShadow: "0 0 20px rgba(99,102,241,0.07)",
            blob: "#6366f1",
          };
  const rowBlob = rowGlassDef.blob;
  const rowCardStyle = {
    background: rowGlassDef.background,
    borderColor: rowGlassDef.borderColor,
    boxShadow: rowGlassDef.boxShadow,
  };

  const load = useCallback(async () => {
    const res = await fetch(fetchUrl);
    if (res.ok) {
      const j = await res.json();
      setItems(j[itemKey] ?? []);
    }
    setLoading(false);
  }, [fetchUrl, itemKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const add = async () => {
    const text = newText.trim();
    if (!text) return;
    setAdding(true);
    try {
      const res = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const j = await res.json();
        const item = j.item ?? j.rule;
        setItems((prev) => [...prev, item]);
        setNewText("");
      }
    } finally {
      setAdding(false);
    }
  };

  const remove = async (id: string) => {
    const res = await fetch(deleteUrl(id), { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((x) => x.id !== id));
    }
  };

  const move = (id: string, dir: "up" | "down") => {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const swapIdx = dir === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  };

  if (loading) {
    return <p className="text-sm text-slate-600 font-mono">Loading…</p>;
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8, height: 0 }}
            className="relative flex items-center gap-2 overflow-hidden rounded-xl border px-4 py-3 backdrop-blur-xl"
            style={rowCardStyle}
          >
            <div
              className="pointer-events-none absolute right-0 top-0 h-16 w-16 rounded-full opacity-20 blur-2xl"
              style={{ background: `radial-gradient(circle, ${rowBlob}, transparent)` }}
            />
            {/* Reorder */}
            <div className="relative z-10 flex flex-col gap-0.5">
              <button
                type="button"
                className="rounded p-0.5 text-slate-700 hover:text-slate-400 transition-colors disabled:opacity-30"
                disabled={i === 0}
                onClick={() => move(item.id, "up")}
                aria-label="Move up"
              >
                <ArrowUp className="h-3 w-3" />
              </button>
              <button
                type="button"
                className="rounded p-0.5 text-slate-700 hover:text-slate-400 transition-colors disabled:opacity-30"
                disabled={i === items.length - 1}
                onClick={() => move(item.id, "down")}
                aria-label="Move down"
              >
                <ArrowDown className="h-3 w-3" />
              </button>
            </div>

            <span className="relative z-10 flex-1 text-sm text-slate-200">{item.text}</span>

            <button
              type="button"
              className="relative z-10 rounded-lg p-1.5 text-slate-600 hover:bg-red-500/10 hover:text-red-400 transition-colors"
              onClick={() => void remove(item.id)}
              aria-label="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {items.length === 0 && (
        <p className="text-sm text-slate-600 font-mono">
          Nothing here yet. Add your first item below.
        </p>
      )}

      {/* Add */}
      <div className="flex gap-2">
        <input
          className={`${jn.input} flex-1`}
          placeholder={placeholder}
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void add()}
        />
        <button
          type="button"
          className={jn.btnPrimary}
          disabled={adding || !newText.trim()}
          onClick={() => void add()}
          style={{ whiteSpace: "nowrap" }}
        >
          <Plus className="h-4 w-4" />
          {adding ? "Adding…" : "Add"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function JournalSettingsClient() {
  const [tab, setTab] = useState<Tab>("strategies");

  const tabs: { id: Tab; label: string }[] = [
    { id: "strategies", label: "Strategies" },
    { id: "checklist", label: "Checklist" },
    { id: "rules", label: "Rules" },
  ];

  return (
    <div className={`${jn.page} space-y-6`}>
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -top-40 left-1/4 h-96 w-96 rounded-full opacity-[0.06] blur-3xl"
          style={{ background: "radial-gradient(circle, #6366f1, transparent)" }}
        />
        <div
          className="absolute top-1/3 right-0 h-72 w-72 rounded-full opacity-[0.04] blur-3xl"
          style={{ background: "radial-gradient(circle, #38bdf8, transparent)" }}
        />
        <div
          className="absolute bottom-1/4 left-0 h-64 w-64 rounded-full opacity-[0.04] blur-3xl"
          style={{ background: "radial-gradient(circle, #4ade80, transparent)" }}
        />
      </div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03]">
            <Settings2 className="h-4 w-4 text-slate-400" />
          </div>
          <div>
            <h1
              className={jn.h1}
              style={{
                background: "linear-gradient(135deg, #e0e7ff 0%, #a78bfa 50%, #6366f1 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Journal Settings
            </h1>
            <p className={jn.sub}>
              Manage your strategies, pre-trade checklist, and trading rules.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tab switcher */}
      <div
        className="flex w-fit items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.02] p-1 backdrop-blur-sm"
        style={{ boxShadow: "0 0 20px rgba(99,102,241,0.06)" }}
      >
        {tabs.map(({ id, label }) => (
          <motion.button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className="relative rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            style={{ color: tab === id ? "#fff" : "#64748b" }}
          >
            {tab === id && (
              <motion.span
                layoutId="settings-tab-pill"
                className="absolute inset-0 rounded-lg"
                style={{ background: "rgba(99,102,241,0.15)", boxShadow: "0 0 12px rgba(99,102,241,0.2)" }}
                transition={{ type: "spring", damping: 28, stiffness: 380 }}
              />
            )}
            <span className="relative z-10">{label}</span>
          </motion.button>
        ))}
      </div>

      {/* Content */}
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className={`${jn.card} max-w-2xl`}
      >
        <div
          className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full opacity-20 blur-2xl"
          style={{ background: "radial-gradient(circle, #6366f1, transparent)" }}
        />
        <div className="relative z-10">
        <AnimatePresence mode="wait">
          {tab === "strategies" && (
            <motion.div key="strategies" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="mb-2 text-[11px] font-mono uppercase tracking-[0.12em] text-slate-500">
                Playbook
              </p>
              <h2 className="mb-4 text-sm font-semibold text-white">
                Trading Strategies
              </h2>
              <p className="mb-5 text-xs text-slate-500">
                Define your playbook. These appear in the trade review modal for
                tagging each trade.
              </p>
              <StrategyManager />
            </motion.div>
          )}

          {tab === "checklist" && (
            <motion.div key="checklist" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="mb-2 text-[11px] font-mono uppercase tracking-[0.12em] text-slate-500">
                Pre-trade
              </p>
              <h2 className="mb-4 text-sm font-semibold text-white">
                Pre-trade Checklist
              </h2>
              <p className="mb-5 text-xs text-slate-500">
                Items you review before entering a trade. Mark each YES/NO in the
                trade review.
              </p>
              <OrderedListManager
                fetchUrl="/api/journal/checklist"
                postUrl="/api/journal/checklist"
                deleteUrl={(id) => `/api/journal/checklist?id=${id}`}
                itemKey="items"
                placeholder="Add checklist item…"
              />
            </motion.div>
          )}

          {tab === "rules" && (
            <motion.div key="rules" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="mb-2 text-[11px] font-mono uppercase tracking-[0.12em] text-slate-500">
                Discipline
              </p>
              <h2 className="mb-4 text-sm font-semibold text-white">
                Trading Rules
              </h2>
              <p className="mb-5 text-xs text-slate-500">
                Your personal trading rules. Track compliance in every trade
                review.
              </p>
              <OrderedListManager
                fetchUrl="/api/journal/rules"
                postUrl="/api/journal/rules"
                deleteUrl={(id) => `/api/journal/rules?id=${id}`}
                itemKey="rules"
                placeholder="Add trading rule…"
              />
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
