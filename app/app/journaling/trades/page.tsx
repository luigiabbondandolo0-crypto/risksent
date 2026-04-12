"use client";

import { useSubscription } from "@/lib/subscription/SubscriptionContext";
import { JournalTradesPageClient } from "@/components/journal/JournalTradesPageClient";

export default function JournalingTradesPage() {
  const sub = useSubscription();

  if (sub?.isDemoMode) {
    return <JournalTradesPageClient forceDemoSeed />;
  }

  return <JournalTradesPageClient />;
}
