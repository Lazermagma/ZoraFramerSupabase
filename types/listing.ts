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

export type PropertyType = 'Buy' | 'Rent';

export interface Listing {
  id: string;
  agent_id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  property_type?: PropertyType;
  property_category?: 'Apartment' | 'House' | 'Townhouse' | 'Condo' | 'Land' | 'Commercial';
  listing_type?: 'Rent' | 'Sale' | 'Development';
  street_address?: string;
  parish?: string;
  bedrooms?: string;
  bathrooms?: string;
  interior_details?: string[];
  property_size?: string;
  availability_status?: 'Available now' | 'Under offer' | 'Pre-construction' | 'Coming soon';
  viewing_instructions?: 'Viewing by appointment only' | 'Open to scheduled viewings' | 'No viewings until further notice';
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
  // Basic Information
  title: string;
  description: string;
  price: number;
  location: string;
  
  // Property Details
  property_type?: PropertyType;
  property_category?: 'Apartment' | 'House' | 'Townhouse' | 'Condo' | 'Land' | 'Commercial';
  listing_type?: 'Rent' | 'Sale' | 'Development';
  street_address?: string;
  parish?: string;
  bedrooms?: string;
  bathrooms?: string;
  interior_details?: string[];
  property_size?: string;
  availability_status?: 'Available now' | 'Under offer' | 'Pre-construction' | 'Coming soon';
  viewing_instructions?: 'Viewing by appointment only' | 'Open to scheduled viewings' | 'No viewings until further notice';
  
  // Media & Documents
  images?: string[];
  documents?: string[];
  
  // Status
  status?: 'draft' | 'pending_review';
}

export interface UpdateListingRequest {
  listing_id: string;
  title?: string;
  description?: string;
  price?: number;
  location?: string;
  property_type?: PropertyType;
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
