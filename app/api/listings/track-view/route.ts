/**
 * POST /api/listings/track-view
 * 
 * Tracks when a buyer views a property listing
 * 
 * FRAMER REQUEST:
 * POST https://your-api.vercel.app/api/listings/track-view
 * Headers: Authorization: Bearer <token>
 * Body:
 *   {
 *     "listing_id": "..."
 *   }
 * 
 * RESPONSE:
 * {
 *   "message": "View tracked successfully"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const authResult = await authenticateRequest(authHeader);

    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = authResult.user;

    // Verify user is buyer
    if (user.role !== 'buyer' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Buyers only.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { listing_id } = body;

    if (!listing_id) {
      return NextResponse.json(
        { error: 'Missing required field: listing_id' },
        { status: 400 }
      );
    }

    // Verify listing exists
    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('id')
      .eq('id', listing_id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Track view (upsert to handle duplicates)
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

    return NextResponse.json({
      message: 'View tracked successfully',
    });
  } catch (error) {
    console.error('Track view error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
