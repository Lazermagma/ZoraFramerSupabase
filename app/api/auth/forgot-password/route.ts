/**
 * POST /api/auth/forgot-password
 * 
 * Sends password reset email via Supabase
 * 
 * FRAMER REQUEST:
 * POST https://your-api.vercel.app/api/auth/forgot-password
 * Body:
 *   {
 *     "email": "user@example.com"
 *   }
 * 
 * RESPONSE:
 * {
 *   "message": "Password reset email sent"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabaseClient';
import { ForgotPasswordRequest } from '@/types/user';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body: ForgotPasswordRequest = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Get app URL for redirect
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Send password reset email
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/reset-password`,
    });

    if (error) {
      // Don't reveal if email exists or not for security
      return NextResponse.json(
        { message: 'If an account exists with this email, a password reset link has been sent.' },
        { status: 200 }
      );
    }

    return NextResponse.json({
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
