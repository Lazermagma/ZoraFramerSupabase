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
  // Financial & Employment Info
  employment_status?: string;
  monthly_income_range?: string;
  budget_range?: string; // For renters
  purchase_budget_range?: string; // For buyers
  intended_move_in_timeframe?: string;
  // Declarations
  declaration_application_not_approval?: boolean;
  declaration_prepared_to_provide_docs?: boolean;
  declaration_actively_looking?: boolean;
  created_at: string;
  updated_at: string;
  viewed_at?: string;
}

export interface CreateApplicationRequest {
  listing_id: string;
  message?: string;
  documents?: string[];
  // Financial & Employment Info
  employment_status?: string;
  monthly_income_range?: string;
  budget_range?: string; // For renters
  purchase_budget_range?: string; // For buyers
  intended_move_in_timeframe?: string;
  // Declarations
  declaration_application_not_approval?: boolean;
  declaration_prepared_to_provide_docs?: boolean;
  declaration_actively_looking?: boolean;
}

export interface UpdateApplicationStatusRequest {
  application_id: string;
  status: ApplicationStatus;
}
