/**
 * GET /api/user/profile - Get current user profile
 * PUT /api/user/profile - Update user profile
 * 
 * FRAMER REQUEST:
 * GET https://your-api.vercel.app/api/user/profile
 * Headers: Authorization: Bearer <token>
 * 
 * PUT https://your-api.vercel.app/api/user/profile
 * Headers: Authorization: Bearer <token>
 * Body: { "name": "...", "phone": "...", "parish": "..." }
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { UpdateProfileRequest } from '@/types/user';

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
      .select('*')
      .eq('id', authResult.user.id)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const body: UpdateProfileRequest = await request.json();
    const { name, phone, parish } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (parish !== undefined) updateData.parish = parish;
    updateData.updated_at = new Date().toISOString();

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', authResult.user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update profile', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
