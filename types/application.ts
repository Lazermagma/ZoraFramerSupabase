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
  // Form field names (from frontend)
  application_type?: string; // "Rent" or "Buy"
  property_type?: string; // "Property Seeker (Buyer/ Renter)" - metadata
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  country?: string; // Maps to country_of_residence
  parish?: string;
  employment_status?: string;
  monthly_income?: string; // Maps to monthly_income_range
  budget_range?: string; // For renters
  purchase_budget?: string; // Maps to purchase_budget_range for buyers
  intended_income?: string; // Maps to intended_move_in_timeframe (seems like a typo in form)
  government_approved?: string; // Document filename/URL - add to documents array
  job_letter?: string; // Document filename/URL - add to documents array
  checkbox1?: boolean; // Maps to declaration_application_not_approval
  checkbox2?: boolean; // Maps to declaration_prepared_to_provide_docs
  checkbox3?: boolean; // Maps to declaration_actively_looking
  // Direct database field names (for backward compatibility)
  employment_status_direct?: string;
  monthly_income_range?: string;
  purchase_budget_range?: string;
  intended_move_in_timeframe?: string;
  declaration_application_not_approval?: boolean;
  declaration_prepared_to_provide_docs?: boolean;
  declaration_actively_looking?: boolean;
}

export interface UpdateApplicationStatusRequest {
  application_id: string;
  status: ApplicationStatus;
}
