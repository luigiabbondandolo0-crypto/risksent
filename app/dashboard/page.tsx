export default function DashboardPage() {
  // Mock data – DB wiring will come next
  const mockStats = {
    equity: "+3.4%",
    winRate: "54%",
    maxDD: "-4.2%",
    avgRR: "1.85R",
    dailyDD: "2.1%"
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-50">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Mock equity curve and risk metrics. Data wiring to Supabase and
            MetaApi comes next.
          </p>
        </div>
        <select className="rounded-md border border-slate-800 bg-black/40 px-3 py-1.5 text-xs text-slate-200">
          <option>All accounts</option>
          <option>FTMO-MT5-001 (demo)</option>
        </select>
      </header>

      <section className="grid gap-4 md:grid-cols-4 text-xs">
        <div className="rounded-lg border border-slate-800 bg-surface p-4">
          <div className="text-slate-400 mb-1">Equity change</div>
          <div className="text-emerald-400 text-lg font-semibold">
            {mockStats.equity}
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Since account inception. Equity curve below is a mock placeholder.
          </p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-surface p-4">
          <div className="text-slate-400 mb-1">Win rate</div>
          <div className="text-slate-100 text-lg font-semibold">
            {mockStats.winRate}
          </div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-surface p-4">
          <div className="text-slate-400 mb-1">Max drawdown</div>
          <div className="text-danger text-lg font-semibold">
            {mockStats.maxDD}
          </div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-surface p-4">
          <div className="text-slate-400 mb-1">Avg R:R</div>
          <div className="text-slate-100 text-lg font-semibold">
            {mockStats.avgRR}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-[2fr,1fr]">
        <div className="rounded-lg border border-slate-800 bg-surface p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-slate-400">Equity curve</div>
            <span className="text-[11px] text-slate-600">
              Chart.js placeholder
            </span>
          </div>
          <div className="h-40 rounded-md border border-dashed border-slate-700/80 bg-gradient-to-b from-slate-900/60 to-black/40 flex items-center justify-center text-[11px] text-slate-600">
            Minimal equity line chart will render here once data is wired.
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-lg border border-slate-800 bg-surface p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-slate-400">Daily DD gauge</div>
              <span className="text-[11px] text-slate-500">Today</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full border-2 border-emerald-500/70 flex items-center justify-center text-xs text-emerald-400">
                {mockStats.dailyDD}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Green while daily loss &lt; rule. Turns red when breach detected
                and triggers an alert.
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-surface p-4">
            <div className="text-xs text-slate-400 mb-2">
              Current risk rules (read-only)
            </div>
            <ul className="space-y-1 text-[11px] text-slate-500">
              <li>Daily loss: 5%</li>
              <li>Max risk per trade: 1%</li>
              <li>Max exposure: 5 positions / 6% total</li>
              <li>Revenge threshold: 3 consecutive losses</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

