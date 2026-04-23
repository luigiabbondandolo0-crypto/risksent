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
import { isAppShellPath } from "@/components/navConfig";
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
    glow: string;
    iconBox: string;
    iconColor: string;
  }
> = {
  info: {
    Icon: Info,
    stripe: "from-cyan-400 via-sky-500 to-blue-600",
    border: "border-cyan-500/35",
    glow: "shadow-[0_0_40px_-8px_rgba(34,211,238,0.35)]",
    iconBox: "border-cyan-500/40 bg-cyan-500/10",
    iconColor: "text-cyan-300",
  },
  warning: {
    Icon: AlertTriangle,
    stripe: "from-amber-400 via-orange-500 to-[#ff3c3c]",
    border: "border-amber-500/40",
    glow: "shadow-[0_0_48px_-10px_rgba(251,191,36,0.4)]",
    iconBox: "border-amber-500/45 bg-amber-500/15",
    iconColor: "text-amber-300",
  },
  success: {
    Icon: CheckCircle,
    stripe: "from-emerald-400 to-teal-500",
    border: "border-emerald-500/40",
    glow: "shadow-[0_0_40px_-8px_rgba(52,211,153,0.35)]",
    iconBox: "border-emerald-500/45 bg-emerald-500/12",
    iconColor: "text-emerald-300",
  },
  error: {
    Icon: AlertCircle,
    stripe: "from-[#ff3c3c] to-rose-600",
    border: "border-red-500/45",
    glow: "shadow-[0_0_48px_-8px_rgba(255,60,60,0.35)]",
    iconBox: "border-red-500/45 bg-red-500/12",
    iconColor: "text-red-300",
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
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className={`relative mb-4 overflow-hidden rounded-2xl border bg-[#0a0a0c]/90 backdrop-blur-xl ${v.border} ${v.glow}`}
    >
      <div
        className={`absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b ${v.stripe}`}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 -top-24 h-48 w-48 rounded-full opacity-[0.12] blur-3xl"
        style={{
          background:
            kind === "warning"
              ? "linear-gradient(135deg, #ff8c00, #ff3c3c)"
              : kind === "error"
                ? "linear-gradient(135deg, #ff3c3c, #991b1b)"
                : kind === "success"
                  ? "linear-gradient(135deg, #34d399, #0d9488)"
                  : "linear-gradient(135deg, #22d3ee, #3b82f6)",
        }}
      />
      <div className="relative flex items-start gap-4 pl-5 pr-3 py-4 sm:pl-6 sm:pr-4 sm:py-5">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${v.iconBox}`}
        >
          <Icon className={`h-5 w-5 ${v.iconColor}`} strokeWidth={2.25} />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-slate-400">
              <Bell className="h-3 w-3 text-amber-400/90" />
              Announcement
            </span>
          </div>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold leading-snug tracking-tight text-white sm:text-xl">
            {ann.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300 font-mono sm:text-[15px]">
            {ann.message}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss announcement"
          className="shrink-0 rounded-xl border border-white/[0.1] bg-white/[0.04] p-2.5 text-slate-400 transition-all hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
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
      className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm"
    >
      <span className="font-mono text-emerald-200">
        Free trial active —{" "}
        <strong>{days} day{days !== 1 ? "s" : ""} remaining</strong>
      </span>
      <div className="flex items-center gap-2">
        <Link
          href="/pricing"
          className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 px-3 py-1 text-xs font-mono text-emerald-300 transition-all hover:text-white"
        >
          Choose a plan
          <ArrowRight className="h-3 w-3" />
        </Link>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="text-emerald-500 hover:text-emerald-300 transition-colors"
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
  const isApp = isAppShellPath(pathname);
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
    <div className="flex min-h-0 min-w-0 w-full max-w-[100vw] flex-1 overflow-hidden">
      <Sidebar variant={isAdminArea ? "admin" : "default"} />
      {/* Full-width scroll column so wheel/trackpad on side gutters still scrolls page content */}
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-contain">
        <div className="mx-auto w-full min-w-0 max-w-[1600px] flex-1 px-3 py-5 sm:px-4 sm:py-6 md:px-6 lg:px-8 lg:py-8">
          {/* Demo banner (not dismissible at shell level — handled inside component) */}
          {sub?.isDemoMode && !sub?.isAdmin && <DemoBanner />}

          {/* Trial countdown banner */}
          <AnimatePresence>
            {sub?.isTrialing && !sub?.isAdmin && <TrialBanner />}
          </AnimatePresence>

          {/* Announcement banners */}
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
