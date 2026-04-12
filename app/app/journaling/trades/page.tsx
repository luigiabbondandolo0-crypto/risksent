"use client";

import { useSubscription } from "@/lib/subscription/SubscriptionContext";
import { DemoJournaling } from "@/components/demo/DemoJournaling";
import { JournalTradesPageClient } from "@/components/journal/JournalTradesPageClient";

export default function JournalingTradesPage() {
  const sub = useSubscription();

  if (sub?.isDemoMode) {
    return <DemoJournaling />;
  }

  return <JournalTradesPageClient />;
}
