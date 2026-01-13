/**
 * Authentication and authorization helpers
 * 
 * Validates JWT tokens from Framer requests
 * Extracts user role and enforces role-based access control
 */

import { validateSession } from './supabaseClient';
import { supabaseAdmin } from './supabaseAdmin';
import { UserRole } from '@/types/user';

export interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
  error?: string;
}

/**
 * Extracts and validates Bearer token from Authorization header
 * Returns user information if token is valid
 */
export async function authenticateRequest(authHeader: string | null): Promise<AuthResult> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      success: false,
      error: 'Missing or invalid Authorization header. Expected: Bearer <token>'
    };
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const user = await validateSession(token);
    
    if (!user) {
      return {
        success: false,
        error: 'Invalid or expired token'
      };
    }

    // Fetch user role from database
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return {
        success: false,
        error: 'User not found in database'
      };
    }

    return {
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        role: userData.role as UserRole
      }
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed'
    };
  }
}

/**
 * Validates that user has required role
 * Returns true if user role matches or is higher privilege
 */
export function hasRequiredRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    buyer: 1,
    agent: 2,
    admin: 3
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Validates that user has exact role (no hierarchy)
 */
export function hasExactRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return userRole === requiredRole;
}

/**
 * Helper to check if user is agent
 */
export function isAgent(role: UserRole): boolean {
  return role === 'agent' || role === 'admin';
}

/**
 * Helper to check if user is admin
 */
export function isAdmin(role: UserRole): boolean {
  return role === 'admin';
}
