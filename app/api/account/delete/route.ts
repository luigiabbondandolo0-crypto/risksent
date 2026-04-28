import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { ACCOUNT_DELETE_CONFIRM_PHRASE } from "@/lib/accountDeleteConstants";
import { sendAccountDeletedEmail } from "@/lib/email";
import { purgeUserBillableResources } from "@/lib/purgeUserBillableResources";
import { checkRateLimit, getClientIpFromRequestHeaders } from "@/lib/security/rateLimit";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * POST /api/account/delete
 * Body: { confirmation: ACCOUNT_DELETE_CONFIRM_PHRASE }
 * Cancels Stripe + MetaApi broker accounts, then removes the Supabase auth user (DB cascades).
 */
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { confirmation?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.confirmation !== ACCOUNT_DELETE_CONFIRM_PHRASE) {
    return NextResponse.json(
      {
        error: `Confirmation must be exactly: ${ACCOUNT_DELETE_CONFIRM_PHRASE}`,
      },
      { status: 400 }
    );
  }

  const ip = getClientIpFromRequestHeaders(req.headers);
  const limiter = await checkRateLimit(`account:delete:${user.id}:${ip}`, 5, 24 * 60 * 60 * 1000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Too many attempts." }, { status: 429 });
  }

  const email = user.email;
  const userName = user.user_metadata?.full_name as string | undefined;
  const userId = user.id;

  try {
    const admin = createSupabaseAdmin();
    const { warnings } = await purgeUserBillableResources(admin, userId);
    if (warnings.length) {
      console.warn("[account/delete] purge warnings", { userId, warnings });
    }

    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) {
      console.error("[account/delete]", delErr);
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }
  } catch (e) {
    Sentry.captureException(e);
    console.error("[account/delete] admin client:", e);
    return NextResponse.json({ error: "Account deletion is not available." }, { status: 503 });
  }

  void sendAccountDeletedEmail({ to: email, userName }).catch((err) =>
    console.error("[account/delete] email:", err)
  );

  return NextResponse.json({ ok: true });
}
