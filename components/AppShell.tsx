"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { isAppShellPath } from "@/components/navConfig";

type AnnouncementRow = {
  id: string;
  title: string;
  message: string;
  type: string;
};

const BANNER_STYLE: Record<string, string> = {
  info: "border-blue-500/20 bg-blue-500/10 text-blue-200",
  warning: "border-amber-500/20 bg-amber-500/10 text-amber-200",
  success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
  error: "border-red-500/20 bg-red-500/10 text-red-200",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isApp = isAppShellPath(pathname);
  const isAdminArea = pathname?.startsWith("/admin") ?? false;

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
    <div className="flex min-h-0 w-full flex-1">
      <Sidebar variant={isAdminArea ? "admin" : "default"} />
      <main className="mx-auto flex w-full min-w-0 max-w-[1600px] flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <AnimatePresence>
          {visible.map((ann) => (
            <motion.div
              key={ann.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`mb-4 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${BANNER_STYLE[ann.type] ?? BANNER_STYLE.info}`}
            >
              <span>
                <strong>{ann.title}</strong> — {ann.message}
              </span>
              <button
                onClick={() => setDismissed((prev) => new Set([...prev, ann.id]))}
                aria-label="Dismiss"
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {children}
      </main>
    </div>
  );
}
