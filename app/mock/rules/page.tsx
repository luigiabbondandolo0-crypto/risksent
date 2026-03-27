import { Link2 } from "lucide-react";
import { MOCK_RULES, MOCK_ALERTS } from "@/lib/mock/siteMockData";

export default function MockRulesPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="rs-page-title">Rules &amp; alerts</h1>
        <p className="rs-page-sub">
          Stessa struttura della pagina live: regole personali, Telegram, lista alert (dati mock).
        </p>
      </header>

      <section className="rs-card border-cyan-500/25 p-5 sm:p-6 shadow-rs-soft">
        <h2 className="text-base font-semibold text-slate-100">Personal risk rules</h2>
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
      </section>

      <section className="rs-card p-5 sm:p-6 shadow-rs-soft">
        <div className="mb-1 flex items-center gap-2">
          <Link2 className="h-4 w-4 text-cyan-400" />
          <h2 className="text-sm font-medium text-slate-200">Link Telegram</h2>
        </div>
        <p className="text-xs text-slate-500">
          In mock: bot non collegato. Nella app reale generi il link di collegamento e invii /start al bot.
        </p>
        <button type="button" disabled className="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-500">
          Generate link (mock)
        </button>
      </section>

      <section className="rs-card p-5 sm:p-6 shadow-rs-soft">
        <h2 className="text-base font-semibold text-slate-100">Alerts</h2>
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
