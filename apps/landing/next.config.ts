import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable monorepo package transpilation
  transpilePackages: [
    "@villa-platform/database",
    "@villa-platform/authorization",
    "@villa-platform/identity",
    "@villa-platform/payments",
    "@villa-platform/storage",
    "@villa-platform/validation",
    "@villa-platform/invoices",
  ],
  compiler: {
    styledComponents: true,
  },
};

export default nextConfig;
