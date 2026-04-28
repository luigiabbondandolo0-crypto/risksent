import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /**
   * TradingView Charting Library is served from `public/charting_library/` at `/charting_library/*`.
   * Next.js already exposes `public/` as static files; these headers improve caching for the large bundle.
   */
  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    // Supabase project URL (strip trailing slash)
    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
    // Extract hostname for wss:// and https:// rules (e.g. xyz.supabase.co)
    const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : "*.supabase.co";

    const csp = [
      "default-src 'self'",
      // Next.js hydration + TradingView charting library require unsafe-eval/unsafe-inline in production.
      // Nonce-based CSP would eliminate these but requires streaming middleware; keep for now.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' js.stripe.com plausible.io",
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      "font-src 'self' fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      `connect-src 'self' ${supabaseUrl} https://${supabaseHost} wss://${supabaseHost} https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.agiliumtrade.ai wss://*.agiliumtrade.ai https://plausible.io`,
      "frame-src 'self' js.stripe.com hooks.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; ");

    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "DENY" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()"
      },
      { key: "Content-Security-Policy", value: csp },
      ...(isProd
        ? [
            {
              key: "Strict-Transport-Security",
              value: "max-age=63072000; includeSubDomains; preload"
            }
          ]
        : [])
    ];
    return [
      {
        source: "/:path*",
        headers: securityHeaders
      },
      {
        source: "/charting_library/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }
        ]
      }
    ];
  },
  async redirects() {
    return [
      { source: "/backtesting", destination: "/app/backtesting", permanent: false },
      { source: "/backtesting/:path*", destination: "/app/backtesting/:path*", permanent: false },
      { source: "/backtesting-lab", destination: "/backtest", permanent: false },
      { source: "/backtesting-lab/:path*", destination: "/backtest/:path*", permanent: false }
    ];
  },
  async rewrites() {
    return [
      { source: "/app/backtesting", destination: "/backtesting" },
      { source: "/app/backtesting/:path*", destination: "/backtesting/:path*" }
    ];
  }
};

export default withSentryConfig(nextConfig, {
  org: "risk-sent",
  project: "javascript-nextjs",
  // Auth token for source map upload during `next build` (set SENTRY_AUTH_TOKEN in Vercel env).
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Upload source maps to Sentry for readable prod stack traces.
  widenClientFileUpload: true,
  // Route Sentry traffic through /monitoring to bypass ad-blockers.
  tunnelRoute: "/monitoring",
  // Hide source maps from browser devtools (they still upload to Sentry).
  hideSourceMaps: true,
  // Suppress build output noise.
  silent: !process.env.CI,
  // Disable telemetry to Sentry about this setup.
  telemetry: false,
});
