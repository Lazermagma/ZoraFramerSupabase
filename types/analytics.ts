/**
 * Analytics types
 * Simple counts only - no charts or advanced analytics
 */

export interface Analytics {
  views: number;
  applications: number;
  listings: number;
}

export interface AgentAnalytics {
  total_listings: number;
  pending_listings: number;
  approved_listings: number;
  total_applications: number;
  pending_applications: number;
  accepted_applications: number;
}

export interface BuyerAnalytics {
  total_applications: number;
  submitted_applications: number;
  accepted_applications: number;
  rejected_applications: number;
}
