"use client";

import { ArrowRight, BarChart3, Shield, TrendingUp, Bell } from "lucide-react";
import Link from "next/link";

const mockTrades = [
  { symbol: "EURUSD", direction: "Long", rr: "2.5R", result: "+1.8%", date: "Today" },
  { symbol: "XAUUSD", direction: "Long", rr: "1.8R", result: "+1.2%", date: "Today" },
  { symbol: "GBPUSD", direction: "Short", rr: "1.5R", result: "+0.9%", date: "Yesterday" },
  { symbol: "NAS100", direction: "Long", rr: "3.0R", result: "+2.3%", date: "Yesterday" }
];

const mockAlerts = [
  {
    id: 1,
    severity: "high",
    message: "Daily loss close to limit (-2.7% vs -3.0%).",
    solution: "Stop trading for today and review rules tomorrow."
  },
  {
    id: 2,
    severity: "medium",
    message: "Risk on EURUSD trade at 1.2% (limit 1.0%).",
    solution: "Reduce lot size or tighten stop loss."
  }
];

export default function DemoDashboardPage() {
  return (
    <div className="min-h-screen bg-background px-4 pb-10 pt-6 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {/* Header + account picker mimic */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-400/90">
              Demo · Read-only
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              Static preview of what you&apos;ll see once your MetaTrader account is connected.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Last update: 14:03 · All metrics below are mock data.
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:w-72">
            <select className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500">
              <option>123456 · Demo MetaTrader Account</option>
            </select>
            <div className="flex gap-2">
              <button className="flex-1 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-200 hover:border-cyan-500 hover:text-cyan-200">
                Refresh stats
              </button>
              <Link
                href="/app/risk-manager"
                className="inline-flex items-center justify-center rounded-lg border border-cyan-500/70 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-200 hover:bg-cyan-500/20"
              >
                Edit rules
              </Link>
            </div>
          </div>
        </header>

        {/* Top row: risk & health */}
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Account Health
              </span>
              <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] text-slate-500">
                Demo score
              </span>
            </div>
            <div className="mt-3 inline-flex items-baseline gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-4 py-2.5">
              <span className="text-2xl font-bold text-emerald-400">82</span>
              <span className="text-xs text-slate-400">/ 100</span>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Healthy risk profile: small drawdown, no high-severity alerts and positive win rate.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-medium text-slate-300">
                <Shield className="h-3.5 w-3.5 text-cyan-400" />
                Daily loss vs limit
              </span>
              <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] text-slate-400">
                Limit -3.0%
              </span>
            </div>
            <p className="mt-3 text-2xl font-semibold text-emerald-400">-0.9%</p>
            <p className="mt-1 text-[11px] text-slate-400">
              Inside limit. If this reaches -3.0%, RiskSent will trigger a high-severity alert.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-medium text-slate-300">
                <BarChart3 className="h-3.5 w-3.5 text-emerald-400" />
                Exposure & win rate
              </span>
            </div>
            <div className="mt-3 flex items-center gap-6">
              <div>
                <p className="text-xs text-slate-400">Current exposure</p>
                <p className="text-lg font-semibold text-emerald-400">3.4%</p>
                <p className="text-[11px] text-slate-500">Limit 6.0%</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Win rate (last 20)</p>
                <p className="text-lg font-semibold text-emerald-300">65%</p>
                <p className="text-[11px] text-slate-500">↑ vs previous 20 trades</p>
              </div>
            </div>
          </div>
        </section>

        {/* Alerts + trades */}
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-1">
            <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                  <Bell className="h-3.5 w-3.5 text-amber-300" />
                  Imminent alerts (demo)
                </span>
                <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] text-slate-500">
                  2 open
                </span>
              </div>
              <ul className="space-y-3">
                {mockAlerts.map((a) => (
                  <li
                    key={a.id}
                    className={`rounded-lg border p-3 text-xs ${
                      a.severity === "high"
                        ? "border-red-500/40 bg-red-500/10"
                        : "border-amber-500/40 bg-amber-500/10"
                    }`}
                  >
                    <p className="font-medium text-slate-100">{a.message}</p>
                    <p className="mt-1 text-slate-200">
                      Solution: <span className="text-cyan-200">{a.solution}</span>
                    </p>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] text-slate-500">
                In the live app, this section pulls from your actual alerts history.
              </p>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5 lg:col-span-2">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Recent trades (mock)
                </p>
                <p className="text-[11px] text-slate-500">
                  All trades shown here are positive to demonstrate a &quot;good day&quot; view.
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed text-left text-xs text-slate-200">
                <thead className="border-b border-slate-800 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                  <tr>
                    <th className="py-2 pr-4">Symbol</th>
                    <th className="py-2 pr-4">Direction</th>
                    <th className="py-2 pr-4">R-multiple</th>
                    <th className="py-2 pr-4">Result</th>
                    <th className="py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {mockTrades.map((t, i) => (
                    <tr
                      key={i}
                      className="border-b border-slate-900/80 last:border-0 hover:bg-slate-900/60"
                    >
                      <td className="py-2 pr-4 text-xs text-slate-100">{t.symbol}</td>
                      <td className="py-2 pr-4 text-xs text-slate-300">{t.direction}</td>
                      <td className="py-2 pr-4 text-xs text-emerald-300">{t.rr}</td>
                      <td className="py-2 pr-4 text-xs font-medium text-emerald-400">
                        {t.result}
                      </td>
                      <td className="py-2 text-xs text-slate-400">{t.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Explanation */}
        <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                What happens in the real app
              </p>
              <p className="mt-1 text-sm text-slate-300">
                In production, RiskSent connects to your MetaTrader account, builds an equity curve
                and checks your risk rules every minute. Alerts are stored and shown here and on
                Telegram.
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/app/risk-manager"
                className="inline-flex items-center justify-center rounded-lg border border-cyan-500/60 px-3 py-1.5 text-xs font-medium text-cyan-200 hover:bg-cyan-500/10"
              >
                See rules screen
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
              <Link
                href="/app/dashboard"
                className="inline-flex items-center justify-center rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-100 hover:border-cyan-400"
              >
                Go to live dashboard
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

