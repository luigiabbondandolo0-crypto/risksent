"use client";

import { useEffect, useState } from "react";
import { Users, CreditCard, TrendingUp, Shield, AlertCircle } from "lucide-react";

const ADMIN_EMAIL = "luigiabbondandolo0@gmail.com";

type UserRow = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  accountsCount: number;
};

type Stats = {
  users: number;
  tradingAccounts: number;
  trades: number;
};

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setForbidden(false);
      setServerError(null);
      try {
        const [statsRes, usersRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/users")
        ]);

        if (statsRes.status === 403 || usersRes.status === 403) {
          setForbidden(true);
          return;
        }
        if (!statsRes.ok || !usersRes.ok) {
          const body = await statsRes.ok ? usersRes.json() : statsRes.json().catch(() => ({}));
          const msg = body?.error ?? `Server error ${statsRes.ok ? usersRes.status : statsRes.status}. Check Vercel env (SUPABASE_SERVICE_ROLE_KEY, Supabase URL) and that tables app_user, trading_account exist.`;
          setServerError(msg);
          return;
        }
        const statsData = await statsRes.json();
        const usersData = await usersRes.json();
        setStats(statsData);
        setUsers(usersData.users ?? []);
      } catch (e) {
        setServerError(e instanceof Error ? e.message : "Request failed");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-slate-500">Loading admin…</p>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 flex items-start gap-3">
        <AlertCircle className="h-6 w-6 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <h2 className="text-lg font-semibold text-amber-200">Access denied</h2>
          <p className="text-sm text-slate-400 mt-1">
            This page is only for the platform admin ({ADMIN_EMAIL}). If you need access, contact the administrator.
          </p>
        </div>
      </div>
    );
  }

  if (serverError) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 flex items-start gap-3">
        <AlertCircle className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <h2 className="text-lg font-semibold text-red-200">Server error</h2>
          <p className="text-sm text-slate-400 mt-1 font-mono break-all">{serverError}</p>
          <p className="text-xs text-slate-500 mt-2">
            Set SUPABASE_SERVICE_ROLE_KEY in Vercel and run supabase/schema.sql + accounts-and-admin.sql in Supabase SQL Editor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-slate-50 flex items-center gap-2">
          <Shield className="h-5 w-5 text-cyan-400" />
          Admin
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor users, roles, and platform statistics. Only visible to the admin account.
        </p>
      </header>

      {stats != null && (
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-surface p-5">
            <div className="flex items-center gap-2 text-slate-400">
              <Users className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">Users</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-white">{stats.users}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-surface p-5">
            <div className="flex items-center gap-2 text-slate-400">
              <CreditCard className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">MT accounts</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-white">{stats.tradingAccounts}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-surface p-5">
            <div className="flex items-center gap-2 text-slate-400">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">Trades</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-white">{stats.trades}</p>
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-medium text-slate-300 mb-3">Users & roles</h2>
        <div className="rounded-xl border border-slate-800 bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-xs text-slate-400 uppercase tracking-wide">
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">MT accounts</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-800/60 last:border-0">
                  <td className="px-4 py-3 text-slate-200">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                      u.role === "admin" ? "bg-amber-500/20 text-amber-400" :
                      u.role === "trader" ? "bg-cyan-500/20 text-cyan-400" :
                      "bg-slate-500/20 text-slate-400"
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{u.accountsCount}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <p className="px-4 py-6 text-center text-slate-500 text-sm">No users yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
