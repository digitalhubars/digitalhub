/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static site for Firebase Hosting; data and WooCommerce calls go through Firebase.
  // Only for builds: `next dev` in Next 14 rejects export mode on optional catch-all routes.
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  images: { unoptimized: true },
};

export default nextConfig;
