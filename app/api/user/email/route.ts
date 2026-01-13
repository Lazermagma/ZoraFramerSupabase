/**
 * PUT /api/user/email
 * 
 * Updates user email
 * 
 * FRAMER REQUEST:
 * PUT https://your-api.vercel.app/api/user/email
 * Headers: Authorization: Bearer <token>
 * Body: { "new_email": "newemail@example.com" }
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { UpdateEmailRequest } from '@/types/user';

export const runtime = 'nodejs';

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const authResult = await authenticateRequest(authHeader);

    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: UpdateEmailRequest = await request.json();
    const { new_email } = body;

    if (!new_email) {
      return NextResponse.json(
        { error: 'New email is required' },
        { status: 400 }
      );
    }

    // Update email in Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      authResult.user.id,
      { email: new_email }
    );

    if (authError) {
      return NextResponse.json(
        { error: 'Failed to update email', details: authError.message },
        { status: 500 }
      );
    }

    // Update email in user profile
    const { data: user, error: profileError } = await supabaseAdmin
      .from('users')
      .update({
        email: new_email,
        updated_at: new Date().toISOString(),
      })
      .eq('id', authResult.user.id)
      .select()
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to update email in profile', details: profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Email updated successfully',
      user,
    });
  } catch (error) {
    console.error('Update email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
