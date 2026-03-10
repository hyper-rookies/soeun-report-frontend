import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
      console.warn('[next.config] BACKEND_URL이 설정되지 않아 프록시가 비활성화됩니다.');
      return [];
    }

    return [
      {
        source: "/api/chat/:path*",
        destination: "/api/chat/:path*",
      },
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
