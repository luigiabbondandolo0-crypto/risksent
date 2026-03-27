export default function MockLiveMonitoringPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="rs-page-title">Live monitoring</h1>
        <p className="rs-page-sub">
          Stessa area della live: stato connessione MetaAPI, closed/open orders, riepilogo risk check — dati finti.
        </p>
      </header>
      <section className="rs-card p-5 shadow-rs-soft">
        <h2 className="text-sm font-semibold text-slate-200">Connection snapshot</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-400">
          <li>AccountSummary: OK (mock)</li>
          <li>ClosedOrders: 127 (mock)</li>
          <li>OpenedOrders: 2 posizioni (mock)</li>
        </ul>
      </section>
    </div>
  );
}
