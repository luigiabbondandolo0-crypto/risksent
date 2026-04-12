import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-03-25.dahlia" });

// Service role client (bypasses RLS) for webhook writes
function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// Local shape that covers the subscription fields we actually use.
// Casting through unknown lets us access period fields regardless of the
// SDK's exact generic wrapper type for this API version.
type SubShape = {
  id: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  metadata: Record<string, string>;
  items: { data: { price: { id: string } }[] };
};

function toSubShape(s: unknown): SubShape {
  return s as SubShape;
}

function planFromPriceId(priceId: string): "new_trader" | "experienced" | "free" {
  if (priceId === process.env.STRIPE_NEW_TRADER_PRICE_ID) return "new_trader";
  if (priceId === process.env.STRIPE_EXPERIENCED_PRICE_ID) return "experienced";
  return "free";
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json({ error: `Webhook error: ${String(err)}` }, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const plan = session.metadata?.plan ?? "free";
      if (!userId) break;

      const rawSub = session.subscription
        ? await stripe.subscriptions.retrieve(session.subscription as string)
        : null;
      const sub = rawSub ? toSubShape(rawSub) : null;

      await supabase.from("subscriptions").upsert(
        {
          user_id: userId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: sub?.id ?? null,
          stripe_price_id: sub?.items.data[0]?.price.id ?? null,
          plan,
          status: sub?.status ?? "active",
          current_period_start: sub
            ? new Date(sub.current_period_start * 1000).toISOString()
            : null,
          current_period_end: sub
            ? new Date(sub.current_period_end * 1000).toISOString()
            : null,
          cancel_at_period_end: sub?.cancel_at_period_end ?? false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
      break;
    }

    case "customer.subscription.updated": {
      const sub = toSubShape(event.data.object);
      const userId = sub.metadata?.user_id;
      if (!userId) break;

      const priceId = sub.items.data[0]?.price.id ?? "";
      const plan = planFromPriceId(priceId);

      await supabase.from("subscriptions").upsert(
        {
          user_id: userId,
          stripe_subscription_id: sub.id,
          stripe_price_id: priceId,
          plan,
          status: sub.status,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
      break;
    }

    case "customer.subscription.deleted": {
      const sub = toSubShape(event.data.object);
      const userId = sub.metadata?.user_id;
      if (!userId) break;

      await supabase.from("subscriptions").upsert(
        {
          user_id: userId,
          plan: "free",
          status: "canceled",
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as unknown as { subscription?: string | null };
      const subId = invoice.subscription ?? null;
      if (!subId) break;

      await supabase
        .from("subscriptions")
        .update({ status: "past_due", updated_at: new Date().toISOString() })
        .eq("stripe_subscription_id", subId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
