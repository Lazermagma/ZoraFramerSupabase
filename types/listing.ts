/**
 * Listing types
 * 
 * Status flow:
 * - draft: Created by agent, not yet submitted
 * - pending_review: Submitted by agent, awaiting admin approval
 * - approved: Approved by admin, visible to buyers
 * - rejected: Rejected by admin
 * - archived: Hidden from public view (expired or manually archived)
 */

export type ListingStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'archived';

export interface Listing {
  id: string;
  agent_id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  status: ListingStatus;
  images?: string[];
  documents?: string[];
  views?: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
  expires_at?: string;
}

export interface CreateListingRequest {
  title: string;
  description: string;
  price: number;
  location: string;
  images?: string[];
  documents?: string[];
  status?: 'draft' | 'pending_review';
}

export interface UpdateListingRequest {
  listing_id: string;
  title?: string;
  description?: string;
  price?: number;
  location?: string;
  images?: string[];
  documents?: string[];
  status?: ListingStatus;
}

export interface ApproveListingRequest {
  listing_id: string;
}

export interface RejectListingRequest {
  listing_id: string;
  rejection_reason?: string;
}
