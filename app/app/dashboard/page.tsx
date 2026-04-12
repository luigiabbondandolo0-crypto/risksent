"use client";

import { useEffect } from "react";
import { useRefreshSubscription, useSubscription } from "@/lib/subscription/SubscriptionContext";
import { DemoDashboard } from "@/components/demo/DemoDashboard";
import RealDashboard from "../../dashboard/page";

export default function DashboardPage() {
  const sub = useSubscription();
  const refreshSubscription = useRefreshSubscription();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const upgraded = new URLSearchParams(window.location.search).get("upgraded");
    if (upgraded === "true") {
      void refreshSubscription();
    }
  }, [refreshSubscription]);

  // While subscription is loading, show real dashboard shell (it has its own loading states)
  if (sub?.isDemoMode) {
    return <DemoDashboard />;
  }

  return <RealDashboard />;
}
