import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdminRole } from "@/lib/adminAuth";
import { sendTrialEndingEmail } from "@/lib/email";

/**
 * /api/admin/trial-reminders
 *
 *   GET  → list of trialing subscriptions (+ already-sent reminders) enriched
 *          with email and time-left, so an admin can eyeball who's coming up.
 *   POST → { userId, action: "send" | "reset" }
 *          - "send"  forces the reminder email for that user and stamps
 *                    trial_reminder_sent_at (skips if not trialing / expired).
 *          - "reset" clears trial_reminder_sent_at so the daily cron will
 *                    pick the user up again (useful for debugging).
 *
 * All handlers are admin-only (see lib/adminAuth.ts).
 */

type SubRow = {
  user_id: string;
  plan: string | null;
  status: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_started_at: string | null;
  trial_reminder_sent_at: string | null;
  updated_at: string | null;
};

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

async function resolveEmails(
  admin: ReturnType<typeof createServiceClient>,
  userIds: string[]
): Promise<Record<string, { email: string | null; name: string | null }>> {
  // auth.admin has no batch getUserById; we fall back to listUsers with a
  // reasonable perPage and then filter. For a small userbase this is plenty.
  const map: Record<string, { email: string | null; name: string | null }> = {};
  for (const id of userIds) map[id] = { email: null, name: null };

  try {
    const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    for (const u of data?.users ?? []) {
      if (!(u.id in map)) continue;
      const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
      map[u.id] = {
        email: u.email ?? null,
        name:
          (typeof meta.full_name === "string" && meta.full_name) ||
          (typeof meta.name === "string" && meta.name) ||
          null,
      };
    }
  } catch {
    // Best-effort: if listUsers fails we still return subs, just without emails.
  }

  return map;
}

export async function GET() {
  const { isAdmin } = await checkAdminRole();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createServiceClient();

  // Show both "currently trialing" and "already reminded" (last 30 days)
  // so admins can see the full pipeline at a glance.
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await admin
    .from("subscriptions")
    .select(
      "user_id, plan, status, current_period_start, current_period_end, trial_started_at, trial_reminder_sent_at, updated_at"
    )
    .or(
      `and(plan.eq.trial,status.eq.trialing),and(trial_reminder_sent_at.gte.${since})`
    )
    .order("current_period_end", { ascending: true })
    .returns<SubRow[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data ?? [];
  const emails = await resolveEmails(admin, rows.map((r) => r.user_id));
  const now = Date.now();

  const enriched = rows.map((r) => {
    const end = r.current_period_end ? new Date(r.current_period_end).getTime() : null;
    const msLeft = end === null ? null : end - now;
    const hoursLeft = msLeft === null ? null : Math.round(msLeft / (60 * 60 * 1000));
    const daysLeftCeil = msLeft === null ? null : msLeft <= 0 ? 0 : Math.ceil(msLeft / (24 * 60 * 60 * 1000));
    const trialing = r.plan === "trial" && r.status === "trialing" && msLeft !== null && msLeft > 0;
    const expired = r.plan === "trial" && msLeft !== null && msLeft <= 0;

    return {
      user_id: r.user_id,
      email: emails[r.user_id]?.email ?? null,
      name: emails[r.user_id]?.name ?? null,
      plan: r.plan,
      status: r.status,
      current_period_start: r.current_period_start,
      current_period_end: r.current_period_end,
      trial_started_at: r.trial_started_at,
      trial_reminder_sent_at: r.trial_reminder_sent_at,
      hours_left: hoursLeft,
      days_left_ceil: daysLeftCeil,
      trialing,
      expired,
      reminder_sent: Boolean(r.trial_reminder_sent_at),
    };
  });

  return NextResponse.json({ rows: enriched, now: new Date(now).toISOString() });
}

export async function POST(req: NextRequest) {
  const { isAdmin } = await checkAdminRole();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { userId?: string; action?: string };
  try {
    body = (await req.json()) as { userId?: string; action?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const userId = typeof body.userId === "string" ? body.userId : "";
  const action = body.action;
  if (!userId || (action !== "send" && action !== "reset")) {
    return NextResponse.json({ error: "Missing userId or unsupported action" }, { status: 400 });
  }

  const admin = createServiceClient();

  if (action === "reset") {
    const { error } = await admin
      .from("subscriptions")
      .update({ trial_reminder_sent_at: null })
      .eq("user_id", userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, action: "reset" });
  }

  // action === "send"
  const { data: sub, error: readErr } = await admin
    .from("subscriptions")
    .select("plan, status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle<{ plan: string | null; status: string | null; current_period_end: string | null }>();

  if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 });
  if (!sub || sub.plan !== "trial" || sub.status !== "trialing" || !sub.current_period_end) {
    return NextResponse.json({ error: "User is not currently on an active trial." }, { status: 400 });
  }

  const msLeft = new Date(sub.current_period_end).getTime() - Date.now();
  if (msLeft <= 0) {
    return NextResponse.json({ error: "Trial already expired." }, { status: 400 });
  }
  const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));

  const { data: userRes, error: userErr } = await admin.auth.admin.getUserById(userId);
  if (userErr || !userRes?.user?.email) {
    return NextResponse.json(
      { error: userErr?.message || "Could not resolve user email." },
      { status: 400 }
    );
  }
  const meta = (userRes.user.user_metadata ?? {}) as Record<string, unknown>;
  const userName =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    undefined;

  const send = await sendTrialEndingEmail({
    to: userRes.user.email,
    userName,
    trialEndsAt: sub.current_period_end,
    daysLeft,
  });

  if (!send.success) {
    return NextResponse.json({ error: send.error || "Send failed" }, { status: 500 });
  }

  const { error: stampErr } = await admin
    .from("subscriptions")
    .update({ trial_reminder_sent_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (stampErr) {
    // Email went out, flag failed: surface to admin so they can manually
    // reset later if needed.
    return NextResponse.json(
      { ok: true, warning: `Email sent but could not stamp flag: ${stampErr.message}` },
      { status: 200 }
    );
  }

  return NextResponse.json({ ok: true, action: "send", daysLeft });
}
