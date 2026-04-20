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
  /** True if the user has ever started a free trial (prevents starting another). */
  trialUsed: boolean;
  /** Set only by client fetch: false = not logged in (401). */
  authenticated?: boolean;
  /** Client fetch failed (network or non-OK response). */
  subscriptionFetchFailed?: boolean;
  /** Admin users get full app UX; client sets plan to "admin" for UI (billing still uses Stripe API). */
  isAdmin?: boolean;
};

export function capsForPlan(
  plan: Plan,
  status: SubStatus,
  trialEndsAt: string | null,
  trialUsed = false
): SubscriptionInfo {
  const isTrialingPlan = status === "trialing" || plan === "trial";
  const trialMsLeft = trialEndsAt ? new Date(trialEndsAt).getTime() - Date.now() : null;
  const trialExpired = isTrialingPlan && trialMsLeft !== null && trialMsLeft <= 0;
  const trialDaysLeft =
    trialEndsAt
      ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86_400_000))
      : null;

  // Trial row exists in DB but the window has expired → behave as demo user.
  // The DB row is left alone (Stripe webhook / backend sync owns that); we
  // just make sure the UI and gating no longer grant paid access.
  if (trialExpired) {
    return {
      plan: "user",
      status: "canceled",
      isDemoMode: true,
      isTrialing: false,
      trialDaysLeft: 0,
      canAccessBacktesting: false,
      canAccessAICoach: false,
      canAccessRiskManager: false,
      maxBrokerAccounts: 0,
      maxBacktestingSessions: 0,
      trialEndsAt,
      trialUsed: true,
    };
  }

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
      trialUsed,
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
      trialUsed,
      isAdmin: true,
    };
  }

  if (isTrialingPlan) {
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
      trialUsed: true,
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
      trialUsed,
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
    trialUsed,
  };
}

// Keep legacy alias for any existing imports
export type SubscriptionCapabilities = SubscriptionInfo;
