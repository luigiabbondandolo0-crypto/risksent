"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertCircle,
  Mail,
  Search,
  Shield,
  TrendingUp,
  Users,
  CreditCard,
  BarChart3,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

type UserRow = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  accountsCount: number;
};

const ROLES = ["customer", "trader", "admin"] as const;
const PAGE_SIZE = 8;

type Stats = {
  users: number;
  tradingAccounts: number;
  trades: number;
};

type HealthPayload = {
  checkedAt: string;
  supabase: { ok: boolean; label: string };
  telegram: { ok: boolean; label: string };
  anthropic: { ok: boolean; label: string };
};

function emailInitials(email: string): string {
  const local = email.split("@")[0] || "?";
  const parts = local.split(/[._-]/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0] + parts[1]![0]).toUpperCase();
  return local.slice(0, 2).toUpperCase();
}

export default function AdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [health, setHealth] = useState<HealthPayload | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?redirectedFrom=/admin");
        return;
      }
      try {
        const res = await fetch("/api/admin/check-role");
        if (res.ok) {
          const data = await res.json();
          if (!data.isAdmin) {
            setForbidden(true);
            setIsAdmin(false);
            return;
          }
          setIsAdmin(true);
        } else {
          setForbidden(true);
          setIsAdmin(false);
        }
      } catch {
        setForbidden(true);
        setIsAdmin(false);
      }
    };
    void checkAdmin();
  }, [router]);

  useEffect(() => {
    if (isAdmin !== true) return;
    (async () => {
      setLoading(true);
      setForbidden(false);
      setServerError(null);
      try {
        const [statsRes, usersRes, healthRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/users"),
          fetch("/api/admin/health")
        ]);
        if (statsRes.status === 403 || usersRes.status === 403) {
          setForbidden(true);
          return;
        }
        if (!statsRes.ok || !usersRes.ok) {
          const failedRes = statsRes.ok ? usersRes : statsRes;
          const body = await failedRes.json().catch(() => ({}));
          setServerError(body?.error ?? `Server error ${failedRes.status}`);
          return;
        }
        const statsData = await statsRes.json();
        const usersData = await usersRes.json();
        setStats(statsData);
        setUsers(usersData.users ?? []);
        if (healthRes.ok) {
          setHealth((await healthRes.json()) as HealthPayload);
        }
      } catch (e) {
        setServerError(e instanceof Error ? e.message : "Request failed");
      } finally {
        setLoading(false);
      }
    })();
  }, [isAdmin]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingRole(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole })
      });
      if (!res.ok) {
        const data = await res.json();
        alert(`Failed: ${data.error || "Unknown"}`);
        return;
      }
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error");
    } finally {
      setUpdatingRole(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q)
    );
  }, [users, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount - 1);
  const slice = filtered.slice(pageSafe * PAGE_SIZE, pageSafe * PAGE_SIZE + PAGE_SIZE);

  const recentActivity = useMemo(() => {
    return [...users]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }, [users]);

  if (isAdmin === null || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="font-mono text-sm text-slate-500">Loading admin…</p>
      </div>
    );
  }

  if (!isAdmin || forbidden) {
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

  if (serverError) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
        <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-400" />
        <div>
          <h2 className="text-lg font-semibold text-red-200">Server error</h2>
          <p className="mt-1 break-all font-mono text-sm text-slate-400">{serverError}</p>
        </div>
      </div>
    );
  }

  const dot = (ok: boolean) => (
    <span className={`h-2 w-2 shrink-0 rounded-full ${ok ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-red-400"}`} />
  );

  return (
    <div className="space-y-10 pb-16">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-2xl font-bold text-white">
            <Shield className="h-7 w-7 text-amber-400" />
            Admin Dashboard
          </h1>
          <p className="mt-1 max-w-xl text-sm font-mono text-slate-500">
            Manage users, platform health, and monitoring.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/trial-reminders"
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:border-orange-500/40 hover:bg-orange-500/10"
          >
            <Mail className="h-4 w-4 text-orange-400" />
            Trial reminders
          </Link>
          <Link
            href="/admin/email-preview"
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:border-indigo-500/40 hover:bg-indigo-500/10"
          >
            <Mail className="h-4 w-4 text-indigo-400" />
            Email preview
          </Link>
          <Link
            href="/admin/live-monitoring"
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:border-cyan-500/40 hover:bg-cyan-500/10"
          >
            <Activity className="h-4 w-4 text-cyan-400" />
            Live Monitoring
          </Link>
        </div>
      </header>

      {stats != null && (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total users",
              value: stats.users,
              icon: Users,
              hint: "+ organic"
            },
            {
              label: "Active MT accounts",
              value: stats.tradingAccounts,
              icon: CreditCard,
              hint: "Linked"
            },
            {
              label: "Trades logged",
              value: stats.trades,
              icon: BarChart3,
              hint: "All time"
            },
            {
              label: "Active subscriptions",
              value: 0,
              icon: Sparkles,
              hint: "Coming soon",
              displayZeroAs: "—" as const
            }
          ].map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"
            >
              <div className="flex items-center gap-2 text-slate-500">
                <c.icon className="h-4 w-4" />
                <span className="text-[10px] font-mono uppercase tracking-wider">{c.label}</span>
              </div>
              <p className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold text-white">
                {"displayZeroAs" in c && c.value === 0 ? c.displayZeroAs : c.value}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs font-mono text-emerald-400/90">
                <TrendingUp className="h-3 w-3" />
                {c.hint}
              </p>
            </motion.div>
          ))}
        </section>
      )}

      {health && (
        <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-white">
            Platform health
          </h2>
          <p className="mt-1 text-xs font-mono text-slate-500">
            Last checked {new Date(health.checkedAt).toLocaleString()}
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              { k: "Supabase", h: health.supabase },
              { k: "Telegram bot", h: health.telegram },
              { k: "Anthropic API", h: health.anthropic }
            ].map(({ k, h: row }) => (
              <li
                key={k}
                className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3"
              >
                <span className="flex items-center gap-2 text-sm text-slate-300">
                  {dot(row.ok)}
                  {k}
                </span>
                <span className="text-xs font-mono text-slate-500">{row.label}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-white">
          Recent activity
        </h2>
        <ul className="mt-4 space-y-3">
          {recentActivity.map((u) => (
            <li
              key={u.id}
              className="flex items-center gap-3 border-b border-white/[0.04] pb-3 text-sm last:border-0"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg,#6366f1,#cc1111)" }}
              >
                {emailInitials(u.email)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-slate-200">{u.email}</p>
                <p className="text-xs text-slate-500">Signed up</p>
              </div>
              <time className="shrink-0 text-xs font-mono text-slate-500">
                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
              </time>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-white">Users</h2>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search email or role…"
              className="w-full min-w-[200px] rounded-xl border border-white/[0.1] bg-[#0e0e12] py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-[#6366f1] sm:w-72"
            />
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-[10px] font-mono uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">MT</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {slice.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-white/[0.04] transition-colors last:border-0 hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ background: "linear-gradient(135deg,#6366f1,#22d3ee)" }}
                      >
                        {emailInitials(u.email)}
                      </span>
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 font-mono text-slate-300">{u.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.role === "admin"
                            ? "bg-amber-500/20 text-amber-300"
                            : u.role === "trader"
                              ? "bg-cyan-500/15 text-cyan-300"
                              : "bg-slate-500/15 text-slate-400"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">{u.accountsCount}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={u.role}
                          onChange={(e) => void handleRoleChange(u.id, e.target.value)}
                          disabled={updatingRole === u.id}
                          className="rounded-lg border border-white/[0.1] bg-[#0e0e12] px-2 py-1 text-xs text-slate-200 outline-none"
                        >
                          {ROLES.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                        <Link
                          href={`/profile`}
                          className="text-xs font-mono text-cyan-400 hover:underline"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-slate-500">No users match.</p>
          )}
          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-3">
              <button
                type="button"
                disabled={pageSafe <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded-lg border border-white/[0.1] px-3 py-1 text-xs disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs font-mono text-slate-500">
                Page {pageSafe + 1} / {pageCount}
              </span>
              <button
                type="button"
                disabled={pageSafe >= pageCount - 1}
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                className="rounded-lg border border-white/[0.1] px-3 py-1 text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
