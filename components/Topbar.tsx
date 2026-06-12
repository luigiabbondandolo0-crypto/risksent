"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Menu, X } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { isNavActive, mobileNavItems, primaryNavItems } from "@/components/navConfig";
import { useIsAppShell } from "@/lib/AppDomainContext";
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
  const inApp = useIsAppShell(pathname);

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

  const logoHref = inApp ? "/dashboard" : "/";

  // App topbar — light glass; marketing topbar — dark glass
  const headerStyle = inApp
    ? { borderColor: "rgba(0,0,0,0.07)", background: "rgba(255,255,255,0.92)" }
    : { borderColor: "rgba(255,255,255,0.06)", background: "rgba(8,8,9,0.88)" };

  return (
    <>
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-[20px]${!inApp ? " rs-topbar-dark rs-dark-context" : ""}`}
        style={headerStyle}
      >
        <div className="flex h-14 min-w-0 w-full max-w-[100vw] items-center justify-between gap-2 px-3 sm:gap-3 sm:px-4 md:pl-8 md:pr-5 lg:pl-[58px] lg:pr-6">

          {/* Brand wordmark */}
          <Link
            href={logoHref}
            className="shrink-0 transition-opacity duration-200 hover:opacity-75"
            aria-label="RiskSent home"
          >
            <BrandWordmark className="text-[clamp(14px,3.5vw,18px)]" />
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
                        ? "text-white"
                        : item.label === "Pricing"
                          ? "text-orange-400 hover:text-orange-300"
                          : "text-slate-400 hover:text-white hover:bg-white/05"
                    }`}
                    style={{
                      background: active ? "rgba(255,255,255,0.08)" : undefined,
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
                  isAdminArea={isAdminArea ?? false}
                />
              ) : (
                <MarketingUserMenu email={email} fullName={fullName} isAdmin={isAdmin} />
              )
            ) : !isLoginPage ? (
              <>
                {!inApp && (
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="lg:hidden flex items-center gap-1 rounded-xl border border-white/15 bg-white/08 px-3 py-1.5 text-xs text-slate-300"
                  >
                    Menu
                    <ChevronDown className={`h-3 w-3 transition-transform ${mobileMenuOpen ? "rotate-180" : ""}`} />
                  </button>
                )}
                <Link
                  href="/login"
                  className={`rounded-xl px-2.5 py-1.5 text-[11px] font-medium transition-colors sm:px-3 sm:text-xs ${
                    inApp
                      ? "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
                      : "border border-white/15 bg-white/06 text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-white transition-all hover:scale-[1.02] sm:px-3 sm:text-xs motion-reduce:transition-none motion-reduce:hover:scale-100"
                  style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
                >
                  Start free
                </Link>
              </>
            ) : null}

            {/* Hamburger — app mobile */}
            {inApp && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 shadow-sm"
                aria-label="Open menu"
              >
                <Menu className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile marketing nav */}
        {!inApp && mobileMenuOpen && (
          <nav
            className="border-t px-6 py-4 lg:hidden"
            style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(8,8,9,0.97)" }}
          >
            <div className="flex flex-col gap-1">
              {marketingNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? "text-white bg-white/07"
                      : item.label === "Pricing"
                        ? "text-orange-400"
                        : "text-slate-400 hover:text-white"
                  }`}
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
          <nav
            className="scrollbar-none flex gap-1 overflow-x-auto border-t px-3 py-2 lg:hidden"
            style={{ borderColor: "rgba(0,0,0,0.06)", background: "rgba(255,255,255,0.95)" }}
          >
            {mobileNavItems.map(({ href, label, icon: Icon }) => {
              const active = isNavActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                    active
                      ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${active ? "text-indigo-600" : "text-slate-400"}`} />
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-[70] flex w-[260px] flex-col border-r border-slate-200 bg-white px-4 py-6 lg:hidden shadow-xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <BrandLogo treatment="bare" size={62} />
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
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
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-200/80"
                          : "border border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800",
                      ].join(" ")}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 ${active ? "text-indigo-600" : "text-slate-400"}`}
                      />
                      <span>{label}</span>
                      {badge && !active && (
                        <span
                          className="ml-auto rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                          style={{ background: "rgba(249,115,22,0.1)", color: "#ea580c" }}
                        >
                          {badge}
                        </span>
                      )}
                      {active && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      )}
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
