import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdminRole } from "@/lib/adminAuth";
import { sendPromotionalEmail } from "@/lib/email";

/**
 * POST /api/admin/email/promo
 *
 * Sends a promotional email to all users (or a subset).
 * Admin-only. Body:
 * {
 *   headline: string
 *   description: string
 *   discountLabel: string   // e.g. "30% off"
 *   promoCode?: string
 *   expiryLabel?: string
 *   ctaLabel?: string
 *   ctaUrl?: string
 *   dryRun?: boolean
 *   segment?: "all" | "trialing" | "paid"
 * }
 */
export async function POST(req: NextRequest) {
  const { isAdmin } = await checkAdminRole();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.headline || !body.description || !body.discountLabel) {
    return NextResponse.json(
      { error: "headline, description, discountLabel are required" },
      { status: 400 }
    );
  }

  const {
    headline,
    description,
    discountLabel,
    promoCode,
    expiryLabel,
    ctaLabel,
    ctaUrl,
    dryRun = false,
    segment = "all",
  } = body as {
    headline: string;
    description: string;
    discountLabel: string;
    promoCode?: string;
    expiryLabel?: string;
    ctaLabel?: string;
    ctaUrl?: string;
    dryRun?: boolean;
    segment?: "all" | "trialing" | "paid";
  };

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: usersData, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) {
    return NextResponse.json({ error: listErr.message }, { status: 500 });
  }

  let recipients = usersData.users.filter((u) => u.email);

  if (segment !== "all") {
    const { data: subs } = await admin
      .from("subscriptions")
      .select("user_id, status, plan");

    const subMap = new Map((subs ?? []).map((s: { user_id: string; status: string; plan: string }) => [s.user_id, s]));

    recipients = recipients.filter((u) => {
      const sub = subMap.get(u.id);
      if (segment === "trialing") return sub?.status === "trialing";
      if (segment === "paid") return sub?.status === "active";
      return true;
    });
  }

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      count: recipients.length,
      emails: recipients.map((u) => u.email),
    });
  }

  const results: Array<{ email: string; ok: boolean; error?: string }> = [];

  for (const user of recipients) {
    if (!user.email) continue;
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const userName =
      (typeof meta.full_name === "string" && meta.full_name) ||
      (typeof meta.name === "string" && meta.name) ||
      undefined;

    const r = await sendPromotionalEmail({
      to: user.email,
      userName,
      headline,
      description,
      discountLabel,
      promoCode,
      expiryLabel,
      ctaLabel,
      ctaUrl,
    });

    results.push({ email: user.email, ok: r.success, error: r.error });
  }

  return NextResponse.json({
    sent: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
}
