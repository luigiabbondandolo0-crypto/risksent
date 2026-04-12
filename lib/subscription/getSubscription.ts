import { createSupabaseRouteClient } from "@/lib/supabase/server";

export type Plan = "user" | "trial" | "new_trader" | "experienced" | "admin";
export type SubStatus = "active" | "trialing" | "past_due" | "canceled" | "incomplete";

export type SubscriptionInfo = {
  plan: Plan;
  status: SubStatus;
  isDemoMode: boolean;
  isTrialing: boolean;
  trialDaysLeft: number | null;
  canAccessBacktesting: boolean;
  canAccessAICoach: boolean;
  canAccessRiskManager: boolean;
  maxBrokerAccounts: number | null;
  maxBacktestingSessions: number | null;
  trialEndsAt: string | null;
  /** Set only by client fetch: false = not logged in (401). */
  authenticated?: boolean;
  /** Client fetch failed (network or non-OK response). */
  subscriptionFetchFailed?: boolean;
  /** Admin users get full app UX; client sets plan to "admin" for UI (billing still uses Stripe API). */
  isAdmin?: boolean;
};

// Keep legacy alias for any existing imports
export type SubscriptionCapabilities = SubscriptionInfo;

function capsForPlan(plan: Plan, status: SubStatus, trialEndsAt: string | null): SubscriptionInfo {
  const isTrialing = status === "trialing" || plan === "trial";
  const trialDaysLeft =
    trialEndsAt
      ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86_400_000))
      : null;

  if (plan === "user") {
    return {
      plan,
      status,
      isDemoMode: true,
      isTrialing: false,
      trialDaysLeft: null,
      canAccessBacktesting: false,
      canAccessAICoach: false,
      canAccessRiskManager: false,
      maxBrokerAccounts: 0,
      maxBacktestingSessions: 0,
      trialEndsAt: null,
    };
  }

  if (plan === "admin") {
    return {
      plan: "admin",
      status: "active",
      isDemoMode: false,
      isTrialing: false,
      trialDaysLeft: null,
      canAccessBacktesting: true,
      canAccessAICoach: true,
      canAccessRiskManager: true,
      maxBrokerAccounts: null,
      maxBacktestingSessions: null,
      trialEndsAt: null,
      isAdmin: true,
    };
  }

  if (isTrialing) {
    return {
      plan,
      status,
      isDemoMode: false,
      isTrialing: true,
      trialDaysLeft,
      canAccessBacktesting: true,
      canAccessAICoach: true,
      canAccessRiskManager: true,
      maxBrokerAccounts: null,
      maxBacktestingSessions: null,
      trialEndsAt,
    };
  }

  if (plan === "experienced") {
    return {
      plan,
      status,
      isDemoMode: false,
      isTrialing: false,
      trialDaysLeft: null,
      canAccessBacktesting: true,
      canAccessAICoach: true,
      canAccessRiskManager: true,
      maxBrokerAccounts: null,
      maxBacktestingSessions: null,
      trialEndsAt: null,
    };
  }

  // new_trader
  return {
    plan,
    status,
    isDemoMode: false,
    isTrialing: false,
    trialDaysLeft: null,
    canAccessBacktesting: true,
    canAccessAICoach: false,
    canAccessRiskManager: false,
    maxBrokerAccounts: 1,
    maxBacktestingSessions: 2,
    trialEndsAt: null,
  };
}

export async function getSubscription(): Promise<SubscriptionInfo> {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return capsForPlan("user", "active", null);
  }

  const { data } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end")
    .eq("user_id", user.id)
    .single();

  if (!data) {
    return capsForPlan("user", "active", null);
  }

  const plan = (data.plan as Plan) ?? "user";
  const status = (data.status as SubStatus) ?? "active";
  const trialEndsAt = (data.current_period_end as string | null) ?? null;

  return capsForPlan(plan, status, trialEndsAt);
}
