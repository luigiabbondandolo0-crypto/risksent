"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { JournalTradeRow } from "@/lib/journal/journalTypes";
import { jn } from "@/lib/journal/jnClasses";
import { SEED_TRADES } from "@/lib/journal/seedTrades";

const SYMBOLS = ["ALL", "EURUSD", "GBPUSD", "XAUUSD", "US30"];

function netPl(t: JournalTradeRow) {
  return (t.pl ?? 0) + (t.commission ?? 0) + (t.swap ?? 0);
}

type JournalTradesPageClientProps = {
  linkBase?: string;
  embedded?: boolean;
  /** Subscription demo: show same list UI with seed trades without calling the API. */
  forceDemoSeed?: boolean;
};

export function JournalTradesPageClient({
  linkBase = "/app/journaling",
  embedded = false,
  forceDemoSeed = false,
}: JournalTradesPageClientProps) {
  const router = useRouter();
  const [trades, setTrades] = useState<JournalTradeRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(!forceDemoSeed);
  const [useSeed, setUseSeed] = useState(forceDemoSeed);

  const [symbol, setSymbol] = useState("ALL");
  const [direction, setDirection] = useState<"ALL" | "BUY" | "SELL">("ALL");
  const [status, setStatus] = useState<"ALL" | "open" | "closed">("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const pageSize = 50;

  const load = useCallback(async () => {
    if (forceDemoSeed) {
      setLoading(true);
      setUseSeed(true);
      setTrades([]);
      setTotal(SEED_TRADES.length);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (symbol !== "ALL") q.set("symbol", symbol);
      if (direction !== "ALL") q.set("direction", direction);
      if (status !== "ALL") q.set("status", status);
      if (from) q.set("from", `${from}T00:00:00.000Z`);
      if (to) q.set("to", `${to}T23:59:59.999Z`);

      const res = await fetch(`/api/journal/trades?${q}`);
      const j = await res.json();
      if (!res.ok) {
        setTrades([]);
        setTotal(0);
        setUseSeed(true);
        return;
      }
      const list = (j.trades ?? []) as JournalTradeRow[];
      setTrades(list);
      setTotal(j.total ?? 0);
      setUseSeed(list.length === 0 && page === 1 && symbol === "ALL" && direction === "ALL" && status === "ALL" && !from && !to);
    } finally {
      setLoading(false);
    }
  }, [page, symbol, direction, status, from, to, forceDemoSeed]);

  useEffect(() => {
    void load();
  }, [load]);

  const displayRows = useMemo(() => {
    if (!useSeed) return trades;
    let s = [...SEED_TRADES];
    if (symbol !== "ALL") s = s.filter((t) => t.symbol === symbol);
    if (direction !== "ALL") s = s.filter((t) => t.direction === direction);
    if (status !== "ALL") s = s.filter((t) => t.status === status);
    const start = (page - 1) * pageSize;
    return s.slice(start, start + pageSize);
  }, [useSeed, trades, symbol, direction, status, page]);

  const displayTotal = useSeed
    ? SEED_TRADES.filter((t) => {
        if (symbol !== "ALL" && t.symbol !== symbol) return false;
        if (direction !== "ALL" && t.direction !== direction) return false;
        if (status !== "ALL" && t.status !== status) return false;
        return true;
      }).length
    : total;

  const totalPages = Math.max(1, Math.ceil(displayTotal / pageSize));

  const shellClass = embedded ? "scroll-mt-28 space-y-6 border-t border-white/[0.06] pt-8" : `${jn.page} space-y-6`;

  return (
    <div className={shellClass} id={embedded ? "journal-trades" : undefined}>
      <div>
        {embedded ? (
          <h2 className={jn.h1}>Trades</h2>
        ) : (
          <h1 className={jn.h1}>Trades</h1>
        )}
        <p className={jn.sub}>Filter, review, and drill into every execution.</p>
      </div>

      {useSeed && (
        <p className="rounded-xl border border-[#ff8c00]/30 bg-[#ff8c00]/10 px-4 py-2 text-xs text-[#ff8c00] font-mono">
          Demo: sample trades shown until your API returns data.
        </p>
      )}

      <div className={`${jn.card} flex flex-wrap gap-3`}>
        <div>
          <label className={jn.label}>Symbol</label>
          <select className={jn.input} value={symbol} onChange={(e) => { setPage(1); setSymbol(e.target.value); }}>
            {SYMBOLS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={jn.label}>Direction</label>
          <select
            className={jn.input}
            value={direction}
            onChange={(e) => { setPage(1); setDirection(e.target.value as typeof direction); }}
          >
            <option value="ALL">ALL</option>
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>
        </div>
        <div>
          <label className={jn.label}>Status</label>
          <select
            className={jn.input}
            value={status}
            onChange={(e) => { setPage(1); setStatus(e.target.value as typeof status); }}
          >
            <option value="ALL">ALL</option>
            <option value="open">OPEN</option>
            <option value="closed">CLOSED</option>
          </select>
        </div>
        <div>
          <label className={jn.label}>From</label>
          <input className={jn.input} type="date" value={from} onChange={(e) => { setPage(1); setFrom(e.target.value); }} />
        </div>
        <div>
          <label className={jn.label}>To</label>
          <input className={jn.input} type="date" value={to} onChange={(e) => { setPage(1); setTo(e.target.value); }} />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/[0.07] bg-white/[0.02]">
        <table className="w-full min-w-[960px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.07] text-[11px] uppercase tracking-wider text-slate-500 font-mono">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Symbol</th>
              <th className="px-4 py-3">Dir</th>
              <th className="px-4 py-3">Lots</th>
              <th className="px-4 py-3">Open</th>
              <th className="px-4 py-3">Close</th>
              <th className="px-4 py-3">Pips</th>
              <th className="px-4 py-3">P&amp;L</th>
              <th className="px-4 py-3">R:R</th>
              <th className="px-4 py-3">Tags</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-slate-500 font-mono">
                  Loading…
                </td>
              </tr>
            ) : (
              displayRows.map((t) => {
                const n = netPl(t);
                const rowTint =
                  t.status === "closed" ? (n > 0 ? "bg-[#00e676]/[0.04]" : n < 0 ? "bg-[#ff3c3c]/[0.04]" : "") : "";
                return (
                  <tr
                    key={t.id}
                    role="link"
                    tabIndex={0}
                    className={`cursor-pointer border-b border-white/[0.04] transition hover:bg-white/[0.05] ${rowTint}`}
                    onClick={() => router.push(`${linkBase}/trade/${t.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`${linkBase}/trade/${t.id}`);
                      }
                    }}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">
                      {format(parseISO(t.open_time), "MMM d, HH:mm")}
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">{t.symbol}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-mono ${
                          t.direction === "BUY"
                            ? "bg-[#00e676]/15 text-[#00e676]"
                            : "bg-[#ff3c3c]/15 text-[#ff3c3c]"
                        }`}
                      >
                        {t.direction}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">{t.lot_size}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{t.open_price}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{t.close_price ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{t.pips ?? "—"}</td>
                    <td
                      className="px-4 py-3 font-mono font-medium"
                      style={{ color: n >= 0 ? jn.green : jn.accentRed }}
                    >
                      {n >= 0 ? "+" : ""}
                      {n.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">{t.risk_reward?.toFixed(2) ?? "—"}</td>
                    <td className="px-4 py-3 max-w-[140px] truncate text-xs text-slate-500">
                      {(t.setup_tags ?? []).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`${linkBase}/trade/${t.id}`}
                        className="text-xs font-mono text-[#6366f1] underline hover:text-[#818cf8]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={`text-xs text-slate-500 ${jn.mono}`}>
          Page {page} / {totalPages} · {displayTotal} trades
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className={jn.btnGhost}
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={jn.btnGhost}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
