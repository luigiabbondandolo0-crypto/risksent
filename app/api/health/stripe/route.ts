import { NextResponse } from "next/server";
import { createStripe } from "@/lib/stripe/client";

export async function GET() {
  const start = Date.now();
  try {
    const stripe = createStripe(process.env.STRIPE_SECRET_KEY!);
    await stripe.customers.list({ limit: 1 });
    return NextResponse.json({ ok: true, ms: Date.now() - start, checkedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json({ ok: false, ms: Date.now() - start, checkedAt: new Date().toISOString() });
  }
}
