/** @type {import('next').NextConfig} */
const nextConfig = {
  // API-only project - optimized for serverless (Vercel/Netlify)
  // Netlify plugin handles output automatically
  
  // Use Node.js runtime for all API routes (required for Supabase and Stripe)
  // Netlify Functions will handle API routes via @netlify/plugin-nextjs
  
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
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
  
  // Disable image optimization (not needed for API-only)
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
