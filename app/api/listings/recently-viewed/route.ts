/**
 * GET /api/listings/recently-viewed
 * 
 * Gets recently viewed properties for the authenticated buyer
 * 
 * POST /api/listings/recently-viewed
 * 
 * Tracks a property view and returns the updated recently viewed properties list
 * 
 * FRAMER REQUEST (GET):
 * GET https://your-api.vercel.app/api/listings/recently-viewed
 * Headers:
 *   Authorization: Bearer <supabase_access_token>
 * Query params (optional):
 *   limit: number of results (default: 10, max: 50)
 * 
 * FRAMER REQUEST (POST):
 * POST https://your-api.vercel.app/api/listings/recently-viewed
 * Headers:
 *   Authorization: Bearer <supabase_access_token>
 *   Content-Type: application/json
 * Body:
 *   {
 *     "listing_id": "listing-uuid",
 *     "limit": 10 (optional)
 *   }
 * 
 * RESPONSE:
 * {
 *   "properties": [
 *     {
 *       "id": "listing-id",
 *       "listing_id": "listing-id",
 *       "title": "Property Title",
 *       "location": "Location",
 *       "images": ["https://..."],
 *       "price": 500000,
 *       "property_category": "Apartment",
 *       "listing_type": "Rent",
 *       "bedrooms": "2",
 *       "bathrooms": "2",
 *       "property_size": "1,990 Sqft",
 *       "viewed_at": "2024-01-01T00:00:00Z",
 *       ...
 *     }
 *   ]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

// Helper function to get recently viewed properties
async function getRecentlyViewedProperties(
  buyerId: string,
  limit: number = 10
) {
  const { data: propertyViews, error: viewsError } = await supabaseAdmin
    .from('property_views')
    .select(`
      viewed_at,
      listing:listings(*)
    `)
    .eq('buyer_id', buyerId)
    .order('viewed_at', { ascending: false })
    .limit(limit);

  if (viewsError) {
    throw viewsError;
  }

  // Transform the data to match the component's expected format
  const properties = (propertyViews || [])
    .filter((pv: any) => pv.listing !== null) // Filter out null listings
    .map((pv: any) => {
      const listing = pv.listing;
      return {
        id: listing.id,
        listing_id: listing.id,
        title: listing.title,
        description: listing.description,
        location: listing.location,
        street_address: listing.street_address,
        parish: listing.parish,
        price: listing.price,
        property_type: listing.property_type,
        property_category: listing.property_category,
        listing_type: listing.listing_type,
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        interior_details: listing.interior_details || [],
        property_size: listing.property_size,
        availability_status: listing.availability_status,
        viewing_instructions: listing.viewing_instructions,
        images: listing.images || [],
        views: listing.views || 0,
        status: listing.status,
        viewed_at: pv.viewed_at,
        created_at: listing.created_at,
        published_at: listing.published_at,
        // Additional fields for backward compatibility
        property_name: listing.title,
        image: listing.images?.[0],
        primary_image: listing.images?.[0],
        address: listing.location,
      };
    });

  return properties;
}

export async function GET(request: NextRequest) {
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

    // Verify user is buyer or admin
    if (user.role !== 'buyer' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Buyers only.' },
        { status: 403 }
      );
    }

    // Get limit from query params (default: 10, max: 50)
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get('limit');
    const limit = Math.min(
      limitParam ? parseInt(limitParam, 10) : 10,
      50
    );

    // Get recently viewed properties for the buyer
    const properties = await getRecentlyViewedProperties(user.id, limit);

    return NextResponse.json({
      properties,
    });
  } catch (error) {
    console.error('Recently viewed properties error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Verify user is buyer or admin
    if (user.role !== 'buyer' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Buyers only.' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { listing_id, limit: limitParam } = body;

    if (!listing_id) {
      return NextResponse.json(
        { error: 'Missing required field: listing_id' },
        { status: 400 }
      );
    }

    // Verify listing exists
    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('id, status')
      .eq('id', listing_id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Only track views for approved listings
    if (listing.status !== 'approved') {
      return NextResponse.json(
        { error: 'Can only view approved listings' },
        { status: 403 }
      );
    }

    // Track view (upsert to handle duplicates - updates viewed_at timestamp)
    const { error: viewError } = await supabaseAdmin
      .from('property_views')
      .upsert({
        buyer_id: user.id,
        listing_id: listing_id,
        viewed_at: new Date().toISOString(),
      }, {
        onConflict: 'buyer_id,listing_id',
      });

    if (viewError) {
      console.error('Error tracking view:', viewError);
      return NextResponse.json(
        { error: 'Failed to track view', details: viewError.message },
        { status: 500 }
      );
    }

    // Increment listing view count
    const { data: currentListing } = await supabaseAdmin
      .from('listings')
      .select('views')
      .eq('id', listing_id)
      .single();

    if (currentListing) {
      await supabaseAdmin
        .from('listings')
        .update({ views: (currentListing.views || 0) + 1 })
        .eq('id', listing_id);
    }

    // Get limit from body or default to 10
    const limit = Math.min(
      limitParam ? parseInt(limitParam, 10) : 10,
      50
    );

    // Return updated recently viewed properties
    const properties = await getRecentlyViewedProperties(user.id, limit);

    return NextResponse.json({
      properties,
      message: 'View tracked successfully',
    });
  } catch (error) {
    console.error('Track view and get recently viewed error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
