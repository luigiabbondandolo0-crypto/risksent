export type Plan = "user" | "trial" | "new_trader" | "experienced" | "admin";
export type SubStatus = "active" | "trialing" | "past_due" | "canceled" | "incomplete";

/**
 * Paid Stripe tiers keep access while status is active/past_due/trialing (including
 * cancel_at_period_end until Stripe moves the subscription to canceled). If status
 * is canceled but the row still shows a paid plan briefly, access ends when
 * current_period_end is reached (must resubscribe manually after that).
 */
export function paidPlanHasEntitlement(status: SubStatus, currentPeriodEnd: string | null): boolean {
  if (status === "active" || status === "past_due" || status === "trialing") {
    return true;
  }
  if (status === "canceled") {
    if (!currentPeriodEnd) return false;
    return Date.now() < new Date(currentPeriodEnd).getTime();
  }
  if (status === "incomplete") return false;
  return false;
}

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
  plan: Plan | "free",
  status: SubStatus,
  trialEndsAt: string | null,
  trialUsed = false
): SubscriptionInfo {
  // Stripe webhook sets plan "free" when the subscription ends; treat as demo ("user").
  const effectivePlan: Plan = plan === "free" ? "user" : plan;

  const isTrialingPlan = status === "trialing" || effectivePlan === "trial";
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

  if (effectivePlan === "user") {
    return {
      plan: effectivePlan,
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

  if (effectivePlan === "admin") {
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
      plan: effectivePlan,
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

  if (effectivePlan === "experienced" || effectivePlan === "new_trader") {
    if (!paidPlanHasEntitlement(status, trialEndsAt)) {
      return {
        plan: "user",
        status: "canceled",
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
  }

  if (effectivePlan === "experienced") {
    return {
      plan: effectivePlan,
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
    plan: effectivePlan,
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
