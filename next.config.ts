import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@juspark/db", "@juspark/types", "@juspark/utils"],
};

export default nextConfig;
