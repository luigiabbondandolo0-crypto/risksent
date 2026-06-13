"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { useIsAppShell } from "@/lib/AppDomainContext";
import { SubscriptionProvider, useSubscription } from "@/lib/subscription/SubscriptionContext";
import { DemoBanner } from "@/components/demo/DemoBanner";
import { Footer } from "@/components/Footer";


function TrialBanner() {
  const sub = useSubscription();
  const [dismissed, setDismissed] = useState(false);

  if (!sub || sub.isAdmin || !sub.isTrialing || dismissed) return null;

  const days = sub.trialDaysLeft ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm shadow-sm"
    >
      <span className="font-mono text-indigo-700">
        Free trial active —{" "}
        <strong className="text-indigo-900">{days} day{days !== 1 ? "s" : ""} remaining</strong>
      </span>
      <div className="flex items-center gap-2">
        <Link
          href="/pricing"
          className="flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-white px-3 py-1 text-xs font-mono font-semibold text-indigo-600 shadow-sm transition-all hover:bg-indigo-600 hover:text-white hover:border-indigo-600"
        >
          Choose a plan
          <ArrowRight className="h-3 w-3" />
        </Link>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="text-indigo-400 hover:text-indigo-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

function AppShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isApp = useIsAppShell(pathname);
  const isAdminArea = pathname?.startsWith("/admin") ?? false;

  const sub = useSubscription();

  useEffect(() => {
    if (!isApp || pathname === "/onboarding") return;
    fetch("/api/onboarding/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d?.profile && d.profile.onboarding_completed === false) {
          router.push("/onboarding");
        }
      })
      .catch(() => {});
  }, [isApp, pathname, router]);

  if (!isApp) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-0 min-w-0 w-full max-w-[100vw] flex-1 overflow-hidden bg-[#F8FAFC]">
      <Sidebar variant={isAdminArea ? "admin" : "default"} />
      {/* Full-width scroll column */}
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-contain">
        <div className="mx-auto w-full min-w-0 max-w-[1600px] flex-1 px-3 py-5 sm:px-4 sm:py-6 md:px-6 lg:px-8 lg:py-8">
          {sub?.isDemoMode && !sub?.isAdmin && <DemoBanner />}

          <AnimatePresence>
            {sub?.isTrialing && !sub?.isAdmin && <TrialBanner />}
          </AnimatePresence>

          {children}
        </div>
        <Footer variant="app" />
      </main>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SubscriptionProvider>
      <AppShellInner>{children}</AppShellInner>
    </SubscriptionProvider>
  );
}
