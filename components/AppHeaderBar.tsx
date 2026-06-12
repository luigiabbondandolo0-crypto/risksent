"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, ChevronDown, LogOut, Settings, Shield, User } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

type AlertRow = {
  id: string;
  message: string;
  severity: string;
  alert_date: string;
  read?: boolean | null;
  dismissed?: boolean | null;
  account_nickname?: string | null;
};

function initialsFrom(name: string | null, email: string | null): string {
  const s = (name || email || "?").trim();
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0] + parts[1]![0]).toUpperCase();
  }
  if (parts.length === 1 && parts[0]!.includes("@")) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return s.slice(0, 2).toUpperCase();
}

const SEVERITY_DOT: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-400",
  low: "bg-blue-400",
};

export function AppHeaderBar({
  email,
  fullName,
  isAdmin,
  isAdminArea
}: {
  email: string | null;
  fullName: string | null;
  isAdmin: boolean;
  isAdminArea: boolean;
}) {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!bellRef.current?.contains(t)) setBellOpen(false);
      if (!userRef.current?.contains(t)) setUserOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/alerts", { cache: "no-store" });
      if (res.ok) {
        const j = (await res.json()) as { alerts?: AlertRow[] };
        setAlerts(j.alerts ?? []);
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await fetch("/api/alerts/sync-from-violations", {
          method: "POST",
          cache: "no-store"
        });
      } catch {
        /* non-fatal */
      }
      if (!cancelled) void fetchAlerts();
    })();
    const id = window.setInterval(() => void fetchAlerts(), 15_000);
    const onRefresh = () => void fetchAlerts();
    window.addEventListener("rs-alerts-refresh", onRefresh);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.removeEventListener("rs-alerts-refresh", onRefresh);
    };
  }, []);

  useEffect(() => {
    if (!bellOpen) return;
    let cancelled = false;
    void (async () => {
      await fetchAlerts();
      const hasUnread = alerts.some((a) => !a.read);
      if (!hasUnread) return;
      try {
        const res = await fetch("/api/alerts/read-all", {
          method: "POST",
          cache: "no-store"
        });
        if (!cancelled && res.ok) {
          setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bellOpen]);

  const visibleAlerts = alerts.filter((a) => !a.dismissed);
  const unread = visibleAlerts.filter((a) => !a.read).length;
  const recent = visibleAlerts.slice(0, 5);
  const hasAny = visibleAlerts.length > 0;

  const clearAll = async () => {
    try {
      const res = await fetch("/api/alerts/dismiss-all", {
        method: "POST",
        cache: "no-store"
      });
      if (res.ok) {
        setAlerts((prev) => prev.map((a) => ({ ...a, dismissed: true, read: true })));
      }
    } catch {
      /* ignore */
    }
  };

  const display = fullName || email || "User";
  const initials = initialsFrom(fullName, email);

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const dropdownBase =
    "absolute right-0 top-[calc(100%+8px)] z-[80] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60";

  return (
    <div className="flex items-center gap-2">
      {isAdminArea && (
        <Link
          href="/dashboard"
          className="hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-[family-name:var(--font-mono)] text-slate-600 shadow-sm transition-colors hover:bg-slate-50 sm:flex"
        >
          Dashboard
        </Link>
      )}
      {isAdmin && !isAdminArea && (
        <Link
          href="/admin"
          className="hidden items-center rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 sm:inline-flex"
        >
          Admin
        </Link>
      )}

      {/* Bell */}
      <div className="relative" ref={bellRef}>
        <button
          type="button"
          onClick={() => setBellOpen((o) => !o)}
          className={`relative flex h-9 w-9 items-center justify-center rounded-lg border transition-all ${
            bellOpen
              ? "border-indigo-200 bg-indigo-50 text-indigo-600"
              : "border-slate-200 bg-white text-slate-500 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
          }`}
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white shadow-sm">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        <AnimatePresence>
          {bellOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className={`${dropdownBase} w-[min(100vw-2rem,320px)] py-2`}
            >
              <p className="border-b border-slate-100 px-3 pb-2 text-[10px] font-[family-name:var(--font-mono)] uppercase tracking-wider text-slate-400">
                Alerts
              </p>
              {unread > 0 && (
                <div className="border-b border-amber-100 bg-amber-50 px-3 py-2.5">
                  <Link
                    href="/app/risk-manager"
                    className="block text-xs font-semibold text-amber-800 hover:text-amber-900"
                    onClick={() => setBellOpen(false)}
                  >
                    New alert — check Risk Manager
                  </Link>
                  <p className="mt-0.5 text-[10px] text-amber-600">Open Risk Manager for details.</p>
                </div>
              )}
              <ul className="max-h-64 overflow-y-auto">
                {recent.length === 0 ? (
                  <li className="px-3 py-5 text-center text-xs text-slate-400">No alerts yet</li>
                ) : (
                  recent.map((a) => (
                    <li
                      key={a.id}
                      className={`border-b border-slate-50 px-3 py-2.5 last:border-0 ${!a.read ? "bg-indigo-50/40" : ""}`}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${SEVERITY_DOT[a.severity] ?? "bg-slate-300"}`}
                        />
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-xs font-medium text-slate-700">{a.message}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            {a.account_nickname ? (
                              <span className="text-[10px] font-mono text-indigo-600">{a.account_nickname}</span>
                            ) : null}
                            <span className="text-[10px] font-mono text-slate-400">
                              {new Date(a.alert_date).toLocaleString(undefined, {
                                dateStyle: "short",
                                timeStyle: "short"
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
              <div className="flex items-center gap-2 border-t border-slate-100 px-2 pt-2">
                <Link
                  href="/app/risk-manager"
                  className="flex-1 rounded-lg py-1.5 text-center text-xs font-[family-name:var(--font-mono)] text-indigo-600 transition-colors hover:bg-indigo-50"
                  onClick={() => setBellOpen(false)}
                >
                  View all
                </Link>
                <button
                  type="button"
                  onClick={() => void clearAll()}
                  disabled={!hasAny}
                  className="flex-1 rounded-lg py-1.5 text-center text-xs font-[family-name:var(--font-mono)] text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Clear
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User menu */}
      <div className="relative" ref={userRef}>
        <button
          type="button"
          onClick={() => setUserOpen((o) => !o)}
          className={`flex items-center gap-2 rounded-lg border py-1 pl-1 pr-2 transition-all ${
            userOpen
              ? "border-indigo-200 bg-indigo-50"
              : "border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:bg-slate-50"
          }`}
        >
          <span
            className="flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-bold text-white"
            style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
          >
            {initials}
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-slate-400 transition-transform ${userOpen ? "rotate-180" : ""}`}
          />
        </button>

        <AnimatePresence>
          {userOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className={`${dropdownBase} w-56 py-1.5`}
            >
              <div className="border-b border-slate-100 px-3 pb-2 pt-1">
                <p className="truncate text-sm font-semibold text-slate-900 font-[family-name:var(--font-display)]">
                  {display}
                </p>
                <p className="truncate text-xs font-mono text-slate-400">{email}</p>
              </div>
              <div className="py-1">
                <Link
                  href="/profile"
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                  onClick={() => setUserOpen(false)}
                >
                  <User className="h-4 w-4 text-slate-400" />
                  Profile
                </Link>
                <Link
                  href="/app/settings"
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                  onClick={() => setUserOpen(false)}
                >
                  <Settings className="h-4 w-4 text-slate-400" />
                  Settings
                </Link>
                {isAdmin && (
                  <>
                    <div className="mx-3 my-1 h-px bg-slate-100" />
                    <Link
                      href="/admin"
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-amber-600 transition-colors hover:bg-amber-50"
                      onClick={() => setUserOpen(false)}
                    >
                      <Shield className="h-4 w-4" />
                      Admin
                    </Link>
                  </>
                )}
              </div>
              <div className="mx-3 mb-1 h-px bg-slate-100" />
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
