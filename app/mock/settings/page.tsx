import Link from "next/link";

export default function MockSettingsPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6 py-4">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">
        Settings
      </h1>
      <p className="text-sm font-[family-name:var(--font-mono)] text-slate-500">
        Demo mode — preferences and profile in one place. Journal-specific options are under Journaling.
      </p>
      <div className="space-y-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
        <Link
          href="/mock/profile"
          className="block rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3 text-sm font-medium text-slate-200 transition-colors hover:border-[#6366f1]/40 hover:text-white"
        >
          Profile & preferences →
        </Link>
        <Link
          href="/mock/journaling/settings"
          className="block rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3 text-sm font-medium text-slate-200 transition-colors hover:border-[#6366f1]/40 hover:text-white"
        >
          Journal settings →
        </Link>
      </div>
    </div>
  );
}
