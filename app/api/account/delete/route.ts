import { NextRequest, NextResponse } from "next/server";
import { sendAccountDeletedEmail } from "@/lib/email";
import { checkRateLimit, getClientIpFromRequestHeaders } from "@/lib/security/rateLimit";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

const CONFIRM_PHRASE = "DELETE_MY_RISKSENT_ACCOUNT";

/**
 * POST /api/account/delete
 * Body: { confirmation: "DELETE_MY_RISKSENT_ACCOUNT" }
 * Permanently removes the authenticated user (Supabase Auth). Sends a confirmation email first.
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

  if (body.confirmation !== CONFIRM_PHRASE) {
    return NextResponse.json(
      {
        error: `Confirmation must be exactly: ${CONFIRM_PHRASE}`,
      },
      { status: 400 }
    );
  }

  const ip = getClientIpFromRequestHeaders(req.headers);
  const limiter = checkRateLimit(`account:delete:${user.id}:${ip}`, 5, 24 * 60 * 60 * 1000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Too many attempts." }, { status: 429 });
  }

  const email = user.email;
  const userName = user.user_metadata?.full_name as string | undefined;
  const userId = user.id;

  try {
    const admin = createSupabaseAdmin();
    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) {
      console.error("[account/delete]", delErr);
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }
  } catch (e) {
    console.error("[account/delete] admin client:", e);
    return NextResponse.json({ error: "Account deletion is not available." }, { status: 503 });
  }

  void sendAccountDeletedEmail({ to: email, userName }).catch((err) =>
    console.error("[account/delete] email:", err)
  );

  return NextResponse.json({ ok: true });
}
