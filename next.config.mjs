/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['node:async_hooks'],
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;