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
  "/live-monitoring",
  "/admin",
  "/change-password",
  "/profile"
];

const ADMIN_PATHS = [
  "/admin"
];

export async function middleware(req: NextRequest) {
  // Log all admin path requests in development
  if (process.env.NODE_ENV === "development" && req.nextUrl.pathname.startsWith("/admin")) {
    console.log("[middleware] 🔍 Admin path requested:", req.nextUrl.pathname);
  }
  
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session }
  } = await supabase.auth.getSession();
  
  if (process.env.NODE_ENV === "development" && req.nextUrl.pathname.startsWith("/admin")) {
    console.log("[middleware] Session check:", {
      hasSession: !!session,
      email: session?.user?.email || null,
      userId: session?.user?.id || null
    });
  }

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
    // Always log in development to see what's happening
    console.log("[middleware] Checking admin access for:", session.user.email, "path:", req.nextUrl.pathname);
    
    try {
      const admin = createSupabaseAdmin();
      const userId = session.user.id;
      
      // Use .maybeSingle() instead of .single() to handle missing records gracefully
      const { data: appUser, error: roleError } = await admin
        .from("app_user")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      // Log for debugging
      if (process.env.NODE_ENV === "development") {
        console.log("[middleware] Admin check:", {
          userId,
          email: session.user.email,
          hasAppUser: !!appUser,
          role: appUser?.role,
          error: roleError?.message || null,
          errorCode: roleError?.code || null
        });
      }

      // If there's a database error (not just "not found"), log it
      if (roleError && roleError.code !== "PGRST116") { // PGRST116 = no rows returned
        console.error("[middleware] ❌ Admin check database error:");
        console.error("  Message:", roleError.message);
        console.error("  Code:", roleError.code);
        console.error("  Details:", roleError.details);
        console.error("  Hint:", roleError.hint);
        console.error("  Full error:", JSON.stringify(roleError, null, 2));
        const url = req.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
      
      // Log anche se c'è un errore PGRST116 (record non trovato)
      if (roleError && roleError.code === "PGRST116") {
        console.warn("[middleware] ⚠️  No app_user record found (PGRST116) for user:", userId);
      }

      // If no user found or role is not admin, redirect
      if (!appUser) {
        console.warn("[middleware] No app_user record found for user:", userId);
        const url = req.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }

      if (appUser.role !== "admin") {
        console.log("[middleware] User is not admin, role:", appUser.role);
        const url = req.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }

      // Admin user - allow access
      if (process.env.NODE_ENV === "development") {
        console.log("[middleware] ✅ Admin access granted for:", session.user.email);
      }
    } catch (err) {
      // If check fails, redirect to dashboard
      console.error("[middleware] Admin check exception:", err);
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
        .maybeSingle();

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

