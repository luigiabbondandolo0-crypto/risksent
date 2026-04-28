import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  sendWeeklyInsightAutoEmail,
  getWeeklyInsightIssueNumber,
} from "@/lib/email";

/**
 * GET/POST /api/cron/weekly-insight
 *
 * Fires every Monday at 08:00 UTC. Sends the weekly trader story to all
 * registered users. Stories cycle automatically through the library in
 * lib/emailWeeklyInsightStories.ts.
 *
 * Protected by CRON_SECRET. Add new stories to the library to extend the cycle.
 */

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const headerSecret = req.headers.get("x-cron-secret");
  const querySecret = new URL(req.url).searchParams.get("secret");
  return bearerToken === secret || headerSecret === secret || querySecret === secret;
}

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET(req: NextRequest) {
  return runCron(req);
}

export async function POST(req: NextRequest) {
  return runCron(req);
}

async function runCron(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, reason: "Unauthorized" }, { status: 401 });
  }

  const weekNumber = getWeeklyInsightIssueNumber();
  const admin = createServiceClient();

  const { data: usersData, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) {
    console.error("[cron/weekly-insight] listUsers error", listErr);
    return NextResponse.json({ ok: false, reason: listErr.message }, { status: 500 });
  }

  const recipients = usersData.users.filter((u) => u.email);

  console.log(
    `[cron/weekly-insight] week=${weekNumber} recipients=${recipients.length}`
  );

  const results: Array<{ email: string; ok: boolean; error?: string }> = [];

  for (const user of recipients) {
    if (!user.email) continue;
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const userName =
      (typeof meta.full_name === "string" && meta.full_name) ||
      (typeof meta.name === "string" && meta.name) ||
      undefined;

    const send = await sendWeeklyInsightAutoEmail({
      to: user.email,
      userName,
      weekNumber,
    });

    results.push({ email: user.email, ok: send.success, error: send.error });
  }

  return NextResponse.json({
    ok: true,
    weekNumber,
    sent: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
}
