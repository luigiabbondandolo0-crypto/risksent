"use client";

import { useState } from "react";
import Link from "next/link";
import { Brain, Sparkles, X } from "lucide-react";

type InsightApi = {
  summary: string;
  patterns: string[];
  emotional: string[];
};

type Props = {
  ticket: number;
  symbol: string;
  sanityScore: number;
  localIssues: string[];
  aiCoachHref: string;
  /** Skip POST /api/ai/trade-insight (e.g. mock preview without session). */
  skipNetwork?: boolean;
};

function scoreColor(score: number) {
  if (score >= 76) return "text-emerald-400";
  if (score >= 41) return "text-amber-400";
  return "text-red-400";
}

function scoreRingClass(score: number) {
  if (score >= 76) return "from-emerald-500/40 to-cyan-500/20";
  if (score >= 41) return "from-amber-500/40 to-orange-500/20";
  return "from-red-500/40 to-rose-500/20";
}

const MOCK_STUB: InsightApi = {
  summary:
    "Preview: single-trade context is merged with your risk rules. In production this layer calls the same insight service used for multi-select analysis.",
  patterns: [
    "Lot size vs equity and stop distance",
    "Streak context before this close",
    "Realized outcome vs implied R at entry",
  ],
  emotional: [
    "Check for size bumps after red days in the full journal view",
  ],
};

export function TradeAiInsightButton({
  ticket,
  symbol,
  sanityScore,
  localIssues,
  aiCoachHref,
  skipNetwork,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<InsightApi | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openModal = () => {
    setOpen(true);
    setInsight(null);
    setError(null);
    if (skipNetwork) {
      setLoading(false);
      setInsight(MOCK_STUB);
      return;
    }
    setLoading(true);
    (async () => {
      try {
        const res = await fetch("/api/ai/trade-insight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticketIds: [ticket] }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Analysis failed");
          return;
        }
        setInsight({
          summary: data.summary ?? "",
          patterns: Array.isArray(data.patterns) ? data.patterns : [],
          emotional: Array.isArray(data.emotional) ? data.emotional : [],
        });
      } catch {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <span
          className={`tabular-nums text-xs font-bold ${scoreColor(sanityScore)}`}
          title="Sanity score (0–100)"
        >
          {sanityScore}
        </span>
        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center gap-1 rounded-lg border border-violet-500/35 bg-violet-500/10 px-2 py-1 text-[11px] font-medium text-violet-200 transition-colors hover:bg-violet-500/20"
        >
          <Brain className="h-3.5 w-3.5" />
          AI Insight
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700/80 bg-gradient-to-b from-slate-900 to-slate-950 p-0 shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-200"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className={`bg-gradient-to-br p-6 pb-4 ${scoreRingClass(sanityScore)}`}>
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/60 shadow-inner">
                  <div className="text-center">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Sanity</p>
                    <p className={`text-3xl font-bold tabular-nums ${scoreColor(sanityScore)}`}>{sanityScore}</p>
                  </div>
                </div>
                <div className="min-w-0 flex-1 pt-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Trade</p>
                  <p className="text-lg font-semibold text-white">
                    #{ticket} · {symbol}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Score blends rule risk %, revenge context, SL presence, and realized R vs risk.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 px-6 pb-6 pt-2">
              <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                  Rule &amp; execution checks
                </h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  {localIssues.map((line, i) => (
                    <li key={i} className="flex gap-2 rounded-lg border border-slate-800/80 bg-slate-950/50 px-3 py-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500/80" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <Brain className="h-4 w-4 text-violet-400" />
                  Site AI (aggregated)
                </h3>
                {loading && <p className="text-sm text-slate-500">Loading insight…</p>}
                {error && <p className="text-sm text-red-400">{error}</p>}
                {!loading && !error && insight && (
                  <>
                    <p className="text-sm leading-relaxed text-slate-300">{insight.summary}</p>
                    {insight.patterns.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Patterns</p>
                        <ul className="mt-1 list-inside list-disc text-sm text-slate-400">
                          {insight.patterns.map((p, i) => (
                            <li key={i}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {insight.emotional.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Behaviour</p>
                        <ul className="mt-1 list-inside list-disc text-sm text-slate-400">
                          {insight.emotional.map((p, i) => (
                            <li key={i}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={aiCoachHref}
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-4 py-2.5 text-sm font-medium text-cyan-100 hover:bg-cyan-500/25"
                  onClick={() => setOpen(false)}
                >
                  Open AI Coach
                </Link>
                <button
                  type="button"
                  className="rounded-xl border border-slate-600 bg-slate-800/80 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700"
                  onClick={() => setOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
