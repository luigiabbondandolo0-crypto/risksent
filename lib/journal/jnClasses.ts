/** Journaling module — matches backtesting glass / RiskSent tokens */
export const jn = {
  page: "relative min-h-0 text-slate-800",
  card:
    "relative overflow-hidden rounded-2xl border border-[rgba(99,102,241,0.2)] bg-white p-5 shadow-[0_0_24px_rgba(99,102,241,0.08)] backdrop-blur-xl",
  cardSm:
    "relative overflow-hidden rounded-xl border border-[rgba(99,102,241,0.18)] bg-white p-4 shadow-[0_0_20px_rgba(99,102,241,0.07)] backdrop-blur-xl",
  h1: "font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl",
  sub: "mt-1 text-sm text-slate-500 font-mono",
  label:
    "mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-500 font-mono",
  input:
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none ring-[#6366f1]/0 transition focus:border-[#6366f1]/40 focus:ring-2 focus:ring-[#6366f1]/20 font-mono",
  btnPrimary:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f46e5] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#6366f1]/20 transition hover:opacity-95",
  btnGhost:
    "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200",
  mono: "font-mono",
  accentRed: "#dc2626",
  green: "#16a34a",
  orange: "#ff8c00"
} as const;
