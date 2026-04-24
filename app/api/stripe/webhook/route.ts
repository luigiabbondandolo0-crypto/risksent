import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { sendPlanPurchasedEmail } from "@/lib/email";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

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

/** Stripe exposes period bounds as Unix seconds; they can be missing right after checkout. */
function stripePeriodSecondsToIso(seconds: unknown): string | null {
  if (seconds == null) return null;
  const n = typeof seconds === "number" ? seconds : Number(seconds);
  if (!Number.isFinite(n)) return null;
  const d = new Date(n * 1000);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function stripeCustomerId(
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

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-03-25.dahlia" });

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

      const customerId =
        stripeCustomerId(session.customer) ??
        (rawSub ? stripeCustomerId(rawSub.customer) : null);

      const periodStart = sub
        ? stripePeriodSecondsToIso(sub.current_period_start)
        : null;
      const periodEnd = sub
        ? stripePeriodSecondsToIso(sub.current_period_end)
        : null;

      await supabase.from("subscriptions").upsert(
        {
          user_id: userId,
          ...(customerId ? { stripe_customer_id: customerId } : {}),
          stripe_subscription_id: sub?.id ?? null,
          stripe_price_id: sub?.items.data[0]?.price.id ?? null,
          plan,
          status: sub?.status ?? "active",
          current_period_start: periodStart,
          current_period_end: periodEnd,
          cancel_at_period_end: sub?.cancel_at_period_end ?? false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      if (plan === "new_trader" || plan === "experienced") {
        void (async () => {
          try {
            const admin = createSupabaseAdmin();
            const { data: authRes, error: authErr } = await admin.auth.admin.getUserById(userId);
            if (authErr || !authRes?.user?.email) return;
            const u = authRes.user;
            await sendPlanPurchasedEmail({
              to: u.email!,
              userName: (u.user_metadata?.full_name as string | undefined) || undefined,
              planKey: plan,
            });
          } catch (e) {
            console.error("[stripe/webhook] plan-purchased email:", e);
          }
        })();
      }
      break;
    }

    case "customer.subscription.updated": {
      const stripeSub = event.data.object as Stripe.Subscription;
      const sub = toSubShape(stripeSub);
      const userId = sub.metadata?.user_id;
      if (!userId) break;

      const priceId = sub.items.data[0]?.price.id ?? "";
      const plan = planFromPriceId(priceId);
      const customerId = stripeCustomerId(stripeSub.customer);

      await supabase.from("subscriptions").upsert(
        {
          user_id: userId,
          ...(customerId ? { stripe_customer_id: customerId } : {}),
          stripe_subscription_id: sub.id,
          stripe_price_id: priceId,
          plan,
          status: sub.status,
          current_period_start: stripePeriodSecondsToIso(sub.current_period_start),
          current_period_end: stripePeriodSecondsToIso(sub.current_period_end),
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
