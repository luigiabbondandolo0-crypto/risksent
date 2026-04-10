"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Info,
  Lightbulb,
  Link2,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { MOCK_ALERTS, MOCK_RULES } from "@/lib/mock/siteMockData";

const RECOMMENDED_RANGES: Record<string, string> = {
  daily_loss_pct: "Recommended: 2%.",
  max_risk_per_trade_pct: "Recommended: 1%.",
  max_exposure_pct: "Recommended: 15%.",
  revenge_threshold_trades: "Recommended: 2 losses.",
};

function relativeTime(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  if (hours < 24) return `${hours} h ago`;
  if (days < 7) return `${days} d ago`;
  return d.toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" });
}

export default function MockRulesPage() {
  const [alertFilter, setAlertFilter] = useState<"all" | "high" | "medium">("all");
  const [aiOpen, setAiOpen] = useState(false);

  const filteredAlerts = useMemo(
    () => MOCK_ALERTS.filter((a) => alertFilter === "all" || a.severity === alertFilter),
    [alertFilter]
  );

  const fields = [
    {
      key: "daily_loss_pct",
      label: "Daily Loss Limit (%)",
      value: MOCK_RULES.daily_loss_pct,
      min: 0,
      max: 10,
      step: 0.5,
      unit: "%",
    },
    {
      key: "max_risk_per_trade_pct",
      label: "Max Risk Per Trade (%)",
      value: MOCK_RULES.max_risk_per_trade_pct,
      min: 0,
      max: 3,
      step: 0.1,
      unit: "%",
    },
    {
      key: "max_exposure_pct",
      label: "Max Total Exposure (%)",
      value: MOCK_RULES.max_exposure_pct,
      min: 0,
      max: 30,
      step: 0.5,
      unit: "%",
    },
    {
      key: "revenge_threshold_trades",
      label: "Revenge Trading Threshold",
      value: MOCK_RULES.revenge_threshold_trades,
      min: 0,
      max: 5,
      step: 1,
      unit: "losses",
    },
  ] as const;

  return (
    <div className="space-y-8 animate-fade-in lg:space-y-10">
      <header>
        <h1 className="rs-page-title">Risk Sentinel</h1>
        <p className="rs-page-sub">
          Full mock of Risk Sentinel: live monitoring flow, rule thresholds and live alerts center.
        </p>
      </header>

      <section className="flex flex-col gap-8 lg:flex-row">
        <div className="flex-1 space-y-6">
          <div className="rs-card border-cyan-500/25 p-6 shadow-rs-soft">
            <div className="mb-2 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-cyan-400" />
              <h2 className="text-sm font-medium text-slate-200">Personal Risk Rules</h2>
            </div>
            <p className="mb-4 text-xs text-slate-500">
              Thresholds govern alert triggers and sanity scoring. In produzione i valori sono salvati nel database.
            </p>
            <div className="mb-4 space-y-1 rounded-lg border border-slate-700 bg-slate-800/30 px-3 py-2 text-[11px] text-slate-400">
              <p>
                <strong className="text-slate-300">Mock:</strong> slider disabilitati — riflettono{" "}
                <span className="text-cyan-300/90">MOCK_RULES</span> in{" "}
                <code className="text-slate-500">siteMockData</code>.
              </p>
            </div>

            <div className="space-y-6">
              {fields.map(({ key, label, value, min, max, step, unit }) => (
                <div key={key} className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="text-xs font-medium text-slate-400">{label}</label>
                    <span className="text-[11px] text-emerald-500/90">{RECOMMENDED_RANGES[key]}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={step}
                      value={value}
                      disabled
                      className="h-2 flex-1 cursor-not-allowed rounded-lg bg-slate-700 accent-cyan-500 opacity-80"
                    />
                    <span className="w-14 rounded border border-slate-700 bg-slate-900/50 px-2 py-1.5 text-center text-sm text-slate-200">
                      {value}
                    </span>
                    <span className="w-10 text-sm text-slate-500">{unit}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] text-slate-500">{RECOMMENDED_RANGES[key]}</p>
                    <span className="text-xs text-slate-500">Live badge: — (mock)</span>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-6 text-xs text-slate-500">
              <SaveHint />
            </p>
          </div>

          <div className="rounded-xl border border-cyan-500/20 bg-surface p-6">
            <div className="mb-1 flex items-center gap-2">
              <Link2 className="h-4 w-4 text-cyan-400" />
              <h2 className="text-sm font-medium text-slate-200">Link Telegram</h2>
            </div>
            <p className="mb-4 text-xs text-slate-500">
              One-time link: nella build reale apri il link e invii /start al bot.
            </p>
            <p className="mb-3 text-xs text-amber-400/95">
              Mock: nessun chat collegato — stessa UI della live con stati disabilitati.
            </p>
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800/50 px-3 py-2 text-sm font-medium text-slate-500"
            >
              <Link2 className="h-4 w-4" /> Link now (mock)
            </button>
          </div>

          <div className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-slate-900/80 to-violet-950/30 p-5">
            <button
              type="button"
              onClick={() => {
                setAiOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-violet-500/35 bg-violet-500/10 px-3 py-2 text-sm font-medium text-violet-100 transition-colors hover:bg-violet-500/20"
            >
              <Lightbulb className="h-4 w-4" /> Analyze my rules with AI
            </button>
            <p className="mt-2 text-[10px] text-slate-500">In mock: apre un pannello dimostrativo (nessuna API).</p>
          </div>
        </div>

        <div className="flex-1 space-y-4 lg:min-w-[320px]">
          <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 p-4">
            <div className="mb-2 flex items-center gap-2 font-medium text-amber-200">
              <AlertCircle className="h-4 w-4" />
              Values above suggested limits (demo)
            </div>
            <p className="mb-2 text-xs text-slate-400">
              Esempio di banner come in live quando salvi sopra i massimi consigliati.
            </p>
            <ul className="space-y-1 text-xs text-slate-300">
              <li className="flex justify-between gap-2">
                <span className="text-slate-500">Max exposure</span>
                <span>
                  <span className="text-amber-300">{MOCK_RULES.max_exposure_pct}%</span> vs suggerito 15%
                </span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-cyan-500/20 bg-surface p-6 shadow-lg shadow-cyan-500/5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium text-slate-200">Alerts Center</h2>
              <span className="inline-flex items-center gap-1 rounded border border-slate-600 bg-slate-800/50 px-2 py-1 text-xs text-slate-500">
                <RefreshCw className="h-3 w-3" /> Mock
              </span>
            </div>
            <p className="mb-3 text-xs text-slate-500">High alerts first — stessi controlli della live.</p>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-[10px] text-slate-500">Show:</span>
              {(["all", "high", "medium"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setAlertFilter(f)}
                  className={`rounded px-2 py-1 text-xs capitalize ${
                    alertFilter === f
                      ? "border border-cyan-500/40 bg-cyan-500/20 text-cyan-300"
                      : "border border-slate-600 text-slate-400 hover:bg-slate-800/50"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="max-h-[420px] space-y-3 overflow-y-auto">
              {filteredAlerts.map((a) => (
                <div
                  key={a.id}
                  className={`rounded-lg border p-3 ${
                    a.severity === "high" ? "border-red-500/40 bg-red-500/10" : "border-amber-500/40 bg-amber-500/10"
                  }`}
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`text-xs font-medium ${a.severity === "high" ? "text-red-300" : "text-amber-300"}`}
                    >
                      {a.severity === "high" ? "High" : "Medium"} • New
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(a.alert_date).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })} –{" "}
                      {relativeTime(a.alert_date)}
                    </span>
                  </div>
                  <p className="mb-1 text-xs font-medium text-slate-300">Problem</p>
                  <p className="mb-2 text-xs text-slate-400">{a.message}</p>
                  {a.solution && (
                    <>
                      <p className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-300">
                        <Lightbulb className="h-3 w-3" /> Action
                      </p>
                      <p className="text-xs text-slate-400">{a.solution}</p>
                    </>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="text-xs text-slate-600">Mark as read (mock)</span>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/mock/dashboard"
              className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300"
            >
              <Sparkles className="h-3 w-3" /> Torna alla dashboard mock
            </Link>
          </div>
        </div>
      </section>

      {aiOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setAiOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-violet-500/30 bg-slate-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 text-lg font-semibold text-slate-100">AI rules insight (mock)</h3>
            <p className="text-sm leading-relaxed text-slate-300">
              Con i valori attuali, l&apos;esposizione massima è sopra il range consigliato: in live l&apos;AI sintetizzerebbe
              impatto su alert e sanity score. Nessuna chiamata rete in questa anteprima.
            </p>
            <button
              type="button"
              className="mt-4 rounded-lg bg-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-600"
              onClick={() => setAiOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SaveHint() {
  return (
    <span className="flex items-start gap-2">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
      <span>
        Save Rules è disabilitato in mock. La live usa <code className="text-slate-500">PATCH /api/rules</code>.
      </span>
    </span>
  );
}
