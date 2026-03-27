import Link from "next/link";
import { Bot, Sparkles, ArrowRight } from "lucide-react";

export default function AICoachPage() {
  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in">
      <header>
        <h1 className="rs-page-title">AI Coach</h1>
        <p className="rs-page-sub">
          Advanced analysis: revenge patterns, overtrading, poor R:R, sizing errors. Requires a minimum trade history
          when the feature is live.
        </p>
      </header>

      <section className="rs-card border-violet-500/20 bg-gradient-to-br from-violet-950/40 to-slate-950/40 p-6 shadow-rs-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 ring-1 ring-violet-500/30">
              <Sparkles className="h-6 w-6 text-violet-300" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Versione mock</h2>
              <p className="mt-1 text-sm text-slate-400 leading-relaxed">
                Esplora tutta l&apos;interfaccia RiskSent con dati dimostrativi — nessun login, nessun account reale.
              </p>
            </div>
          </div>
          <Link
            href="/mock"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500/20 px-5 py-2.5 text-sm font-semibold text-violet-100 ring-1 ring-violet-500/40 transition-colors hover:bg-violet-500/30"
          >
            Apri sito mock
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <div className="rs-card p-8 text-center shadow-rs-soft">
        <Bot className="mx-auto h-10 w-10 text-slate-600" />
        <p className="mt-4 text-sm text-slate-400">
          AI Coach is coming soon. It will integrate with Claude or OpenAI for personalized insights.
        </p>
      </div>
    </div>
  );
}
