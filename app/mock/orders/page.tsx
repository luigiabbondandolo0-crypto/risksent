import {
  MOCK_CURRENCY,
  MOCK_DASHBOARD_STATS,
  MOCK_POSITIONS,
} from "@/lib/mock/siteMockData";

function fmt(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2 }) + " " + MOCK_CURRENCY;
}

export default function MockOrdersPage() {
  const bal = MOCK_DASHBOARD_STATS.balance;
  const eq = MOCK_DASHBOARD_STATS.equity;

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="rs-page-title">Orders</h1>
        <p className="rs-page-sub">Riepilogo conto e posizioni aperte dimostrative. L&apos;invio ordini è disabilitato in mock.</p>
      </header>

      <section className="rs-card overflow-hidden shadow-rs-soft">
        <div className="border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-200">Riepilogo account</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
          <div>
            <p className="rs-kpi-label">Balance</p>
            <p className="mt-1 text-lg font-semibold text-white">{fmt(bal)}</p>
          </div>
          <div>
            <p className="rs-kpi-label">Equity</p>
            <p className="mt-1 text-lg font-semibold text-white">{fmt(eq)}</p>
          </div>
          <div>
            <p className="rs-kpi-label">Valuta</p>
            <p className="mt-1 text-lg font-medium text-slate-300">{MOCK_CURRENCY}</p>
          </div>
          <div>
            <p className="rs-kpi-label">Posizioni</p>
            <p className="mt-1 text-lg font-medium text-slate-300">{MOCK_POSITIONS.length}</p>
          </div>
        </div>
      </section>

      <section className="rs-card overflow-hidden shadow-rs-soft">
        <div className="border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-200">Posizioni aperte</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-2.5 font-medium">Ticket</th>
                <th className="px-4 py-2.5 font-medium">Simbolo</th>
                <th className="px-4 py-2.5 font-medium">Tipo</th>
                <th className="px-4 py-2.5 font-medium text-right">Volume</th>
                <th className="px-4 py-2.5 font-medium text-right">Profitto</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_POSITIONS.map((p) => (
                <tr key={p.ticket} className="border-b border-slate-800/80">
                  <td className="px-4 py-2 text-slate-400">{p.ticket}</td>
                  <td className="px-4 py-2 font-medium text-slate-200">{p.symbol}</td>
                  <td className="px-4 py-2 text-emerald-400">{p.type}</td>
                  <td className="px-4 py-2 text-right text-slate-300">{p.volume}</td>
                  <td
                    className={`px-4 py-2 text-right font-medium ${p.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {fmt(p.profit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rs-card p-5 shadow-rs-soft">
        <h2 className="text-sm font-semibold text-slate-200">Nuovo ordine</h2>
        <p className="mt-2 text-sm text-slate-500">
          Nel mock l&apos;invio è disattivato. Nell&apos;app reale questo modulo è collegato a MetaTrader API.
        </p>
        <button
          type="button"
          disabled
          className="mt-4 rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-slate-500"
        >
          Invia ordine (disabilitato)
        </button>
      </section>
    </div>
  );
}
