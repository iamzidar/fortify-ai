import type { NextConfig } from 'next'

const API_GATEWAY = process.env.API_GATEWAY_URL ?? 'http://api-gateway:3001'

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_GATEWAY}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
