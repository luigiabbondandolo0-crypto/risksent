import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendTrialEndingEmail } from "@/lib/email";

/**
 * GET/POST /api/cron/trial-reminder
 *
 * Finds trialing subscriptions whose trial ends in the next ~2 days and have
 * not yet received the reminder email. Sends one reminder per user, then
 * stamps `trial_reminder_sent_at` so the next invocation skips them.
 *
 * Protected by CRON_SECRET. Designed to be called once a day by Vercel Cron.
 */

// Window (hours) ahead of `now` to pick up trials that are about to expire.
// 54h gives us headroom if the cron runs a bit late and still wants to catch
// everyone at ~48h before expiry.
const REMINDER_WINDOW_HOURS = 54;

type TrialRow = {
  user_id: string;
  current_period_end: string | null;
  trial_reminder_sent_at: string | null;
};

export async function GET(req: NextRequest) {
  return runCron(req);
}

export async function POST(req: NextRequest) {
  return runCron(req);
}

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const headerSecret = req.headers.get("x-cron-secret");
  return bearerToken === secret || headerSecret === secret;
}

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

async function runCron(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, reason: "Unauthorized" }, { status: 401 });
  }

  const admin = createServiceClient();
  const now = new Date();
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_HOURS * 60 * 60 * 1000);

  const { data: rows, error } = await admin
    .from("subscriptions")
    .select("user_id, current_period_end, trial_reminder_sent_at")
    .eq("plan", "trial")
    .eq("status", "trialing")
    .is("trial_reminder_sent_at", null)
    .lte("current_period_end", windowEnd.toISOString())
    .gte("current_period_end", now.toISOString())
    .returns<TrialRow[]>();

  if (error) {
    console.error("[cron/trial-reminder] query failed", error);
    return NextResponse.json({ ok: false, reason: error.message }, { status: 500 });
  }

  const candidates = rows ?? [];
  console.log(`[cron/trial-reminder] ${candidates.length} candidate(s) in next ${REMINDER_WINDOW_HOURS}h`);

  const results: Array<{ user: string; ok: boolean; reason?: string }> = [];

  for (const sub of candidates) {
    if (!sub.current_period_end) continue;

    // Resolve the user's email via the auth admin API.
    const { data: userRes, error: userErr } = await admin.auth.admin.getUserById(sub.user_id);
    if (userErr || !userRes?.user?.email) {
      results.push({
        user: sub.user_id.slice(0, 8) + "…",
        ok: false,
        reason: userErr?.message || "no_email",
      });
      continue;
    }
    const email = userRes.user.email;
    const meta = (userRes.user.user_metadata ?? {}) as Record<string, unknown>;
    const userName =
      (typeof meta.full_name === "string" && meta.full_name) ||
      (typeof meta.name === "string" && meta.name) ||
      undefined;

    // Round UP: 35h left must read as "2 days", not "1 day". Only when the
    // remaining time is literally 0 or negative do we show 0 ("ends today").
    const msLeft = new Date(sub.current_period_end).getTime() - now.getTime();
    const daysLeft = msLeft <= 0 ? 0 : Math.ceil(msLeft / (24 * 60 * 60 * 1000));

    const send = await sendTrialEndingEmail({
      to: email,
      userName,
      trialEndsAt: sub.current_period_end,
      daysLeft,
    });

    if (!send.success) {
      results.push({
        user: sub.user_id.slice(0, 8) + "…",
        ok: false,
        reason: send.error || "send_failed",
      });
      continue;
    }

    const { error: stampErr } = await admin
      .from("subscriptions")
      .update({ trial_reminder_sent_at: new Date().toISOString() })
      .eq("user_id", sub.user_id);

    if (stampErr) {
      // Email went out but we couldn't flag the row → log loudly so we can
      // investigate. Next run will re-send the reminder, which is annoying
      // but not catastrophic.
      console.error(
        `[cron/trial-reminder] email sent but could not stamp user=${sub.user_id}`,
        stampErr
      );
      results.push({ user: sub.user_id.slice(0, 8) + "…", ok: false, reason: stampErr.message });
      continue;
    }

    results.push({ user: sub.user_id.slice(0, 8) + "…", ok: true });
  }

  return NextResponse.json({
    ok: true,
    scanned: candidates.length,
    sent: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
}
