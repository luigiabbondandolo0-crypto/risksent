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
      <div className="pointer-events-none select-none opacity-50 blur-[1.5px]">
        <AiCoachPageClient
          isMock
          mockReport={buildDemoCoachReportRow()}
          mockMessages={buildDemoCoachMessages()}
        />
      </div>
    );
  }

  return <AiCoachPageClient />;
}
