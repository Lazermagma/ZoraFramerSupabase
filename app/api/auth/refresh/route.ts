/**
 * POST /api/auth/refresh
 * 
 * Refreshes an expired access token using a refresh token
 * 
 * FRAMER REQUEST:
 * POST https://your-api.vercel.app/api/auth/refresh
 * Body:
 *   {
 *     "refresh_token": "refresh_token_here"
 *   }
 * 
 * RESPONSE:
 * {
 *   "session": {
 *     "access_token": "...",
 *     "refresh_token": "...",
 *     "expires_at": 1234567890
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refresh_token } = body;

    if (!refresh_token) {
      return NextResponse.json(
        { error: 'Missing required field: refresh_token' },
        { status: 400 }
      );
    }

    // Refresh the session using the refresh token
    const { data: sessionData, error: refreshError } = await supabaseAdmin.auth.refreshSession({
      refresh_token,
    });

    if (refreshError || !sessionData.session) {
      return NextResponse.json(
        { error: refreshError?.message || 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      session: {
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
        expires_at: sessionData.session.expires_at,
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
