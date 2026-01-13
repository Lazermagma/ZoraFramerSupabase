/** @type {import('next').NextConfig} */
const nextConfig = {
  // API-only project - no pages needed
  output: 'standalone',
  // Use Node.js runtime for all API routes
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = nextConfig
