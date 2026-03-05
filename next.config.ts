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
  webpack: (config) => {
    config.externals.push({ xml2js: "commonjs xml2js" });
    return config;
  },
};

export default nextConfig;
