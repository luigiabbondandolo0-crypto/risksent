"use client";

import { useSubscription } from "@/lib/subscription/SubscriptionContext";
import { BacktestingDashboard } from "@/components/backtesting/BacktestingDashboard";

export default function BacktestingPage() {
  const sub = useSubscription();

  return (
    <BacktestingDashboard
      basePath="/app/backtesting"
      subscriptionDemo={Boolean(sub?.isDemoMode)}
    />
  );
}
