"use client";

import { useSubscription } from "@/lib/subscription/SubscriptionContext";
import { DemoBacktesting } from "@/components/demo/DemoBacktesting";
import { BacktestingDashboard } from "@/components/backtesting/BacktestingDashboard";

export default function BacktestingPage() {
  const sub = useSubscription();

  if (sub?.isDemoMode) {
    return <DemoBacktesting />;
  }

  return <BacktestingDashboard basePath="/app/backtesting" />;
}
