"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Plus, Check, RefreshCw } from "lucide-react";
import { format, parseISO } from "date-fns";
import { jn } from "@/lib/journal/jnClasses";
import type {
  JournalChecklistItem,
  JournalEmotion,
  JournalRule,
  JournalStrategy,
  JournalTradeReview,
  JournalTradeRow,
} from "@/lib/journal/journalTypes";

const EMOTIONS: JournalEmotion[] = ["Calm", "Confident", "Anxious", "FOMO", "Revenge"];

const emotionColor: Record<JournalEmotion, string> = {
  Calm: "#00e676",
  Confident: "#22d3ee",
  Anxious: "#ff8c00",
  FOMO: "#a855f7",
  Revenge: "#ff3c3c",
};

type Props = {
  trade: JournalTradeRow;
  onClose: () => void;
  strategies: JournalStrategy[];
  checklist: JournalChecklistItem[];
  rules: JournalRule[];
  isMock?: boolean;
  onStrategiesChange?: (strategies: JournalStrategy[]) => void;
  onChecklistChange?: (items: JournalChecklistItem[]) => void;
  onRulesChange?: (rules: JournalRule[]) => void;
};

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  return format(parseISO(iso), "MMM d, HH:mm");
}

function plColor(pl: number | null) {
  if (pl == null) return "#94a3b8";
  return pl >= 0 ? "#00e676" : "#ff3c3c";
}

export function TradeReviewModal({
  trade,
  onClose,
  strategies,
  checklist,
  rules,
  isMock = false,
  onStrategiesChange,
  onChecklistChange,
  onRulesChange,
}: Props) {
  const [review, setReview] = useState<Partial<JournalTradeReview>>({
    strategy_id: null,
    checklist_results: {},
    rules_followed: {},
    emotion: null,
    rating: null,
    notes: "",
    images: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);

  // New strategy / checklist / rule inputs
  const [newStrategy, setNewStrategy] = useState("");
  const [newChecklist, setNewChecklist] = useState("");
  const [newRule, setNewRule] = useState("");

  const netPl = (trade.pl ?? 0) + (trade.commission ?? 0) + (trade.swap ?? 0);

  // Load existing review
  useEffect(() => {
    if (isMock) {
      setLoading(false);
      return;
    }
    void (async () => {
      const res = await fetch(`/api/journal/trades/${trade.id}/review`);
      if (res.ok) {
        const j = await res.json();
        if (j.review) setReview(j.review);
      }
      setLoading(false);
    })();
  }, [trade.id, isMock]);

  const scheduleAutoSave = useCallback(
    (updates: Partial<JournalTradeReview>) => {
      if (isMock) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        setSaving(true);
        try {
          await fetch(`/api/journal/trades/${trade.id}/review`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          });
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        } finally {
          setSaving(false);
        }
      }, 800);
    },
    [trade.id, isMock]
  );

  const update = useCallback(
    (patch: Partial<JournalTradeReview>) => {
      setReview((prev) => {
        const next = { ...prev, ...patch };
        scheduleAutoSave(next);
        return next;
      });
    },
    [scheduleAutoSave]
  );

  const toggleChecklist = (itemId: string) => {
    const current = review.checklist_results ?? {};
    update({ checklist_results: { ...current, [itemId]: !current[itemId] } });
  };

  const toggleRule = (ruleId: string) => {
    const current = review.rules_followed ?? {};
    update({ rules_followed: { ...current, [ruleId]: !current[ruleId] } });
  };

  const rulesFollowedCount = rules.filter(
    (r) => review.rules_followed?.[r.id]
  ).length;

  const addStrategy = async () => {
    const name = newStrategy.trim();
    if (!name || isMock) return;
    const res = await fetch("/api/journal/strategies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const j = await res.json();
      onStrategiesChange?.([...strategies, j.strategy]);
      setNewStrategy("");
    }
  };

  const addChecklistItem = async () => {
    const text = newChecklist.trim();
    if (!text || isMock) return;
    const res = await fetch("/api/journal/checklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (res.ok) {
      const j = await res.json();
      onChecklistChange?.([...checklist, j.item]);
      setNewChecklist("");
    }
  };

  const addRule = async () => {
    const text = newRule.trim();
    if (!text || isMock) return;
    const res = await fetch("/api/journal/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (res.ok) {
      const j = await res.json();
      onRulesChange?.([...rules, j.rule]);
      setNewRule("");
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Modal */}
        <motion.div
          className="relative z-10 flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/[0.08] shadow-2xl"
          style={{ background: "rgba(8,8,9,0.97)" }}
          initial={{ scale: 0.93, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.93, opacity: 0, y: 16 }}
          transition={{ type: "spring", damping: 28, stiffness: 360 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-4">
            <div className="flex items-center gap-3">
              <span
                className="rounded-lg px-2.5 py-1 text-xs font-bold font-mono"
                style={{
                  background:
                    trade.direction === "BUY"
                      ? "rgba(0,230,118,0.15)"
                      : "rgba(255,60,60,0.15)",
                  color:
                    trade.direction === "BUY" ? "#00e676" : "#ff3c3c",
                }}
              >
                {trade.direction}
              </span>
              <span className="font-display text-lg font-bold text-white">
                {trade.symbol}
              </span>
              <span className="text-sm text-slate-500 font-mono">
                #{trade.ticket}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <AnimatePresence>
                {(saving || saved) && (
                  <motion.span
                    className="flex items-center gap-1.5 text-xs font-mono text-slate-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {saving ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <Check className="h-3 w-3 text-[#00e676]" />
                    )}
                    {saving ? "Saving…" : "Saved ✓"}
                  </motion.span>
                )}
              </AnimatePresence>
              <button
                type="button"
                aria-label="Close"
                className="rounded-lg p-1.5 text-slate-500 hover:bg-white/[0.06] hover:text-slate-200 transition-colors"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-500 font-mono">
              Loading…
            </div>
          ) : (
            <div className="flex flex-1 overflow-hidden">
              {/* Left side — 50% */}
              <div className="flex w-1/2 flex-col gap-5 overflow-y-auto border-r border-white/[0.06] p-6">
                {/* Trade stats */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Open", value: fmt(trade.open_time) },
                    { label: "Close", value: fmt(trade.close_time) },
                    {
                      label: "Entry",
                      value: trade.open_price?.toFixed(5) ?? "—",
                    },
                    {
                      label: "Exit",
                      value: trade.close_price?.toFixed(5) ?? "—",
                    },
                    { label: "Lots", value: trade.lot_size?.toString() ?? "—" },
                    {
                      label: "Pips",
                      value: trade.pips != null ? `${trade.pips}` : "—",
                    },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2"
                    >
                      <p className="text-[10px] uppercase tracking-wider text-slate-600 font-mono">
                        {label}
                      </p>
                      <p className="mt-0.5 text-sm text-slate-200 font-mono">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Net P&L */}
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-slate-600 font-mono">
                    Net P&L
                  </p>
                  <p
                    className="mt-1 font-display text-2xl font-bold"
                    style={{ color: plColor(netPl) }}
                  >
                    {netPl >= 0 ? "+" : ""}
                    {netPl.toFixed(2)}
                  </p>
                </div>

                {/* Strategy */}
                <div>
                  <label className={jn.label}>Strategy</label>
                  <select
                    className={jn.input}
                    value={review.strategy_id ?? ""}
                    onChange={(e) =>
                      update({ strategy_id: e.target.value || null })
                    }
                  >
                    <option value="">— Select strategy —</option>
                    {strategies.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  {!isMock && (
                    <div className="mt-2 flex gap-2">
                      <input
                        className={`${jn.input} text-xs`}
                        placeholder="Add new strategy…"
                        value={newStrategy}
                        onChange={(e) => setNewStrategy(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && void addStrategy()
                        }
                      />
                      <button
                        type="button"
                        className={jn.btnGhost}
                        onClick={() => void addStrategy()}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Emotion */}
                <div>
                  <label className={jn.label}>Emotion</label>
                  <div className="flex flex-wrap gap-2">
                    {EMOTIONS.map((e) => (
                      <motion.button
                        key={e}
                        type="button"
                        whileTap={{ scale: 0.93 }}
                        onClick={() =>
                          update({ emotion: review.emotion === e ? null : e })
                        }
                        className="rounded-full border px-3 py-1 text-xs font-medium transition-all"
                        style={
                          review.emotion === e
                            ? {
                                borderColor: emotionColor[e],
                                background: `${emotionColor[e]}20`,
                                color: emotionColor[e],
                              }
                            : {
                                borderColor: "rgba(255,255,255,0.08)",
                                color: "#64748b",
                              }
                        }
                      >
                        {e}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <label className={jn.label}>Trade Rating</label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <motion.button
                        key={star}
                        type="button"
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() =>
                          update({ rating: review.rating === star ? null : star })
                        }
                      >
                        <Star
                          className="h-6 w-6"
                          fill={
                            (review.rating ?? 0) >= star
                              ? "#ff8c00"
                              : "transparent"
                          }
                          stroke={
                            (review.rating ?? 0) >= star
                              ? "#ff8c00"
                              : "#475569"
                          }
                        />
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="flex flex-col flex-1">
                  <label className={jn.label}>Notes</label>
                  <textarea
                    className={`${jn.input} min-h-[120px] resize-none`}
                    placeholder="What went well? What would you do differently?"
                    value={review.notes ?? ""}
                    onChange={(e) => update({ notes: e.target.value })}
                  />
                </div>
              </div>

              {/* Right side — 50% */}
              <div className="flex w-1/2 flex-col gap-5 overflow-y-auto p-6">
                {/* Checklist */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <p className={jn.label}>Pre-trade checklist</p>
                    <span className="text-[10px] font-mono text-slate-600">
                      {
                        checklist.filter(
                          (c) => review.checklist_results?.[c.id]
                        ).length
                      }
                      /{checklist.length} checked
                    </span>
                  </div>
                  <div className="space-y-2">
                    {checklist.map((item) => {
                      const yes = !!review.checklist_results?.[item.id];
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
                        >
                          <span className="text-sm text-slate-300">
                            {item.text}
                          </span>
                          <div className="flex gap-1.5">
                            <motion.button
                              type="button"
                              whileTap={{ scale: 0.9 }}
                              onClick={() => toggleChecklist(item.id)}
                              className="rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all"
                              style={
                                yes
                                  ? {
                                      background: "rgba(0,230,118,0.2)",
                                      color: "#00e676",
                                      border: "1px solid rgba(0,230,118,0.3)",
                                    }
                                  : {
                                      background: "rgba(255,255,255,0.04)",
                                      color: "#64748b",
                                      border: "1px solid rgba(255,255,255,0.06)",
                                    }
                              }
                            >
                              YES
                            </motion.button>
                            <motion.button
                              type="button"
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                const current =
                                  review.checklist_results ?? {};
                                update({
                                  checklist_results: {
                                    ...current,
                                    [item.id]: false,
                                  },
                                });
                              }}
                              className="rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all"
                              style={
                                !yes &&
                                review.checklist_results?.[item.id] != null
                                  ? {
                                      background: "rgba(255,60,60,0.2)",
                                      color: "#ff3c3c",
                                      border: "1px solid rgba(255,60,60,0.3)",
                                    }
                                  : {
                                      background: "rgba(255,255,255,0.04)",
                                      color: "#64748b",
                                      border: "1px solid rgba(255,255,255,0.06)",
                                    }
                              }
                            >
                              NO
                            </motion.button>
                          </div>
                        </div>
                      );
                    })}
                    {checklist.length === 0 && (
                      <p className="text-xs text-slate-600 font-mono">
                        No checklist items — add them in Journal Settings.
                      </p>
                    )}
                  </div>
                  {!isMock && (
                    <div className="mt-2 flex gap-2">
                      <input
                        className={`${jn.input} text-xs`}
                        placeholder="Add checklist item…"
                        value={newChecklist}
                        onChange={(e) => setNewChecklist(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && void addChecklistItem()
                        }
                      />
                      <button
                        type="button"
                        className={jn.btnGhost}
                        onClick={() => void addChecklistItem()}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Rules */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <p className={jn.label}>Rules followed?</p>
                    <span
                      className="text-[11px] font-mono font-semibold"
                      style={{
                        color:
                          rules.length === 0
                            ? "#475569"
                            : rulesFollowedCount === rules.length
                              ? "#00e676"
                              : "#ff8c00",
                      }}
                    >
                      {rulesFollowedCount}/{rules.length} rules followed
                    </span>
                  </div>
                  <div className="space-y-2">
                    {rules.map((rule) => {
                      const followed = !!review.rules_followed?.[rule.id];
                      return (
                        <div
                          key={rule.id}
                          className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
                        >
                          <span className="text-sm text-slate-300">
                            {rule.text}
                          </span>
                          <div className="flex gap-1.5">
                            <motion.button
                              type="button"
                              whileTap={{ scale: 0.9 }}
                              onClick={() => toggleRule(rule.id)}
                              className="rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all"
                              style={
                                followed
                                  ? {
                                      background: "rgba(0,230,118,0.2)",
                                      color: "#00e676",
                                      border: "1px solid rgba(0,230,118,0.3)",
                                    }
                                  : {
                                      background: "rgba(255,255,255,0.04)",
                                      color: "#64748b",
                                      border: "1px solid rgba(255,255,255,0.06)",
                                    }
                              }
                            >
                              YES
                            </motion.button>
                            <motion.button
                              type="button"
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                const current = review.rules_followed ?? {};
                                update({
                                  rules_followed: {
                                    ...current,
                                    [rule.id]: false,
                                  },
                                });
                              }}
                              className="rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all"
                              style={
                                !followed &&
                                review.rules_followed?.[rule.id] != null
                                  ? {
                                      background: "rgba(255,60,60,0.2)",
                                      color: "#ff3c3c",
                                      border: "1px solid rgba(255,60,60,0.3)",
                                    }
                                  : {
                                      background: "rgba(255,255,255,0.04)",
                                      color: "#64748b",
                                      border: "1px solid rgba(255,255,255,0.06)",
                                    }
                              }
                            >
                              NO
                            </motion.button>
                          </div>
                        </div>
                      );
                    })}
                    {rules.length === 0 && (
                      <p className="text-xs text-slate-600 font-mono">
                        No rules — add them in Journal Settings.
                      </p>
                    )}
                  </div>
                  {!isMock && (
                    <div className="mt-2 flex gap-2">
                      <input
                        className={`${jn.input} text-xs`}
                        placeholder="Add rule…"
                        value={newRule}
                        onChange={(e) => setNewRule(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && void addRule()
                        }
                      />
                      <button
                        type="button"
                        className={jn.btnGhost}
                        onClick={() => void addRule()}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {trade.setup_tags && trade.setup_tags.length > 0 && (
                  <div>
                    <p className={jn.label}>Setup tags</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {trade.setup_tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-0.5 text-[11px] text-slate-400 font-mono"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
