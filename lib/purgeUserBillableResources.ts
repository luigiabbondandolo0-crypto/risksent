import type { SupabaseClient } from "@supabase/supabase-js";
import { createStripe } from "@/lib/stripe/client";
import { deleteProvisionedMetaTraderAccount } from "@/lib/metaapiProvisioning";
import { normalizeMetaApiToken } from "@/lib/metaapiTokenNormalize";

/**
 * Before removing a Supabase auth user, tear down paid integrations:
 * - Stripe subscription (stop recurring charges)
 * - MetaApi provisioned MT accounts (stop host-side billing)
 */
export async function purgeUserBillableResources(
  admin: SupabaseClient,
  userId: string
): Promise<{ warnings: string[] }> {
  const warnings: string[] = [];

  const { data: subRow } = await admin
    .from("subscriptions")
    .select("stripe_subscription_id, stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();

  const subId =
    subRow && typeof (subRow as { stripe_subscription_id?: string }).stripe_subscription_id === "string"
      ? (subRow as { stripe_subscription_id: string }).stripe_subscription_id.trim()
      : "";

  const customerId =
    subRow && typeof (subRow as { stripe_customer_id?: string }).stripe_customer_id === "string"
      ? (subRow as { stripe_customer_id: string }).stripe_customer_id.trim()
      : "";

  const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim();
  if (stripeSecret) {
    const stripe = createStripe(stripeSecret);

    if (subId) {
      try {
        await stripe.subscriptions.cancel(subId);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!/No such subscription/i.test(msg) && !/already been canceled/i.test(msg)) {
          warnings.push(`stripe subscription: ${msg}`);
        }
      }
    }

    // Delete the Stripe customer to remove stored payment methods
    if (customerId) {
      try {
        await stripe.customers.del(customerId);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!/No such customer/i.test(msg)) {
          warnings.push(`stripe customer: ${msg}`);
        }
      }
    }
  }

  const metaIds = new Set<string>();

  const { data: journals } = await admin.from("journal_account").select("metaapi_account_id").eq("user_id", userId);
  for (const row of journals ?? []) {
    const id = (row as { metaapi_account_id?: string | null }).metaapi_account_id?.trim();
    if (id) metaIds.add(id);
  }

  const { data: trading } = await admin.from("trading_account").select("metaapi_account_id").eq("user_id", userId);
  for (const row of trading ?? []) {
    const id = (row as { metaapi_account_id?: string | null }).metaapi_account_id?.trim();
    if (id) metaIds.add(id);
  }

  if (normalizeMetaApiToken(process.env.METAAPI_TOKEN)) {
    for (const metaId of metaIds) {
      try {
        const ok = await deleteProvisionedMetaTraderAccount(metaId);
        if (!ok) {
          warnings.push(`metaapi: delete returned false for ${metaId}`);
        }
      } catch (e) {
        warnings.push(
          `metaapi ${metaId}: ${e instanceof Error ? e.message : String(e)}`
        );
      }
    }
  }

  return { warnings };
}
