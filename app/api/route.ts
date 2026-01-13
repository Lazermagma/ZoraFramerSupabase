/**
 * GET /api
 * 
 * Health check endpoint
 * Returns API status and available endpoints
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Framer-Supabase API Backend',
    version: '1.0.0',
    endpoints: {
      // Authentication
      'POST /api/auth/signup': 'Create new user account',
      'POST /api/auth/signin': 'Sign in existing user',
      'POST /api/auth/forgot-password': 'Request password reset',
      'POST /api/auth/reset-password': 'Reset password with token',
      'POST /api/auth/update-password': 'Update password (authenticated)',
      
      // User Management
      'GET /api/user/profile': 'Get user profile',
      'PUT /api/user/profile': 'Update user profile',
      'PUT /api/user/email': 'Update user email',
      'GET /api/user/account-status': 'Get account status',
      
      // Dashboards
      'GET /api/dashboard/buyer': 'Get buyer dashboard data',
      'GET /api/dashboard/agent': 'Get agent dashboard data',
      
      // Listings
      'POST /api/listings/create': 'Create new listing (Agent-only)',
      'PUT /api/listings/update': 'Update listing (Agent-only)',
      'POST /api/listings/approve': 'Approve listing (Admin-only)',
      'POST /api/listings/reject': 'Reject listing (Admin-only)',
      'GET /api/listings/browse': 'Browse approved listings (Public)',
      
      // Applications
      'POST /api/applications/create': 'Create application (Buyer-only)',
      'POST /api/applications/update-status': 'Update application status (Agent-only)',
      
      // Payments
      'POST /api/stripe/checkout': 'Create Stripe checkout session',
      'POST /api/stripe/payment-success': 'Handle payment success',
      
      // Analytics
      'GET /api/analytics': 'Get user analytics',
      
      // WhatsApp
      'POST /api/whatsapp/generate-link': 'Generate WhatsApp link',
      
      // Storage
      'POST /api/storage/upload': 'Upload document/file',
    },
  });
}
