/**
 * User types and roles
 * 
 * Roles:
 * - buyer: Can view listings and submit applications
 * - agent: Can create listings and manage applications
 * - admin: Can approve listings and manage all content
 */

export type UserRole = 'buyer' | 'agent' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface UserSession {
  user: User;
  access_token: string;
  expires_at?: number;
}
