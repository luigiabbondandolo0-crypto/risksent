export default function TradesPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-50">Trades</h1>
        <p className="text-sm text-slate-500 mt-1">
          Repeating group of trades with Sanity Score. Data wiring coming next.
        </p>
      </header>
      <div className="rounded-xl border border-slate-800 bg-surface p-6 text-center text-slate-500 text-sm">
        No trades yet. Connect an account and sync trades to see data here.
      </div>
    </div>
  );
}
