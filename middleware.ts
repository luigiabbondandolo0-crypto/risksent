import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

const PROTECTED_PATHS = [
  "/dashboard",
  "/rules",
  "/trades",
  "/simulator",
  "/ai-coach",
  "/add-account",
  "/accounts",
  "/admin",
  "/live-monitoring",
  "/change-password",
  "/profile"
];

const ADMIN_PATHS = [
  "/admin"
];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session }
  } = await supabase.auth.getSession();

  const isProtected = PROTECTED_PATHS.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  );

  if (isProtected && !session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectedFrom", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Check admin access for admin paths
  const isAdminPath = ADMIN_PATHS.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  );

  if (isAdminPath && session) {
    try {
      const admin = createSupabaseAdmin();
      const { data: appUser } = await admin
        .from("app_user")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (!appUser || appUser.role !== "admin") {
        const url = req.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
    } catch {
      // If check fails, redirect to dashboard
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  // Don't auto-redirect admin users from login - let them choose area
  if (req.nextUrl.pathname === "/login" && session) {
    try {
      const admin = createSupabaseAdmin();
      const { data: appUser } = await admin
        .from("app_user")
        .select("role")
        .eq("id", session.user.id)
        .single();

      // If admin, don't redirect - let them choose area
      if (appUser && appUser.role === "admin") {
        return res;
      }
    } catch {
      // If check fails, proceed with normal redirect
    }
    
    // Non-admin users - redirect to dashboard
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};

