"use client";

import { Sparkles, AlertCircle, Lightbulb, Heart } from "lucide-react";

export type AIFeedbackData = {
  summary: string;
  errors: string[];
  tips: string[];
  healthScore: number;
};

type FeedbackAICardProps = {
  data: AIFeedbackData;
  tradesCount: number;
  periodLabel?: string;
  className?: string;
};

/**
 * AI Coach card: summary, 3 errors, 3 actionable tips, health score 0–100.
 * Data can come from API/AI later; for now uses placeholder or passed data.
 */
export function FeedbackAICard({
  data,
  tradesCount,
  periodLabel = "ultimi 30 trade",
  className = ""
}: FeedbackAICardProps) {
  const scoreColor =
    data.healthScore >= 70 ? "text-emerald-400" : data.healthScore >= 40 ? "text-amber-400" : "text-red-400";

  return (
    <div className={`rounded-xl border border-slate-800 bg-surface p-5 ${className}`}>
      <h3 className="text-sm font-medium text-slate-200 mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-cyan-400" />
        Analisi AI Coach – {periodLabel}
      </h3>

      <p className="text-sm text-slate-400 mb-4">{data.summary}</p>

      {data.errors.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
            3 errori chiave
          </h4>
          <ul className="space-y-1.5 text-sm text-slate-300">
            {data.errors.map((e, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-amber-400/80">•</span>
                {e}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.tips.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-cyan-400" />
            3 consigli actionable
          </h4>
          <ul className="space-y-1.5 text-sm text-slate-300">
            {data.tips.map((t, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-cyan-400/80">•</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
        <span className="text-xs text-slate-500 flex items-center gap-1.5">
          <Heart className="h-3.5 w-3.5" />
          Health Score emotivo
        </span>
        <span className={`text-lg font-semibold tabular-nums ${scoreColor}`}>{data.healthScore}/100</span>
      </div>
      <p className="text-xs text-slate-500 mt-1">
        {data.healthScore >= 70
          ? "Buona disciplina."
          : data.healthScore >= 40
            ? "Migliorabile con disciplina su revenge e size."
            : "Alto rischio emotivo: riduci size e rispetta stop."}
      </p>
    </div>
  );
}
