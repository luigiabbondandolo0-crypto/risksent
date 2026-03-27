import { MOCK_RULES, MOCK_ALERTS } from "@/lib/mock/siteMockData";

export default function MockRulesPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="rs-page-title">Rules &amp; alerts</h1>
        <p className="rs-page-sub">
          Valori di esempio e alert dimostrativi. In produzione questi dati arrivano dal database e dallo stato live.
        </p>
      </header>

      <section className="rs-card p-5 sm:p-6 shadow-rs-soft">
        <h2 className="text-base font-semibold text-slate-100">Regole</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(
            [
              ["Perdita giornaliera max", `${MOCK_RULES.daily_loss_pct}%`],
              ["Rischio per trade", `${MOCK_RULES.max_risk_per_trade_pct}%`],
              ["Esposizione max", `${MOCK_RULES.max_exposure_pct}%`],
              ["Soglia revenge (trade)", String(MOCK_RULES.revenge_threshold_trades)],
            ] as const
          ).map(([label, val]) => (
            <div key={label} className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/40 px-4 py-3">
              <span className="text-sm text-slate-400">{label}</span>
              <span className="text-lg font-semibold text-white">{val}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-500">
          Telegram: in mock risulta &quot;non collegato&quot;. Nella app reale configuri il chat ID dalla stessa pagina.
        </p>
      </section>

      <section className="rs-card p-5 sm:p-6 shadow-rs-soft">
        <h2 className="text-base font-semibold text-slate-100">Alert recenti</h2>
        <ul className="mt-4 space-y-3">
          {MOCK_ALERTS.map((a) => (
            <li
              key={a.id}
              className={`rounded-xl border p-4 ${
                a.severity === "high" ? "border-red-500/35 bg-red-500/10" : "border-amber-500/35 bg-amber-500/10"
              }`}
            >
              <p className="text-sm font-medium text-slate-200">{a.message}</p>
              <p className="mt-1 text-xs text-slate-400">{a.solution}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
