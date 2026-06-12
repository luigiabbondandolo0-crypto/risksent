"use client";

import { Suspense } from "react";
import { useSubscription } from "@/lib/subscription/SubscriptionContext";
import { JournalingPageClient } from "@/components/journal/JournalingPageClient";

function JournalSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-28 rounded-2xl bg-slate-200/70" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-slate-200/70" />
        ))}
      </div>
      <div className="h-40 rounded-2xl bg-slate-200/70" />
      <div className="h-32 rounded-2xl bg-slate-200/70" />
    </div>
  );
}

export default function JournalingPage() {
  const sub = useSubscription();

  if (sub?.isDemoMode) {
    return (
      <div className="pointer-events-none select-none opacity-50 blur-[1.5px]">
        <Suspense fallback={<JournalSkeleton />}>
          <JournalingPageClient isMock mockUseAppRoutes />
        </Suspense>
      </div>
    );
  }

  return (
    <Suspense fallback={<JournalSkeleton />}>
      <JournalingPageClient />
    </Suspense>
  );
}
