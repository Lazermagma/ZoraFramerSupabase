/**
 * POST /api/auth/signin
 * 
 * Signs in an existing user
 * 
 * FRAMER REQUEST:
 * POST https://your-api.vercel.app/api/auth/signin
 * Body:
 *   {
 *     "email": "user@example.com",
 *     "password": "password123"
 *   }
 * 
 * RESPONSE:
 * {
 *   "user": { ... },
 *   "session": { access_token: "...", ... }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { SignInRequest } from '@/types/user';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body: SignInRequest = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password' },
        { status: 400 }
      );
    }

    // Sign in with Supabase
    const { data: sessionData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !sessionData.session || !sessionData.user) {
      return NextResponse.json(
        { error: authError?.message || 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', sessionData.user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Check if account is active
    if (userData.account_status !== 'active') {
      return NextResponse.json(
        { error: 'Account is inactive. Please contact support.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      user: userData,
      session: {
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
        expires_at: sessionData.session.expires_at,
      },
    });
  } catch (error) {
    console.error('Signin error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
