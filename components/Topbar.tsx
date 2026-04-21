"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Menu, X } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { isAppShellPath, isNavActive, mobileNavItems, primaryNavItems } from "@/components/navConfig";
import { AppHeaderBar } from "@/components/AppHeaderBar";
import { MarketingUserMenu } from "@/components/MarketingUserMenu";
import { BrandLogo, BrandWordmark } from "@/components/Brand";

const marketingNav = [
  { href: "/backtest", label: "Backtesting" },
  { href: "/journaling", label: "Journaling" },
  { href: "/risk-manager", label: "Risk Manager" },
  { href: "/live-alerts", label: "Live Alerts" },
  { href: "/ai-coach", label: "AI Coach" },
  { href: "/pricing", label: "Pricing" },
  { href: "/info", label: "Info" },
];

export function Topbar() {
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const logoHref = inApp ? "/app/dashboard" : "/";

  return (
    <>
    <header
      className="sticky top-0 z-50 h-14 border-b backdrop-blur-[20px]"
      style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(8,8,9,0.85)" }}
    >

      <div className={`mx-auto flex h-full w-full max-w-[1800px] items-center justify-between gap-4 px-4 sm:px-6 ${inApp ? "" : "lg:px-10"}`}>

        {/* Brand wordmark — always leftmost */}
        <Link
          href={logoHref}
          className="shrink-0 transition-transform duration-200 hover:-translate-y-[1px]"
          aria-label="RiskSent home"
        >
          <BrandWordmark className="text-[17px] sm:text-[19px]" />
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
              <MarketingUserMenu email={email} fullName={fullName} isAdmin={isAdmin} />
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
          {/* Hamburger — app mobile, at far right so wordmark stays leftmost */}
          {inApp && (
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-slate-300 hover:text-white"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
          )}
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
                  active ? "bg-[#6366f1]/15 text-indigo-100 ring-1 ring-[#6366f1]/25" : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-100"
                }`}>
                <Icon className={`h-3.5 w-3.5 ${active ? "text-[#6366f1]" : "text-slate-500"}`} />
                {label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>

      {/* Mobile sidebar drawer (app only) */}
      <AnimatePresence>
        {inApp && sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-[70] flex w-[260px] flex-col border-r border-white/[0.07] bg-[#080809] px-4 py-6 lg:hidden"
            >
              <div className="mb-6 flex items-center justify-between">
                <BrandLogo treatment="bare" size={44} />
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                Platform
              </p>
              <nav className="flex flex-col gap-0.5">
                {primaryNavItems.map(({ href, label, icon: Icon, badge }) => {
                  const active = isNavActive(pathname, href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setSidebarOpen(false)}
                      className={[
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                        active
                          ? "border border-[#6366f1]/30 bg-[#6366f1]/10 text-indigo-100"
                          : "border border-transparent text-slate-500 hover:bg-slate-800/60 hover:text-slate-100",
                      ].join(" ")}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${active ? "text-[#6366f1]" : "text-slate-500"}`} />
                      <span>{label}</span>
                      {badge && !active && (
                        <span className="ml-auto rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                          style={{ background: "rgba(255,140,0,0.12)", color: "#ff8c00" }}>
                          {badge}
                        </span>
                      )}
                      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#6366f1]" />}
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}