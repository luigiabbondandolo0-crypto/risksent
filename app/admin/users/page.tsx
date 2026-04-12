"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Users, AlertCircle, Search } from "lucide-react";

type UserRow = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  accountsCount: number;
  plan?: "free" | "new_trader" | "experienced";
  subStatus?: string;
};

type SubRow = {
  user_id: string;
  plan: "free" | "new_trader" | "experienced";
  status: string;
};

const ROLES = ["customer", "trader", "admin"] as const;
const PAGE_SIZE = 25;

const PLAN_LABELS: Record<string, string> = { free: "Free", new_trader: "New Trader", experienced: "Experienced" };
const PLAN_COLORS: Record<string, string> = {
  free: "text-slate-400 bg-slate-500/15 border-slate-500/30",
  new_trader: "text-cyan-300 bg-cyan-500/15 border-cyan-500/30",
  experienced: "text-amber-300 bg-amber-500/15 border-amber-500/30",
};
const STATUS_COLORS: Record<string, string> = {
  active: "text-emerald-300 bg-emerald-500/15",
  trialing: "text-cyan-300 bg-cyan-500/15",
  past_due: "text-orange-300 bg-orange-500/15",
  canceled: "text-red-300 bg-red-500/15",
};

function emailInitials(email: string): string {
  const local = email.split("@")[0] ?? "?";
  const parts = local.split(/[._-]/).filter(Boolean);
  if (parts.length >= 2) return ((parts[0]![0] ?? "") + (parts[1]![0] ?? "")).toUpperCase();
  return local.slice(0, 2).toUpperCase();
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/check-role")
      .then((r) => r.json())
      .then((d: { isAdmin: boolean }) => {
        if (!d.isAdmin) { setIsAdmin(false); router.push("/app/dashboard"); }
        else { setIsAdmin(true); void fetchData(); }
      })
      .catch(() => setIsAdmin(false));
  }, [router]);

  async function fetchData() {
    setLoading(true);
    try {
      const [usersRes, subsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/subscriptions"),
      ]);
      const usersData = await usersRes.json() as { users: UserRow[] };
      const rawUsers: UserRow[] = usersData.users ?? [];

      let subMap: Record<string, SubRow> = {};
      if (subsRes.ok) {
        const subsData = await subsRes.json() as { subscriptions: SubRow[] };
        subMap = Object.fromEntries((subsData.subscriptions ?? []).map((s) => [s.user_id, s]));
      }

      setUsers(rawUsers.map((u) => ({
        ...u,
        plan: subMap[u.id]?.plan ?? "free",
        subStatus: subMap[u.id]?.status ?? undefined,
      })));
    } finally {
      setLoading(false);
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingRole(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      }
    } finally {
      setUpdatingRole(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchQ = !q || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
      const matchPlan = planFilter === "all" || u.plan === planFilter;
      return matchQ && matchPlan;
    });
  }, [users, search, planFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount - 1);
  const slice = filtered.slice(pageSafe * PAGE_SIZE, (pageSafe + 1) * PAGE_SIZE);

  if (isAdmin === null) {
    return <div className="flex min-h-[40vh] items-center justify-center"><p className="font-mono text-sm text-slate-500">Loading…</p></div>;
  }
  if (!isAdmin) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
        <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-amber-400" />
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-amber-200">Access denied</h2>
          <p className="mt-1 text-sm text-slate-400">This page is only for administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      <header>
        <h1 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-2xl font-bold text-white">
          <Users className="h-6 w-6 text-amber-400" />
          Users Management
        </h1>
        <p className="mt-1 text-sm font-mono text-slate-500">
          {users.length} total users — search, filter, and manage roles.
        </p>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search by email or role…"
            className="w-full rounded-xl border border-white/[0.1] bg-[#0e0e12] py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-[#ff3c3c] font-mono"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => { setPlanFilter(e.target.value); setPage(0); }}
          className="rounded-xl border border-white/[0.1] bg-[#0e0e12] px-3 py-2.5 text-sm text-white outline-none"
        >
          <option value="all">All plans</option>
          <option value="free">Free</option>
          <option value="new_trader">New Trader</option>
          <option value="experienced">Experienced</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-[10px] font-mono uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Accounts</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500 font-mono">Loading users…</td></tr>
              ) : slice.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500 font-mono">No users match.</td></tr>
              ) : (
                slice.map((u, i) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
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
                      {u.plan && (
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${PLAN_COLORS[u.plan] ?? ""}`}>
                          {PLAN_LABELS[u.plan] ?? u.plan}
                        </span>
                      )}
                      {u.subStatus && u.subStatus !== "active" && (
                        <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-mono ${STATUS_COLORS[u.subStatus] ?? "text-slate-400 bg-slate-500/15"}`}>
                          {u.subStatus}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.role === "admin" ? "bg-amber-500/20 text-amber-300"
                          : u.role === "trader" ? "bg-cyan-500/15 text-cyan-300"
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
                          className="rounded-lg border border-white/[0.1] bg-[#0e0e12] px-2 py-1 text-xs text-slate-200 outline-none disabled:opacity-50"
                        >
                          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                        {updatingRole === u.id && (
                          <span className="text-xs font-mono text-slate-500">Saving…</span>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-3">
            <button
              type="button"
              disabled={pageSafe <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg border border-white/[0.1] px-3 py-1 text-xs disabled:opacity-40 hover:border-white/20"
            >
              Previous
            </button>
            <span className="text-xs font-mono text-slate-500">
              Page {pageSafe + 1} / {pageCount} · {filtered.length} users
            </span>
            <button
              type="button"
              disabled={pageSafe >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              className="rounded-lg border border-white/[0.1] px-3 py-1 text-xs disabled:opacity-40 hover:border-white/20"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
