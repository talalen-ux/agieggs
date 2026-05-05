/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // We don't ship lint rules; don't let a missing/strict eslint config
  // turn the Vercel build red.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
