/**
 * POST /api/auth/update-password
 * 
 * Updates password for logged-in user
 * 
 * FRAMER REQUEST:
 * POST https://your-api.vercel.app/api/auth/update-password
 * Headers:
 *   Authorization: Bearer <supabase_access_token>
 * Body:
 *   {
 *     "current_password": "oldpassword",
 *     "new_password": "newpassword123"
 *   }
 * 
 * RESPONSE:
 * {
 *   "message": "Password updated successfully"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { UpdatePasswordRequest } from '@/types/user';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    const authResult = await authenticateRequest(authHeader);

    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: UpdatePasswordRequest = await request.json();
    const { current_password, new_password } = body;

    if (!current_password || !new_password) {
      return NextResponse.json(
        { error: 'Missing required fields: current_password, new_password' },
        { status: 400 }
      );
    }

    if (new_password.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Verify current password by attempting to sign in
    const { data: verifyData, error: verifyError } = await supabaseAdmin.auth.signInWithPassword({
      email: authResult.user.email,
      password: current_password,
    });

    if (verifyError || !verifyData.user) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      authResult.user.id,
      { password: new_password }
    );

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update password', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Update password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
