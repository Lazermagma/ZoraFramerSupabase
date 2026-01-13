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
 */
export async function validateSession(accessToken: string) {
  try {
    const { data: { user }, error } = await supabaseClient.auth.getUser(accessToken);
    
    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error validating session:', error);
    return null;
  }
}
