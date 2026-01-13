/**
 * POST /api/listings/approve
 * 
 * Approves and publishes a listing (Admin-only)
 * Verifies agent has active subscription before publishing
 * 
 * FRAMER REQUEST:
 * POST https://your-api.vercel.app/api/listings/approve
 * Headers:
 *   Authorization: Bearer <supabase_access_token>
 *   Content-Type: application/json
 * Body:
 *   {
 *     "listing_id": "listing-uuid"
 *   }
 * 
 * RESPONSE:
 * {
 *   "listing": {
 *     "id": "...",
 *     "status": "published",
 *     "published_at": "...",
 *     ...
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { ApproveListingRequest } from '@/types/listing';

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

    // Check if user is admin
    if (!isAdmin(user.role)) {
      return NextResponse.json(
        { error: 'Only admins can approve listings' },
        { status: 403 }
      );
    }

    // Parse request body
    const body: ApproveListingRequest = await request.json();
    const { listing_id } = body;

    if (!listing_id) {
      return NextResponse.json(
        { error: 'Missing required field: listing_id' },
        { status: 400 }
      );
    }

    // Fetch listing
    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('*, agent_id')
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

    // Verify agent has active subscription
    // This assumes you have a subscriptions table with user_id and status
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('status')
      .eq('user_id', listing.agent_id)
      .eq('status', 'active')
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'Agent does not have an active subscription' },
        { status: 403 }
      );
    }

    // Update listing to published
    const { data: updatedListing, error: updateError } = await supabaseAdmin
      .from('listings')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .eq('id', listing_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating listing:', updateError);
      return NextResponse.json(
        { error: 'Failed to approve listing', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      listing: updatedListing,
    });
  } catch (error) {
    console.error('Approve listing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
