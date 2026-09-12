import type { NextConfig } from "next";

const backendUrl =
  process.env.NEXT_PUBLIC_API_URL || "https://visionx-demo-8xgd.onrender.com";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  allowedDevOrigins: [
    "*.e2b.app",
    "*.ideavo.app",
    "*.ideavo.ai",
    "*.grok.computer",
    "*.grok.com",
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
} as NextConfig;

export default nextConfig;