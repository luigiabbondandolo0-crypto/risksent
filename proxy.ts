import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

const PROTECTED_PATHS = [
  "/app",
  "/dashboard",
  "/rules",
  "/trades",
  "/backtesting",
  "/simulator",
  "/ai-coach",
  "/add-account",
  "/accounts",
  "/live-monitoring",
  "/admin",
  "/change-password",
  "/profile",
];

const ADMIN_PATHS = ["/admin"];

export async function proxy(req: NextRequest) {
  // PKCE: exchange must run on the server so request cookies include the code verifier.
  if (req.nextUrl.pathname === "/reset-password" && req.nextUrl.searchParams.has("code")) {
    const dest = req.nextUrl.clone();
    dest.pathname = "/auth/callback";
    if (!dest.searchParams.has("next")) {
      dest.searchParams.set("next", "/reset-password");
    }
    return NextResponse.redirect(dest);
  }

  // Log all admin path requests in development
  if (process.env.NODE_ENV === "development" && req.nextUrl.pathname.startsWith("/admin")) {
    console.log("[proxy] 🔍 Admin path requested:", req.nextUrl.pathname);
  }

  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[proxy] Missing Supabase environment variables");
    return res;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          req.cookies.set(name, value);
          res.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (process.env.NODE_ENV === "development" && req.nextUrl.pathname.startsWith("/admin")) {
    console.log("[proxy] Session check:", {
      hasSession: !!user,
      email: user?.email || null,
      userId: user?.id || null,
    });
  }

  const isProtected = PROTECTED_PATHS.some((path) => req.nextUrl.pathname.startsWith(path));

  if (isProtected && !user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectedFrom", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Check admin access for admin paths
  const isAdminPath = ADMIN_PATHS.some((path) => req.nextUrl.pathname.startsWith(path));

  if (isAdminPath && user) {
    console.log("[proxy] Checking admin access for:", user.email, "path:", req.nextUrl.pathname);

    try {
      const admin = createSupabaseAdmin();
      const userId = user.id;

      const { data: appUser, error: roleError } = await admin
        .from("app_user")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (process.env.NODE_ENV === "development") {
        console.log("[proxy] Admin check:", {
          userId,
          email: user.email,
          hasAppUser: !!appUser,
          role: appUser?.role,
          error: roleError?.message || null,
          errorCode: roleError?.code || null,
        });
      }

      if (roleError && roleError.code !== "PGRST116") {
        console.error("[proxy] ❌ Admin check database error:");
        console.error("  Message:", roleError.message);
        console.error("  Code:", roleError.code);
        console.error("  Details:", roleError.details);
        console.error("  Hint:", roleError.hint);
        console.error("  Full error:", JSON.stringify(roleError, null, 2));
        const url = req.nextUrl.clone();
        url.pathname = "/app/dashboard";
        return NextResponse.redirect(url);
      }

      if (roleError && roleError.code === "PGRST116") {
        console.warn("[proxy] ⚠️  No app_user record found (PGRST116) for user:", userId);
      }

      if (!appUser) {
        console.warn("[proxy] No app_user record found for user:", userId);
        const url = req.nextUrl.clone();
        url.pathname = "/app/dashboard";
        return NextResponse.redirect(url);
      }

      if (appUser.role !== "admin") {
        console.log("[proxy] User is not admin, role:", appUser.role);
        const url = req.nextUrl.clone();
        url.pathname = "/app/dashboard";
        return NextResponse.redirect(url);
      }

      if (process.env.NODE_ENV === "development") {
        console.log("[proxy] ✅ Admin access granted for:", user.email);
      }
    } catch (err) {
      console.error("[proxy] Admin check exception:", err);
      const url = req.nextUrl.clone();
      url.pathname = "/app/dashboard";
      return NextResponse.redirect(url);
    }
  }

  if (req.nextUrl.pathname === "/login" && user) {
    try {
      const admin = createSupabaseAdmin();
      const { data: appUser } = await admin
        .from("app_user")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (appUser && appUser.role === "admin") {
        return res;
      }
    } catch {
      // If check fails, proceed with normal redirect
    }

    const url = req.nextUrl.clone();
    url.pathname = "/app/dashboard";
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
