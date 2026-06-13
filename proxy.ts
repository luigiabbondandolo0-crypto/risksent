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
  "/add-account",
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

function basicAuthResponse() {
  return new NextResponse("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Staging", charset="UTF-8"',
    },
  });
}

function checkBasicAuth(req: NextRequest): boolean {
  const stagingUser = process.env.STAGING_USER;
  const stagingPassword = process.env.STAGING_PASSWORD;
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return false;
  const [scheme, encoded] = authHeader.split(" ");
  if (scheme !== "Basic" || !encoded) return false;
  const decoded = Buffer.from(encoded, "base64").toString("utf-8");
  const [user, password] = decoded.split(":");
  return user === stagingUser && password === stagingPassword;
}

// ---------------------------------------------------------------------------
// Subdomain routing helpers
// ---------------------------------------------------------------------------

const MAIN_DOMAIN = process.env.MAIN_DOMAIN || "risksent.com";
const APP_DOMAIN = process.env.APP_DOMAIN || "app.risksent.com";

/**
 * Paths that live exclusively on the app subdomain.
 * Visiting these on risksent.com → 301 to app.risksent.com.
 *
 * NOTE: /journaling, /risk-manager, /ai-coach, /billing, /affiliate, /settings
 * are intentionally NOT listed here because they are also marketing pages on
 * risksent.com. On app.risksent.com they are handled by CLEAN_APP_REWRITES.
 */
const APP_SUBDOMAIN_PATHS = [
  "/app",
  "/dashboard",
  "/backtesting",
  "/login",
  "/signup",
  "/reset-password",
  "/change-password",
  "/onboarding",
  "/add-account",
  "/admin",
  "/profile",
  "/rules",
  "/trades",
  "/orders",
  "/live-monitoring",
];

/**
 * On app subdomain, these clean paths rewrite internally to /app/* equivalents.
 * URL stays clean; the Next.js page at /app/* is served.
 */
const CLEAN_APP_REWRITES: Array<[string, string]> = [
  ["/journaling", "/app/journaling"],
  ["/risk-manager", "/app/risk-manager"],
  ["/ai-coach", "/app/ai-coach"],
  ["/billing", "/app/billing"],
  ["/affiliate", "/app/affiliate"],
  ["/settings", "/app/settings"],
];

function getCleanAppRewrite(pathname: string): string | null {
  for (const [clean, target] of CLEAN_APP_REWRITES) {
    if (pathname === clean || pathname.startsWith(clean + "/")) {
      return target + pathname.slice(clean.length);
    }
  }
  return null;
}

/** Returns the clean equivalent for /app/* paths on app subdomain */
function getAppToCleanRedirect(pathname: string): string | null {
  // /app/dashboard → /dashboard
  if (pathname === "/app/dashboard") return "/dashboard";
  for (const [clean, target] of CLEAN_APP_REWRITES) {
    if (pathname === target || pathname.startsWith(target + "/")) {
      return clean + pathname.slice(target.length);
    }
  }
  return null;
}

function isAppOnlyPath(pathname: string): boolean {
  return APP_SUBDOMAIN_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

function skipSubdomainRouting(pathname: string): boolean {
  return (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/monitoring") ||
    pathname.startsWith("/charting_library") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  );
}

export async function proxy(req: NextRequest) {
  // --- Subdomain routing (production only) ---
  if (process.env.NODE_ENV === "production") {
    const hostname = req.headers.get("host") || "";
    const { pathname } = req.nextUrl;

    if (!skipSubdomainRouting(pathname)) {
      const isMainDomain =
        hostname === MAIN_DOMAIN || hostname === `www.${MAIN_DOMAIN}`;
      const isAppDomain = hostname === APP_DOMAIN;

      // On main domain: redirect app-only paths to app subdomain
      if (isMainDomain && isAppOnlyPath(pathname)) {
        const dest = req.nextUrl.clone();
        dest.host = APP_DOMAIN;
        return NextResponse.redirect(dest, { status: 301 });
      }

      // On app subdomain: redirect root "/" to login
      if (isAppDomain && pathname === "/") {
        const dest = req.nextUrl.clone();
        dest.pathname = "/login";
        return secure(req, NextResponse.redirect(dest));
      }

      if (isAppDomain) {
        // Redirect /app/* → clean equivalent (e.g. /app/journaling → /journaling)
        const cleanRedirect = getAppToCleanRedirect(pathname);
        if (cleanRedirect) {
          const dest = req.nextUrl.clone();
          dest.pathname = cleanRedirect;
          return NextResponse.redirect(dest, { status: 301 });
        }

        // Rewrite clean paths to /app/* internally (URL stays clean)
        const rewriteTarget = getCleanAppRewrite(pathname);
        if (rewriteTarget) {

          const dest = req.nextUrl.clone();
          dest.pathname = rewriteTarget;
          // Auth will be checked below via PROTECTED_PATHS which includes clean paths
          // We must fall through to auth checks — but NextResponse.rewrite returns early.
          // So we handle auth here before rewriting.
          // (Supabase client created below; duplicate logic for this case)
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
          if (supabaseUrl && supabaseAnonKey) {
            let rewriteRes = NextResponse.next({ request: { headers: req.headers } });
            const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
              cookies: {
                getAll() { return req.cookies.getAll(); },
                setAll(cookiesToSet) {
                  cookiesToSet.forEach(({ name, value, options }) => {
                    req.cookies.set(name, value);
                    rewriteRes.cookies.set(name, value, options);
                  });
                },
              },
            });
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
              const loginUrl = req.nextUrl.clone();
              loginUrl.pathname = "/login";
              loginUrl.searchParams.set("redirectedFrom", pathname);
              return secure(req, NextResponse.redirect(loginUrl));
            }
            // Session activity
            const timeoutSeconds = getSessionInactivityTimeoutSeconds();
            const now = Math.floor(Date.now() / 1000);
            const rawLastActivity = req.cookies.get(SESSION_ACTIVITY_COOKIE)?.value;
            const lastActivity = rawLastActivity ? Number.parseInt(rawLastActivity, 10) : NaN;
            if (Number.isFinite(lastActivity) && now - lastActivity > timeoutSeconds) {
              await supabase.auth.signOut();
              const expiredRedirect = req.nextUrl.clone();
              expiredRedirect.pathname = "/login";
              expiredRedirect.searchParams.set("sessionExpired", "1");
              const redirectRes = NextResponse.redirect(expiredRedirect);
              redirectRes.cookies.delete(SESSION_ACTIVITY_COOKIE);
              return secure(req, redirectRes);
            }
            // Do the rewrite, carry cookies
            rewriteRes = NextResponse.rewrite(dest, { request: { headers: req.headers } });
            rewriteRes.cookies.set(SESSION_ACTIVITY_COOKIE, String(now), {
              httpOnly: true,
              sameSite: "lax",
              secure: true,
              path: "/",
              maxAge: timeoutSeconds,
            });
            return secure(req, rewriteRes);
          }
          return NextResponse.rewrite(dest);
        }

        // Any path not belonging to the app → redirect to main domain
        // (marketing pages like /backtest, /live-alerts, /pricing must stay on risksent.com)
        if (!isAppOnlyPath(pathname)) {
          const dest = req.nextUrl.clone();
          dest.host = MAIN_DOMAIN;
          return NextResponse.redirect(dest, { status: 301 });
        }
      }
    }
  }

  if (process.env.STAGING_BASIC_AUTH === "true") {
    const skipPaths = ["/api/stripe/", "/api/telegram/", "/api/monitoring/"];
    const { pathname } = req.nextUrl;
    if (!skipPaths.some((p) => pathname.startsWith(p))) {
      if (!checkBasicAuth(req)) {
        return basicAuthResponse();
      }
    }
  }

  const httpsRedirect = httpsUpgradeResponseIfNeeded(req);
  if (httpsRedirect) {
    return secure(req, httpsRedirect);
  }

  const apiBlocked = await enforceGlobalApiRateLimit(req);
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
        url.pathname = "/dashboard";
        return secure(req, NextResponse.redirect(url));
      }

      if (!appUser) {
        const url = req.nextUrl.clone();
        url.pathname = "/dashboard";
        return secure(req, NextResponse.redirect(url));
      }

      if (appUser.role !== "admin") {
        const url = req.nextUrl.clone();
        url.pathname = "/dashboard";
        return secure(req, NextResponse.redirect(url));
      }
    } catch {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
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
    url.pathname = "/dashboard";
    return secure(req, NextResponse.redirect(url));
  }

  return secure(req, res);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
