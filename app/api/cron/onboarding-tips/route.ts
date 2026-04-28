import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendOnboardingTipEmail, type OnboardingStep } from "@/lib/email";

/**
 * GET/POST /api/cron/onboarding-tips
 *
 * Sends drip onboarding emails based on account age:
 *   Step 1 → users created ~1 day ago
 *   Step 2 → users created ~3 days ago
 *   Step 3 → users created ~7 days ago
 *
 * Idempotency: tracks sent steps in `app_user.onboarding_tips_sent` (int bitmask).
 *   Bit 0 = step 1 sent, bit 1 = step 2 sent, bit 2 = step 3 sent.
 *
 * DB MIGRATION REQUIRED (run once in Supabase SQL editor):
 *   ALTER TABLE app_user ADD COLUMN IF NOT EXISTS onboarding_tips_sent INTEGER NOT NULL DEFAULT 0;
 *
 * Protected by CRON_SECRET (same as other cron routes).
 * Designed to run daily via Vercel Cron.
 */

const STEPS: Array<{ step: OnboardingStep; dayTarget: number; bit: number }> = [
  { step: 1, dayTarget: 1, bit: 0 },
  { step: 2, dayTarget: 3, bit: 1 },
  { step: 3, dayTarget: 7, bit: 2 },
];

// Tolerance window (hours) around the target day. Accounts for cron drift.
const WINDOW_HOURS = 20;

export async function GET(req: NextRequest) {
  return runCron(req);
}

export async function POST(req: NextRequest) {
  return runCron(req);
}

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

async function runCron(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, reason: "Unauthorized" }, { status: 401 });
  }

  const admin = createServiceClient();
  const now = new Date();

  const allResults: Array<{
    step: OnboardingStep;
    user: string;
    ok: boolean;
    reason?: string;
  }> = [];

  for (const { step, dayTarget, bit } of STEPS) {
    const windowMs = WINDOW_HOURS * 60 * 60 * 1000;
    const targetMs = dayTarget * 24 * 60 * 60 * 1000;
    const rangeStart = new Date(now.getTime() - targetMs - windowMs);
    const rangeEnd = new Date(now.getTime() - targetMs + windowMs);

    // Fetch auth users created in the target window
    const { data: usersData, error: listErr } = await admin.auth.admin.listUsers({
      perPage: 1000,
    });

    if (listErr) {
      console.error(`[cron/onboarding-tips] step=${step} list error`, listErr);
      continue;
    }

    const candidates = usersData.users.filter((u) => {
      if (!u.email || !u.created_at) return false;
      const created = new Date(u.created_at).getTime();
      return created >= rangeStart.getTime() && created <= rangeEnd.getTime();
    });

    console.log(
      `[cron/onboarding-tips] step=${step} window=[${rangeStart.toISOString()}, ${rangeEnd.toISOString()}] candidates=${candidates.length}`
    );

    for (const user of candidates) {
      if (!user.email) continue;

      // Check if this step was already sent
      const { data: appUser, error: appUserErr } = await admin
        .from("app_user")
        .select("onboarding_tips_sent")
        .eq("id", user.id)
        .maybeSingle();

      if (appUserErr) {
        console.warn(`[cron/onboarding-tips] step=${step} app_user fetch error for ${user.id}`, appUserErr);
      }

      const sentBitmask: number = (appUser as { onboarding_tips_sent?: number } | null)?.onboarding_tips_sent ?? 0;
      if (sentBitmask & (1 << bit)) {
        // Already sent
        continue;
      }

      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      const userName =
        (typeof meta.full_name === "string" && meta.full_name) ||
        (typeof meta.name === "string" && meta.name) ||
        undefined;

      const send = await sendOnboardingTipEmail({ to: user.email, userName, step });

      if (!send.success) {
        allResults.push({
          step,
          user: user.id.slice(0, 8) + "…",
          ok: false,
          reason: send.error || "send_failed",
        });
        continue;
      }

      // Stamp the bit
      const newBitmask = sentBitmask | (1 << bit);
      const { error: stampErr } = await admin
        .from("app_user")
        .update({ onboarding_tips_sent: newBitmask })
        .eq("id", user.id);

      if (stampErr) {
        console.error(
          `[cron/onboarding-tips] step=${step} email sent but stamp failed for ${user.id}`,
          stampErr
        );
      }

      allResults.push({ step, user: user.id.slice(0, 8) + "…", ok: true });
    }
  }

  return NextResponse.json({
    ok: true,
    sent: allResults.filter((r) => r.ok).length,
    failed: allResults.filter((r) => !r.ok).length,
    results: allResults,
  });
}
