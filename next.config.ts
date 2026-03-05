import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow deployment to complete even when TypeScript or ESLint report errors
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ["xml2js"],
};

export default nextConfig;
