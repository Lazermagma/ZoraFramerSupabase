/**
 * Application types
 * 
 * Status flow:
 * - submitted: Submitted by buyer
 * - viewed: Agent has viewed the application
 * - under_review: Agent is reviewing the application
 * - accepted: Accepted by agent
 * - rejected: Declined by agent
 */

export type ApplicationStatus = 'submitted' | 'viewed' | 'under_review' | 'accepted' | 'rejected';

export interface Application {
  id: string;
  listing_id: string;
  buyer_id: string;
  agent_id: string;
  status: ApplicationStatus;
  message?: string;
  documents?: string[];
  created_at: string;
  updated_at: string;
  viewed_at?: string;
}

export interface CreateApplicationRequest {
  listing_id: string;
  message?: string;
  documents?: string[];
}

export interface UpdateApplicationStatusRequest {
  application_id: string;
  status: ApplicationStatus;
}
