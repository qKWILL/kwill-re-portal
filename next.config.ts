import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    // Keep already-visited route RSC payloads in the client router cache
    // so tab switches are instant after the first visit and the
    // loading.tsx skeleton doesn't flash on every navigation.
    staleTimes: {
      dynamic: 300,
      static: 600,
    },
  },
  images: {
    minimumCacheTTL: 2592000,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fsfyshvkcbjrrpqbbuzj.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
}

export default nextConfig
