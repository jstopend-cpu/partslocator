import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "@neondatabase/serverless", "xml2js"],
};

export default nextConfig;
