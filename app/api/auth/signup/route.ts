import { NextRequest, NextResponse } from "next/server";
import { validatePasswordPolicy } from "@/lib/security/passwordPolicy";
import { checkRateLimit, getClientIpFromRequestHeaders } from "@/lib/security/rateLimit";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/routeHandlerClient";

const SIGNUP_LIMIT = 5;
const SIGNUP_WINDOW_MS = 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string; fullName?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  const fullName = body.fullName?.trim() ?? "";
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const pwValidation = validatePasswordPolicy(password);
  if (!pwValidation.valid) {
    return NextResponse.json({ error: pwValidation.message }, { status: 400 });
  }

  const ip = getClientIpFromRequestHeaders(req.headers);
  const limiter = checkRateLimit(`auth:signup:${ip}:${email}`, SIGNUP_LIMIT, SIGNUP_WINDOW_MS);
  if (!limiter.allowed) {
    const blocked = NextResponse.json(
      { error: "Too many signup attempts. Try again later." },
      { status: 429 }
    );
    blocked.headers.set("Retry-After", String(limiter.retryAfterSeconds));
    return blocked;
  }

  const res = NextResponse.json({ ok: true });
  try {
    const supabase = createSupabaseRouteHandlerClient(req, res);
    const redirectTo = new URL("/auth/callback?next=/login", req.nextUrl.origin).toString();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: { full_name: fullName }
      }
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (data.user && data.user.identities?.length === 0) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in." },
        { status: 409 }
      );
    }

    // Security requirement: signup must require email verification before login.
    if (data.session) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: "Email verification must be enabled before new users can sign in." },
        { status: 500, headers: res.headers }
      );
    }

    return NextResponse.json(
      { ok: true, message: "Account created. Verify your email before signing in." },
      { headers: res.headers }
    );
  } catch {
    return NextResponse.json({ error: "Unable to create account." }, { status: 500 });
  }
}
