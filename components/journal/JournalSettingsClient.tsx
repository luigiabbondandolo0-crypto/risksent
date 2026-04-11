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

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {strategies.map((s) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8, height: 0 }}
            className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-slate-200">{s.name}</p>
              {s.description && (
                <p className="mt-0.5 text-xs text-slate-500">{s.description}</p>
              )}
            </div>
            <button
              type="button"
              className="rounded-lg p-1.5 text-slate-600 hover:bg-red-500/10 hover:text-red-400 transition-colors"
              onClick={() => void remove(s.id)}
              aria-label="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
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
            className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3"
          >
            {/* Reorder */}
            <div className="flex flex-col gap-0.5">
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

            <span className="flex-1 text-sm text-slate-200">{item.text}</span>

            <button
              type="button"
              className="rounded-lg p-1.5 text-slate-600 hover:bg-red-500/10 hover:text-red-400 transition-colors"
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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03]">
            <Settings2 className="h-4 w-4 text-slate-400" />
          </div>
          <div>
            <h1 className={jn.h1}>Journal Settings</h1>
            <p className={jn.sub}>
              Manage your strategies, pre-trade checklist, and trading rules.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1 w-fit">
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
                className="absolute inset-0 rounded-lg bg-white/[0.06]"
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
        transition={{ duration: 0.2 }}
        className={`${jn.card} max-w-2xl`}
      >
        <AnimatePresence mode="wait">
          {tab === "strategies" && (
            <motion.div key="strategies" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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
      </motion.div>
    </div>
  );
}
