import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

function extractStripeCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined
): string | null {
  if (customer == null) return null;
  if (typeof customer === "string" && customer.length > 0) return customer;
  if (typeof customer === "object" && "deleted" in customer && customer.deleted) return null;
  if (typeof customer === "object" && customer !== null && "id" in customer) {
    const id = (customer as { id?: string }).id;
    return typeof id === "string" && id.length > 0 ? id : null;
  }
  return null;
}

export async function POST() {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret?.trim()) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const stripe = new Stripe(secret, { apiVersion: "2026-03-25.dahlia" });

  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: row, error } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id, stripe_subscription_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[stripe/portal] subscriptions select", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let customerId =
    typeof row?.stripe_customer_id === "string" && row.stripe_customer_id.trim().length > 0
      ? row.stripe_customer_id.trim()
      : null;

  if (!customerId && row?.stripe_subscription_id) {
    try {
      const sub = await stripe.subscriptions.retrieve(row.stripe_subscription_id);
      customerId = extractStripeCustomerId(sub.customer);
    } catch (e) {
      console.error("[stripe/portal] subscriptions.retrieve", e);
    }
  }

  if (!customerId) {
    return NextResponse.json(
      { error: "No Stripe customer found for this account." },
      { status: 404 }
    );
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "http://localhost:3000";

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/app/billing`,
    });
    if (!session.url) {
      return NextResponse.json({ error: "Stripe did not return a portal URL." }, { status: 502 });
    }
    return NextResponse.json({ url: session.url });
  } catch (e) {
    const message = e instanceof Stripe.errors.StripeError ? e.message : "Could not open billing portal.";
    console.error("[stripe/portal]", e);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
