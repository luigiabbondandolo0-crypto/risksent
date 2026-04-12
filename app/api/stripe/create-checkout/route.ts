import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

function priceIdFromPlan(plan: string): string {
  if (plan === "new_trader") return process.env.STRIPE_NEW_TRADER_PRICE_ID ?? "";
  if (plan === "experienced") return process.env.STRIPE_EXPERIENCED_PRICE_ID ?? "";
  return "";
}

function checkoutPaymentMethodTypes(): ("card" | "paypal")[] {
  if (process.env.STRIPE_CHECKOUT_ENABLE_PAYPAL === "true") {
    return ["card", "paypal"];
  }
  return ["card"];
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret?.trim()) {
    return NextResponse.json({ error: "Stripe is not configured (missing STRIPE_SECRET_KEY)." }, { status: 503 });
  }

  const stripe = new Stripe(secret, { apiVersion: "2026-03-25.dahlia" });

  try {
    const supabase = await createSupabaseRouteClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json()) as { plan: string };
    const { plan } = body;

    if (!plan) return NextResponse.json({ error: "Missing plan" }, { status: 400 });

    const priceId = priceIdFromPlan(plan);
    if (!priceId) {
      return NextResponse.json({ error: "Invalid plan or missing price env var" }, { status: 400 });
    }

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    let customerId = sub?.stripe_customer_id as string | undefined;

    if (!customerId) {
      const { data: profile } = await supabase
        .from("app_user")
        .select("full_name")
        .eq("id", user.id)
        .limit(1)
        .maybeSingle();

      const customer = await stripe.customers.create({
        email: user.email,
        name: (profile?.full_name as string | null) ?? undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: checkoutPaymentMethodTypes(),
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/app/dashboard?upgraded=true`,
      cancel_url: `${baseUrl}/pricing`,
      metadata: { user_id: user.id, plan },
      subscription_data: { metadata: { user_id: user.id, plan } },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Stripe.errors.StripeError ? err.message : "Checkout failed.";
    const status = err instanceof Stripe.errors.StripeInvalidRequestError ? 400 : 502;
    console.error("[create-checkout]", err);
    return NextResponse.json({ error: message }, { status });
  }
}
