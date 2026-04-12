"use client";

import { Suspense } from "react";
import { useSubscription } from "@/lib/subscription/SubscriptionContext";
import { DemoJournaling } from "@/components/demo/DemoJournaling";
import { JournalingPageClient } from "@/components/journal/JournalingPageClient";

export default function JournalingPage() {
  const sub = useSubscription();

  if (sub?.isDemoMode) {
    return <DemoJournaling />;
  }

  return (
    <Suspense fallback={<p className="font-mono text-sm text-slate-500">Loading…</p>}>
      <JournalingPageClient />
    </Suspense>
  );
}
