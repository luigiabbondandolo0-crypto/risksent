"use client";

import { useMemo } from "react";

export type WhatIfParams = {
  riskPerTradePct: number;
  maxTradesPerDay: number;
  stopAfterConsecutiveLosses: number;
};

const DEFAULT_PARAMS: WhatIfParams = {
  riskPerTradePct: 1.5,
  maxTradesPerDay: 5,
  stopAfterConsecutiveLosses: 2
};

type WhatIfSlidersProps = {
  value: WhatIfParams;
  onChange: (p: WhatIfParams) => void;
  baselineProbPhase1: number;
  baselineDaysToTarget: number;
  baselineBreachRisk: number;
  className?: string;
};

/**
 * What-If sliders: risk per trade (0.5–3%), max trades/day (1–10), stop after N consecutive losses (1–5).
 * AI will evaluate how these affect pass probability; heuristic used here for live preview.
 */
export function WhatIfSliders({
  value,
  onChange,
  baselineProbPhase1,
  baselineDaysToTarget,
  baselineBreachRisk,
  className = ""
}: WhatIfSlidersProps) {
  const params = value;

  const simulated = useMemo(() => {
    const riskFactor = params.riskPerTradePct <= 1 ? 1.2 : params.riskPerTradePct <= 2 ? 1.05 : 0.95;
    const tradeLimitFactor = params.maxTradesPerDay <= 3 ? 1.15 : params.maxTradesPerDay <= 6 ? 1.05 : 1;
    const stopFactor = params.stopAfterConsecutiveLosses <= 1 ? 1.2 : params.stopAfterConsecutiveLosses <= 2 ? 1.1 : 1.05;
    const probBoost = (riskFactor * 0.2 + tradeLimitFactor * 0.1 + stopFactor * 0.1 - 0.35) * 100;
    const newProb = Math.min(95, Math.max(5, baselineProbPhase1 + probBoost));
    const newDays = Math.max(1, Math.round(baselineDaysToTarget * (2 - riskFactor)));
    const newBreach = Math.max(0, Math.min(100, baselineBreachRisk * (1.4 - riskFactor * 0.4)));
    return { newProb, newDays, newBreach };
  }, [baselineProbPhase1, baselineDaysToTarget, baselineBreachRisk, params.riskPerTradePct, params.maxTradesPerDay, params.stopAfterConsecutiveLosses]);

  return (
    <div className={"rounded-xl border border-slate-800 bg-surface p-5 " + className}>
      <h3 className="text-sm font-medium text-slate-200 mb-4">Projection & What-If</h3>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Risk per trade</span>
            <span className="text-cyan-400">{params.riskPerTradePct}%</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.1}
            value={params.riskPerTradePct}
            onChange={(e) => onChange({ ...params, riskPerTradePct: Number(e.target.value) })}
            className="w-full h-2 rounded-full appearance-none bg-slate-800 accent-cyan-500"
          />
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Max trades per day</span>
            <span className="text-cyan-400">{params.maxTradesPerDay}</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={params.maxTradesPerDay}
            onChange={(e) => onChange({ ...params, maxTradesPerDay: Number(e.target.value) })}
            className="w-full h-2 rounded-full appearance-none bg-slate-800 accent-cyan-500"
          />
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Stop after N consecutive losses</span>
            <span className="text-cyan-400">{params.stopAfterConsecutiveLosses}</span>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            value={params.stopAfterConsecutiveLosses}
            onChange={(e) => onChange({ ...params, stopAfterConsecutiveLosses: Number(e.target.value) })}
            className="w-full h-2 rounded-full appearance-none bg-slate-800 accent-cyan-500"
          />
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-800 space-y-2 text-sm">
        <p className="text-xs text-slate-500 mb-2">Estimated outcome with these settings (AI may refine):</p>
        <div className="flex justify-between">
          <span className="text-slate-400">New Phase 1 probability</span>
          <span
            className={
              simulated.newProb >= 60 ? "text-emerald-400" : simulated.newProb >= 30 ? "text-amber-400" : "text-red-400"
            }
          >
            {Math.round(simulated.newProb)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Est. days to target</span>
          <span className="text-slate-200">{simulated.newDays}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Daily breach risk</span>
          <span
            className={
              simulated.newBreach <= 20 ? "text-emerald-400" : simulated.newBreach <= 50 ? "text-amber-400" : "text-red-400"
            }
          >
            {Math.round(simulated.newBreach)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export { DEFAULT_PARAMS as WHATIF_DEFAULT_PARAMS };
