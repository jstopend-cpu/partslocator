import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["xml2js"],
  // /dashboard is strictly dynamic (see src/app/dashboard/page.tsx: dynamic = "force-dynamic").
  // Next.js has no config-level "ignore route" for static generation; the route opts out via the page export.
};

export default nextConfig;
