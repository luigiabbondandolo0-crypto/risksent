/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /**
   * TradingView Charting Library is served from `public/charting_library/` at `/charting_library/*`.
   * Next.js already exposes `public/` as static files; these headers improve caching for the large bundle.
   */
  async headers() {
    return [
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
      { source: "/ai-coach", destination: "/app/ai-coach", permanent: false },
      { source: "/ai-coach/:path*", destination: "/app/ai-coach/:path*", permanent: false },
      { source: "/backtesting-lab", destination: "/backtest", permanent: false },
      { source: "/backtesting-lab/:path*", destination: "/backtest/:path*", permanent: false }
    ];
  },
  async rewrites() {
    return [
      { source: "/app/backtesting", destination: "/backtesting" },
      { source: "/app/backtesting/:path*", destination: "/backtesting/:path*" },
      { source: "/app/ai-coach", destination: "/ai-coach" },
      { source: "/app/ai-coach/:path*", destination: "/ai-coach/:path*" }
    ];
  }
};

export default nextConfig;
