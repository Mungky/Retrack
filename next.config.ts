import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
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

export default nextConfig;
