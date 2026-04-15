/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // 静的サイトとして書き出す設定（これが一番安定します）
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
