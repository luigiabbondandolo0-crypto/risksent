"use client";

import Link from "next/link";
import {
  Activity,
  BarChart3,
  Brain,
  CheckCircle2,
  Circle,
  Gauge,
  ListChecks,
  Sparkles,
  Timer,
} from "lucide-react";
import type { AiCoachModel } from "@/lib/mock/siteMockData";

type CoachData = AiCoachModel;

type Props = {
  variant: "live" | "mock";
  data: CoachData | null;
};

function SectionTitle({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <Icon className="h-5 w-5 text-cyan-400/90" />
      <h2 className="text-base font-semibold text-slate-100">{children}</h2>
    </div>
  );
}

/** `string` avoids narrowing issues when mock data only uses a subset of severities. */
function insightBoxClass(severity: string) {
  if (severity === "high") return "border-red-500/35 bg-red-500/10";
  if (severity === "medium") return "border-amber-500/35 bg-amber-500/10";
  return "border-slate-700/80 bg-slate-950/40";
}

export function AICoachPanels({ variant, data }: Props) {
  const d = data;
  const isMock = variant === "mock";

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="rs-page-title">AI Coach</h1>
        <p className="rs-page-sub">
          Analisi comportamentale, sessioni, simboli e parametri di rischio. Con dati reali richiede storico trade sufficiente;
          l&apos;LLM sarà integrato nella release completa.
        </p>
      </header>

      {isMock && (
        <section className="rs-card border-violet-500/25 bg-gradient-to-br from-violet-950/40 to-slate-950/60 p-6 shadow-rs-soft">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 ring-1 ring-violet-500/30">
                <Sparkles className="h-6 w-6 text-violet-300" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Versione mock</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Stessi pannelli della vista live, popolati con dati dimostrativi. Nessuna chiamata a modelli esterni.
                </p>
              </div>
            </div>
            <Link
              href="/mock"
              className="inline-flex shrink-0 items-center justify-center rounded-xl border border-violet-500/40 bg-violet-500/15 px-4 py-2 text-sm font-medium text-violet-100 hover:bg-violet-500/25"
            >
              Hub mock
            </Link>
          </div>
        </section>
      )}

      {!isMock && (
        <section className="rs-card border-cyan-500/20 bg-cyan-950/20 p-5 shadow-rs-soft">
          <p className="text-sm text-slate-300">
            I punteggi dettagliati si popoleranno quando il backend AI sarà collegato. La struttura sotto riflette il layout
            previsto.
          </p>
        </section>
      )}

      {/* Analysis window + model */}
      <section className="rs-card p-5 sm:p-6 shadow-rs-soft">
        <SectionTitle icon={Timer}>Finestra di analisi</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 px-4 py-3">
            <p className="rs-kpi-label">Lookback</p>
            <p className="mt-1 text-lg font-semibold text-white">{d ? `${d.analysisWindow.lookbackDays} giorni` : "—"}</p>
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 px-4 py-3">
            <p className="rs-kpi-label">Trade minimi</p>
            <p className="mt-1 text-lg font-semibold text-white">{d ? d.analysisWindow.minTrades : "—"}</p>
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 px-4 py-3">
            <p className="rs-kpi-label">Ultimo calcolo</p>
            <p className="mt-1 text-sm text-slate-300">
              {d ? new Date(d.analysisWindow.lastComputed).toLocaleString("it-IT") : "—"}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-800/60 pt-4 text-xs text-slate-500">
          <Brain className="h-4 w-4 text-slate-600" />
          <span>
            Modello: <span className="text-slate-300">{d?.model.label ?? "—"}</span>
            {d && (
              <>
                {" "}
                · provider <span className="text-slate-400">{d.model.provider}</span> · temp{" "}
                <span className="text-slate-400">{d.model.temperature}</span>
              </>
            )}
          </span>
        </div>
      </section>

      {/* Scores */}
      <section className="rs-card p-5 sm:p-6 shadow-rs-soft">
        <SectionTitle icon={Gauge}>Punteggi (0–100)</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {(
            [
              ["Disciplina", "discipline"],
              ["Coerenza rischio", "riskConsistency"],
              ["Reattività emotiva", "emotionalReactivity"],
              ["Aderenza strategia", "strategyAdherence"],
              ["Complessivo", "overall"],
            ] as const
          ).map(([label, key]) => (
            <div key={key} className="rounded-xl border border-slate-800/80 bg-slate-950/40 px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-cyan-300">
                {d ? d.scores[key] : "—"}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Behavioral metrics */}
      <section className="rs-card p-5 sm:p-6 shadow-rs-soft">
        <SectionTitle icon={Activity}>Metriche comportamentali</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              ["↑ size dopo loss (media)", "avgSizeAfterLossPct", "%"],
              ["Trade revenge (90g)", "revengeTradesCount", ""],
              ["Fuori piano (stima)", "tradesOutsidePlanPct", "%"],
              ["Max loss singola / equity", "largestSingleLossPct", "%"],
              ["Max losing streak", "consecutiveLossMax", ""],
            ] as const
          ).map(([label, key, suf]) => (
            <div key={key} className="rounded-xl border border-slate-800/60 bg-slate-900/30 px-4 py-3">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {d ? `${(d.behavioral as Record<string, number>)[key]}${suf}` : "—"}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Sessions + symbols */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rs-card p-5 shadow-rs-soft">
          <SectionTitle icon={BarChart3}>Win rate per sessione</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs text-slate-500">
                  <th className="py-2 font-medium">Sessione</th>
                  <th className="py-2 font-medium">Win %</th>
                  <th className="py-2 font-medium">Trade</th>
                </tr>
              </thead>
              <tbody>
                {(d?.sessionWinRate ?? []).map((row) => (
                  <tr key={row.session} className="border-b border-slate-800/50">
                    <td className="py-2 text-slate-200">{row.session}</td>
                    <td className="py-2 text-emerald-400">{row.winPct}%</td>
                    <td className="py-2 text-slate-400">{row.trades}</td>
                  </tr>
                ))}
                {!d && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-500">
                      Nessun dato
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
        <section className="rs-card p-5 shadow-rs-soft">
          <SectionTitle icon={BarChart3}>Per simbolo</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs text-slate-500">
                  <th className="py-2 font-medium">Simbolo</th>
                  <th className="py-2 font-medium">Trade</th>
                  <th className="py-2 font-medium">Net R</th>
                  <th className="py-2 font-medium">Hold (min)</th>
                </tr>
              </thead>
              <tbody>
                {(d?.symbolStats ?? []).map((row) => (
                  <tr key={row.symbol} className="border-b border-slate-800/50">
                    <td className="py-2 font-medium text-slate-200">{row.symbol}</td>
                    <td className="py-2 text-slate-400">{row.trades}</td>
                    <td className={`py-2 ${row.netR >= 0 ? "text-emerald-400" : "text-red-400"}`}>{row.netR.toFixed(2)}</td>
                    <td className="py-2 text-slate-500">{row.avgHoldMin}</td>
                  </tr>
                ))}
                {!d && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500">
                      Nessun dato
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Parameters table */}
      <section className="rs-card p-5 sm:p-6 shadow-rs-soft">
        <SectionTitle icon={ListChecks}>Parametri vs benchmark</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-xs text-slate-500">
                <th className="py-2 pr-4 font-medium">Parametro</th>
                <th className="py-2 pr-4 font-medium">Valore</th>
                <th className="py-2 pr-4 font-medium">Target</th>
                <th className="py-2 font-medium">Stato</th>
              </tr>
            </thead>
            <tbody>
              {(d?.parameters ?? []).map((p) => (
                <tr key={p.name} className="border-b border-slate-800/50">
                  <td className="py-2.5 text-slate-300">{p.name}</td>
                  <td className="py-2.5 font-mono text-slate-200">{p.value}</td>
                  <td className="py-2.5 text-slate-500">{p.benchmark}</td>
                  <td className="py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.status === "ok" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-300"
                      }`}
                    >
                      {p.status === "ok" ? "OK" : "Review"}
                    </span>
                  </td>
                </tr>
              ))}
              {!d && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-500">
                    — 
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Insights */}
      <section className="rs-card p-5 sm:p-6 shadow-rs-soft">
        <SectionTitle icon={Sparkles}>Insight narrativi</SectionTitle>
        <ul className="space-y-3">
          {(d?.insights ?? []).map((ins) => (
            <li
              key={ins.title}
              className={`rounded-xl border p-4 ${insightBoxClass(ins.severity)}`}
            >
              <p className="font-medium text-slate-100">{ins.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{ins.body}</p>
            </li>
          ))}
          {!d && (
            <li className="rounded-xl border border-dashed border-slate-700 py-8 text-center text-slate-500">
              Nessun insight ancora — collega l&apos;account e accumula trade.
            </li>
          )}
        </ul>
      </section>

      {/* Weekly focus + checklist */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rs-card p-5 shadow-rs-soft">
          <SectionTitle icon={ListChecks}>Focus settimanale</SectionTitle>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-300">
            {(d?.weeklyFocus ?? []).map((line, i) => (
              <li key={i}>{line}</li>
            ))}
            {!d && <li className="text-slate-500">—</li>}
          </ol>
        </section>
        <section className="rs-card p-5 shadow-rs-soft">
          <SectionTitle icon={CheckCircle2}>Checklist</SectionTitle>
          <ul className="space-y-2">
            {(d?.checklist ?? []).map((c) => (
              <li key={c.id} className="flex items-start gap-2 text-sm text-slate-300">
                {c.done ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />
                )}
                {c.label}
              </li>
            ))}
            {!d && (
              <li className="text-slate-500 flex items-center gap-2">
                <Circle className="h-4 w-4" /> —
              </li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
