import Stripe from "stripe";

/** Keep Stripe API version in one place so routes and jobs stay aligned. */
export const STRIPE_API_VERSION = "2026-03-25.dahlia";

export function createStripe(secretKey: string): Stripe {
  return new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION });
}
