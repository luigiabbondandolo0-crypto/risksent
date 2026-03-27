export default function MockAdminPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="rs-page-title">Admin</h1>
        <p className="rs-page-sub">
          Area amministrativa — mock. In produzione richiede ruolo admin.
        </p>
      </header>
      <section className="rs-card p-5 shadow-rs-soft">
        <p className="text-sm text-slate-400">Statistiche utenti e sistema: placeholder statico.</p>
      </section>
    </div>
  );
}
