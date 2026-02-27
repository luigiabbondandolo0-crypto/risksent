export default function RulesPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-50">Risk rules</h1>
        <p className="text-xs text-slate-500 mt-1">
          Mock configuration for daily loss, max risk per trade, exposure and
          revenge trading filters. Alerts are mocked below.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-[3fr,2fr]">
        <div className="rounded-lg border border-slate-800 bg-surface p-4 space-y-4">
          <h2 className="text-xs font-medium text-slate-300">
            Risk rule settings (mock form)
          </h2>
          <div className="grid gap-3 text-xs md:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-slate-400" htmlFor="dailyLoss">
                Daily loss limit (%)
              </label>
              <input
                id="dailyLoss"
                type="number"
                defaultValue={5}
                className="w-full rounded-md border border-slate-800 bg-black/40 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-emerald-500"
                readOnly
              />
            </div>
            <div className="space-y-1">
              <label className="block text-slate-400" htmlFor="maxRisk">
                Max risk per trade (%)
              </label>
              <input
                id="maxRisk"
                type="number"
                defaultValue={1}
                className="w-full rounded-md border border-slate-800 bg-black/40 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-emerald-500"
                readOnly
              />
            </div>
            <div className="space-y-1">
              <label className="block text-slate-400" htmlFor="maxExposure">
                Max exposure (%)
              </label>
              <input
                id="maxExposure"
                type="number"
                defaultValue={6}
                className="w-full rounded-md border border-slate-800 bg-black/40 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-emerald-500"
                readOnly
              />
            </div>
            <div className="space-y-1">
              <label className="block text-slate-400" htmlFor="revenge">
                Revenge threshold (consecutive losses)
              </label>
              <input
                id="revenge"
                type="number"
                defaultValue={3}
                className="w-full rounded-md border border-slate-800 bg-black/40 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-emerald-500"
                readOnly
              />
            </div>
          </div>

          <button
            type="button"
            disabled
            className="inline-flex items-center rounded-md bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-300 border border-emerald-500/40 cursor-not-allowed"
          >
            Save to Supabase (coming next)
          </button>

          <p className="text-[11px] text-slate-500">
            These values will be stored per user in the `app_user` table in
            Supabase. Alerts and AI coach will read from here.
          </p>
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border border-slate-800 bg-surface p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-medium text-slate-300">
                Alerts center (mock)
              </h2>
              <span className="text-[10px] text-slate-500">
                Medium / High severity
              </span>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2">
                <div className="text-amber-300 font-medium">
                  Medium – Daily loss pressure
                </div>
                <p className="text-amber-100/80 mt-1">
                  You reached 3.8% loss today (limit 5%). Consider pausing after
                  the next losing trade.
                </p>
                <p className="mt-1 text-amber-100/70">
                  Suggested action: hard-stop trading at -4.5% for the day.
                </p>
              </div>
              <div className="rounded-md border border-danger/40 bg-danger/10 p-2">
                <div className="text-danger font-medium">
                  High – Max exposure breach
                </div>
                <p className="text-red-100/80 mt-1">
                  You opened 7 trades with total risk &gt; 8% (limit 6%).
                </p>
                <p className="mt-1 text-red-100/70">
                  Suggested action: close lowest-quality setups and reduce size
                  next sessions.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-surface p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-medium text-slate-300">
                Telegram live alerts
              </h2>
              <span className="text-[10px] text-slate-500">Mock toggle</span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-slate-500 max-w-xs">
                Send breaches to a private Telegram chat via webhook.
              </p>
              <button
                type="button"
                disabled
                className="inline-flex items-center rounded-full bg-slate-900 px-1 py-0.5 border border-slate-700 cursor-not-allowed text-[10px] text-slate-400"
              >
                <span className="inline-flex h-4 w-8 items-center rounded-full bg-slate-800 mr-1">
                  <span className="h-3 w-3 rounded-full bg-slate-500 translate-x-1" />
                </span>
                Connect bot (soon)
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

