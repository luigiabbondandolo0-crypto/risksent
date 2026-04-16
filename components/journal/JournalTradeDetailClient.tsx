"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ChevronLeft, X, Star, RefreshCw, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type {
  JournalChecklistItem,
  JournalEmotion,
  JournalRule,
  JournalStrategy,
  JournalTradeReview,
  JournalTradeRow,
} from "@/lib/journal/journalTypes";
import { relatedTrades } from "@/lib/journal/analytics";
import { jn } from "@/lib/journal/jnClasses";
import { getSeedTradeById, SEED_TRADES } from "@/lib/journal/seedTrades";
import { JOURNAL_IMAGE_MAX, readImageFileAsDataUrl } from "@/lib/journal/imageUpload";
import { JournalScreenshotTile } from "@/components/journal/JournalScreenshotTile";

const EMOTIONS: JournalEmotion[] = ["Calm", "Confident", "Anxious", "FOMO", "Revenge"];
const emotionColor: Record<JournalEmotion, string> = {
  Calm: "#00e676", Confident: "#22d3ee", Anxious: "#ff8c00", FOMO: "#a855f7", Revenge: "#ff3c3c",
};

const TAG_PRESETS = ["FOMO", "HTF Trend", "Revenge", "A+ Setup", "London", "NY", "Asia", "Breakout", "Liquidity sweep"];

function netPl(t: JournalTradeRow) {
  return (t.pl ?? 0) + (t.commission ?? 0) + (t.swap ?? 0);
}

type Props = { tradeId: string; linkBase?: string };

export function JournalTradeDetailClient({ tradeId, linkBase = "/app/journaling" }: Props) {
  const [trade, setTrade] = useState<JournalTradeRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [related, setRelated] = useState<JournalTradeRow[]>([]);
  const isSeed = tradeId.startsWith("seed-");

  // Review state
  const [review, setReview] = useState<Partial<JournalTradeReview>>({
    checklist_results: {}, rules_followed: {}, emotion: null, rating: null, notes: "", images: [],
  });
  const [strategies, setStrategies] = useState<JournalStrategy[]>([]);
  const [checklist, setChecklist] = useState<JournalChecklistItem[]>([]);
  const [rules, setRules] = useState<JournalRule[]>([]);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewSaved, setReviewSaved] = useState(false);
  const reviewSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const [shotUploading, setShotUploading] = useState(false);
  const [shotDragOver, setShotDragOver] = useState(false);
  const shotFileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    if (isSeed) {
      const t = getSeedTradeById(tradeId);
      setTrade(t ?? null);
      setNotes(t?.notes ?? "");
      setTags(t?.setup_tags ?? []);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/journal/trades/${tradeId}`);
      const j = await res.json();
      if (!res.ok) {
        setTrade(null);
        return;
      }
      const t = j.trade as JournalTradeRow;
      setTrade(t);
      setNotes(t.notes ?? "");
      setTags(t.setup_tags ?? []);
      const [rRes, revRes, strRes, clRes, rulesRes] = await Promise.all([
        fetch(`/api/journal/trades?symbol=${encodeURIComponent(t.symbol)}&status=closed&pageSize=8&page=1`),
        fetch(`/api/journal/trades/${tradeId}/review`),
        fetch("/api/journal/strategies"),
        fetch("/api/journal/checklist"),
        fetch("/api/journal/rules"),
      ]);
      if (rRes.ok) {
        const rJson = await rRes.json();
        const list = (rJson.trades ?? []) as JournalTradeRow[];
        setRelated(list.filter((x) => x.id !== t.id).slice(0, 5));
      }
      if (revRes.ok) {
        const rj = await revRes.json();
        if (rj.review) {
          const r = rj.review as JournalTradeReview;
          setReview({
            ...r,
            images: Array.isArray(r.images) ? r.images : [],
            checklist_results: r.checklist_results ?? {},
            rules_followed: r.rules_followed ?? {},
          });
        }
      }
      if (strRes.ok) setStrategies((await strRes.json()).strategies ?? []);
      if (clRes.ok) setChecklist((await clRes.json()).items ?? []);
      if (rulesRes.ok) setRules((await rulesRes.json()).rules ?? []);
    } finally {
      setLoading(false);
    }
  }, [tradeId, isSeed]);

  useEffect(() => {
    void load();
  }, [load]);

  const persist = useCallback(
    async (nextNotes: string, nextTags: string[]) => {
      if (isSeed || !trade) return;
      setSaving(true);
      try {
        await fetch(`/api/journal/trades/${tradeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: nextNotes, setup_tags: nextTags })
        });
      } finally {
        setSaving(false);
      }
    },
    [isSeed, trade, tradeId]
  );

  const scheduleReviewSave = useCallback(
    (patch: Partial<JournalTradeReview>) => {
      if (isSeed) return;
      if (reviewSaveTimer.current) clearTimeout(reviewSaveTimer.current);
      reviewSaveTimer.current = setTimeout(async () => {
        setReviewSaving(true);
        try {
          await fetch(`/api/journal/trades/${tradeId}/review`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch),
          });
          setReviewSaved(true);
          setTimeout(() => setReviewSaved(false), 2000);
        } finally {
          setReviewSaving(false);
        }
      }, 800);
    },
    [isSeed, tradeId]
  );

  type ReviewPatch =
    | Partial<JournalTradeReview>
    | ((prev: Partial<JournalTradeReview>) => Partial<JournalTradeReview>);

  const updateReview = useCallback(
    (patch: ReviewPatch) => {
      setReview((prev) => {
        const part = typeof patch === "function" ? patch(prev) : patch;
        const next = { ...prev, ...part };
        scheduleReviewSave(next);
        return next;
      });
    },
    [scheduleReviewSave]
  );

  const processReviewImages = async (files: FileList | File[]) => {
    if (isSeed) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) return;
    setShotUploading(true);
    try {
      const newUrls: string[] = [];
      for (const file of list) {
        if (newUrls.length >= JOURNAL_IMAGE_MAX) break;
        const dataUrl = await readImageFileAsDataUrl(file);
        const res = await fetch("/api/journal/images/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: dataUrl, filename: file.name }),
        });
        if (!res.ok) continue;
        const j: { url?: string } = await res.json();
        if (j.url) newUrls.push(j.url);
      }
      if (newUrls.length > 0) {
        updateReview((prev) => {
          const cur = prev.images ?? [];
          const merged = [...cur];
          for (const u of newUrls) {
            if (merged.length >= JOURNAL_IMAGE_MAX) break;
            if (!merged.includes(u)) merged.push(u);
          }
          return { images: merged };
        });
      }
    } finally {
      setShotUploading(false);
    }
  };

  const removeReviewImage = (url: string) => {
    updateReview((prev) => ({
      images: (prev.images ?? []).filter((u) => u !== url),
    }));
  };

  const rel = useMemo(() => {
    if (!trade) return [];
    if (isSeed) return relatedTrades(SEED_TRADES, trade.symbol, trade.id, 5);
    return related;
  }, [trade, isSeed, related]);

  const addTag = (raw: string) => {
    const t = raw.trim();
    if (!t || tags.includes(t)) return;
    const next = [...tags, t];
    setTags(next);
    void persist(notes, next);
  };

  const removeTag = (t: string) => {
    const next = tags.filter((x) => x !== t);
    setTags(next);
    void persist(notes, next);
  };

  if (loading) {
    return <p className="text-slate-500 font-mono text-sm">Loading…</p>;
  }
  if (!trade) {
    return (
      <div className={jn.page}>
        <p className="text-red-400">Trade not found.</p>
        <Link href={`${linkBase}/trades`} className="mt-4 inline-block text-[#6366f1] underline text-sm">
          Back to trades
        </Link>
      </div>
    );
  }

  const n = netPl(trade);

  return (
    <div className={`${jn.page} space-y-6`}>
      <Link
        href={`${linkBase}/trades`}
        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 font-mono"
      >
        <ChevronLeft className="h-3 w-3" />
        Trades
      </Link>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <div className={jn.card}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className={`${jn.h1} text-2xl`}>{trade.symbol}</h1>
                <p className={jn.sub}>Ticket {trade.ticket}</p>
              </div>
              <span
                className={`rounded-lg px-3 py-1 text-sm font-mono font-bold ${
                  trade.direction === "BUY"
                    ? "bg-[#00e676]/15 text-[#00e676]"
                    : "bg-[#ff3c3c]/15 text-[#ff3c3c]"
                }`}
              >
                {trade.direction}
              </span>
            </div>

            <dl className="mt-6 grid gap-3 sm:grid-cols-2 font-mono text-sm">
              <div>
                <dt className={jn.label}>Open</dt>
                <dd className="text-slate-300">{format(parseISO(trade.open_time), "PPpp")}</dd>
              </div>
              <div>
                <dt className={jn.label}>Close</dt>
                <dd className="text-slate-300">
                  {trade.close_time ? format(parseISO(trade.close_time), "PPpp") : "—"}
                </dd>
              </div>
              <div>
                <dt className={jn.label}>Open price</dt>
                <dd className="text-slate-300">{trade.open_price}</dd>
              </div>
              <div>
                <dt className={jn.label}>Close price</dt>
                <dd className="text-slate-300">{trade.close_price ?? "—"}</dd>
              </div>
              <div>
                <dt className={jn.label}>Lots</dt>
                <dd className="text-slate-300">{trade.lot_size}</dd>
              </div>
              <div>
                <dt className={jn.label}>Pips</dt>
                <dd className="text-slate-300">{trade.pips ?? "—"}</dd>
              </div>
              <div>
                <dt className={jn.label}>P&amp;L</dt>
                <dd style={{ color: n >= 0 ? jn.green : jn.accentRed }} className="font-semibold">
                  {n >= 0 ? "+" : ""}
                  {n.toFixed(2)}
                </dd>
              </div>
              <div>
                <dt className={jn.label}>Commission / swap</dt>
                <dd className="text-slate-400">
                  {(trade.commission ?? 0).toFixed(2)} / {(trade.swap ?? 0).toFixed(2)}
                </dd>
              </div>
            </dl>
          </div>

          <div className={jn.card}>
            <p className={jn.label}>Setup tags</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full border border-white/[0.1] bg-black/30 px-3 py-1 text-xs text-slate-200 font-mono"
                >
                  {t}
                  <button type="button" aria-label={`Remove ${t}`} onClick={() => removeTag(t)}>
                    <X className="h-3 w-3 text-slate-500 hover:text-white" />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                className={`${jn.input} max-w-[200px]`}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(tagInput);
                    setTagInput("");
                  }
                }}
                placeholder="Add tag…"
              />
              <button type="button" className={jn.btnGhost} onClick={() => { addTag(tagInput); setTagInput(""); }}>
                Add
              </button>
            </div>
            <p className={`mt-3 text-[10px] text-slate-600 ${jn.mono}`}>Quick add:</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {TAG_PRESETS.filter((p) => !tags.includes(p)).map((p) => (
                <button
                  key={p}
                  type="button"
                  className="rounded-md border border-white/[0.06] px-2 py-0.5 text-[10px] text-slate-500 hover:border-[#ff3c3c]/30 hover:text-slate-300"
                  onClick={() => addTag(p)}
                >
                  +{p}
                </button>
              ))}
            </div>
            {isSeed && (
              <p className="mt-2 text-[10px] text-[#ff8c00] font-mono">Demo trade — tags not saved to API.</p>
            )}
          </div>

          <div className={jn.card}>
            <div className="flex items-center justify-between">
              <p className={jn.label}>Notes</p>
              {saving && <span className="text-[10px] text-slate-500 font-mono">Saving…</span>}
            </div>
            <textarea
              className={`${jn.input} mt-2 min-h-[120px] resize-y`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => {
                if (!isSeed) void persist(notes, tags);
              }}
              placeholder="What went well? What would you change?"
            />
            {isSeed && (
              <p className="mt-1 text-[10px] text-[#ff8c00] font-mono">Demo — notes not persisted.</p>
            )}
          </div>

          <div className={jn.card}>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200">
              Screenshots
            </p>
            <p className="mb-3 text-[11px] text-slate-500 font-mono">
              Click a preview to open full size
            </p>
            <input
              ref={shotFileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                void processReviewImages(e.target.files ?? []);
                e.target.value = "";
              }}
            />
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (!isSeed) shotFileRef.current?.click();
                }
              }}
              onDragEnter={() => setShotDragOver(true)}
              onDragLeave={() => setShotDragOver(false)}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                setShotDragOver(false);
                void processReviewImages(e.dataTransfer.files);
              }}
              onClick={() => !isSeed && shotFileRef.current?.click()}
              className={`mt-1 flex min-h-[104px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center font-mono transition-colors ${
                shotDragOver
                  ? "border-[#ff8c00]/60 bg-[#ff8c00]/15 text-slate-100"
                  : "border-white/25 bg-white/[0.06] text-slate-200"
              } ${isSeed ? "pointer-events-none opacity-50" : ""}`}
            >
              <span className="text-sm font-medium">
                {shotUploading
                  ? "Uploading…"
                  : "Drop screenshots here or click to upload"}
              </span>
              <span className="mt-1 text-[11px] text-slate-400">
                Max {JOURNAL_IMAGE_MAX} images
              </span>
            </div>
            {(review.images ?? []).length > 0 && (
              <div className="mt-5 flex flex-col gap-6">
                {(review.images ?? []).slice(0, JOURNAL_IMAGE_MAX).map((url) => (
                  <JournalScreenshotTile
                    key={url}
                    url={url}
                    removeDisabled={isSeed}
                    onRemove={
                      isSeed ? undefined : () => removeReviewImage(url)
                    }
                  />
                ))}
              </div>
            )}
            {isSeed && (
              <p className="mt-2 text-[10px] text-[#ff8c00] font-mono">
                Demo — screenshots not saved.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          {/* Trade stats */}
          <div className={jn.card}>
            <p className={jn.label}>Trade stats</p>
            <ul className="mt-3 space-y-2 font-mono text-sm text-slate-300">
              <li className="flex justify-between">
                <span className="text-slate-500">R:R</span>
                <span>{trade.risk_reward?.toFixed(2) ?? "—"}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className="uppercase">{trade.status}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-500">Net</span>
                <span style={{ color: n >= 0 ? jn.green : jn.accentRed }}>
                  {n >= 0 ? "+" : ""}
                  {n.toFixed(2)}
                </span>
              </li>
            </ul>
          </div>

          {/* Trade Review Panel */}
          <div className={jn.card}>
            <div className="mb-4 flex items-center justify-between">
              <p className={jn.label}>Trade Review</p>
              <AnimatePresence>
                {(reviewSaving || reviewSaved) && (
                  <motion.span
                    className="flex items-center gap-1 text-[10px] font-mono text-slate-500"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  >
                    {reviewSaving ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 text-[#00e676]" />}
                    {reviewSaving ? "Saving…" : "Saved ✓"}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Strategy */}
            <div className="mb-4">
              <label className={jn.label}>Strategy</label>
              <select
                className={jn.input}
                value={review.strategy_id ?? ""}
                onChange={(e) => updateReview({ strategy_id: e.target.value || null })}
                disabled={isSeed}
              >
                <option value="">— Select strategy —</option>
                {strategies.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {/* Emotion */}
            <div className="mb-4">
              <label className={jn.label}>Emotion</label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {EMOTIONS.map((e) => (
                  <motion.button
                    key={e} type="button" whileTap={{ scale: 0.93 }}
                    disabled={isSeed}
                    onClick={() => updateReview({ emotion: review.emotion === e ? null : e })}
                    className="rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all"
                    style={review.emotion === e
                      ? { borderColor: emotionColor[e], background: `${emotionColor[e]}20`, color: emotionColor[e] }
                      : { borderColor: "rgba(255,255,255,0.08)", color: "#64748b" }}
                  >
                    {e}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div className="mb-4">
              <label className={jn.label}>Rating</label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <motion.button
                    key={star} type="button" whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                    disabled={isSeed}
                    onClick={() => updateReview({ rating: review.rating === star ? null : star })}
                  >
                    <Star
                      className="h-5 w-5"
                      fill={(review.rating ?? 0) >= star ? "#ff8c00" : "transparent"}
                      stroke={(review.rating ?? 0) >= star ? "#ff8c00" : "#475569"}
                    />
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Checklist */}
            {checklist.length > 0 && (
              <div className="mb-4">
                <label className={jn.label}>Pre-trade checklist</label>
                <div className="mt-1 space-y-1.5">
                  {checklist.map((item) => {
                    const yes = !!review.checklist_results?.[item.id];
                    return (
                      <div key={item.id} className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2">
                        <span className="text-xs text-slate-300">{item.text}</span>
                        <div className="flex gap-1">
                          {["YES", "NO"].map((v) => (
                            <button
                              key={v} type="button" disabled={isSeed}
                              onClick={() => {
                                const cur = review.checklist_results ?? {};
                                updateReview({ checklist_results: { ...cur, [item.id]: v === "YES" } });
                              }}
                              className="rounded px-2 py-0.5 text-[10px] font-bold transition-all"
                              style={
                                (v === "YES" ? yes : !yes && review.checklist_results?.[item.id] != null)
                                  ? { background: v === "YES" ? "rgba(0,230,118,0.2)" : "rgba(255,60,60,0.2)", color: v === "YES" ? "#00e676" : "#ff3c3c" }
                                  : { background: "rgba(255,255,255,0.04)", color: "#475569" }
                              }
                            >{v}</button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Rules */}
            {rules.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <label className={jn.label}>Rules followed?</label>
                  <span className="text-[10px] font-mono" style={{ color: rules.filter(r => review.rules_followed?.[r.id]).length === rules.length ? "#00e676" : "#ff8c00" }}>
                    {rules.filter(r => review.rules_followed?.[r.id]).length}/{rules.length}
                  </span>
                </div>
                <div className="mt-1 space-y-1.5">
                  {rules.map((rule) => {
                    const followed = !!review.rules_followed?.[rule.id];
                    return (
                      <div key={rule.id} className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2">
                        <span className="text-xs text-slate-300">{rule.text}</span>
                        <div className="flex gap-1">
                          {["YES", "NO"].map((v) => (
                            <button
                              key={v} type="button" disabled={isSeed}
                              onClick={() => {
                                const cur = review.rules_followed ?? {};
                                updateReview({ rules_followed: { ...cur, [rule.id]: v === "YES" } });
                              }}
                              className="rounded px-2 py-0.5 text-[10px] font-bold transition-all"
                              style={
                                (v === "YES" ? followed : !followed && review.rules_followed?.[rule.id] != null)
                                  ? { background: v === "YES" ? "rgba(0,230,118,0.2)" : "rgba(255,60,60,0.2)", color: v === "YES" ? "#00e676" : "#ff3c3c" }
                                  : { background: "rgba(255,255,255,0.04)", color: "#475569" }
                              }
                            >{v}</button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {(checklist.length === 0 && rules.length === 0) && (
              <p className="text-xs text-slate-600 font-mono mb-4">
                Add checklist items and rules in{" "}
                <Link href="/app/journaling/settings" className="text-[#6366f1] hover:underline">Journal Settings</Link>.
              </p>
            )}

            {isSeed && (
              <p className="text-[10px] text-[#ff8c00] font-mono">Demo trade — review not saved.</p>
            )}
          </div>

          {/* Related */}
          <div className={jn.card}>
            <p className={jn.label}>Related ({trade.symbol})</p>
            <ul className="mt-3 space-y-2">
              {rel.length === 0 && (
                <li className="text-xs text-slate-600 font-mono">No other closed trades for this symbol.</li>
              )}
              {rel.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`${linkBase}/trade/${r.id}`}
                    className="flex justify-between rounded-lg border border-white/[0.05] bg-black/20 px-3 py-2 text-xs font-mono hover:border-[#ff3c3c]/20"
                  >
                    <span className="text-slate-400">{format(parseISO(r.close_time ?? r.open_time), "MMM d")}</span>
                    <span style={{ color: netPl(r) >= 0 ? jn.green : jn.accentRed }}>
                      {netPl(r) >= 0 ? "+" : ""}
                      {netPl(r).toFixed(0)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
