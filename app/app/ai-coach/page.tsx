"use client";

import { useSubscription } from "@/lib/subscription/SubscriptionContext";
import { AiCoachPageClient } from "@/components/ai-coach/AiCoachPageClient";

export default function AiCoachPage() {
  const sub = useSubscription();

  if (sub?.isDemoMode) {
    return (
      <div className="pointer-events-none select-none opacity-50 blur-[1.5px]">
        <AiCoachPageClient isMock />
      </div>
    );
  }

  return <AiCoachPageClient />;
}
