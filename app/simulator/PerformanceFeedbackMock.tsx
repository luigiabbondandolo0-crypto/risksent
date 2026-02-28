"use client";

import { Sparkles, TrendingUp, Activity, AlertTriangle } from "lucide-react";

type PerformanceFeedbackMockProps = {
  tradesCount: number;
  periodLabel?: string;
};

export function PerformanceFeedbackMock({ tradesCount, periodLabel = "periodo analizzato" }: PerformanceFeedbackMockProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-surface p-5">
      <h3 className="text-sm font-medium text-slate-200 mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-400" />
        Feedback performance (mock)
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        In futuro questo blocco sarà alimentato da analisi AI. Per ora mostra dati di esempio.
      </p>

      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            Proiezione prossime mosse
          </h4>
          <div className="rounded-lg bg-slate-800/50 border border-slate-700/50 p-3 text-sm text-slate-300">
            <p className="italic">
              Mantenere risk per trade sotto il 2%; evitare nuovi ingressi in sessioni già in drawdown. Possibile target su area di liquidità a +1,5% dal prezzo corrente.
            </p>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            Trade nel {periodLabel}
          </h4>
          <div className="rounded-lg bg-slate-800/50 border border-slate-700/50 p-3 text-sm text-slate-300">
            <p>
              <strong>{tradesCount}</strong> trade chiusi. Distribuzione temporale e PnL saranno analizzati dall’AI per suggerimenti su timing e dimensione posizione.
            </p>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            Errori gravi
          </h4>
          <div className="rounded-lg bg-slate-800/50 border border-slate-700/50 p-3 text-sm text-slate-300">
            <p className="text-slate-400">
              Nessun errore grave rilevato nel periodo. L’AI in futuro segnalerà sovraesposizione, violazioni di regole o pattern ripetuti da correggere.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
