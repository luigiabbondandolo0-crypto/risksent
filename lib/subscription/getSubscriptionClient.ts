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

/** Full product access + no demo/trial shell UX; keeps plan/status/trial metadata for billing. */
function applyAdminSubscriptionOverrides(info: SubscriptionInfo): SubscriptionInfo {
  return {
    ...info,
    isAdmin: true,
    isDemoMode: false,
    isTrialing: false,
    canAccessBacktesting: true,
    canAccessAICoach: true,
    canAccessRiskManager: true,
    maxBrokerAccounts: null,
    maxBacktestingSessions: null,
  };
}

export async function getSubscriptionClient(): Promise<SubscriptionInfo> {
  try {
    const [subRes, roleRes] = await Promise.all([
      fetch("/api/stripe/subscription"),
      fetch("/api/admin/check-role"),
    ]);

    const roleJson = (await roleRes.json().catch(() => ({}))) as { isAdmin?: boolean };
    const isAdmin = roleJson.isAdmin === true;

    if (subRes.status === 401) {
      return { ...capsForPlan("user", "active", null), authenticated: false };
    }
    if (!subRes.ok) {
      return { ...capsForPlan("user", "active", null), subscriptionFetchFailed: true };
    }
    const d = (await subRes.json()) as {
      subscription?: { plan: Plan; status: SubStatus; current_period_end: string | null };
    };
    const sub = d.subscription;
    const base = !sub
      ? { ...capsForPlan("user", "active", null), authenticated: true as const }
      : {
          ...capsForPlan(sub.plan, sub.status, sub.current_period_end ?? null),
          authenticated: true as const,
        };

    return isAdmin ? applyAdminSubscriptionOverrides(base) : base;
  } catch {
    return { ...capsForPlan("user", "active", null), subscriptionFetchFailed: true };
  }
}
