"use client";

import { useSubscription } from "@/lib/subscription/SubscriptionContext";
import { AiCoachPageClient } from "@/components/ai-coach/AiCoachPageClient";
import {
  buildDemoCoachMessages,
  buildDemoCoachReportRow,
} from "@/lib/demo/demoCoachSeed";

export default function AiCoachPage() {
  const sub = useSubscription();

  if (sub?.isDemoMode) {
    return (
      <AiCoachPageClient
        isMock
        mockReport={buildDemoCoachReportRow()}
        mockMessages={buildDemoCoachMessages()}
      />
    );
  }

  return <AiCoachPageClient />;
}
