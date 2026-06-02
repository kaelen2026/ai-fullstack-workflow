import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // @repo/api is consumed type-only today, but transpiling it keeps the door
  // open for sharing runtime utilities from the workspace package.
  transpilePackages: ['@repo/api'],
}

export default nextConfig
