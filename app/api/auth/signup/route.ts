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
 *     "first_name": "John", // optional
 *     "last_name": "Doe", // optional
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
    const { email, password, role, first_name, last_name, name, phone, country_of_residence, parish } = body;

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

    // Get app URL for email confirmation redirect
    // Auto-detect from request headers to avoid secret scanning issues
    let appUrl: string | null = null;
    try {
      const host = request?.headers?.get('host') || null;
      const origin = request?.headers?.get('origin') || null;
      const protocol = request?.headers?.get('x-forwarded-proto') || 'https';
      appUrl = process.env.NEXT_PUBLIC_APP_URL || 
               origin || 
               (host ? `${protocol}://${host}` : null);
    } catch (error) {
      console.error('Error getting app URL from headers:', error);
      appUrl = process.env.NEXT_PUBLIC_APP_URL || null;
    }
    
    if (!appUrl) {
      return NextResponse.json(
        { error: 'Unable to determine app URL. Please configure the app URL in environment variables.' },
        { status: 500 }
      );
    }
    
    const redirectTo = `${appUrl}/confirm-email`;

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          role,
          first_name: first_name || '',
          last_name: last_name || '',
          name: name || (first_name && last_name ? `${first_name} ${last_name}` : '') || '',
          phone: phone || '',
          country_of_residence: country_of_residence || '',
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
    // Support both first_name/last_name and legacy name field
    const fullName = name || (first_name && last_name ? `${first_name} ${last_name}` : null);
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        role,
        first_name: first_name || null,
        last_name: last_name || null,
        name: fullName,
        phone: phone || null,
        country_of_residence: country_of_residence || null,
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

    // Check if session was returned from signUp (email confirmation disabled)
    if (authData.session) {
      return NextResponse.json({
        user: profileData,
        session: {
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
          expires_at: authData.session.expires_at,
        },
      }, { status: 201 });
    }

    // If no session (email confirmation required), check if user needs confirmation
    if (authData.user && !authData.user.email_confirmed_at) {
      return NextResponse.json({
        user: profileData,
        message: 'Account created successfully. Please check your email to confirm your account.',
        requires_confirmation: true,
      }, { status: 201 });
    }

    // Try to sign in (in case user was auto-confirmed)
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (sessionError || !sessionData.session) {
      return NextResponse.json(
        { 
          error: 'Account created but failed to create session',
          details: sessionError?.message || 'Please check your email to confirm your account',
          requires_confirmation: true,
        },
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
