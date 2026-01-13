/**
 * POST /api/auth/confirm-email
 * 
 * Confirms email using token from confirmation link
 * 
 * FRAMER REQUEST:
 * POST https://your-api.vercel.app/api/auth/confirm-email
 * Body:
 *   {
 *     "token": "confirmation-token-from-email",
 *     "redirect_to": "/dashboard/buyer" // optional
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

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, redirect_to } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Missing required field: token' },
        { status: 400 }
      );
    }

    // Supabase email confirmation tokens come in the URL hash as access_token
    // The token parameter here is actually the access_token from the URL
    // We need to use it to get the user and confirm them
    
    try {
      // Get user from the access token
      const { data: { user }, error: verifyError } = await supabaseAdmin.auth.getUser(token);
      
      if (verifyError || !user) {
        return NextResponse.json(
          { error: 'Invalid or expired confirmation token' },
          { status: 400 }
        );
      }

      // If user is already confirmed, get their profile and return success
      if (user.email_confirmed_at) {
        const { data: profileData, error: profileError } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          return NextResponse.json(
            { error: 'User profile not found' },
            { status: 404 }
          );
        }

        // Try to create a session for the already-confirmed user
        // Note: We can't create a session without password, so we return requires_signin
        return NextResponse.json({
          user: profileData,
          message: 'Email is already confirmed. Please sign in.',
          requires_signin: true,
        });
      }

      // Confirm the user using admin API
      const { data: updatedUser, error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { email_confirm: true }
      );

      if (confirmError) {
        return NextResponse.json(
          { error: 'Failed to confirm email', details: confirmError.message },
          { status: 500 }
        );
      }

      // Get user profile
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        return NextResponse.json(
          { error: 'User profile not found' },
          { status: 404 }
        );
      }

      // Note: We can't create a session here without the password
      // The user will need to sign in after confirmation
      return NextResponse.json({
        user: profileData,
        message: 'Email confirmed successfully. Please sign in.',
        requires_signin: true,
      });
    } catch (error) {
      console.error('Email confirmation error:', error);
      return NextResponse.json(
        { error: 'Failed to confirm email' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Confirm email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
