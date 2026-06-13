"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Users, AlertCircle, Search, CheckCircle } from "lucide-react";

type SubscriptionPlan = "user" | "trial" | "new_trader" | "experienced";

type UserRow = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  accountsCount: number;
  plan: SubscriptionPlan;
  subStatus?: string;
};

type SubRow = {
  user_id: string;
  plan: string;
  status: string;
};

const SELECTABLE_PLANS = ["user", "trial", "new_trader", "experienced", "admin"] as const;
type SelectablePlan = (typeof SELECTABLE_PLANS)[number];

const PAGE_SIZE = 25;

function normalizeSubPlan(raw: string | undefined): SubscriptionPlan {
  if (!raw || raw === "free") return "user";
  if (raw === "user" || raw === "trial" || raw === "new_trader" || raw === "experienced") return raw;
  return "user";
}

function planBadgeClasses(u: UserRow): { label: string; className: string } {
  if (u.role === "admin") {
    return {
      label: "Admin",
      className: "text-violet-700 bg-violet-50 border-violet-200",
    };
  }
  if (u.subStatus === "trialing" || u.plan === "trial") {
    return {
      label: "Trial",
      className: "text-amber-700 bg-amber-50 border-amber-200",
    };
  }
  if (u.role === "trader" && u.plan === "user") {
    return {
      label: "Trader",
      className: "text-cyan-700 bg-cyan-50 border-cyan-200",
    };
  }
  if (u.plan === "user") {
    return {
      label: "Demo",
      className: "text-slate-600 bg-slate-100 border-slate-200",
    };
  }
  if (u.plan === "new_trader") {
    return {
      label: "New Trader",
      className: "text-cyan-700 bg-cyan-50 border-cyan-200",
    };
  }
  if (u.plan === "experienced") {
    return {
      label: "Experienced",
      className: "text-indigo-700 bg-indigo-50 border-indigo-200",
    };
  }
  return {
    label: "Demo",
    className: "text-slate-600 bg-slate-100 border-slate-200",
  };
}

function dropdownPlanValue(u: UserRow): SelectablePlan {
  if (u.role === "admin") return "admin";
  if (u.subStatus === "trialing" || u.plan === "trial") return "trial";
  if (u.plan === "new_trader") return "new_trader";
  if (u.plan === "experienced") return "experienced";
  return "user";
}

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
  const [updatingPlan, setUpdatingPlan] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; ok: boolean } | null>(null);

  const showToast = useCallback((message: string, ok: boolean) => {
    setToast({ message, ok });
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => {
    fetch("/api/admin/check-role")
      .then((r) => r.json())
      .then((d: { isAdmin: boolean }) => {
        if (!d.isAdmin) {
          setIsAdmin(false);
          router.push("/app/dashboard");
        } else {
          setIsAdmin(true);
          void fetchData();
        }
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
      const usersData = (await usersRes.json()) as { users: Omit<UserRow, "plan" | "subStatus">[] };
      const rawUsers = usersData.users ?? [];

      let subMap: Record<string, SubRow> = {};
      if (subsRes.ok) {
        const subsData = (await subsRes.json()) as { subscriptions: SubRow[] };
        subMap = Object.fromEntries((subsData.subscriptions ?? []).map((s) => [s.user_id, s]));
      }

      setUsers(
        rawUsers.map((u) => {
          const s = subMap[u.id];
          return {
            ...u,
            plan: normalizeSubPlan(s?.plan),
            subStatus: s?.status,
          };
        })
      );
    } finally {
      setLoading(false);
    }
  }

  const handlePlanChange = async (userId: string, newPlan: SelectablePlan) => {
    setUpdatingPlan(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: newPlan }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string; plan?: string };

      if (!res.ok) {
        showToast(data.error ?? "Update failed", false);
        return;
      }

      if (newPlan === "admin") {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: "admin" } : u))
        );
      } else {
        const subStatus = newPlan === "trial" ? "trialing" : "active";
        const plan = newPlan as SubscriptionPlan;
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, role: "customer", plan, subStatus } : u
          )
        );
      }

      showToast("Saved successfully.", true);
    } catch {
      showToast("Could not save. Try again.", false);
    } finally {
      setUpdatingPlan(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const badge = planBadgeClasses(u);
      const matchQ =
        !q ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        badge.label.toLowerCase().includes(q) ||
        u.plan.toLowerCase().includes(q);
      if (planFilter === "all") return matchQ;
      if (planFilter === "admin") {
        return matchQ && u.role === "admin";
      }
      if (planFilter === "trial") {
        return matchQ && (u.subStatus === "trialing" || u.plan === "trial");
      }
      if (planFilter === "user") {
        return matchQ && u.plan === "user" && u.subStatus !== "trialing" && u.role !== "admin";
      }
      return matchQ && u.plan === planFilter;
    });
  }, [users, search, planFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount - 1);
  const slice = filtered.slice(pageSafe * PAGE_SIZE, (pageSafe + 1) * PAGE_SIZE);

  if (isAdmin === null) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="font-mono text-sm text-slate-500">Loading…</p>
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-amber-500" />
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-amber-700">
            Access denied
          </h2>
          <p className="mt-1 text-sm text-slate-600">This page is only for administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      <AnimatePresence>
        {toast && (
          <motion.div
            key="save-toast"
            role="status"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className={`fixed left-1/2 top-6 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-xl border px-5 py-3 text-sm font-mono shadow-xl ${
              toast.ok
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {toast.ok ? (
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            )}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <header>
        <h1 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900">
          <Users className="h-6 w-6 text-amber-500" />
          Users Management
        </h1>
        <p className="mt-1 text-sm font-mono text-slate-500">
          {users.length} total users — search, filter, and manage roles.
        </p>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search by email, role, or plan…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 font-mono text-sm text-slate-900 outline-none focus:border-indigo-400"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => {
            setPlanFilter(e.target.value);
            setPage(0);
          }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none"
        >
          <option value="all">All plans</option>
          <option value="admin">Admin</option>
          <option value="user">Demo</option>
          <option value="trial">Trial</option>
          <option value="new_trader">New Trader</option>
          <option value="experienced">Experienced</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-mono uppercase tracking-wider text-slate-500">
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
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center font-mono text-sm text-slate-500">
                    Loading users…
                  </td>
                </tr>
              ) : slice.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center font-mono text-sm text-slate-500">
                    No users match.
                  </td>
                </tr>
              ) : (
                slice.map((u, i) => {
                  const badge = planBadgeClasses(u);
                  return (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ background: "linear-gradient(135deg,#6366f1,#22d3ee)" }}
                        >
                          {emailInitials(u.email)}
                        </span>
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 font-mono text-slate-700">{u.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            u.role === "admin"
                              ? "bg-amber-50 text-amber-700"
                              : u.role === "trader"
                                ? "bg-cyan-50 text-cyan-700"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">{u.accountsCount}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={dropdownPlanValue(u)}
                            onChange={(e) =>
                              void handlePlanChange(u.id, e.target.value as SelectablePlan)
                            }
                            disabled={updatingPlan === u.id}
                            className="max-w-[200px] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none disabled:opacity-50"
                          >
                            <option value="user">user</option>
                            <option value="trial">trial</option>
                            <option value="new_trader">new_trader</option>
                            <option value="experienced">experienced</option>
                            <option value="admin">admin</option>
                          </select>
                          {updatingPlan === u.id && (
                            <span className="text-xs font-mono text-slate-500">Saving…</span>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <button
              type="button"
              disabled={pageSafe <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:border-slate-300 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="font-mono text-xs text-slate-500">
              Page {pageSafe + 1} / {pageCount} · {filtered.length} users
            </span>
            <button
              type="button"
              disabled={pageSafe >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:border-slate-300 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
