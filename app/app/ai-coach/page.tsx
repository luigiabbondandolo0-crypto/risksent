"use client";

import Link from "next/link";
import { useSubscription } from "@/lib/subscription/SubscriptionContext";
import { AiCoachPageClient } from "@/components/ai-coach/AiCoachPageClient";

export default function AiCoachPage() {
  const sub = useSubscription();

  if (sub?.isDemoMode) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="text-4xl">🤖</p>
        <h2 className="text-xl font-bold text-white">AI Coach is not included in your plan</h2>
        <p className="max-w-sm text-sm text-slate-400">
          Upgrade to the Experienced plan to get personalised trading psychology reports and chat with your data.
        </p>
        <Link
          href="/app/billing"
          className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
        >
          Upgrade plan
        </Link>
      </div>
    );
  }

  return <AiCoachPageClient />;
}
