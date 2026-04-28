import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdminRole } from "@/lib/adminAuth";
import { sendMarketingEmail } from "@/lib/email";

/**
 * POST /api/admin/email/broadcast
 *
 * Sends a marketing email to all users (or a filtered subset).
 * Admin-only. Body:
 * {
 *   subject: string
 *   headline: string
 *   body: string
 *   ctaLabel?: string
 *   ctaUrl?: string
 *   dryRun?: boolean  // if true, returns recipient list without sending
 *   segment?: "all" | "trialing" | "paid"  // default "all"
 * }
 */
export async function POST(req: NextRequest) {
  const { isAdmin } = await checkAdminRole();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.subject || !body.headline || !body.body) {
    return NextResponse.json(
      { error: "subject, headline, body are required" },
      { status: 400 }
    );
  }

  const { subject, headline, body: emailBody, ctaLabel, ctaUrl, dryRun = false, segment = "all" } = body as {
    subject: string;
    headline: string;
    body: string;
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

  // Fetch users via auth admin API
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

    const r = await sendMarketingEmail({
      to: user.email,
      userName,
      subject,
      headline,
      body: emailBody,
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
