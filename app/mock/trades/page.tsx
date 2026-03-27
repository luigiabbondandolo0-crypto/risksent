"use client";

import { useMemo } from "react";
import { TradeAiInsightButton } from "@/app/trades/components/TradeAiInsightButton";
import { SanityBadge, getSanityLevel } from "@/app/trades/components/SanityBadge";
import {
  buildTradeInsightIssues,
  computeTradeSanityScore,
  riskPctForTrade,
} from "@/app/trades/lib/tradeInsight";
import { MOCK_CURRENCY, MOCK_DASHBOARD_STATS, MOCK_RULES, MOCK_TRADES } from "@/lib/mock/siteMockData";

function formatD(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function normalizeType(t: string): "Buy" | "Sell" {
  const u = (t || "").toLowerCase();
  return u === "sell" ? "Sell" : "Buy";
}

export default function MockTradesPage() {
  const balance = MOCK_DASHBOARD_STATS.balance;
  const maxRisk = MOCK_RULES.max_risk_per_trade_pct;
  const revengeThr = MOCK_RULES.revenge_threshold_trades;

  const sortedByTime = useMemo(() => {
    const copy = [...MOCK_TRADES];
    copy.sort((a, b) => new Date(a.closeTime).getTime() - new Date(b.closeTime).getTime());
    return copy;
  }, []);

  const riskPctAndEquity = useMemo(() => {
    let runningEquity = balance;
    return sortedByTime.map((t) => {
      const equity = runningEquity;
      runningEquity += t.profit;
      const riskPct = riskPctForTrade({
        stopLoss: "stopLoss" in t ? (t as { stopLoss?: number }).stopLoss : undefined,
        lots: t.lots,
        openPrice: t.openPrice,
        equity,
      });
      return { riskPct, equity };
    });
  }, [sortedByTime, balance]);

  const consecutiveLossesBefore = useMemo(() => {
    const out: number[] = [];
    let streak = 0;
    for (let i = 0; i < sortedByTime.length; i++) {
      out.push(streak);
      if (sortedByTime[i].profit < 0) streak += 1;
      else streak = 0;
    }
    return out;
  }, [sortedByTime]);

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="rs-page-title">Trades</h1>
          <p className="rs-page-sub">
            Stessa struttura della pagina live: KPI, sanity, Sanity Score 0–100 e AI Insight per ogni trade (mock).
          </p>
        </div>
        <div className="w-full sm:max-w-xs">
          <label htmlFor="mock-trades-acct" className="rs-section-title mb-2 block">
            Trading account
          </label>
          <select id="mock-trades-acct" className="rs-input" disabled value="m1">
            <option value="m1">500123 · FTMO Demo</option>
          </select>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
        <div className="rs-card p-3 shadow-rs-soft">
          <p className="rs-kpi-label">Trades</p>
          <p className="mt-1 text-lg font-semibold text-slate-200">{MOCK_TRADES.length}</p>
        </div>
        <div className="rs-card p-3 shadow-rs-soft">
          <p className="rs-kpi-label">Win %</p>
          <p className="mt-1 text-lg font-semibold text-emerald-400">66.7%</p>
        </div>
        <div className="rs-card p-3 shadow-rs-soft">
          <p className="rs-kpi-label">Avg win</p>
          <p className="mt-1 text-lg font-semibold text-emerald-400">+193 {MOCK_CURRENCY}</p>
        </div>
        <div className="rs-card p-3 shadow-rs-soft">
          <p className="rs-kpi-label">Avg loss</p>
          <p className="mt-1 text-lg font-semibold text-red-400">-132 {MOCK_CURRENCY}</p>
        </div>
        <div className="rs-card p-3 shadow-rs-soft">
          <p className="rs-kpi-label">Max loss</p>
          <p className="mt-1 text-lg font-semibold text-red-400">-132 {MOCK_CURRENCY}</p>
        </div>
      </div>

      <div className="rs-card overflow-hidden shadow-rs-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Close time</th>
                <th className="px-4 py-3 font-medium">Symbol</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Lots</th>
                <th className="px-4 py-3 font-medium">Open</th>
                <th className="px-4 py-3 font-medium">Close</th>
                <th className="px-4 py-3 font-medium">Profit</th>
                <th className="px-4 py-3 font-medium">Sanity</th>
                <th className="px-3 py-3 text-right font-medium whitespace-nowrap">Score · AI</th>
              </tr>
            </thead>
            <tbody>
              {sortedByTime.map((t, idx) => {
                const type = normalizeType(t.type);
                const globalIndex = idx;
                const { riskPct } = riskPctAndEquity[globalIndex] ?? { riskPct: null };
                const consec = consecutiveLossesBefore[globalIndex] ?? 0;
                const sanity = getSanityLevel({
                  consecutiveLossesBefore: consec,
                  riskPct,
                  maxRiskPct: maxRisk,
                  revengeThreshold: revengeThr,
                });
                const hasStopLoss =
                  "stopLoss" in t &&
                  t.stopLoss != null &&
                  Number.isFinite((t as { stopLoss?: number }).stopLoss);
                const sl = hasStopLoss ? (t as { stopLoss: number }).stopLoss : undefined;
                const sanityScore = computeTradeSanityScore({
                  consecutiveLossesBefore: consec,
                  riskPct,
                  maxRiskPct: maxRisk,
                  revengeThreshold: revengeThr,
                  balance,
                  profit: t.profit,
                  hasStopLoss: !!hasStopLoss,
                });
                const localIssues = buildTradeInsightIssues({
                  consecutiveLossesBefore: consec,
                  riskPct,
                  maxRiskPct: maxRisk,
                  revengeThreshold: revengeThr,
                  balance,
                  profit: t.profit,
                  hasStopLoss: !!hasStopLoss,
                });
                return (
                  <tr key={t.ticket} className="border-b border-slate-800/80 hover:bg-slate-800/40">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-300">{formatD(t.closeTime)}</td>
                    <td className="px-4 py-3 font-medium text-slate-200">{t.symbol}</td>
                    <td className="px-4 py-3">
                      <span className={type === "Buy" ? "font-medium text-emerald-400" : "font-medium text-red-400"}>
                        {type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300" title={sl != null ? `SL ${sl.toFixed(5)}` : undefined}>
                      {t.lots.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{t.openPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-300">{t.closePrice.toFixed(2)}</td>
                    <td
                      className={`px-4 py-3 font-medium ${t.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {t.profit >= 0 ? "+" : ""}
                      {t.profit.toFixed(2)} {MOCK_CURRENCY}
                    </td>
                    <td className="px-4 py-3" title={sanity.tooltip}>
                      <SanityBadge level={sanity.level} tooltip={sanity.tooltip} />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <TradeAiInsightButton
                        ticket={t.ticket}
                        symbol={t.symbol}
                        sanityScore={sanityScore}
                        localIssues={localIssues}
                        aiCoachHref="/mock/ai-coach"
                        skipNetwork
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
