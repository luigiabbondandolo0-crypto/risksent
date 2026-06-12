"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  ArrowRight,
  Bell,
  Info,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { useIsAppShell } from "@/lib/AppDomainContext";
import { SubscriptionProvider, useSubscription } from "@/lib/subscription/SubscriptionContext";
import { DemoBanner } from "@/components/demo/DemoBanner";
import { Footer } from "@/components/Footer";

type AnnouncementRow = {
  id: string;
  title: string;
  message: string;
  type: string;
};

type AnnType = "info" | "warning" | "success" | "error";

const ANNOUNCEMENT_VARIANT: Record<
  AnnType,
  {
    Icon: typeof Info;
    stripe: string;
    border: string;
    bg: string;
    iconBox: string;
    iconColor: string;
    titleColor: string;
    bodyColor: string;
  }
> = {
  info: {
    Icon: Info,
    stripe: "from-blue-500 to-cyan-500",
    border: "border-blue-200",
    bg: "bg-blue-50",
    iconBox: "border-blue-200 bg-blue-100",
    iconColor: "text-blue-600",
    titleColor: "text-blue-900",
    bodyColor: "text-blue-700",
  },
  warning: {
    Icon: AlertTriangle,
    stripe: "from-amber-400 to-orange-500",
    border: "border-amber-200",
    bg: "bg-amber-50",
    iconBox: "border-amber-200 bg-amber-100",
    iconColor: "text-amber-600",
    titleColor: "text-amber-900",
    bodyColor: "text-amber-700",
  },
  success: {
    Icon: CheckCircle,
    stripe: "from-emerald-400 to-teal-500",
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    iconBox: "border-emerald-200 bg-emerald-100",
    iconColor: "text-emerald-600",
    titleColor: "text-emerald-900",
    bodyColor: "text-emerald-700",
  },
  error: {
    Icon: AlertCircle,
    stripe: "from-red-500 to-rose-500",
    border: "border-red-200",
    bg: "bg-red-50",
    iconBox: "border-red-200 bg-red-100",
    iconColor: "text-red-600",
    titleColor: "text-red-900",
    bodyColor: "text-red-700",
  },
};

function normalizeAnnType(t: string): AnnType {
  if (t === "warning" || t === "success" || t === "error") return t;
  return "info";
}

function ActiveAnnouncementCard({
  ann,
  onDismiss,
}: {
  ann: AnnouncementRow;
  onDismiss: () => void;
}) {
  const kind = normalizeAnnType(ann.type);
  const v = ANNOUNCEMENT_VARIANT[kind];
  const Icon = v.Icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`relative mb-4 overflow-hidden rounded-xl border bg-white shadow-sm ${v.border}`}
    >
      {/* Left accent stripe */}
      <div
        className={`absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b ${v.stripe}`}
        aria-hidden
      />
      <div className="relative flex items-start gap-4 pl-5 pr-3 py-4 sm:pl-6 sm:pr-4 sm:py-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${v.iconBox}`}
        >
          <Icon className={`h-4.5 w-4.5 ${v.iconColor}`} strokeWidth={2.25} />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] ${v.iconColor} border-current/20 bg-current/5`}>
              <Bell className="h-3 w-3" />
              Announcement
            </span>
          </div>
          <h2 className={`font-[family-name:var(--font-display)] text-base font-bold leading-snug tracking-tight sm:text-lg ${v.titleColor}`}>
            {ann.title}
          </h2>
          <p className={`mt-1.5 text-sm leading-relaxed font-mono sm:text-[14px] ${v.bodyColor}`}>
            {ann.message}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss announcement"
          className="shrink-0 rounded-lg border border-slate-200 bg-white p-2 text-slate-400 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

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

  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

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

  useEffect(() => {
    if (!isApp || isAdminArea) return;
    fetch("/api/announcements/active")
      .then((r) => r.json())
      .then((d: { announcements?: AnnouncementRow[] }) => {
        setAnnouncements(d.announcements ?? []);
      })
      .catch(() => {});
  }, [isApp, isAdminArea, pathname]);

  const visible = announcements.filter((a) => !dismissed.has(a.id));

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

          <AnimatePresence mode="popLayout">
            {visible.map((ann) => (
              <ActiveAnnouncementCard
                key={ann.id}
                ann={ann}
                onDismiss={() =>
                  setDismissed((prev) => new Set([...prev, ann.id]))
                }
              />
            ))}
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
