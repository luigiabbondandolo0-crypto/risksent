"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertCircle,
  Info,
  Lightbulb,
  Link2,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { bt } from "@/components/backtesting/btClasses";
import { MOCK_ALERTS, MOCK_RULES } from "@/lib/mock/siteMockData";

const SITE_DOC_TITLE = "RiskSent – Trading Risk Dashboard";
const RISK_MANAGER_MOCK_DOC_TITLE = "Risk Manager – RiskSent (mock)";

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
  const pathname = usePathname();
  const isMockRiskManager = pathname === "/mock/risk-manager";
  const pageTitle = isMockRiskManager ? "Risk Manager" : "Rules (mock)";

  const [alertFilter, setAlertFilter] = useState<"all" | "high" | "medium">("all");
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    if (!isMockRiskManager) return;
    document.title = RISK_MANAGER_MOCK_DOC_TITLE;
    return () => {
      document.title = SITE_DOC_TITLE;
    };
  }, [isMockRiskManager]);

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
    <div className={`${bt.page} space-y-6 lg:space-y-8 animate-fade-in`}>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className={bt.h1}>{pageTitle}</h1>
          <p className={bt.sub}>
            Mock preview: same layout and typography as live — sliders and save are disabled; alerts are sample data.
          </p>
        </div>
      </header>

      <section className="flex flex-col gap-6 lg:flex-row lg:gap-8 lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-6 animate-fade-in-up">
          <div className="rs-card-accent relative isolate z-0 p-5 shadow-rs-soft sm:p-6">
            <div className="relative z-[1]">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 shrink-0 text-cyan-400" />
                <h2 className="text-base font-semibold font-display tracking-tight text-slate-100">
                  Personal risk rules
                </h2>
              </div>
              <p className="mb-4 text-xs font-mono leading-relaxed text-slate-500">
                Thresholds govern alert triggers and sanity scoring. In production, values are saved in the database.
              </p>
              <div className="mb-4 space-y-1.5 rounded-xl border border-slate-700/80 bg-slate-950/40 px-3 py-2.5 text-[11px] font-mono leading-relaxed text-slate-400">
                <p>
                  <span className="font-semibold text-slate-300">Mock:</span> sliders are disabled — they mirror{" "}
                  <span className="text-cyan-300/90">MOCK_RULES</span> in{" "}
                  <code className="text-slate-500">siteMockData</code>.
                </p>
              </div>

              <div className="space-y-5">
                {fields.map(({ key, label, value, min, max, step, unit }) => (
                  <div key={key} className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={bt.label}>{label}</span>
                      <span className="text-[11px] font-mono text-emerald-500/90">{RECOMMENDED_RANGES[key]}</span>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                      <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={value}
                        disabled
                        className="h-2 w-full flex-1 cursor-not-allowed appearance-none rounded-lg bg-slate-700 accent-cyan-500 opacity-80 sm:min-w-0"
                      />
                      <div className="flex items-center gap-2 sm:shrink-0">
                        <span className="w-full min-w-[4.5rem] max-w-[6rem] rounded-xl border border-white/[0.08] bg-[#0c0c0e] px-2 py-2 text-center text-sm font-mono text-slate-200 sm:w-16 sm:max-w-none">
                          {value}
                        </span>
                        <span className="w-10 shrink-0 font-mono text-sm text-slate-500">{unit}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[11px] font-mono text-slate-500">{RECOMMENDED_RANGES[key]}</p>
                      <span className="text-xs font-mono text-slate-500">Live badge: — (mock)</span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-6 text-xs font-mono text-slate-500">
                <SaveHint />
              </p>

              <button
                type="button"
                disabled
                className="mt-4 inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-4 py-2.5 text-sm font-medium font-display text-cyan-500/50 opacity-70"
              >
                Save rules (disabled)
              </button>
            </div>
          </div>

          <p className="rounded-lg border border-slate-700/80 bg-slate-950/40 px-3 py-2 text-xs font-mono text-slate-500">
            Connect an account in the live dashboard to see real status badges.
          </p>

          <div id="telegram" className="rs-card p-5 shadow-rs-soft sm:p-6">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Link2 className="h-4 w-4 shrink-0 text-cyan-400" />
              <h2 className="text-base font-semibold font-display tracking-tight text-slate-100">Link Telegram</h2>
            </div>
            <p className="mb-4 text-xs font-mono leading-relaxed text-slate-500">
              One-time link: in the real build, open the link and send /start to the bot.
            </p>
            <p className="mb-3 text-xs font-mono text-amber-400/95">
              Mock: no linked chat — same UI as live with disabled states.
            </p>
            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-slate-600 bg-slate-800/50 px-3 py-2 text-sm font-medium font-display text-slate-500"
            >
              <Link2 className="h-4 w-4" /> Link now (mock)
            </button>
          </div>

          <div className="rs-card p-4 shadow-rs-soft sm:p-5">
            <button
              type="button"
              onClick={() => setAiOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-800/50 px-3 py-2 text-sm font-medium font-display text-slate-300 transition hover:bg-slate-700/50"
            >
              <Lightbulb className="h-4 w-4" /> Analyze my rules with AI
            </button>
            <p className="mt-2 text-[10px] font-mono text-slate-500">In mock: opens a demo panel (no API calls).</p>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4 animate-fade-in-up animate-delay-100 lg:min-w-[min(100%,22rem)]">
          <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-4 sm:p-5">
            <div className="mb-2 flex items-center gap-2 font-medium font-display text-amber-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Values above suggested limits (demo)
            </div>
            <p className="mb-3 text-xs font-mono text-slate-300">
              Example banner as in live when you save above suggested maximums.
            </p>
            <ul className="space-y-1.5 text-xs font-mono">
              <li className="flex justify-between gap-2">
                <span className="text-slate-400">Max exposure</span>
                <span>
                  <span className="text-red-400">{MOCK_RULES.max_exposure_pct}%</span>
                  <span className="text-slate-500"> → suggested </span>
                  <span className="text-emerald-400">15%</span>
                </span>
              </li>
            </ul>
          </div>

          <div className="rs-card-accent relative isolate z-0 p-5 shadow-rs-soft sm:p-6">
            <div className="relative z-[1]">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold font-display tracking-tight text-slate-100">Alerts center</h2>
                <span className="inline-flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-800/50 px-2 py-1 text-xs font-mono text-slate-400">
                  <RefreshCw className="h-3 w-3" /> Mock
                </span>
              </div>
              <p className="mb-3 text-xs font-mono text-slate-500">High alerts first — same controls as live.</p>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Show</span>
                {(["all", "high", "medium"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setAlertFilter(f)}
                    className={`rounded-lg px-2 py-1 text-xs font-mono capitalize transition ${
                      alertFilter === f
                        ? "border border-cyan-500/40 bg-cyan-500/20 text-cyan-300"
                        : "border border-slate-600 text-slate-400 hover:bg-slate-800/50"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="max-h-[min(420px,60vh)] space-y-3 overflow-y-auto sm:max-h-[420px]">
                {filteredAlerts.map((a) => (
                  <div
                    key={a.id}
                    className={`rounded-xl border p-3 sm:p-4 ${
                      a.severity === "high" ? "border-red-500/40 bg-red-500/10" : "border-amber-500/40 bg-amber-500/10"
                    }`}
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`text-xs font-medium font-mono ${
                          a.severity === "high" ? "text-red-300" : "text-amber-300"
                        }`}
                      >
                        {a.severity === "high" ? "High" : "Medium"} • New
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(a.alert_date).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })} –{" "}
                        {relativeTime(a.alert_date)}
                      </span>
                    </div>
                    <p className="mb-1 text-xs font-medium font-display text-slate-300">Problem</p>
                    <p className="mb-2 text-xs font-mono text-slate-400">{a.message}</p>
                    {a.solution && (
                      <>
                        <p className="mb-1 flex items-center gap-1 text-xs font-medium font-display text-slate-300">
                          <Lightbulb className="h-3 w-3" /> Action
                        </p>
                        <p className="text-xs font-mono text-slate-400">{a.solution}</p>
                      </>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="text-xs font-mono text-slate-600">Mark as read (mock)</span>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/mock/dashboard"
                className="mt-4 inline-flex items-center gap-1 text-xs font-medium font-display text-cyan-400 hover:text-cyan-300"
              >
                <Sparkles className="h-3 w-3" /> Back to mock dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {aiOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setAiOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 text-lg font-semibold font-display text-slate-100">AI rules insight (mock)</h3>
            <p className="text-sm font-mono leading-relaxed text-slate-300">
              With current values, maximum exposure is above the suggested range: in live, AI would summarize impact on
              alerts and sanity score. No network call in this preview.
            </p>
            <button
              type="button"
              className="mt-4 rounded-xl bg-slate-700 px-4 py-2 text-sm font-display text-slate-200 transition hover:bg-slate-600"
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
        Save rules is disabled in mock. Live uses <code className="text-slate-500">PATCH /api/rules</code>.
      </span>
    </span>
  );
}
