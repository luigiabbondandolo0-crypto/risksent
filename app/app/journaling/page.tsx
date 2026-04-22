"use client";

import { Suspense } from "react";
import { useSubscription } from "@/lib/subscription/SubscriptionContext";
import { JournalingPageClient } from "@/components/journal/JournalingPageClient";

export default function JournalingPage() {
  const sub = useSubscription();

  if (sub?.isDemoMode) {
    return (
      <div className="pointer-events-none select-none opacity-50 blur-[1.5px]">
        <Suspense fallback={<p className="font-mono text-sm text-slate-500">Loading…</p>}>
          <JournalingPageClient isMock mockUseAppRoutes />
        </Suspense>
      </div>
    );
  }

  return (
    <Suspense fallback={<p className="font-mono text-sm text-slate-500">Loading…</p>}>
      <JournalingPageClient />
    </Suspense>
  );
}
