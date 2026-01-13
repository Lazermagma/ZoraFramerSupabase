/**
 * POST /api/listings/reject
 * 
 * Rejects a listing (Admin-only)
 * 
 * FRAMER REQUEST:
 * POST https://your-api.vercel.app/api/listings/reject
 * Headers: Authorization: Bearer <token>
 * Body: { "listing_id": "...", "rejection_reason": "..." }
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { RejectListingRequest } from '@/types/listing';

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

    if (!isAdmin(user.role)) {
      return NextResponse.json(
        { error: 'Only admins can reject listings' },
        { status: 403 }
      );
    }

    const body: RejectListingRequest = await request.json();
    const { listing_id, rejection_reason } = body;

    if (!listing_id) {
      return NextResponse.json(
        { error: 'Missing required field: listing_id' },
        { status: 400 }
      );
    }

    // Fetch listing
    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('*')
      .eq('id', listing_id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Verify listing is in pending_review status
    if (listing.status !== 'pending_review') {
      return NextResponse.json(
        { error: `Listing is not pending review. Current status: ${listing.status}` },
        { status: 400 }
      );
    }

    // Update listing to rejected
    const { data: updatedListing, error: updateError } = await supabaseAdmin
      .from('listings')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString(),
        // Store rejection reason in description or a separate field if you have one
      })
      .eq('id', listing_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to reject listing', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      listing: updatedListing,
      message: 'Listing rejected successfully',
    });
  } catch (error) {
    console.error('Reject listing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
