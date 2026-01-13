/** @type {import('next').NextConfig} */
const nextConfig = {
  // API-only project - optimized for Vercel
  output: 'standalone',
  
  // Use Node.js runtime for all API routes (required for Supabase and Stripe)
  // Vercel will automatically detect and use Node.js runtime
  
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // Ensure proper handling of environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Optimize for serverless
  poweredByHeader: false,
  
  // Ensure API routes work correctly
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
