import type { SubscriptionInfo, Plan, SubStatus } from "./caps";
import { capsForPlan } from "./caps";

export type { SubscriptionInfo, Plan, SubStatus };

/** Full product access; subscription row may still say trial — UI uses plan "admin". */
function applyAdminSubscriptionOverrides(info: SubscriptionInfo): SubscriptionInfo {
  return {
    ...info,
    plan: "admin",
    status: "active",
    isAdmin: true,
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

export async function getSubscriptionClient(): Promise<SubscriptionInfo> {
  try {
    const [subRes, roleRes] = await Promise.all([
      fetch("/api/stripe/subscription"),
      fetch("/api/admin/check-role"),
    ]);

    const roleJson = (await roleRes.json().catch(() => ({}))) as { isAdmin?: boolean };
    const isAdmin = roleJson.isAdmin === true;

    if (subRes.status === 401) {
      return { ...capsForPlan("user", "active", null, false), authenticated: false };
    }
    if (!subRes.ok) {
      return { ...capsForPlan("user", "active", null, false), subscriptionFetchFailed: true };
    }
    const d = (await subRes.json()) as {
      subscription?: {
        plan: Plan;
        status: SubStatus;
        current_period_end: string | null;
        trial_started_at?: string | null;
      };
    };
    const sub = d.subscription;
    const base = !sub
      ? { ...capsForPlan("user", "active", null, false), authenticated: true as const }
      : {
          ...capsForPlan(
            sub.plan,
            sub.status,
            sub.current_period_end ?? null,
            Boolean(sub.trial_started_at)
          ),
          authenticated: true as const,
        };

    return isAdmin ? applyAdminSubscriptionOverrides(base) : base;
  } catch {
    return { ...capsForPlan("user", "active", null, false), subscriptionFetchFailed: true };
  }
}
