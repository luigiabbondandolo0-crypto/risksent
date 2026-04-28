import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendMarketingDripStepEmail, MARKETING_DRIP_TOTAL_STEPS } from "@/lib/email";

/**
 * GET/POST /api/cron/marketing-drip
 *
 * Sends the next feature email in the marketing drip sequence to every user
 * whose account age matches the next unsent step.
 *
 * Logic: for each user, if days_since_registration >= marketing_drip_step + 1
 * AND marketing_drip_step < MARKETING_DRIP_TOTAL_STEPS, send step N+1 and
 * increment the counter.
 *
 * DB MIGRATION REQUIRED (run once in Supabase SQL editor):
 *   ALTER TABLE app_user
 *     ADD COLUMN IF NOT EXISTS marketing_drip_step INTEGER NOT NULL DEFAULT 0;
 *
 * Protected by CRON_SECRET. Runs daily at 10:30 UTC via Vercel Cron.
 */

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

  const admin = createServiceClient();
  const now = new Date();
  const DAY_MS = 24 * 60 * 60 * 1000;

  // List all auth users (up to 1000 — paginate if your user base grows beyond this)
  const { data: usersData, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) {
    console.error("[cron/marketing-drip] listUsers error", listErr);
    return NextResponse.json({ ok: false, reason: listErr.message }, { status: 500 });
  }

  const results: Array<{ user: string; step: number; ok: boolean; reason?: string }> = [];

  for (const user of usersData.users) {
    if (!user.email || !user.created_at) continue;

    const daysSinceRegistration = Math.floor(
      (now.getTime() - new Date(user.created_at).getTime()) / DAY_MS
    );

    // Fetch current drip step
    const { data: appUser, error: appErr } = await admin
      .from("app_user")
      .select("marketing_drip_step")
      .eq("id", user.id)
      .maybeSingle();

    if (appErr) {
      console.warn(`[cron/marketing-drip] app_user fetch error for ${user.id}`, appErr);
      continue;
    }

    const currentStep: number =
      (appUser as { marketing_drip_step?: number } | null)?.marketing_drip_step ?? 0;

    // Already finished the sequence
    if (currentStep >= MARKETING_DRIP_TOTAL_STEPS) continue;

    // Not yet time for the next step
    const nextStep = currentStep + 1;
    if (daysSinceRegistration < nextStep) continue;

    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const userName =
      (typeof meta.full_name === "string" && meta.full_name) ||
      (typeof meta.name === "string" && meta.name) ||
      undefined;

    const send = await sendMarketingDripStepEmail({
      to: user.email,
      userName,
      step: nextStep,
    });

    if (!send.success) {
      results.push({
        user: user.id.slice(0, 8) + "…",
        step: nextStep,
        ok: false,
        reason: send.error || "send_failed",
      });
      continue;
    }

    // Stamp the new step count
    const { error: stampErr } = await admin
      .from("app_user")
      .update({ marketing_drip_step: nextStep })
      .eq("id", user.id);

    if (stampErr) {
      console.error(
        `[cron/marketing-drip] email sent but stamp failed for ${user.id}`,
        stampErr
      );
    }

    results.push({ user: user.id.slice(0, 8) + "…", step: nextStep, ok: true });
  }

  return NextResponse.json({
    ok: true,
    sent: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
}
