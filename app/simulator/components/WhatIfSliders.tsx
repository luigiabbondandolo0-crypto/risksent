"use client";

import { useState, useMemo } from "react";

export type WhatIfParams = {
  riskReducePct: number;
  maxTradesPerDay: number;
  stopAfterConsecutiveLosses: number;
};

type WhatIfSlidersProps = {
  /** Current baseline probability (0–100) */
  baselineProbPhase1: number;
  /** Current estimated days to target */
  baselineDaysToTarget: number;
  /** Current breach risk (0–100) */
  baselineBreachRisk: number;
  onParamsChange?: (params: WhatIfParams) => void;
  className?: string;
};

/**
 * What-If sliders: adjust risk/trade, max trades/day, stop after Z losses.
 * Output: simulated new probability, days, breach risk (simplified heuristic).
 */
export function WhatIfSliders({
  baselineProbPhase1,
  baselineDaysToTarget,
  baselineBreachRisk,
  onParamsChange,
  className = ""
}: WhatIfSlidersProps) {
  const [riskReducePct, setRiskReducePct] = useState(0);
  const [maxTradesPerDay, setMaxTradesPerDay] = useState(10);
  const [stopAfterLosses, setStopAfterLosses] = useState(3);

  const params: WhatIfParams = useMemo(
    () => ({
      riskReducePct,
      maxTradesPerDay,
      stopAfterConsecutiveLosses: stopAfterLosses
    }),
    [riskReducePct, maxTradesPerDay, stopAfterLosses]
  );

  // Heuristic: reducing risk and limiting trades/losses improves prob and reduces breach
  const simulated = useMemo(() => {
    const riskFactor = 1 - riskReducePct / 100;
    const tradeLimitFactor = maxTradesPerDay <= 5 ? 1.15 : maxTradesPerDay <= 10 ? 1.05 : 1;
    const stopFactor = stopAfterLosses <= 2 ? 1.2 : stopAfterLosses <= 4 ? 1.1 : 1;
    const probBoost = (riskFactor * 0.3 + tradeLimitFactor * 0.1 + stopFactor * 0.1 - 0.5) * 100;
    const newProb = Math.min(95, Math.max(5, baselineProbPhase1 + probBoost));
    const newDays = Math.max(1, Math.round(baselineDaysToTarget * (1 - riskReducePct / 200)));
    const newBreach = Math.max(0, Math.min(100, baselineBreachRisk * (1 - riskReducePct / 150)));
    return { newProb, newDays, newBreach };
  }, [baselineProbPhase1, baselineDaysToTarget, baselineBreachRisk, riskReducePct, maxTradesPerDay, stopAfterLosses]);

  return (
    <div className={`rounded-xl border border-slate-800 bg-surface p-5 ${className}`}>
      <h3 className="text-sm font-medium text-slate-200 mb-4">What-If – Proiezione</h3>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Riduci risk per trade</span>
            <span className="text-cyan-400">{riskReducePct}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={50}
            value={riskReducePct}
            onChange={(e) => setRiskReducePct(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none bg-slate-800 accent-cyan-500"
          />
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Max trade/giorno</span>
            <span className="text-cyan-400">{maxTradesPerDay}</span>
          </div>
          <input
            type="range"
            min={1}
            max={20}
            value={maxTradesPerDay}
            onChange={(e) => setMaxTradesPerDay(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none bg-slate-800 accent-cyan-500"
          />
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Stop dopo N perdite consecutive</span>
            <span className="text-cyan-400">{stopAfterLosses}</span>
          </div>
          <input
            type="range"
            min={1}
            max={8}
            value={stopAfterLosses}
            onChange={(e) => setStopAfterLosses(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none bg-slate-800 accent-cyan-500"
          />
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-800 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-400">Nuova prob. Phase 1</span>
          <span
            className={
              simulated.newProb >= 60 ? "text-emerald-400" : simulated.newProb >= 30 ? "text-amber-400" : "text-red-400"
            }
          >
            {Math.round(simulated.newProb)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Giorni stimati al target</span>
          <span className="text-slate-200">{simulated.newDays}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Rischio breach daily</span>
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
