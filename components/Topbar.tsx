"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { isAppShellPath, isNavActive, mobileNavItems } from "@/components/navConfig";
import { AppHeaderBar } from "@/components/AppHeaderBar";

const marketingNav = [
  { href: "/backtest", label: "Backtesting" },
  { href: "/journaling", label: "Journaling" },
  { href: "/risk-manager", label: "Risk Manager" },
  { href: "/live-alerts", label: "Live Alerts" },
  { href: "/pricing", label: "Pricing" },
];

export function Topbar() {
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLoginPage = pathname === "/login";
  const isAdminArea = pathname?.startsWith("/admin");
  const isHome = pathname === "/";
  const isDemo = pathname === "/demo";
  const inApp = isAppShellPath(pathname);
  const isMarketingPage = marketingNav.some(n => pathname === n.href) || isHome;

  useEffect(() => {
    const loadUserData = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setEmail(session.user.email ?? null);
        try {
          const res = await fetch("/api/profile");
          if (res.ok) {
            const data = await res.json();
            setFullName(data.fullName || null);
            setIsAdmin(data.role === "admin");
          }
        } catch {}
      }
    };
    loadUserData();
  }, []);

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const logoHref = inApp ? "/app/dashboard" : "/";

  return (
    <header
      className="sticky top-0 z-50 h-14 border-b backdrop-blur-[20px]"
      style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(8,8,9,0.85)" }}
    >

      <div className="mx-auto flex h-full w-full max-w-[1800px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">

        {/* Logo */}
        <Link href={logoHref} className="flex items-center gap-2.5 shrink-0">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-black text-white"
            style={{ background: "linear-gradient(135deg, #ff3c3c, #ff8c00)" }}
          >
            RS
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-100"
            style={{ fontFamily: "'Syne', sans-serif" }}>
            RiskSent
          </span>
        </Link>

        {/* Marketing nav — desktop */}
        {!inApp && (
          <nav className="hidden lg:flex items-center gap-1">
            {marketingNav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3.5 py-1.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                    active
                      ? "text-white bg-white/08"
                      : "text-slate-400 hover:text-white hover:bg-white/05"
                  } ${item.label === "Pricing" ? "text-orange-400 hover:text-orange-300" : ""}`}
                  style={{
                    background: active ? "rgba(255,255,255,0.07)" : undefined,
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          {email ? (
            inApp ? (
              <AppHeaderBar
                email={email}
                fullName={fullName}
                isAdmin={isAdmin}
                isAdminArea={isAdminArea}
              />
            ) : (
              <>
                <Link
                  href="/profile"
                  className="flex max-w-[160px] items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-900/40 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:bg-slate-800/60"
                >
                  <span className="truncate">{fullName || email}</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl border border-slate-700/50 bg-slate-900/50 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800/70"
                >
                  Log out
                </button>
              </>
            )
          ) : !isLoginPage ? (
            <>
              {/* Mobile menu toggle */}
              {!inApp && (
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden flex items-center gap-1 rounded-xl border border-slate-700/50 bg-slate-900/50 px-3 py-1.5 text-xs text-slate-300"
                >
                  Menu
                  <ChevronDown className={`h-3 w-3 transition-transform ${mobileMenuOpen ? "rotate-180" : ""}`} />
                </button>
              )}
              <Link href="/login"
                className="rounded-xl border border-slate-700/50 bg-slate-900/50 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800/70 hover:text-white">
                Log in
              </Link>
              <Link href="/signup"
                className="rounded-xl px-3 py-1.5 text-xs font-bold text-black transition-all hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, #ff3c3c, #ff8c00)" }}>
                Start free
              </Link>
            </>
          ) : null}
        </div>
      </div>

      {/* Mobile marketing nav */}
      {!inApp && mobileMenuOpen && (
        <nav className="border-t px-6 py-4 lg:hidden"
          style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(8,8,9,0.95)" }}>
          <div className="flex flex-col gap-1">
            {marketingNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  pathname === item.href ? "text-white bg-white/07" : "text-slate-400 hover:text-white"
                } ${item.label === "Pricing" ? "text-orange-400" : ""}`}
                style={{ background: pathname === item.href ? "rgba(255,255,255,0.06)" : undefined }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}

      {/* App mobile nav */}
      {inApp && (
        <nav className="scrollbar-none flex gap-1 overflow-x-auto border-t px-3 py-2.5 lg:hidden"
          style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(8,8,9,0.6)" }}>
          {mobileNavItems.map(({ href, label, icon: Icon }) => {
            const active = isNavActive(pathname, href);
            return (
              <Link key={href} href={href}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                  active ? "bg-cyan-500/15 text-cyan-100 ring-1 ring-cyan-500/25" : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-100"
                }`}>
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