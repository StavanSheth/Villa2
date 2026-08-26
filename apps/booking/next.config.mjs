/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@villa-platform/database",
    "@villa-platform/bookings",
    "@villa-platform/middleware",
    "@villa-platform/payments",
    "@villa-platform/ui",
    "@villa-platform/storage",
    "@villa-platform/types",
    "@villa-platform/hooks"
  ],
  reactStrictMode: true,
  devIndicators: false,
};

export default nextConfig;
