export default function MockProfilePage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="rs-page-title">Profile</h1>
        <p className="rs-page-sub">
          Same sidebar item as live. In mock: demo data, no saving.
        </p>
      </header>
      <section className="rs-card p-5 sm:p-6 shadow-rs-soft">
        <h2 className="text-base font-semibold text-slate-100">Account</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Name</dt>
            <dd className="mt-1 text-slate-200">Demo Trader</dd>
          </div>
          <div>
            <dt className="text-slate-500">Email</dt>
            <dd className="mt-1 text-slate-200">demo@risksent.mock</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
