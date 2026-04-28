import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function safeNextPath(next: string | null, fallback = "/login"): string {
  if (!next || !next.startsWith("/")) return fallback;
  if (next.startsWith("//") || next.includes(":")) return fallback;
  return next;
}

function normalizeAuthCallbackErrorMessage(rawMessage: string): string {
  const lower = rawMessage.toLowerCase();
  if (lower.includes("expired")) return "Link expired. Please request a new one.";
  if (lower.includes("invalid") || lower.includes("code")) return "Invalid link. Please request a new one.";
  return "Authentication link is no longer valid. Please request a new one.";
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const rawNext = requestUrl.searchParams.get("next");
  // For password reset the next is explicitly /reset-password; everything else defaults to /login
  const isPasswordReset = rawNext === "/reset-password";
  const nextPath = safeNextPath(rawNext, "/login");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL("/login", requestUrl.origin));
  }

  const successUrl = new URL(nextPath, requestUrl.origin);
  if (isPasswordReset) {
    successUrl.searchParams.set("recovery", "1");
  }
  const redirectSuccess = NextResponse.redirect(successUrl);

  // No PKCE code — hash-based implicit flow (e.g. signup confirmation on some Supabase configs).
  // Redirect to nextPath; client-side Supabase picks up the session from the URL hash.
  if (!code) {
    return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          redirectSuccess.cookies.set(name, value, options);
        });
      }
    }
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const failUrl = new URL(isPasswordReset ? "/reset-password" : "/login", requestUrl.origin);
    failUrl.searchParams.set("error_description", normalizeAuthCallbackErrorMessage(error.message));
    return NextResponse.redirect(failUrl);
  }

  return redirectSuccess;
}
