"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Mail, RefreshCw, RotateCcw, Send, Timer, Users } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "@/lib/toast";

type ReminderRow = {
  user_id: string;
  email: string | null;
  name: string | null;
  plan: string | null;
  status: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_started_at: string | null;
  trial_reminder_sent_at: string | null;
  hours_left: number | null;
  days_left_ceil: number | null;
  trialing: boolean;
  expired: boolean;
  reminder_sent: boolean;
};

type ApiResponse = {
  rows?: ReminderRow[];
  now?: string;
  error?: string;
};

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function humanCountdown(hours: number | null): string {
  if (hours === null) return "—";
  if (hours <= 0) return "expired";
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  const rem = hours % 24;
  return rem === 0 ? `${days}d` : `${days}d ${rem}h`;
}

export default function AdminTrialRemindersPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<ReminderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/check-role")
      .then((r) => r.json())
      .then((d: { isAdmin: boolean }) => {
        if (!d.isAdmin) {
          setIsAdmin(false);
          router.push("/app/dashboard");
          return;
        }
        setIsAdmin(true);
      })
      .catch(() => setIsAdmin(false));
  }, [router]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/trial-reminders", { credentials: "same-origin" });
      const data: ApiResponse = await res.json();
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`);
        setRows([]);
      } else {
        setRows(data.rows ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin === true) void refresh();
  }, [isAdmin, refresh]);

  const runAction = useCallback(
    async (userId: string, action: "send" | "reset") => {
      setPending((p) => ({ ...p, [userId]: true }));
      try {
        const res = await fetch("/api/admin/trial-reminders", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, action }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(
            action === "send" ? "Could not send reminder" : "Could not reset flag",
            data.error || `HTTP ${res.status}`
          );
        } else {
          toast.success(
            action === "send" ? "Reminder sent" : "Flag reset",
            action === "send"
              ? `Email delivered (${data.daysLeft ?? "?"} days left).`
              : "Cron will pick this user up on the next run."
          );
          await refresh();
        }
      } finally {
        setPending((p) => {
          const next = { ...p };
          delete next[userId];
          return next;
        });
      }
    },
    [refresh]
  );

  const grouped = useMemo(() => {
    const active = rows.filter((r) => r.trialing);
    const sent = rows.filter((r) => !r.trialing && r.reminder_sent);
    return { active, sent };
  }, [rows]);

  if (isAdmin === null) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="font-mono text-sm text-slate-500">Loading…</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
        <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-amber-400" />
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-amber-200">
            Access denied
          </h2>
          <p className="mt-1 text-sm text-slate-400">This page is only for administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-16">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-2xl font-bold text-white">
            <Mail className="h-6 w-6 text-orange-400" />
            Trial reminders
          </h1>
          <p className="mt-1 max-w-xl text-sm font-mono text-slate-500">
            Active trials and the reminder-email pipeline. The daily cron runs at 09:00 UTC;
            you can force a send or reset the flag manually below.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:border-cyan-500/40 hover:bg-cyan-500/10"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </header>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
          <p className="font-mono text-sm text-red-200">{error}</p>
        </div>
      )}

      {/* Counters */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Users className="h-4 w-4 text-indigo-300" />}
          label="Active trials"
          value={grouped.active.length}
          hint="plan=trial, currently"
        />
        <StatCard
          icon={<Timer className="h-4 w-4 text-amber-300" />}
          label="≤ 48h from expiry"
          value={grouped.active.filter((r) => (r.hours_left ?? 9e9) <= 48).length}
          hint="cron will pick these"
        />
        <StatCard
          icon={<Send className="h-4 w-4 text-emerald-300" />}
          label="Already reminded"
          value={grouped.active.filter((r) => r.reminder_sent).length}
          hint="flag set"
        />
        <StatCard
          icon={<Mail className="h-4 w-4 text-slate-300" />}
          label="Past 30d reminders"
          value={grouped.sent.length}
          hint="trial now ended"
        />
      </section>

      <ReminderTable
        title="Active trials"
        rows={grouped.active}
        pending={pending}
        onAction={runAction}
        emptyText={loading ? "Loading…" : "No active trials right now."}
      />

      <ReminderTable
        title="Recently reminded (trial ended)"
        rows={grouped.sent}
        pending={pending}
        onAction={runAction}
        emptyText="No reminders sent in the last 30 days."
        showSendButton={false}
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"
    >
      <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-slate-500">
        {icon}
        {label}
      </div>
      <div className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold text-white">
        {value}
      </div>
      <div className="mt-1 text-[11px] font-mono text-slate-600">{hint}</div>
    </motion.div>
  );
}

function ReminderTable({
  title,
  rows,
  pending,
  onAction,
  emptyText,
  showSendButton = true,
}: {
  title: string;
  rows: ReminderRow[];
  pending: Record<string, boolean>;
  onAction: (userId: string, action: "send" | "reset") => void;
  emptyText: string;
  showSendButton?: boolean;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-white">
        {title}
      </h2>
      <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/[0.06] bg-white/[0.02]">
              <tr className="text-[11px] font-mono uppercase tracking-widest text-slate-500">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Ends</th>
                <th className="px-4 py-3">Time left</th>
                <th className="px-4 py-3">Reminder</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center font-mono text-sm text-slate-600">
                    {emptyText}
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const busy = pending[r.user_id];
                  return (
                    <tr key={r.user_id} className="border-b border-white/[0.04] last:border-none">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{r.email ?? "—"}</div>
                        <div className="mt-0.5 font-mono text-[11px] text-slate-500">
                          {r.name ?? r.user_id.slice(0, 8) + "…"}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-300">
                        {formatWhen(r.current_period_end)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[11px] ${
                            (r.hours_left ?? 0) <= 0
                              ? "border-red-500/30 bg-red-500/10 text-red-300"
                              : (r.hours_left ?? 0) <= 48
                              ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
                              : "border-white/10 bg-white/[0.03] text-slate-300"
                          }`}
                        >
                          {humanCountdown(r.hours_left)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {r.reminder_sent ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] text-emerald-300">
                            Sent {formatWhen(r.trial_reminder_sent_at)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 font-mono text-[11px] text-slate-400">
                            pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {showSendButton && (
                            <button
                              type="button"
                              onClick={() => onAction(r.user_id, "send")}
                              disabled={busy || !r.trialing}
                              title={!r.trialing ? "User is no longer trialing" : "Send the trial-ending email now"}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-orange-500/40 hover:bg-orange-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Send className="h-3.5 w-3.5" />
                              {busy ? "…" : "Send now"}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onAction(r.user_id, "reset")}
                            disabled={busy || !r.reminder_sent}
                            title={
                              !r.reminder_sent
                                ? "No reminder flag to reset"
                                : "Clear trial_reminder_sent_at so the cron picks this user up again"
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-cyan-500/40 hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Reset
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
