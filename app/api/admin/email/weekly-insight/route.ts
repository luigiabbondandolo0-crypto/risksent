import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdminRole } from "@/lib/adminAuth";
import { sendWeeklyInsightEmail } from "@/lib/email";

/**
 * POST /api/admin/email/weekly-insight
 *
 * Sends the weekly insight newsletter to all active users.
 * Admin-only. Body:
 * {
 *   issueNumber: number
 *   traderName: string      // anonymised, e.g. "Marco T."
 *   story: string           // 2-3 sentence narrative
 *   metric: string          // e.g. "–18% drawdown → –4%"
 *   tip: string             // actionable tip
 *   tipCtaLabel?: string
 *   tipCtaUrl?: string
 *   dryRun?: boolean
 * }
 */
export async function POST(req: NextRequest) {
  const { isAdmin } = await checkAdminRole();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.issueNumber || !body.traderName || !body.story || !body.metric || !body.tip) {
    return NextResponse.json(
      { error: "issueNumber, traderName, story, metric, tip are required" },
      { status: 400 }
    );
  }

  const {
    issueNumber,
    traderName,
    story,
    metric,
    tip,
    tipCtaLabel,
    tipCtaUrl,
    dryRun = false,
  } = body as {
    issueNumber: number;
    traderName: string;
    story: string;
    metric: string;
    tip: string;
    tipCtaLabel?: string;
    tipCtaUrl?: string;
    dryRun?: boolean;
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

  const recipients = usersData.users.filter((u) => u.email);

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

    const r = await sendWeeklyInsightEmail({
      to: user.email,
      userName,
      issueNumber,
      traderName,
      story,
      metric,
      tip,
      tipCtaLabel,
      tipCtaUrl,
    });

    results.push({ email: user.email, ok: r.success, error: r.error });
  }

  return NextResponse.json({
    sent: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
}
