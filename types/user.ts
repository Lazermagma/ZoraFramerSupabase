/**
 * User types and roles
 * 
 * Roles:
 * - buyer: Can view listings and submit applications (Buyer/Renter)
 * - agent: Can create listings and manage applications (Agent/Owner)
 * - admin: Can approve listings and manage all content
 */

export type UserRole = 'buyer' | 'agent' | 'admin';

export type AccountStatus = 'active' | 'inactive';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  first_name?: string;
  last_name?: string;
  name?: string; // Deprecated: kept for backward compatibility
  phone?: string;
  parish?: string;
  account_status: AccountStatus;
  created_at: string;
  updated_at: string;
}

export interface UserSession {
  user: User;
  access_token: string;
  expires_at?: number;
}

export interface SignUpRequest {
  email: string;
  password: string;
  role: 'buyer' | 'agent';
  first_name?: string;
  last_name?: string;
  name?: string; // Deprecated: kept for backward compatibility
  phone?: string;
  parish?: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  name?: string; // Deprecated: kept for backward compatibility
  phone?: string;
  parish?: string;
}

export interface UpdateEmailRequest {
  new_email: string;
}

export interface UpdatePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}
