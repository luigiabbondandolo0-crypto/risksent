"use client";

import { useSubscription } from "@/lib/subscription/SubscriptionContext";
import { DemoDashboard } from "@/components/demo/DemoDashboard";
import RealDashboard from "../../dashboard/page";

export default function DashboardPage() {
  const sub = useSubscription();

  // While subscription is loading, show real dashboard shell (it has its own loading states)
  if (sub?.isDemoMode) {
    return <DemoDashboard />;
  }

  return <RealDashboard />;
}
