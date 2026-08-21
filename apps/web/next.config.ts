import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable monorepo package transpilation
  transpilePackages: [
    "@villa-platform/database",
    "@villa-platform/rbac",
    "@villa-platform/auth",
    "@villa-platform/payment",
    "@villa-platform/storage",
    "@villa-platform/validation",
  ],
};

export default nextConfig;
