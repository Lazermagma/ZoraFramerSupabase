/**
 * GET /api/user/account-status
 * 
 * Gets current user's account status
 * 
 * FRAMER REQUEST:
 * GET https://your-api.vercel.app/api/user/account-status
 * Headers: Authorization: Bearer <token>
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const authResult = await authenticateRequest(authHeader);

    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('account_status, role')
      .eq('id', authResult.user.id)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      account_status: user.account_status,
      role: user.role,
    });
  } catch (error) {
    console.error('Get account status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
