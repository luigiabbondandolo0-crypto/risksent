import type { SubscriptionInfo, Plan, SubStatus } from "./getSubscription";

export type { SubscriptionInfo, Plan, SubStatus };

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

export async function getSubscriptionClient(): Promise<SubscriptionInfo> {
  try {
    const res = await fetch("/api/stripe/subscription");
    if (res.status === 401) {
      return { ...capsForPlan("user", "active", null), authenticated: false };
    }
    if (!res.ok) {
      return { ...capsForPlan("user", "active", null), subscriptionFetchFailed: true };
    }
    const d = (await res.json()) as {
      subscription?: { plan: Plan; status: SubStatus; current_period_end: string | null };
    };
    const sub = d.subscription;
    if (!sub) return { ...capsForPlan("user", "active", null), authenticated: true };
    return {
      ...capsForPlan(sub.plan, sub.status, sub.current_period_end ?? null),
      authenticated: true
    };
  } catch {
    return { ...capsForPlan("user", "active", null), subscriptionFetchFailed: true };
  }
}
