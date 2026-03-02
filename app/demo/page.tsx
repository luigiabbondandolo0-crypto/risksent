"use client";

import { ArrowRight, BarChart3, Shield, TrendingUp } from "lucide-react";
import Link from "next/link";

const mockTrades = [
  { symbol: "EURUSD", direction: "Long", rr: "2.5R", result: "+1.8%", date: "Today" },
  { symbol: "XAUUSD", direction: "Long", rr: "1.8R", result: "+1.2%", date: "Today" },
  { symbol: "GBPUSD", direction: "Short", rr: "1.5R", result: "+0.9%", date: "Yesterday" },
  { symbol: "NAS100", direction: "Long", rr: "3.0R", result: "+2.3%", date: "Yesterday" },
];

export default function DemoDashboardPage() {
  return (
    <div className="min-h-screen bg-background px-4 pb-10 pt-6 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-400/90">
              Demo · Read-only
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">
              RiskSent demo dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              This is a static preview. Connect your own MetaTrader account to see live data and
              Telegram alerts.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
            >
              Get started
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-100 hover:border-cyan-400"
            >
              Go to live dashboard
            </Link>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-medium text-slate-300">
                <Shield className="h-3.5 w-3.5 text-cyan-400" />
                Daily loss
              </span>
              <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] text-slate-400">
                Limit -3.0%
              </span>
            </div>
            <p className="mt-3 text-2xl font-semibold text-emerald-400">-0.9%</p>
            <p className="mt-1 text-[11px] text-slate-400">
              Inside limit. You&apos;re clear to keep trading.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-medium text-slate-300">
                <BarChart3 className="h-3.5 w-3.5 text-emerald-400" />
                Exposure
              </span>
              <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] text-slate-400">
                Limit 6.0%
              </span>
            </div>
            <p className="mt-3 text-2xl font-semibold text-emerald-400">3.4%</p>
            <p className="mt-1 text-[11px] text-slate-400">
              Portfolio risk is healthy. No alerts triggered.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-medium text-slate-300">
                <TrendingUp className="h-3.5 w-3.5 text-amber-300" />
                Win rate (last 20)
              </span>
            </div>
            <p className="mt-3 text-2xl font-semibold text-emerald-300">65%</p>
            <p className="mt-1 text-[11px] text-slate-400">
              Recent performance is positive. Focus on respecting max loss rules.
            </p>
          </div>
        </section>

        <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5">
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
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                What happens in the real app
              </p>
              <p className="mt-1 text-sm text-slate-300">
                In production, this dashboard is connected to your MetaTrader account and checks
                risk rules every minute.
              </p>
            </div>
            <Link
              href="/rules"
              className="inline-flex items-center justify-center rounded-lg border border-cyan-500/60 px-3 py-1.5 text-xs font-medium text-cyan-200 hover:bg-cyan-500/10"
            >
              See rules screen
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

