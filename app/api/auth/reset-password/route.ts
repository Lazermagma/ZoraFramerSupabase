/**
 * POST /api/auth/reset-password
 * 
 * Resets password using token from email
 * 
 * FRAMER REQUEST:
 * POST https://your-api.vercel.app/api/auth/reset-password
 * Body:
 *   {
 *     "token": "reset-token-from-email",
 *     "new_password": "newpassword123"
 *   }
 * 
 * RESPONSE:
 * {
 *   "message": "Password reset successfully"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { ResetPasswordRequest } from '@/types/user';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body: ResetPasswordRequest = await request.json();
    const { token, new_password } = body;

    if (!token || !new_password) {
      return NextResponse.json(
        { error: 'Missing required fields: token, new_password' },
        { status: 400 }
      );
    }

    if (new_password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Verify token and update password
    // Note: Supabase handles token verification through the reset link
    // This endpoint should be called after user clicks the reset link
    // The token is typically handled by Supabase's built-in reset flow
    
    // For API-based reset, we need to use the admin client
    // First, verify the token by attempting to get the user
    const { data: { user }, error: verifyError } = await supabaseAdmin.auth.getUser(token);

    if (verifyError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: new_password }
    );

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to reset password', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
