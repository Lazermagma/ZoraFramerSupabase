/**
 * POST /api/auth/signup
 * 
 * Creates a new user account with role selection
 * 
 * FRAMER REQUEST:
 * POST https://your-api.vercel.app/api/auth/signup
 * Body:
 *   {
 *     "email": "user@example.com",
 *     "password": "password123",
 *     "role": "buyer" | "agent",
 *     "name": "John Doe", // optional
 *     "phone": "+1234567890", // optional
 *     "parish": "Kingston" // optional
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
import { SignUpRequest } from '@/types/user';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body: SignUpRequest = await request.json();
    const { email, password, role, name, phone, parish } = body;

    // Validate required fields
    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, role' },
        { status: 400 }
      );
    }

    // Validate role
    if (role !== 'buyer' && role !== 'agent') {
      return NextResponse.json(
        { error: 'Invalid role. Must be "buyer" or "agent"' },
        { status: 400 }
      );
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          name: name || '',
          phone: phone || '',
          parish: parish || '',
        },
      },
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || 'Failed to create user' },
        { status: 400 }
      );
    }

    // Create user profile in database
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        role,
        name: name || null,
        phone: phone || null,
        parish: parish || null,
        account_status: 'active',
      })
      .select()
      .single();

    if (profileError) {
      // If profile creation fails, try to delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: 'Failed to create user profile', details: profileError.message },
        { status: 500 }
      );
    }

    // Get session
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (sessionError || !sessionData.session) {
      return NextResponse.json(
        { error: 'Account created but failed to create session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      user: profileData,
      session: {
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
        expires_at: sessionData.session.expires_at,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
