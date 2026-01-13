/**
 * Listing types
 * 
 * Status flow:
 * - pending_review: Created by agent, awaiting admin approval
 * - published: Approved by admin, visible to buyers
 * - archived: Hidden from public view
 */

export type ListingStatus = 'pending_review' | 'published' | 'archived';

export interface Listing {
  id: string;
  agent_id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  status: ListingStatus;
  images?: string[];
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface CreateListingRequest {
  title: string;
  description: string;
  price: number;
  location: string;
  images?: string[];
}

export interface ApproveListingRequest {
  listing_id: string;
}
