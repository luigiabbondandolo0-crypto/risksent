/** Shared Tailwind / inline styles for backtesting module */
export const bt = {
  page: "min-h-0 text-slate-100",
  card:
    "rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 shadow-xl",
  h1: "font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight text-white sm:text-3xl",
  sub: "mt-1 text-sm text-slate-500 font-[family-name:var(--font-mono)]",
  label: "mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-500 font-[family-name:var(--font-mono)]",
  input:
    "w-full rounded-xl border border-white/[0.08] bg-[#0c0c0e] px-3 py-2.5 text-sm text-slate-100 outline-none ring-[#ff3c3c]/0 transition focus:border-[#ff3c3c]/40 focus:ring-2 focus:ring-[#ff3c3c]/20 font-[family-name:var(--font-mono)]",
  btnPrimary:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff3c3c] to-[#c92a2a] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#ff3c3c]/20 transition hover:opacity-95",
  btnGhost:
    "inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.06]"
} as const;
