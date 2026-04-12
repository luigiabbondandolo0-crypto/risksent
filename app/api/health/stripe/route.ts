import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function GET() {
  const start = Date.now();
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-03-31.basil" });
    await stripe.customers.list({ limit: 1 });
    return NextResponse.json({ ok: true, ms: Date.now() - start, checkedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json({ ok: false, ms: Date.now() - start, checkedAt: new Date().toISOString() });
  }
}
