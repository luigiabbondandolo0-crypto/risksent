/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /**
   * TradingView Charting Library is served from `public/charting_library/` at `/charting_library/*`.
   * Next.js already exposes `public/` as static files; these headers improve caching for the large bundle.
   */
  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "DENY" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()"
      },
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

export default nextConfig;
