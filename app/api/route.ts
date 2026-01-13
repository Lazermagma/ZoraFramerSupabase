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
      'POST /api/stripe/checkout': 'Create Stripe checkout session',
      'POST /api/listings/create': 'Create a new listing (Agent-only)',
      'POST /api/listings/approve': 'Approve and publish listing (Admin-only)',
      'POST /api/applications/update-status': 'Update application status (Agent-only)',
    },
  });
}
