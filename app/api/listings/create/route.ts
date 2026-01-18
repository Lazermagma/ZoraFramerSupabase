/**
 * POST /api/listings/create
 * 
 * Creates a new listing (Agent-only)
 * Listing is created with status = "draft" or "pending_review"
 * 
 * FRAMER REQUEST:
 * POST https://your-api.vercel.app/api/listings/create
 * Headers:
 *   Authorization: Bearer <supabase_access_token>
 *   Content-Type: application/json
 * Body:
 *   {
 *     "title": "Property Title",
 *     "description": "Property description",
 *     "price": 500000,
 *     "location": "123 Main St, City, State",
 *     "property_type": "Buy" | "Rent" | "Development",
 *     "property_category": "Apartment" | "House" | "Townhouse" | "Condo" | "Land" | "Commercial",
 *     "listing_type": "Rent" | "Sale" | "Development",
 *     "street_address": "716 Kings Way",
 *     "parish": "Kingston",
 *     "bedrooms": "1" | "2" | "3" | "4+",
 *     "bathrooms": "1" | "2" | "3" | "4+",
 *     "interior_details": ["Furnished", "Gated", "Pool", "Parking", "Generator / Water Tank"],
 *     "property_size": "1,990 Sqft",
 *     "availability_status": "Available now" | "Under offer" | "Pre-construction" | "Coming soon",
 *     "viewing_instructions": "Viewing by appointment only" | "Open to scheduled viewings" | "No viewings until further notice",
 *     "images": ["https://..."],
 *     "status": "draft" | "pending_review"
 *   }
 * 
 * RESPONSE:
 * {
 *   "listing": {
 *     "id": "...",
 *     "agent_id": "...",
 *     "title": "...",
 *     "status": "pending_review",
 *     ...
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAgent } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { CreateListingRequest } from '@/types/listing';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    const authResult = await authenticateRequest(authHeader);

    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = authResult.user;

    // Check if user is agent or admin
    if (!isAgent(user.role)) {
      return NextResponse.json(
        { error: 'Only agents can create listings' },
        { status: 403 }
      );
    }

    // Parse request body
    const body: CreateListingRequest = await request.json();
    const { 
      title, 
      description, 
      price, 
      location, 
      images,
      property_type,
      property_category,
      listing_type,
      street_address,
      parish,
      bedrooms,
      bathrooms,
      interior_details,
      property_size,
      availability_status,
      viewing_instructions,
    } = body;

    // Validate required fields
    if (!title || !description || !price || !location) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, price, location' },
        { status: 400 }
      );
    }

    // Validate price is positive
    if (price <= 0) {
      return NextResponse.json(
        { error: 'Price must be greater than 0' },
        { status: 400 }
      );
    }

    // Create listing with status (default to 'draft' if not specified)
    const listingStatus = body.status || 'draft';
    
    if (listingStatus !== 'draft' && listingStatus !== 'pending_review') {
      return NextResponse.json(
        { error: 'Invalid status. Must be "draft" or "pending_review"' },
        { status: 400 }
      );
    }

    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .insert({
        agent_id: user.id,
        title,
        description,
        price,
        location,
        property_type,
        property_category,
        listing_type,
        street_address,
        parish,
        bedrooms,
        bathrooms,
        interior_details: interior_details || [],
        property_size,
        availability_status,
        viewing_instructions,
        images: images || [],
        documents: body.documents || [],
        status: listingStatus,
        views: 0,
      })
      .select()
      .single();

    if (listingError) {
      console.error('Error creating listing:', listingError);
      return NextResponse.json(
        { error: 'Failed to create listing', details: listingError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { listing },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create listing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
