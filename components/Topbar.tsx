"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, User, Shield, LayoutDashboard } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { isAppShellPath, isNavActive, mobileNavItems } from "@/components/navConfig";

export function Topbar() {
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const isLoginPage = pathname === "/login";
  const isAdminArea = pathname?.startsWith("/admin");
  const isHome = pathname === "/";
  const isDemo = pathname === "/demo";
  const inApp = isAppShellPath(pathname);

  useEffect(() => {
    const loadUserData = async () => {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setEmail(session.user.email ?? null);

        try {
          const res = await fetch("/api/profile");
          if (res.ok) {
            const data = await res.json();
            setFullName(data.fullName || null);
            setIsAdmin(data.role === "admin");
          }
        } catch {
          // Ignore errors, just use email
        }
      }
    };

    loadUserData();
  }, []);

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/60 bg-[#050509]/85 shadow-sm shadow-black/20 backdrop-blur-xl">
      <div className="flex w-full items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-900/70 ring-1 ring-slate-700/50">
            <img
              src="/logo.png"
              alt="RiskSent"
              className="h-full w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const fb = e.currentTarget.parentElement?.querySelector("[data-fallback]");
                if (fb) (fb as HTMLElement).classList.remove("hidden");
              }}
            />
            <div
              data-fallback
              className="absolute inset-0 hidden flex items-center justify-center text-xs font-bold text-emerald-400"
            >
              RS
            </div>
          </div>
          <span className="truncate text-base font-semibold tracking-tight text-slate-100">
            RiskSent
          </span>
        </Link>

        <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
          {email ? (
            <>
              {isAdminArea && (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 rounded-xl border border-slate-600 bg-slate-800/40 px-2.5 py-1.5 text-xs text-slate-300 transition-colors hover:bg-slate-700/50 hover:text-slate-100"
                  title="Vai alla Dashboard"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  <span>Dashboard</span>
                </Link>
              )}
              {isAdmin && !isAdminArea && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 rounded-xl border border-amber-700/50 bg-amber-900/20 px-2.5 py-1.5 text-xs text-amber-300 transition-colors hover:bg-amber-800/30 hover:text-amber-200"
                  title="Admin area"
                >
                  <Shield className="h-3.5 w-3.5" />
                  <span>Admin</span>
                </Link>
              )}
              <Link
                href="/profile"
                className="flex max-w-[180px] cursor-pointer items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-900/40 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:bg-slate-800/60 hover:text-slate-100"
              >
                <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{fullName || email}</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-xl border border-slate-700/50 bg-slate-900/50 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800/70 hover:text-slate-100"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : !isLoginPage ? (
            <>
              {!isDemo && (
                <>
                  <Link
                    href="/demo"
                    className="hidden rounded-xl border border-slate-600 bg-slate-800/40 px-3 py-1.5 text-xs font-medium text-slate-200 transition-all duration-200 hover:border-cyan-500/50 hover:bg-slate-700/50 hover:text-cyan-200 sm:inline-flex"
                  >
                    Demo dashboard
                  </Link>
                  {!isHome && (
                    <Link
                      href="/dashboard"
                      className="rounded-xl border border-slate-600/80 bg-slate-800/50 px-3 py-1.5 text-xs font-medium text-slate-200 transition-all hover:border-cyan-500/40 hover:bg-slate-800 hover:text-cyan-100"
                    >
                      Dashboard
                    </Link>
                  )}
                </>
              )}
              <Link
                href="/login"
                className="rounded-xl border border-emerald-500/45 bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-200 transition-colors hover:bg-emerald-500/25"
              >
                Log in
              </Link>
            </>
          ) : null}
        </div>
      </div>

      {inApp && (
        <nav
          className="scrollbar-none flex gap-1 overflow-x-auto border-t border-slate-800/50 bg-slate-950/40 px-3 py-2.5 lg:hidden"
          aria-label="App navigation"
        >
          {mobileNavItems.map(({ href, label, icon: Icon }) => {
            const active = isNavActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                  active
                    ? "bg-cyan-500/15 text-cyan-100 ring-1 ring-cyan-500/25"
                    : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-100"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${active ? "text-cyan-400" : "text-slate-500"}`} />
                {label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
