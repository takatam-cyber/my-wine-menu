/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Edge環境でNext.js 15を安定させる設定
  serverExternalPackages: ['node:async_hooks'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
