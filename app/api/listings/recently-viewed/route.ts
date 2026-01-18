/**
 * GET /api/listings/recently-viewed
 * 
 * Gets recently viewed properties for the authenticated buyer
 * 
 * FRAMER REQUEST:
 * GET https://your-api.vercel.app/api/listings/recently-viewed
 * Headers:
 *   Authorization: Bearer <supabase_access_token>
 * Query params (optional):
 *   limit: number of results (default: 10, max: 50)
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
    // Join property_views with listings to get full property details
    const { data: propertyViews, error: viewsError } = await supabaseAdmin
      .from('property_views')
      .select(`
        viewed_at,
        listing:listings(*)
      `)
      .eq('buyer_id', user.id)
      .order('viewed_at', { ascending: false })
      .limit(limit);

    if (viewsError) {
      console.error('Error fetching property views:', viewsError);
      return NextResponse.json(
        { error: 'Failed to fetch recently viewed properties', details: viewsError.message },
        { status: 500 }
      );
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
