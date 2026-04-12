import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

export async function POST() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-03-25.dahlia" });

  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  const customerId = sub?.stripe_customer_id;
  if (!customerId) {
    return NextResponse.json({ error: "No Stripe customer found" }, { status: 404 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/app/billing`,
  });

  return NextResponse.json({ url: session.url });
}
