import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const pwa = withPWA({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    skipWaiting: true,
  },
});

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/((?!_next/static|_next/image|favicon|icon|manifest).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/stats", destination: "/statistics", permanent: true },
      { source: "/stats/:path*", destination: "/statistics", permanent: true },
    ];
  },
  // Optimize bundle size (keep console.error/warn for debugging production errors)
  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["error", "warn"] }
      : false,
  },
  // Optimize images
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // Reduce bundle size
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
};

export default pwa(nextConfig);
