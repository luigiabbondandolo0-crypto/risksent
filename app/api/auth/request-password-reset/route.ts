import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIpFromRequestHeaders } from "@/lib/security/rateLimit";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/routeHandlerClient";

const RESET_LIMIT = 3;
const RESET_WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  let body: { email?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const ip = getClientIpFromRequestHeaders(req.headers);
  const limiter = checkRateLimit(`auth:reset-request:${ip}:${email}`, RESET_LIMIT, RESET_WINDOW_MS);
  if (!limiter.allowed) {
    const blocked = NextResponse.json(
      { error: "Too many reset requests. Try again later." },
      { status: 429 }
    );
    blocked.headers.set("Retry-After", String(limiter.retryAfterSeconds));
    return blocked;
  }

  const res = NextResponse.json({
    ok: true,
    message: "If the email exists, a reset link has been sent."
  });

  try {
    const supabase = createSupabaseRouteHandlerClient(req, res);
    const redirectTo = `${req.nextUrl.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`;
    await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    return res;
  } catch {
    // Keep response generic to avoid account enumeration.
    return res;
  }
}
