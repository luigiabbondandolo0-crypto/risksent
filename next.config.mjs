/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/app/backtesting", destination: "/backtesting", permanent: false },
      { source: "/app/backtesting/:path*", destination: "/backtesting/:path*", permanent: false }
    ];
  }
};

export default nextConfig;

