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

    // Exchange token for session and update password
    // Supabase password reset tokens need to be exchanged first
    try {
      // Try to exchange the token (this verifies it's valid)
      // Note: The token from email is an access_token, not a regular token
      // We need to use it to get the user, then update password
      
      // First, try to get user from the token
      const { data: { user }, error: verifyError } = await supabaseAdmin.auth.getUser(token);

      if (verifyError || !user) {
        // If that doesn't work, the token might be in the hash format
        // Try using updateUser with the token directly
        return NextResponse.json(
          { error: 'Invalid or expired reset token. Please request a new password reset link.' },
          { status: 400 }
        );
      }

      // Update password using admin API
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
    } catch (error) {
      console.error('Password reset error:', error);
      return NextResponse.json(
        { error: 'Invalid or expired reset token. Please request a new password reset link.' },
        { status: 400 }
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
