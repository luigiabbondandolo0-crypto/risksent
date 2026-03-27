export default function MockSimulatorPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="rs-page-title">Challenge simulator</h1>
        <p className="rs-page-sub">
          Anteprima statica delle metriche tipo FTMO / Simplified. La versione reale calcola sui tuoi trade.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rs-card p-5 shadow-rs-soft">
          <h2 className="text-sm font-semibold text-slate-200">FTMO — 2 step (fase 1)</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            <li className="flex justify-between">
              <span>Profitto vs target</span>
              <span className="font-medium text-emerald-400">+6.2% / 10%</span>
            </li>
            <li className="flex justify-between">
              <span>Max daily loss</span>
              <span className="text-slate-300">-2.1% (limite -5%)</span>
            </li>
            <li className="flex justify-between">
              <span>Drawdown</span>
              <span className="text-slate-300">4.8% (limite 10%)</span>
            </li>
          </ul>
        </section>
        <section className="rs-card p-5 shadow-rs-soft">
          <h2 className="text-sm font-semibold text-slate-200">Probabilità (mock)</h2>
          <p className="mt-3 text-3xl font-bold text-cyan-300">62%</p>
          <p className="mt-1 text-xs text-slate-500">Stima illustrativa, non predittiva.</p>
        </section>
      </div>

      <section className="rs-card p-5 shadow-rs-soft">
        <h2 className="text-sm font-semibold text-slate-200">What-if sliders</h2>
        <p className="mt-2 text-sm text-slate-500">
          Nella build reale modifichi R:R, frequenza e sizing per vedere curve proiettate. Qui è solo placeholder.
        </p>
        <div className="mt-4 h-32 rounded-xl border border-dashed border-slate-700 bg-slate-950/40" />
      </section>
    </div>
  );
}
