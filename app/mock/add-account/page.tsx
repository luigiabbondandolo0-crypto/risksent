export default function MockAddAccountPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="rs-page-title">Add account</h1>
        <p className="rs-page-sub">
          Flusso collegamento MetaTrader — mock. In produzione colleghi credenziali MetaAPI qui.
        </p>
      </header>
      <section className="rs-card p-6 shadow-rs-soft">
        <p className="text-sm text-slate-400">
          Form placeholder: broker, login, password crittografata, server — disabilitato in anteprima mock.
        </p>
        <button
          type="button"
          disabled
          className="mt-6 rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-slate-500"
        >
          Connect (disabilitato)
        </button>
      </section>
    </div>
  );
}
