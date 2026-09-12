import type { NextConfig } from "next";

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
} as NextConfig;

export default nextConfig;
