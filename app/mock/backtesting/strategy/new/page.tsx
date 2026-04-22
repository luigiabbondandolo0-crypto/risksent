export default function ComingSoon() {
  return (
    <div className="relative flex h-[60vh] items-center justify-center">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -top-32 left-1/4 h-80 w-80 rounded-full opacity-[0.06] blur-3xl"
          style={{ background: "radial-gradient(circle, #6366f1, transparent)" }}
        />
        <div
          className="absolute bottom-0 right-0 h-64 w-64 rounded-full opacity-[0.04] blur-3xl"
          style={{ background: "radial-gradient(circle, #38bdf8, transparent)" }}
        />
      </div>
      <div
        className="relative z-10 rounded-2xl border px-8 py-10 backdrop-blur-xl"
        style={{
          background: "rgba(99,102,241,0.04)",
          borderColor: "rgba(99,102,241,0.2)",
          boxShadow: "0 0 24px rgba(99,102,241,0.08)",
        }}
      >
        <div
          className="pointer-events-none absolute right-0 top-0 h-20 w-20 rounded-full opacity-20 blur-2xl"
          style={{ background: "radial-gradient(circle, #6366f1, transparent)" }}
        />
        <p className="relative z-10 text-center font-mono text-sm text-slate-400">Backtesting — coming soon</p>
      </div>
    </div>
  );
}
