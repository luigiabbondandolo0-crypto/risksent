import Link from "next/link";

export default function AppSettingsPage() {
  return (
    <div className="relative mx-auto max-w-lg space-y-6 py-4">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -top-40 left-1/4 h-96 w-96 rounded-full opacity-[0.06] blur-3xl"
          style={{ background: "radial-gradient(circle, #6366f1, transparent)" }}
        />
        <div
          className="absolute top-1/3 right-0 h-72 w-72 rounded-full opacity-[0.04] blur-3xl"
          style={{ background: "radial-gradient(circle, #38bdf8, transparent)" }}
        />
        <div
          className="absolute bottom-1/4 left-0 h-64 w-64 rounded-full opacity-[0.04] blur-3xl"
          style={{ background: "radial-gradient(circle, #4ade80, transparent)" }}
        />
      </div>
      <div>
        <p className="mb-2 text-[11px] font-mono uppercase tracking-[0.12em] text-slate-500">App</p>
        <h1
          className="font-[family-name:var(--font-display)] text-2xl font-bold"
          style={{
            background: "linear-gradient(135deg, #e0e7ff 0%, #a78bfa 50%, #6366f1 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Settings
        </h1>
        <p className="mt-1 text-sm font-[family-name:var(--font-mono)] text-slate-500">
          Preferences and profile live in one place. Journal-specific options are under Journaling.
        </p>
      </div>
      <div
        className="relative overflow-hidden space-y-3 rounded-2xl border p-5 backdrop-blur-xl"
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
        <div className="relative z-10 space-y-3">
          <Link
            href="/profile"
            className="block rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3 text-sm font-medium text-slate-200 transition-colors hover:border-[#6366f1]/40 hover:text-white"
          >
            Profile & preferences →
          </Link>
          <Link
            href="/app/journaling/settings"
            className="block rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3 text-sm font-medium text-slate-200 transition-colors hover:border-[#6366f1]/40 hover:text-white"
          >
            Journal settings →
          </Link>
        </div>
      </div>
    </div>
  );
}
