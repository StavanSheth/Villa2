/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@villa-platform/database",
    "@villa-platform/bookings",
    "@villa-platform/middleware",
    "@villa-platform/payments",
    "@villa-platform/ui",
    "@villa-platform/storage"
  ],
  reactStrictMode: true,
  devIndicators: false,
};

export default nextConfig;
