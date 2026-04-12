import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-03-31.basil" });

function priceIdFromPlan(plan: string): string {
  if (plan === "new_trader") return process.env.STRIPE_NEW_TRADER_PRICE_ID ?? "";
  if (plan === "experienced") return process.env.STRIPE_EXPERIENCED_PRICE_ID ?? "";
  return "";
}

export async function POST(req: Request) {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { plan: string };
  const { plan } = body;

  if (!plan) return NextResponse.json({ error: "Missing plan" }, { status: 400 });

  const priceId = priceIdFromPlan(plan);
  if (!priceId) return NextResponse.json({ error: "Invalid plan or missing price env var" }, { status: 400 });

  // Get or create Stripe customer
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  let customerId = sub?.stripe_customer_id as string | undefined;

  if (!customerId) {
    const { data: profile } = await supabase
      .from("app_user")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const customer = await stripe.customers.create({
      email: user.email,
      name: (profile?.full_name as string | null) ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card", "paypal"],
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/app/dashboard?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/pricing`,
    metadata: { user_id: user.id, plan },
    subscription_data: { metadata: { user_id: user.id, plan } },
  });

  return NextResponse.json({ url: session.url });
}
