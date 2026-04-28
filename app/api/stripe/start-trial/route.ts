import { NextResponse } from "next/server";
import { sendTrialActivatedEmail, sendOnboardingMastermailEmail } from "@/lib/email";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

const TRIAL_DAYS = 7;

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

type ExistingSub = {
  plan: string | null;
  status: string | null;
  trial_started_at: string | null;
  current_period_end: string | null;
};

export async function POST() {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // We use the service client for reads too, because the RLS policy on
  // subscriptions restricts to the row owner; the service role bypasses RLS
  // and also lets us rely on trial_started_at even if a stale row exists.
  const service = createServiceClient();

  const { data: existing, error: readError } = await service
    .from("subscriptions")
    .select("plan, status, trial_started_at, current_period_end")
    .eq("user_id", user.id)
    .maybeSingle<ExistingSub>();

  if (readError) {
    return NextResponse.json(
      { error: "Could not verify subscription status. Please try again." },
      { status: 500 }
    );
  }

  // Once a trial has ever been started for this user, we never issue another.
  if (existing?.trial_started_at) {
    return NextResponse.json(
      {
        error:
          "Free trial already used. Each account is eligible for one 7-day trial.",
        code: "trial_already_used",
      },
      { status: 400 }
    );
  }

  // Block users who are already on a paid plan or currently trialing.
  const activePaid = existing?.plan === "new_trader" || existing?.plan === "experienced";
  const alreadyTrialing = existing?.plan === "trial" || existing?.status === "trialing";
  if (activePaid || alreadyTrialing) {
    return NextResponse.json(
      {
        error: alreadyTrialing ? "You already have an active trial." : "You already have an active subscription.",
        code: alreadyTrialing ? "trial_active" : "subscription_active",
      },
      { status: 400 }
    );
  }

  const now = new Date();
  const trialEnd = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  const { error: writeError } = await service
    .from("subscriptions")
    .upsert(
      {
        user_id: user.id,
        plan: "trial",
        status: "trialing",
        current_period_start: now.toISOString(),
        current_period_end: trialEnd.toISOString(),
        trial_started_at: now.toISOString(),
        cancel_at_period_end: false,
        updated_at: now.toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (writeError) {
    return NextResponse.json({ error: writeError.message }, { status: 500 });
  }

  if (user.email) {
    const emailArgs = {
      to: user.email,
      userName: (user.user_metadata?.full_name as string | undefined) || undefined,
    };
    void sendTrialActivatedEmail(emailArgs).catch((err) =>
      console.error("[start-trial] trial email:", err)
    );
    // Small delay so the two emails don't land in the inbox simultaneously
    void new Promise<void>((resolve) => setTimeout(resolve, 3000))
      .then(() => sendOnboardingMastermailEmail(emailArgs))
      .catch((err) => console.error("[start-trial] mastermail:", err));
  }

  return NextResponse.json({
    success: true,
    trialDays: TRIAL_DAYS,
    trialEndsAt: trialEnd.toISOString(),
  });
}
