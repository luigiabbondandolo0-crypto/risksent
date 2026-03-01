"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, User } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

export function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setEmail(session?.user?.email ?? null);
    });
  }, []);

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    // Use window.location for proper redirect
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-black/60 backdrop-blur-md">
      <div className="flex items-center justify-between w-full px-6 py-3">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-9 w-9 flex-shrink-0 flex items-center justify-center overflow-hidden rounded-md bg-slate-900/60 relative">
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
          <span className="text-base font-bold tracking-wider text-slate-100 uppercase">
            RISKSENT
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {email ? (
            <>
              <div className="flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-900/40 px-3 py-1.5">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs text-slate-300 truncate max-w-[140px]">
                  {email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-900/40 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-slate-100 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </>
          ) : !isLoginPage ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-lg border border-slate-600 bg-slate-800/40 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700/50 hover:border-cyan-500/50 hover:text-cyan-200 transition-all duration-200"
              >
                Dashboard
              </Link>
              <Link
                href="/login"
                className="rounded-lg border border-emerald-500/50 bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/30 transition-colors"
              >
                Log in
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
