import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  applySecurityHeaders,
  enforceGlobalApiRateLimit,
  httpsUpgradeResponseIfNeeded
} from "@/lib/security/edgeSecurity";
import { securityLog } from "@/lib/security/structuredLog";
import { getClientIpFromRequestHeaders } from "@/lib/security/rateLimit";

const PROTECTED_PATHS = [
  "/app",
  "/dashboard",
  "/rules",
  "/trades",
  "/backtesting",
  "/simulator",
  "/add-account",
  "/accounts",
  "/live-monitoring",
  "/admin",
  "/change-password",
  "/profile",
];

const ADMIN_PATHS = ["/admin"];
const SESSION_ACTIVITY_COOKIE = "rs_last_activity_at";
const DEFAULT_SESSION_INACTIVITY_TIMEOUT_SECONDS = 60 * 60 * 8;

function getSessionInactivityTimeoutSeconds() {
  const envValue = process.env.AUTH_SESSION_INACTIVITY_TIMEOUT_SECONDS;
  const parsed = envValue ? Number.parseInt(envValue, 10) : NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_SESSION_INACTIVITY_TIMEOUT_SECONDS;
  }
  return parsed;
}

function secure(req: NextRequest, res: NextResponse) {
  return applySecurityHeaders(req, res);
}

export async function proxy(req: NextRequest) {
  const httpsRedirect = httpsUpgradeResponseIfNeeded(req);
  if (httpsRedirect) {
    return secure(req, httpsRedirect);
  }

  const apiBlocked = enforceGlobalApiRateLimit(req);
  if (apiBlocked) {
    return secure(req, apiBlocked);
  }

  const authPath = req.nextUrl.pathname;
  if (authPath.startsWith("/api/auth/") && req.method === "POST") {
    securityLog("info", "security.api.auth_request", {
      path: authPath,
      method: req.method,
      ip: getClientIpFromRequestHeaders(req.headers)
    });
  }

  // PKCE: exchange must run on the server so request cookies include the code verifier.
  if (req.nextUrl.pathname === "/reset-password" && req.nextUrl.searchParams.has("code")) {
    const dest = req.nextUrl.clone();
    dest.pathname = "/auth/callback";
    if (!dest.searchParams.has("next")) {
      dest.searchParams.set("next", "/reset-password");
    }
    return secure(req, NextResponse.redirect(dest));
  }

  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return secure(req, res);
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

  const isProtected = PROTECTED_PATHS.some((path) => req.nextUrl.pathname.startsWith(path));

  if (isProtected && !user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectedFrom", req.nextUrl.pathname);
    return secure(req, NextResponse.redirect(url));
  }

  if (isProtected && user) {
    const timeoutSeconds = getSessionInactivityTimeoutSeconds();
    const now = Math.floor(Date.now() / 1000);
    const rawLastActivity = req.cookies.get(SESSION_ACTIVITY_COOKIE)?.value;
    const lastActivity = rawLastActivity ? Number.parseInt(rawLastActivity, 10) : NaN;
    const hasExpiredForInactivity =
      Number.isFinite(lastActivity) && now - lastActivity > timeoutSeconds;

    if (hasExpiredForInactivity) {
      await supabase.auth.signOut();
      const expiredRedirect = req.nextUrl.clone();
      expiredRedirect.pathname = "/login";
      expiredRedirect.searchParams.set("sessionExpired", "1");
      const redirectRes = NextResponse.redirect(expiredRedirect);
      redirectRes.cookies.delete(SESSION_ACTIVITY_COOKIE);
      return secure(req, redirectRes);
    }

    res.cookies.set(SESSION_ACTIVITY_COOKIE, String(now), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: timeoutSeconds,
    });
  }

  // Check admin access for admin paths
  const isAdminPath = ADMIN_PATHS.some((path) => req.nextUrl.pathname.startsWith(path));

  if (isAdminPath && user) {
    try {
      const admin = createSupabaseAdmin();
      const userId = user.id;

      const { data: appUser, error: roleError } = await admin
        .from("app_user")
        .select("role")
        .eq("id", userId)
        .limit(1)
        .maybeSingle();

      if (roleError && roleError.code !== "PGRST116") {
        const url = req.nextUrl.clone();
        url.pathname = "/app/dashboard";
        return secure(req, NextResponse.redirect(url));
      }

      if (!appUser) {
        const url = req.nextUrl.clone();
        url.pathname = "/app/dashboard";
        return secure(req, NextResponse.redirect(url));
      }

      if (appUser.role !== "admin") {
        const url = req.nextUrl.clone();
        url.pathname = "/app/dashboard";
        return secure(req, NextResponse.redirect(url));
      }
    } catch {
      const url = req.nextUrl.clone();
      url.pathname = "/app/dashboard";
      return secure(req, NextResponse.redirect(url));
    }
  }

  if (req.nextUrl.pathname === "/login" && user) {
    try {
      const admin = createSupabaseAdmin();
      const { data: appUser } = await admin
        .from("app_user")
        .select("role")
        .eq("id", user.id)
        .limit(1)
        .maybeSingle();

      if (appUser && appUser.role === "admin") {
        return secure(req, res);
      }
    } catch {
      // If check fails, proceed with normal redirect
    }

    const url = req.nextUrl.clone();
    url.pathname = "/app/dashboard";
    return secure(req, NextResponse.redirect(url));
  }

  return secure(req, res);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
