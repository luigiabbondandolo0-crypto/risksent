import { NextRequest, NextResponse } from "next/server";
import { validatePasswordPolicy } from "@/lib/security/passwordPolicy";
import { checkRateLimit, getClientIpFromRequestHeaders } from "@/lib/security/rateLimit";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/routeHandlerClient";

const RESET_PASSWORD_LIMIT = 5;
const RESET_PASSWORD_WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  let body: { newPassword?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const newPassword = body.newPassword ?? "";
  const pwValidation = validatePasswordPolicy(newPassword);
  if (!pwValidation.valid) {
    return NextResponse.json({ error: pwValidation.message }, { status: 400 });
  }

  const ip = getClientIpFromRequestHeaders(req.headers);
  const limiter = checkRateLimit(`auth:reset-password:${ip}`, RESET_PASSWORD_LIMIT, RESET_PASSWORD_WINDOW_MS);
  if (!limiter.allowed) {
    const blocked = NextResponse.json(
      { error: "Too many reset attempts. Try again later." },
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

    if (!user) {
      return NextResponse.json(
        { error: "Reset session expired. Request a new reset link." },
        { status: 401 }
      );
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await supabase.auth.signOut();
    return res;
  } catch {
    return NextResponse.json({ error: "Unable to reset password." }, { status: 500 });
  }
}
