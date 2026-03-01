"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import type { AIWhatIfResult } from "../lib/aiWhatIf";

type AIWhatIfProjectionProps = {
  data: AIWhatIfResult | null;
  className?: string;
};

/**
 * AI-driven What-If projection: shows scenario, recommendation, and projected
 * pass probabilities for all challenges. No user input – all from AI analysis.
 */
export function AIWhatIfProjection(props: AIWhatIfProjectionProps) {
  const { data, className = "" } = props;
  if (!data) return null;

  return (
    <div className={"rounded-xl border border-slate-800 bg-surface p-5 " + className}>
      <h3 className="text-sm font-medium text-slate-200 mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-cyan-400" />
        AI What-If Projection
      </h3>
      <p className="text-sm text-slate-400 mb-3">{data.scenario}</p>
      <p className="text-sm text-cyan-200/90 mb-4">{data.recommendation}</p>

      <div className="pt-4 border-t border-slate-800">
        <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">Projected pass probability if you apply the recommendation</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg bg-slate-800/50 p-2">
            <p className="text-xs text-slate-500">FTMO 2-Step P1</p>
            <p
              className={
                data.projectedProbFtmo2StepP1 >= 60
                  ? "text-emerald-400 font-semibold"
                  : data.projectedProbFtmo2StepP1 >= 30
                    ? "text-amber-400 font-semibold"
                    : "text-red-400 font-semibold"
              }
            >
              {data.projectedProbFtmo2StepP1}%
            </p>
          </div>
          <div className="rounded-lg bg-slate-800/50 p-2">
            <p className="text-xs text-slate-500">FTMO 2-Step P2</p>
            <p
              className={
                data.projectedProbFtmo2StepP2 >= 60
                  ? "text-emerald-400 font-semibold"
                  : data.projectedProbFtmo2StepP2 >= 30
                    ? "text-amber-400 font-semibold"
                    : "text-red-400 font-semibold"
              }
            >
              {data.projectedProbFtmo2StepP2}%
            </p>
          </div>
          <div className="rounded-lg bg-slate-800/50 p-2">
            <p className="text-xs text-slate-500">FTMO 1-Step</p>
            <p
              className={
                data.projectedProbFtmo1Step >= 60
                  ? "text-emerald-400 font-semibold"
                  : data.projectedProbFtmo1Step >= 30
                    ? "text-amber-400 font-semibold"
                    : "text-red-400 font-semibold"
              }
            >
              {data.projectedProbFtmo1Step}%
            </p>
          </div>
          <div className="rounded-lg bg-slate-800/50 p-2">
            <p className="text-xs text-slate-500">Simplified P1</p>
            <p
              className={
                data.projectedProbSimplifiedP1 >= 60
                  ? "text-emerald-400 font-semibold"
                  : data.projectedProbSimplifiedP1 >= 30
                    ? "text-amber-400 font-semibold"
                    : "text-red-400 font-semibold"
              }
            >
              {data.projectedProbSimplifiedP1}%
            </p>
          </div>
          <div className="rounded-lg bg-slate-800/50 p-2">
            <p className="text-xs text-slate-500">Simplified P2</p>
            <p
              className={
                data.projectedProbSimplifiedP2 >= 60
                  ? "text-emerald-400 font-semibold"
                  : data.projectedProbSimplifiedP2 >= 30
                    ? "text-amber-400 font-semibold"
                    : "text-red-400 font-semibold"
              }
            >
              {data.projectedProbSimplifiedP2}%
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400">
          <span>Est. days to target: <strong className="text-slate-200">{data.projectedDaysToTarget}</strong></span>
          <span>Daily breach risk: <strong className={data.projectedBreachRiskPct <= 20 ? "text-emerald-400" : data.projectedBreachRiskPct <= 50 ? "text-amber-400" : "text-red-400"}">{data.projectedBreachRiskPct}%</strong></span>
        </div>
      </div>
    </div>
  );
}
