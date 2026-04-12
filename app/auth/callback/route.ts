import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function safeNextPath(next: string | null): string {
  const fallback = "/reset-password";
  if (!next || !next.startsWith("/")) return fallback;
  if (next.startsWith("//") || next.includes(":")) return fallback;
  return next;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = safeNextPath(requestUrl.searchParams.get("next"));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL("/reset-password", requestUrl.origin));
  }

  const successUrl = new URL(nextPath, requestUrl.origin);
  if (nextPath === "/reset-password") {
    successUrl.searchParams.set("recovery", "1");
  }
  const redirectSuccess = NextResponse.redirect(successUrl);

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

  if (!code) {
    return NextResponse.redirect(new URL("/reset-password", requestUrl.origin));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const failUrl = new URL("/reset-password", requestUrl.origin);
    failUrl.searchParams.set("error_description", error.message);
    return NextResponse.redirect(failUrl);
  }

  return redirectSuccess;
}
