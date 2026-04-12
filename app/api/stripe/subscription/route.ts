import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

export type SubscriptionRow = {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  plan: "user" | "trial" | "new_trader" | "experienced";
  status: "active" | "trialing" | "past_due" | "canceled" | "incomplete";
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export async function GET() {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return default demo (user) plan if no subscription row exists
  const sub: SubscriptionRow = (data as SubscriptionRow | null) ?? {
    id: "",
    user_id: user.id,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    stripe_price_id: null,
    plan: "user",
    status: "active",
    current_period_start: null,
    current_period_end: null,
    cancel_at_period_end: false,
    created_at: null,
    updated_at: null,
  };

  return NextResponse.json({ subscription: sub });
}
