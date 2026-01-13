/**
 * Application types
 * 
 * Status flow:
 * - pending: Submitted by buyer, awaiting agent review
 * - approved: Accepted by agent
 * - rejected: Declined by agent
 */

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface Application {
  id: string;
  listing_id: string;
  buyer_id: string;
  agent_id: string;
  status: ApplicationStatus;
  message?: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateApplicationStatusRequest {
  application_id: string;
  status: ApplicationStatus;
}
