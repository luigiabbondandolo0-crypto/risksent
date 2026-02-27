import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-8">
      <section className="mt-10 max-w-xl">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-50">
          Trade risk with{" "}
          <span className="text-emerald-400">brutal clarity</span>.
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          RiskSent is a minimal, dark fintech dashboard for MT4/MT5/cTrader/
          Tradelocker traders. Track equity, risk rules, and alerts in one
          place.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-black shadow-sm hover:bg-emerald-400 transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-500 transition-colors"
          >
            View mock dashboard
          </Link>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-3 text-xs text-slate-400">
        <div className="rounded-lg border border-slate-800 bg-surface p-4">
          <div className="text-slate-300 font-medium mb-1">Risk rules</div>
          Daily loss, max risk per trade, exposure caps and revenge filters.
        </div>
        <div className="rounded-lg border border-slate-800 bg-surface p-4">
          <div className="text-slate-300 font-medium mb-1">Alerts center</div>
          Clean alerts with problem + solution. Telegram toggle (mock).
        </div>
        <div className="rounded-lg border border-slate-800 bg-surface p-4">
          <div className="text-slate-300 font-medium mb-1">Equity overview</div>
          Minimal equity curve, WR %, DD %, and sanity checks per trade.
        </div>
      </section>
    </div>
  );
}

