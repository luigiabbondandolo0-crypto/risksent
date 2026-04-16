import { NextRequest, NextResponse } from "next/server";
import { validatePasswordPolicy } from "@/lib/security/passwordPolicy";
import { checkRateLimit, getClientIpFromRequestHeaders } from "@/lib/security/rateLimit";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/routeHandlerClient";

const CHANGE_PASSWORD_LIMIT = 5;
const CHANGE_PASSWORD_WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  let body: { currentPassword?: string; newPassword?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const currentPassword = body.currentPassword ?? "";
  const newPassword = body.newPassword ?? "";
  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Current password and new password are required." },
      { status: 400 }
    );
  }

  if (currentPassword === newPassword) {
    return NextResponse.json(
      { error: "New password must be different from current password." },
      { status: 400 }
    );
  }

  const pwValidation = validatePasswordPolicy(newPassword);
  if (!pwValidation.valid) {
    return NextResponse.json({ error: pwValidation.message }, { status: 400 });
  }

  const ip = getClientIpFromRequestHeaders(req.headers);
  const limiter = checkRateLimit(`auth:change-password:${ip}`, CHANGE_PASSWORD_LIMIT, CHANGE_PASSWORD_WINDOW_MS);
  if (!limiter.allowed) {
    const blocked = NextResponse.json(
      { error: "Too many password change attempts. Try again later." },
      { status: 429 }
    );
    blocked.headers.set("Retry-After", String(limiter.retryAfterSeconds));
    return blocked;
  }

  const res = NextResponse.json({ ok: true });
  try {
    const supabase = createSupabaseRouteHandlerClient(req, res);
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // Re-authenticate with current password before allowing password change.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    });
    if (signInError) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return res;
  } catch {
    return NextResponse.json({ error: "Unable to change password." }, { status: 500 });
  }
}
