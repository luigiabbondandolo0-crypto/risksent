"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, Pencil, Plus } from "lucide-react";
import { ACCOUNT_DELETE_CONFIRM_PHRASE } from "@/lib/accountDeleteConstants";

const TZ_OPTIONS = [
  "UTC",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Asia/Dubai",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
];

const CURRENCIES = ["USD", "EUR", "GBP"] as const;

const MOCK_PROFILE = {
  email: "demo@risksent.mock",
  fullName: "Demo Trader",
  phone: "",
  company: "",
  role: "customer",
  createdAt: "2025-06-01",
  preferenceTimezone: "Europe/London",
  preferenceCurrency: "USD",
};

const MOCK_ACCOUNTS = [
  { id: "m1", nickname: "FTMO Demo", platform: "mt5", broker_server: "FTMO-Demo", status: "active" as const },
  { id: "m2", nickname: "IC Markets Live", platform: "mt4", broker_server: "ICMarkets-Live07", status: "active" as const },
];

function initials(name: string, email: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length >= 2) return (p[0]![0] + p[1]![0]).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return "RS";
}

const inputClass =
  "w-full rounded-lg border border-white/[0.1] bg-[#0e0e12] px-3 py-2.5 text-sm text-slate-100 outline-none transition-colors focus:border-[#6366f1] font-[family-name:var(--font-mono)]";

const glassCard = "rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 backdrop-blur-sm";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function MockProfilePage() {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState("");
  const [demoDeleteDone, setDemoDeleteDone] = useState(false);

  const ini = initials(MOCK_PROFILE.fullName, MOCK_PROFILE.email);
  const memberSince = new Date(MOCK_PROFILE.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-16">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div
          className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full text-xl font-bold text-white shadow-[0_0_40px_rgba(99,102,241,0.25)]"
          style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
        >
          {ini}
          <button
            type="button"
            disabled
            className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-full border border-white/[0.15] bg-[#0e0e12] text-slate-500"
            title="Disabled in demo"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">
          {MOCK_PROFILE.fullName}
        </h1>
        <p className="mt-1 font-[family-name:var(--font-mono)] text-sm text-slate-500">
          {MOCK_PROFILE.email}
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-full border border-white/[0.1] bg-white/[0.05] px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wide text-slate-400">
            {MOCK_PROFILE.role}
          </span>
          <span className="text-xs font-mono text-slate-500">Member since {memberSince}</span>
        </div>
      </motion.header>

      <p className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2 text-xs font-mono text-amber-200">
        Demo mode — form actions are disabled. Sign up to edit your real profile.
      </p>

      <motion.section custom={0} variants={cardVariants} initial="hidden" animate="show" className={glassCard}>
        <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg font-semibold text-white">
          Personal info
        </h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-mono text-slate-500">Full name</label>
            <input value={MOCK_PROFILE.fullName} disabled className={`${inputClass} opacity-60`} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-mono text-slate-500">Email</label>
            <input value={MOCK_PROFILE.email} disabled className={`${inputClass} opacity-60`} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-mono text-slate-500">Phone (optional)</label>
            <input value={MOCK_PROFILE.phone} disabled className={`${inputClass} opacity-60`} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-mono text-slate-500">Company (optional)</label>
            <input value={MOCK_PROFILE.company} disabled className={`${inputClass} opacity-60`} />
          </div>
        </div>
      </motion.section>

      <motion.section custom={1} variants={cardVariants} initial="hidden" animate="show" className={glassCard}>
        <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg font-semibold text-white">
          Preferences
        </h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-mono text-slate-500">Timezone</label>
            <select value={MOCK_PROFILE.preferenceTimezone} disabled className={`${inputClass} opacity-60`}>
              {TZ_OPTIONS.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-mono text-slate-500">Currency display</label>
            <select value={MOCK_PROFILE.preferenceCurrency} disabled className={`${inputClass} opacity-60`}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-mono text-slate-500">Language</label>
            <input disabled value="English" className={`${inputClass} opacity-60`} />
          </div>
        </div>
      </motion.section>

      <motion.section custom={2} variants={cardVariants} initial="hidden" animate="show" className={glassCard}>
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-white">
            Connected accounts
          </h2>
          <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs font-mono text-slate-500">
            <Plus className="h-3.5 w-3.5" />
            Add account
          </span>
        </div>
        <ul className="space-y-3">
          {MOCK_ACCOUNTS.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-black/20 px-3 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-100">{a.nickname}</p>
                <p className="truncate text-xs font-mono text-slate-500">{a.broker_server}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="rounded border border-white/[0.1] px-1.5 py-0.5 text-[10px] font-mono uppercase text-slate-400">
                    {a.platform}
                  </span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      a.status === "active"
                        ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                        : "bg-slate-500"
                    }`}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </motion.section>

      <motion.section
        custom={3}
        variants={cardVariants}
        initial="hidden"
        animate="show"
        className={`${glassCard} border-red-500/20 bg-red-500/[0.03]`}
      >
        <p className="mb-2 text-[11px] font-mono uppercase tracking-[0.12em] text-slate-500">Irreversible</p>
        <h2 className="mb-2 flex items-center gap-2 font-[family-name:var(--font-display)] text-lg font-semibold text-red-400">
          <AlertTriangle className="h-5 w-5" />
          Danger zone
        </h2>
        <p className="mb-4 text-xs font-mono text-slate-500">
          On the real profile this cancels Stripe, removes broker accounts from MetaApi, then deletes your login. Demo
          only — nothing is removed here.
        </p>
        <button
          type="button"
          onClick={() => {
            setDeletePhrase("");
            setDemoDeleteDone(false);
            setDeleteOpen(true);
          }}
          className="rounded-xl border border-red-500/40 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-500/10"
        >
          Delete account
        </button>
      </motion.section>

      <p className="text-center text-xs font-mono text-slate-600">
        <Link href="/mock/dashboard" className="text-slate-400 hover:text-white">
          ← Back to dashboard
        </Link>
      </p>

      {deleteOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#0c0c0e] p-6"
          >
            {!demoDeleteDone ? (
              <>
                <p className="text-sm font-semibold text-red-300">Delete your RiskSent account?</p>
                <p className="mt-2 text-sm text-slate-400">
                  Type{" "}
                  <span className="font-mono text-slate-200">{ACCOUNT_DELETE_CONFIRM_PHRASE}</span> below — same flow as
                  the live app.
                </p>
                <input
                  type="text"
                  value={deletePhrase}
                  onChange={(e) => setDeletePhrase(e.target.value)}
                  autoComplete="off"
                  placeholder={ACCOUNT_DELETE_CONFIRM_PHRASE}
                  className="mt-4 w-full rounded-xl border border-white/[0.12] bg-[#0e0e12] px-3 py-2.5 font-mono text-sm text-slate-100 outline-none focus:border-red-500/40"
                />
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-row-reverse">
                  <button
                    type="button"
                    disabled={deletePhrase !== ACCOUNT_DELETE_CONFIRM_PHRASE}
                    onClick={() => setDemoDeleteDone(true)}
                    className="rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-40"
                  >
                    Permanently delete
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteOpen(false);
                      setDeletePhrase("");
                    }}
                    className="rounded-xl bg-white/[0.08] py-2.5 text-sm text-white hover:bg-white/[0.12]"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-amber-200">Demo mode</p>
                <p className="mt-2 text-sm text-slate-400">
                  No data was deleted. With a real account we would cancel billing, remove MetaApi broker connections, and
                  delete your user — then email you a confirmation.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteOpen(false);
                    setDeletePhrase("");
                    setDemoDeleteDone(false);
                  }}
                  className="mt-4 w-full rounded-xl bg-white/[0.08] py-2.5 text-sm text-white hover:bg-white/[0.12]"
                >
                  Close
                </button>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
