/**
 * Monthly list prices in USD (billing UI, pricing page, admin MRR estimates).
 * Stripe Checkout charges whatever the linked Price IDs are — create USD prices
 * in Stripe and point STRIPE_NEW_TRADER_PRICE_ID / STRIPE_EXPERIENCED_PRICE_ID at them.
 */
export const PLAN_MONTHLY_USD = {
  new_trader: 30,
  experienced: 45,
} as const;

export function formatUsdMonthly(n: number): string {
  return `$${n % 1 === 0 ? n : n.toFixed(2)}`;
}
