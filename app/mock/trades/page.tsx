"use client";

import { MOCK_CURRENCY, MOCK_TRADES } from "@/lib/mock/siteMockData";

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
  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="rs-page-title">Trades</h1>
          <p className="rs-page-sub">
            Stessa struttura della pagina live: account, filtri, KPI e tabella trade (dati mock).
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

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search symbol, ticket…"
          className="rs-input max-w-xs"
          disabled
        />
        <span className="text-xs text-slate-500">Filtri data (mock)</span>
      </div>

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
              </tr>
            </thead>
            <tbody>
              {MOCK_TRADES.map((t) => {
                const type = normalizeType(t.type);
                return (
                  <tr key={t.ticket} className="border-b border-slate-800/80 hover:bg-slate-800/40">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-300">{formatD(t.closeTime)}</td>
                    <td className="px-4 py-3 font-medium text-slate-200">{t.symbol}</td>
                    <td className="px-4 py-3">
                      <span className={type === "Buy" ? "font-medium text-emerald-400" : "font-medium text-red-400"}>
                        {type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{t.lots.toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-300">{t.openPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-300">{t.closePrice.toFixed(2)}</td>
                    <td
                      className={`px-4 py-3 font-medium ${t.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {t.profit >= 0 ? "+" : ""}
                      {t.profit.toFixed(2)} {MOCK_CURRENCY}
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
