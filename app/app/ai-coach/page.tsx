"use client";

import { useSubscription } from "@/lib/subscription/SubscriptionContext";
import { DemoAiCoach } from "@/components/demo/DemoAiCoach";
import { AiCoachPageClient } from "@/components/ai-coach/AiCoachPageClient";

export default function AiCoachPage() {
  const sub = useSubscription();

  if (sub?.isDemoMode) {
    return <DemoAiCoach />;
  }

  return <AiCoachPageClient />;
}
