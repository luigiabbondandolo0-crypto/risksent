import { createSupabaseRouteClient } from "@/lib/supabase/server";
import { capsForPlan } from "./caps";
import type { Plan, SubStatus, SubscriptionInfo } from "./caps";

export type { Plan, SubStatus, SubscriptionInfo, SubscriptionCapabilities } from "./caps";
export { capsForPlan } from "./caps";

export async function getSubscription(): Promise<SubscriptionInfo> {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return capsForPlan("user", "active", null, false);
  }

  const { data } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end, trial_started_at")
    .eq("user_id", user.id)
    .single();

  if (!data) {
    return capsForPlan("user", "active", null, false);
  }

  const plan = (data.plan as Plan) ?? "user";
  const status = (data.status as SubStatus) ?? "active";
  const trialEndsAt = (data.current_period_end as string | null) ?? null;
  const trialUsed = Boolean((data as { trial_started_at?: string | null }).trial_started_at);

  return capsForPlan(plan, status, trialEndsAt, trialUsed);
}
