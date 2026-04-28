"use client";

import { useCallback, useEffect, useMemo, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, Pencil, Trash2, Plus } from "lucide-react";
import { authFetch } from "@/lib/api/authFetch";
import { ACCOUNT_DELETE_CONFIRM_PHRASE } from "@/lib/accountDeleteConstants";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { AddAccountModal } from "@/components/journal/AddAccountModal";
import type { JournalAccountPublic } from "@/lib/journal/journalTypes";

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
  "Australia/Sydney"
];

const CURRENCIES = ["USD", "EUR", "GBP"] as const;

function passwordStrength(pw: string): "weak" | "fair" | "strong" {
  if (pw.length < 6) return "weak";
  const hasNum = /\d/.test(pw);
  const hasSpecial = /[^a-zA-Z0-9]/.test(pw);
  const long = pw.length >= 10;
  if (long && hasNum && hasSpecial) return "strong";
  if (pw.length >= 8 && (hasNum || hasSpecial)) return "fair";
  return "weak";
}

function initials(name: string, email: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length >= 2) return (p[0]![0] + p[1]![0]).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return "RS";
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }
  })
};

type ProfileData = {
  email: string;
  fullName: string;
  phone: string;
  company: string;
  role: string;
  createdAt: string;
  preferenceTimezone: string;
  preferenceCurrency: string;
};

const inputClass =
  "w-full rounded-lg border border-white/[0.1] bg-[#0e0e12] px-3 py-2.5 text-sm text-slate-100 outline-none transition-colors focus:border-[#6366f1] font-[family-name:var(--font-mono)]";

const glassCard =
  "relative overflow-hidden rounded-2xl border p-6 backdrop-blur-xl";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefSaving, setPrefSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData>({
    email: "",
    fullName: "",
    phone: "",
    company: "",
    role: "customer",
    createdAt: "",
    preferenceTimezone: "UTC",
    preferenceCurrency: "USD"
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordInfo, setPasswordInfo] = useState<string | null>(null);
  const [journalAccounts, setJournalAccounts] = useState<JournalAccountPublic[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState("");
  const [accountDeleteBusy, setAccountDeleteBusy] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  const loadJournal = useCallback(async () => {
    try {
      const res = await fetch("/api/journal/accounts");
      if (!res.ok) return;
      const j = await res.json();
      setJournalAccounts((j.accounts ?? []) as JournalAccountPublic[]);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        if (res.status === 401) {
          router.push("/login?redirectedFrom=/app/profile");
          return;
        }
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to load profile");
          setLoading(false);
          return;
        }
        const data = await res.json();
        setProfile({
          email: data.email ?? "",
          fullName: data.fullName ?? "",
          phone: data.phone ?? "",
          company: data.company ?? "",
          role: data.role ?? "customer",
          createdAt: data.createdAt ?? "",
          preferenceTimezone: data.preferenceTimezone ?? "UTC",
          preferenceCurrency: data.preferenceCurrency ?? "USD"
        });
        setLoading(false);
        void loadJournal();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load profile");
        setLoading(false);
      }
    };
    void loadProfile();
  }, [router, loadJournal]);

  const strength = useMemo(() => passwordStrength(newPassword), [newPassword]);

  const handlePersonal = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: profile.fullName,
          phone: profile.phone,
          company: profile.company
        })
      });
      if (res.status === 401) {
        router.push("/login?redirectedFrom=/app/profile");
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update");
        setSaving(false);
        return;
      }
      setInfo("Saved.");
      setSaving(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
      setSaving(false);
    }
  };

  const handlePrefs = async (e: FormEvent) => {
    e.preventDefault();
    setPrefSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferenceTimezone: profile.preferenceTimezone,
          preferenceCurrency: profile.preferenceCurrency
        })
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save preferences");
      } else {
        const data = (await res.json()) as {
          preferenceTimezone?: string;
          preferenceCurrency?: string;
        };
        setProfile((p) => ({
          ...p,
          preferenceTimezone: data.preferenceTimezone ?? p.preferenceTimezone,
          preferenceCurrency: data.preferenceCurrency ?? p.preferenceCurrency
        }));
        setInfo("Preferences saved.");
      }
    } catch {
      setError("Failed to save preferences");
    }
    setPrefSaving(false);
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordInfo(null);

    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }
    if (!newPassword || newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError("New password must be different from current password.");
      return;
    }

    setPasswordLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: currentPassword
      });

      if (signInError) {
        setPasswordError("Current password is incorrect.");
        setPasswordLoading(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        setPasswordError(updateError.message);
        setPasswordLoading(false);
        return;
      }

      setPasswordInfo("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPasswordError("Unexpected error. Please try again.");
    }
    setPasswordLoading(false);
  };

  const removeJournalAccount = async (id: string) => {
    if (!confirm("Remove this journal account from RiskSent?")) return;
    setDeleteBusy(true);
    try {
      const res = await fetch(`/api/journal/accounts/${id}`, { method: "DELETE" });
      if (res.ok) void loadJournal();
    } finally {
      setDeleteBusy(false);
    }
  };

  const deleteOwnAccount = async () => {
    if (deletePhrase !== ACCOUNT_DELETE_CONFIRM_PHRASE) return;
    setAccountDeleteBusy(true);
    setDeleteAccountError(null);
    try {
      const res = await authFetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: ACCOUNT_DELETE_CONFIRM_PHRASE }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setDeleteAccountError(
          typeof data.error === "string" ? data.error : "Could not delete account."
        );
        return;
      }
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      setDeleteOpen(false);
      router.push("/login?accountDeleted=1");
    } catch {
      setDeleteAccountError("Unexpected error. Try again or contact support.");
    } finally {
      setAccountDeleteBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="font-mono text-sm text-slate-500">Loading profile…</p>
      </div>
    );
  }

  const ini = initials(profile.fullName, profile.email);
  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric"
      })
    : "—";

  return (
    <div className="relative mx-auto max-w-2xl space-y-8 pb-16">
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
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full text-xl font-bold text-white shadow-[0_0_40px_rgba(99,102,241,0.25)]"
          style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}>
          {ini}
          <button
            type="button"
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.15] bg-[#0e0e12] text-slate-400 transition-colors hover:text-white"
            title="Avatar upload coming soon"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          <span
            style={{
              background: "linear-gradient(135deg, #e0e7ff 0%, #a78bfa 50%, #6366f1 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {profile.fullName || "Your profile"}
          </span>
        </h1>
        <p className="mt-1 font-[family-name:var(--font-mono)] text-sm text-slate-500">{profile.email}</p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wide ${
              profile.role === "admin"
                ? "border-amber-500/40 bg-amber-500/15 text-amber-200"
                : "border-white/[0.1] bg-white/[0.05] text-slate-400"
            }`}
          >
            {profile.role}
          </span>
          <span className="text-xs font-mono text-slate-500">Member since {memberSince}</span>
        </div>
      </motion.header>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>
      )}
      {info && !error && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
          {info}
        </p>
      )}

      <motion.form
        custom={0}
        variants={cardVariants}
        initial="hidden"
        animate="show"
        onSubmit={handlePersonal}
        className={glassCard}
        style={{
          background: "rgba(99,102,241,0.04)",
          borderColor: "rgba(99,102,241,0.2)",
          boxShadow: "0 0 24px rgba(99,102,241,0.08)",
        }}
      >
        <div
          className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full opacity-20 blur-2xl"
          style={{ background: "radial-gradient(circle, #6366f1, transparent)" }}
        />
        <div className="relative z-10">
        <p className="mb-2 text-[11px] font-mono uppercase tracking-[0.12em] text-slate-500">Profile</p>
        <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg font-semibold text-white">
          Personal info
        </h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-mono text-slate-500" htmlFor="fullName">
              Full name
            </label>
            <input
              id="fullName"
              value={profile.fullName}
              onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-mono text-slate-500" htmlFor="email">
              Email
            </label>
            <input id="email" type="email" value={profile.email} disabled className={`${inputClass} opacity-50`} />
            <p className="mt-1 text-[10px] font-mono text-slate-600">Email cannot be changed</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-mono text-slate-500" htmlFor="phone">
              Phone (optional)
            </label>
            <input
              id="phone"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-mono text-slate-500" htmlFor="company">
              Company (optional)
            </label>
            <input
              id="company"
              value={profile.company}
              onChange={(e) => setProfile({ ...profile, company: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
        <motion.button
          type="submit"
          disabled={saving}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="mt-6 w-full rounded-xl py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(99,102,241,0.2)] transition-shadow hover:shadow-[0_0_32px_rgba(99,102,241,0.35)] disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
        >
          {saving ? "Saving…" : "Save"}
        </motion.button>
        </div>
      </motion.form>

      <motion.form
        custom={1}
        variants={cardVariants}
        initial="hidden"
        animate="show"
        onSubmit={handleChangePassword}
        className={glassCard}
        style={{
          background: "rgba(167,139,250,0.04)",
          borderColor: "rgba(167,139,250,0.2)",
          boxShadow: "0 0 24px rgba(167,139,250,0.08)",
        }}
      >
        <div
          className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full opacity-20 blur-2xl"
          style={{ background: "radial-gradient(circle, #a78bfa, transparent)" }}
        />
        <div className="relative z-10">
        <p className="mb-2 text-[11px] font-mono uppercase tracking-[0.12em] text-slate-500">Account</p>
        <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg font-semibold text-white">
          Security
        </h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-mono text-slate-500">Current password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClass}
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-mono text-slate-500">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
              autoComplete="new-password"
            />
            {newPassword ? (
              <p
                className={`mt-1 text-[10px] font-mono ${
                  strength === "strong"
                    ? "text-emerald-400"
                    : strength === "fair"
                      ? "text-amber-400"
                      : "text-red-400"
                }`}
              >
                {strength === "strong" ? "Strong" : strength === "fair" ? "Fair" : "Weak"}
              </p>
            ) : null}
          </div>
          <div>
            <label className="mb-1 block text-xs font-mono text-slate-500">Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
              autoComplete="new-password"
            />
          </div>
        </div>
        {passwordError && <p className="mt-3 text-xs text-red-400">{passwordError}</p>}
        {passwordInfo && <p className="mt-3 text-xs text-emerald-400">{passwordInfo}</p>}
        <motion.button
          type="submit"
          disabled={passwordLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="mt-6 w-full rounded-xl border border-white/[0.12] bg-white/[0.04] py-3 text-sm font-semibold text-white hover:bg-white/[0.07] disabled:opacity-50"
        >
          {passwordLoading ? "Updating…" : "Update password"}
        </motion.button>
        </div>
      </motion.form>

      <motion.form
        custom={2}
        variants={cardVariants}
        initial="hidden"
        animate="show"
        onSubmit={handlePrefs}
        className={glassCard}
        style={{
          background: "rgba(56,189,248,0.04)",
          borderColor: "rgba(56,189,248,0.2)",
          boxShadow: "0 0 24px rgba(56,189,248,0.08)",
        }}
      >
        <div
          className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full opacity-20 blur-2xl"
          style={{ background: "radial-gradient(circle, #38bdf8, transparent)" }}
        />
        <div className="relative z-10">
        <p className="mb-2 text-[11px] font-mono uppercase tracking-[0.12em] text-slate-500">Display</p>
        <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg font-semibold text-white">
          Preferences
        </h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-mono text-slate-500">Timezone</label>
            <select
              value={profile.preferenceTimezone}
              onChange={(e) => setProfile({ ...profile, preferenceTimezone: e.target.value })}
              className={inputClass}
            >
              {TZ_OPTIONS.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-mono text-slate-500">Currency display</label>
            <select
              value={profile.preferenceCurrency}
              onChange={(e) => setProfile({ ...profile, preferenceCurrency: e.target.value })}
              className={inputClass}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-mono text-slate-500">Language</label>
            <input disabled value="English" className={`${inputClass} opacity-50`} />
          </div>
        </div>
        <motion.button
          type="submit"
          disabled={prefSaving}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="mt-6 w-full rounded-xl py-3 text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
        >
          {prefSaving ? "Saving…" : "Save preferences"}
        </motion.button>
        </div>
      </motion.form>

      <motion.section
        custom={3}
        variants={cardVariants}
        initial="hidden"
        animate="show"
        className={glassCard}
        style={{
          background: "rgba(56,189,248,0.04)",
          borderColor: "rgba(56,189,248,0.2)",
          boxShadow: "0 0 24px rgba(56,189,248,0.08)",
        }}
      >
        <div
          className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full opacity-20 blur-2xl"
          style={{ background: "radial-gradient(circle, #38bdf8, transparent)" }}
        />
        <div className="relative z-10">
        <p className="mb-2 text-[11px] font-mono uppercase tracking-[0.12em] text-slate-500">Brokers</p>
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-white">
            Connected accounts
          </h2>
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-white/[0.12] bg-white/[0.04] px-3 py-1.5 text-xs font-mono text-indigo-300"
          >
            <Plus className="h-3.5 w-3.5" />
            Add account
          </motion.button>
        </div>
        <ul className="space-y-3">
          {journalAccounts.length === 0 ? (
            <li className="text-sm font-mono text-slate-500">No journal accounts linked.</li>
          ) : (
            journalAccounts.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-black/20 px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-100">{a.nickname}</p>
                  <p className="truncate text-xs font-mono text-slate-500">{a.broker_server}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="rounded border border-white/[0.1] px-1.5 py-0.5 text-[10px] font-mono uppercase text-slate-400">
                      {a.platform}
                    </span>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        a.status === "active" ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-slate-500"
                      }`}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  disabled={deleteBusy}
                  onClick={() => void removeJournalAccount(a.id)}
                  className="shrink-0 rounded-lg border border-red-500/30 p-2 text-red-400 hover:bg-red-500/10"
                  aria-label="Remove account"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))
          )}
        </ul>
        </div>
      </motion.section>

      <motion.section
        custom={4}
        variants={cardVariants}
        initial="hidden"
        animate="show"
        className={glassCard}
        style={{
          background: "rgba(99,102,241,0.03)",
          borderColor: "rgba(99,102,241,0.15)",
          boxShadow: "0 0 20px rgba(99,102,241,0.06)",
        }}
      >
        <div className="relative z-10">
        <p className="mb-2 text-[11px] font-mono uppercase tracking-[0.12em] text-slate-500">Privacy &amp; Data</p>
        <h2 className="mb-2 font-[family-name:var(--font-display)] text-lg font-semibold text-slate-200">
          Download your data
        </h2>
        <p className="mb-4 text-xs font-mono text-slate-500">
          Export all your data (profile, journal, alerts, subscription) as a JSON file. Your right under GDPR Article 20.
        </p>
        <button
          type="button"
          disabled={exportLoading}
          onClick={async () => {
            setExportLoading(true);
            try {
              const res = await fetch("/api/account/export");
              if (!res.ok) { alert("Export failed. Try again."); return; }
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `risksent-data-export-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              URL.revokeObjectURL(url);
            } catch {
              alert("Export failed. Check your connection and try again.");
            } finally {
              setExportLoading(false);
            }
          }}
          className="rounded-xl border border-[#6366f1]/30 px-4 py-2 text-sm font-medium text-indigo-300 hover:bg-[#6366f1]/10 disabled:opacity-50 transition-colors"
        >
          {exportLoading ? "Preparing…" : "Download my data"}
        </button>
        </div>
      </motion.section>

      <motion.section
        custom={5}
        variants={cardVariants}
        initial="hidden"
        animate="show"
        className={glassCard}
        style={{
          background: "rgba(248,113,113,0.04)",
          borderColor: "rgba(248,113,113,0.2)",
          boxShadow: "0 0 24px rgba(248,113,113,0.08)",
        }}
      >
        <div
          className="pointer-events-none absolute right-0 top-0 h-20 w-20 rounded-full opacity-20 blur-2xl"
          style={{ background: "radial-gradient(circle, #f87171, transparent)" }}
        />
        <div className="relative z-10">
        <p className="mb-2 text-[11px] font-mono uppercase tracking-[0.12em] text-slate-500">Irreversible</p>
        <h2 className="mb-2 flex items-center gap-2 font-[family-name:var(--font-display)] text-lg font-semibold text-red-400">
          <AlertTriangle className="h-5 w-5" />
          Danger zone
        </h2>
        <p className="mb-4 text-xs font-mono text-slate-500">
          Cancels your Stripe subscription, removes broker accounts from MetaApi, then deletes your login and data. You
          will receive a confirmation email.
        </p>
        <button
          type="button"
          onClick={() => {
            setDeletePhrase("");
            setDeleteAccountError(null);
            setDeleteOpen(true);
          }}
          className="rounded-xl border border-red-500/40 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-500/10"
        >
          Delete account
        </button>
        </div>
      </motion.section>

      <p className="text-center text-xs font-mono text-slate-600">
        <Link href="/app/dashboard" className="text-slate-400 hover:text-white">
          ← Back to dashboard
        </Link>
      </p>

      <AddAccountModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={() => {
          setAddOpen(false);
          void loadJournal();
        }}
      />

      {deleteOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#0c0c0e] p-6"
          >
            <p className="text-sm font-semibold text-red-300">Delete your RiskSent account?</p>
            <p className="mt-2 text-sm text-slate-400">
              This cannot be undone. Type{" "}
              <span className="font-mono text-slate-200">{ACCOUNT_DELETE_CONFIRM_PHRASE}</span> below to confirm.
            </p>
            <input
              type="text"
              value={deletePhrase}
              onChange={(e) => setDeletePhrase(e.target.value)}
              autoComplete="off"
              placeholder={ACCOUNT_DELETE_CONFIRM_PHRASE}
              className="mt-4 w-full rounded-xl border border-white/[0.12] bg-[#0e0e12] px-3 py-2.5 font-mono text-sm text-slate-100 outline-none focus:border-red-500/40"
            />
            {deleteAccountError ? (
              <p className="mt-2 text-xs text-red-400" role="alert">
                {deleteAccountError}
              </p>
            ) : null}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-row-reverse">
              <button
                type="button"
                disabled={
                  accountDeleteBusy || deletePhrase !== ACCOUNT_DELETE_CONFIRM_PHRASE
                }
                onClick={() => void deleteOwnAccount()}
                className="rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-40"
              >
                {accountDeleteBusy ? "Deleting…" : "Permanently delete"}
              </button>
              <button
                type="button"
                disabled={accountDeleteBusy}
                onClick={() => {
                  setDeleteOpen(false);
                  setDeletePhrase("");
                  setDeleteAccountError(null);
                }}
                className="rounded-xl bg-white/[0.08] py-2.5 text-sm text-white hover:bg-white/[0.12]"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
