"use client";

import { Sparkles, TrendingUp, Activity, AlertTriangle } from "lucide-react";

type PerformanceFeedbackMockProps = {
  tradesCount: number;
  periodLabel?: string;
};

export function PerformanceFeedbackMock({ tradesCount, periodLabel = "analysis period" }: PerformanceFeedbackMockProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-surface p-5">
      <h3 className="text-sm font-medium text-slate-200 mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-400" />
        Feedback performance (mock)
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        In the future this block will be powered by AI analysis. For now it shows sample data.
      </p>

      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            Next-move projection
          </h4>
          <div className="rounded-lg bg-slate-800/50 border border-slate-700/50 p-3 text-sm text-slate-300">
            <p className="italic">
              Keep risk per trade below 2%; avoid new entries in sessions already in drawdown. Possible target around a liquidity area at +1.5% from current price.
            </p>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            Trades in {periodLabel}
          </h4>
          <div className="rounded-lg bg-slate-800/50 border border-slate-700/50 p-3 text-sm text-slate-300">
            <p>
              <strong>{tradesCount}</strong> closed trades. Time distribution and PnL will be analyzed by AI for timing and position-size suggestions.
            </p>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            Critical errors
          </h4>
          <div className="rounded-lg bg-slate-800/50 border border-slate-700/50 p-3 text-sm text-slate-300">
            <p className="text-slate-400">
              No critical errors detected in this period. In the future, AI will flag overexposure, rule violations, and repeated patterns to fix.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
