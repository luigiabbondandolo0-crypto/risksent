"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LayoutDashboard, LogOut, Shield, User } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

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

export function MarketingUserMenu({
  email,
  fullName,
  isAdmin
}: {
  email: string | null;
  fullName: string | null;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const display = fullName || email || "User";
  const initials = initialsFrom(fullName, email);

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div ref={rootRef} className="relative z-50 flex items-center gap-2">
      {isAdmin && (
        <Link
          href="/admin"
          className="hidden items-center rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-200 sm:inline-flex"
        >
          Admin
        </Link>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] py-1 pl-1 pr-2 transition-colors hover:border-white/[0.14] hover:bg-white/[0.06]"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span
          className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold text-white"
          style={{ background: "linear-gradient(135deg, #ff3c3c, #cc1111)" }}
        >
          {initials}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c0c0e]/95 py-2 shadow-2xl backdrop-blur-xl"
            role="menu"
          >
            <div className="border-b border-white/[0.06] px-3 pb-2">
              <p className="truncate font-[family-name:var(--font-display)] text-sm font-semibold text-white">
                {display}
              </p>
              <p className="truncate text-xs font-mono text-slate-500">{email}</p>
            </div>
            <Link
              href="/app/dashboard"
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 hover:bg-white/[0.04]"
              onClick={() => setOpen(false)}
            >
              <LayoutDashboard className="h-4 w-4 text-slate-500" />
              Dashboard
            </Link>
            <Link
              href="/profile"
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 hover:bg-white/[0.04]"
              onClick={() => setOpen(false)}
            >
              <User className="h-4 w-4 text-slate-500" />
              Profile
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-2 px-3 py-2.5 text-sm text-amber-300 hover:bg-white/[0.04] sm:hidden"
                onClick={() => setOpen(false)}
              >
                <Shield className="h-4 w-4" />
                Admin
              </Link>
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
  );
}
