"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ChevronLeft, X } from "lucide-react";
import type { JournalTradeRow } from "@/lib/journal/journalTypes";
import { relatedTrades } from "@/lib/journal/analytics";
import { jn } from "@/lib/journal/jnClasses";
import { getSeedTradeById, SEED_TRADES } from "@/lib/journal/seedTrades";

const TAG_PRESETS = ["FOMO", "HTF Trend", "Revenge", "A+ Setup", "London", "NY", "Asia", "Breakout", "Liquidity sweep"];

function netPl(t: JournalTradeRow) {
  return (t.pl ?? 0) + (t.commission ?? 0) + (t.swap ?? 0);
}

type Props = { tradeId: string };

export function JournalTradeDetailClient({ tradeId }: Props) {
  const [trade, setTrade] = useState<JournalTradeRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [related, setRelated] = useState<JournalTradeRow[]>([]);
  const isSeed = tradeId.startsWith("seed-");

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
      const rRes = await fetch(
        `/api/journal/trades?symbol=${encodeURIComponent(t.symbol)}&status=closed&pageSize=8&page=1`
      );
      const rJson = await rRes.json();
      if (rRes.ok) {
        const list = (rJson.trades ?? []) as JournalTradeRow[];
        setRelated(list.filter((x) => x.id !== t.id).slice(0, 5));
      } else {
        setRelated([]);
      }
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
    return <p className="text-slate-500 font-[family-name:var(--font-mono)] text-sm">Loading…</p>;
  }
  if (!trade) {
    return (
      <div className={jn.page}>
        <p className="text-red-400">Trade not found.</p>
        <Link href="/app/journaling/trades" className="mt-4 inline-block text-[#ff3c3c] underline text-sm">
          Back to trades
        </Link>
      </div>
    );
  }

  const n = netPl(trade);

  return (
    <div className={`${jn.page} space-y-6`}>
      <Link
        href="/app/journaling/trades"
        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 font-[family-name:var(--font-mono)]"
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

            <dl className="mt-6 grid gap-3 sm:grid-cols-2 font-[family-name:var(--font-mono)] text-sm">
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
                  className="inline-flex items-center gap-1 rounded-full border border-white/[0.1] bg-black/30 px-3 py-1 text-xs text-slate-200 font-[family-name:var(--font-mono)]"
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
            <p className={jn.label}>Screenshot</p>
            <div className="mt-3 flex min-h-[140px] items-center justify-center rounded-xl border border-dashed border-white/[0.1] bg-black/20 text-sm text-slate-600">
              Upload coming soon (Supabase Storage)
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className={jn.card}>
            <p className={jn.label}>Trade stats</p>
            <ul className="mt-3 space-y-2 font-[family-name:var(--font-mono)] text-sm text-slate-300">
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

          <div className={jn.card}>
            <p className={jn.label}>Related ({trade.symbol})</p>
            <ul className="mt-3 space-y-2">
              {rel.length === 0 && (
                <li className="text-xs text-slate-600 font-mono">No other closed trades for this symbol.</li>
              )}
              {rel.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/app/journaling/trade/${r.id}`}
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
