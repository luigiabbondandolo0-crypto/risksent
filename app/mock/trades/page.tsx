import {
  MOCK_CURRENCY,
  MOCK_TRADES,
} from "@/lib/mock/siteMockData";

function formatD(iso: string) {
  return new Date(iso).toLocaleString("it-IT", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MockTradesPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="rs-page-title">Trades</h1>
        <p className="rs-page-sub">Lista trade chiusi dimostrativa.</p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rs-card p-4 shadow-rs-soft">
          <p className="rs-kpi-label">Trade</p>
          <p className="mt-1 text-lg font-semibold text-white">{MOCK_TRADES.length}</p>
        </div>
        <div className="rs-card p-4 shadow-rs-soft">
          <p className="rs-kpi-label">Valuta</p>
          <p className="mt-1 text-lg font-semibold text-slate-200">{MOCK_CURRENCY}</p>
        </div>
      </div>

      <div className="rs-card overflow-hidden shadow-rs-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-xs text-slate-500">
                <th className="px-4 py-3 font-medium">Chiusura</th>
                <th className="px-4 py-3 font-medium">Simbolo</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Lotti</th>
                <th className="px-4 py-3 font-medium">Profitto</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_TRADES.map((t) => (
                <tr key={t.ticket} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                  <td className="px-4 py-3 whitespace-nowrap text-slate-300">{formatD(t.closeTime)}</td>
                  <td className="px-4 py-3 font-medium text-slate-200">{t.symbol}</td>
                  <td className="px-4 py-3 capitalize text-slate-300">{t.type}</td>
                  <td className="px-4 py-3 text-slate-400">{t.lots}</td>
                  <td
                    className={`px-4 py-3 font-medium ${t.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {t.profit >= 0 ? "+" : ""}
                    {t.profit.toFixed(2)} {MOCK_CURRENCY}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
