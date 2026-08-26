/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@villa-platform/identity",
    "@villa-platform/database",
    "@villa-platform/bookings",
    "@villa-platform/middleware",
    "@villa-platform/ui",
    "@villa-platform/payments",
    "@villa-platform/storage",
    "@villa-platform/validation",
    "@villa-platform/invoices",
    "@villa-platform/authorization",
    "@villa-platform/types",
    "@villa-platform/hooks"
  ],
  reactStrictMode: true,
  devIndicators: false,
};

export default nextConfig;
