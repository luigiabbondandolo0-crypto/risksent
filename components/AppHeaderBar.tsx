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

  // Initial load + live polling so the bell stays in sync with the server.
  // On mount we also run a one-shot backfill from risk_violations into the
  // alert table, so older violations that pre-date the dual-write mirror
  // still show up in the bell / dashboard.
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

  // When the dropdown opens: refresh, then mark all unread as read so the badge
  // doesn't get stuck on stale counts.
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

  return (
    <div className="flex items-center gap-3">
      {isAdminArea && (
        <Link
          href="/app/dashboard"
          className="hidden items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-xs font-[family-name:var(--font-mono)] text-slate-300 transition-colors hover:bg-white/[0.06] sm:flex"
        >
          Dashboard
        </Link>
      )}
      {isAdmin && !isAdminArea && (
        <Link
          href="/admin"
          className="hidden items-center rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-200 sm:inline-flex"
        >
          Admin
        </Link>
      )}

      <div className="relative" ref={bellRef}>
        <button
          type="button"
          onClick={() => setBellOpen((o) => !o)}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-slate-300 transition-colors hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-white"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#6366f1] px-1 text-[10px] font-bold text-white">
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
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              className="absolute right-0 top-[calc(100%+8px)] z-[80] w-[min(100vw-2rem,320px)] overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c0c0e]/95 py-2 shadow-2xl backdrop-blur-xl"
            >
              <p className="border-b border-white/[0.06] px-3 pb-2 text-[10px] font-[family-name:var(--font-mono)] uppercase tracking-wider text-slate-500">
                Alerts
              </p>
              {unread > 0 && (
                <div className="border-b border-amber-500/20 bg-amber-500/10 px-3 py-2.5">
                  <Link
                    href="/app/risk-manager"
                    className="block text-xs font-semibold text-amber-200/95 hover:text-amber-100"
                    onClick={() => setBellOpen(false)}
                  >
                    Nuova alert: verifica
                  </Link>
                  <p className="mt-0.5 text-[10px] text-slate-500">Apri il Risk Manager per i dettagli.</p>
                </div>
              )}
              <ul className="max-h-64 overflow-y-auto">
                {recent.length === 0 ? (
                  <li className="px-3 py-4 text-center text-xs text-slate-500">No alerts yet</li>
                ) : (
                  recent.map((a) => (
                    <li
                      key={a.id}
                      className="border-b border-white/[0.04] px-3 py-2.5 last:border-0"
                    >
                      <p className="line-clamp-2 text-xs font-medium text-slate-200">{a.message}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {a.account_nickname ? (
                          <span className="text-[10px] font-mono text-indigo-400/90">{a.account_nickname}</span>
                        ) : null}
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(a.alert_date).toLocaleString(undefined, {
                            dateStyle: "short",
                            timeStyle: "short"
                          })}
                        </span>
                      </div>
                    </li>
                  ))
                )}
              </ul>
              <div className="flex items-center gap-2 border-t border-white/[0.06] px-2 pt-2">
                <Link
                  href="/app/risk-manager"
                  className="flex-1 rounded-lg py-2 text-center text-xs font-[family-name:var(--font-mono)] text-indigo-400 hover:bg-white/[0.04]"
                  onClick={() => setBellOpen(false)}
                >
                  View all
                </Link>
                <button
                  type="button"
                  onClick={() => void clearAll()}
                  disabled={!hasAny}
                  className="flex-1 rounded-lg py-2 text-center text-xs font-[family-name:var(--font-mono)] text-slate-300 transition-colors hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  Clear
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative" ref={userRef}>
        <button
          type="button"
          onClick={() => setUserOpen((o) => !o)}
          className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] py-1 pl-1 pr-2 transition-colors hover:border-white/[0.14] hover:bg-white/[0.06]"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold text-white"
            style={{
              background: "linear-gradient(135deg, #6366f1, #4f46e5)"
            }}
          >
            {initials}
          </span>
          <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${userOpen ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>
          {userOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              className="absolute right-0 top-[calc(100%+8px)] z-[80] w-56 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c0c0e]/95 py-2 shadow-2xl backdrop-blur-xl"
            >
              <div className="border-b border-white/[0.06] px-3 pb-2">
                <p className="truncate text-sm font-semibold text-white font-[family-name:var(--font-display)]">
                  {display}
                </p>
                <p className="truncate text-xs font-mono text-slate-500">{email}</p>
              </div>
              <Link
                href="/profile"
                className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 hover:bg-white/[0.04]"
                onClick={() => setUserOpen(false)}
              >
                <User className="h-4 w-4 text-slate-500" />
                Profile
              </Link>
              <Link
                href="/app/settings"
                className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 hover:bg-white/[0.04]"
                onClick={() => setUserOpen(false)}
              >
                <Settings className="h-4 w-4 text-slate-500" />
                Settings
              </Link>
              {isAdmin && (
                <>
                  <div className="mx-2 my-1 h-px bg-white/[0.06]" />
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 px-3 py-2.5 text-sm text-amber-300 hover:bg-white/[0.04]"
                    onClick={() => setUserOpen(false)}
                  >
                    <Shield className="h-4 w-4" />
                    Admin
                  </Link>
                </>
              )}
              <div className="mx-2 my-1 h-px bg-white/[0.06]" />
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10"
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
