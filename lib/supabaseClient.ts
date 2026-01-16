/**
 * Supabase Client for user session validation
 * 
 * Uses SUPABASE_ANON_KEY - safe to use for validating user sessions
 * This client is used to verify tokens sent from Framer
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables: SUPABASE_URL and SUPABASE_ANON_KEY are required');
}

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Validates a Supabase access token from Framer
 * Returns the user session if valid, null otherwise
 * 
 * Note: This will return null if the token is expired.
 * Clients should use the refresh token endpoint to get a new access token.
 */
export async function validateSession(accessToken: string) {
  try {
    const { data: { user }, error } = await supabaseClient.auth.getUser(accessToken);
    
    if (error) {
      // Log the specific error for debugging
      if (error.message?.includes('expired') || error.message?.includes('JWT')) {
        console.log('Token validation failed:', error.message);
      }
      return null;
    }

    if (!user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error validating session:', error);
    return null;
  }
}
