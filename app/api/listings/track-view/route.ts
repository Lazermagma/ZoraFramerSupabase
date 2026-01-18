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

    // Check if this is a new view (buyer hasn't viewed this property before)
    const { data: existingView, error: checkError } = await supabaseAdmin
      .from('property_views')
      .select('id')
      .eq('buyer_id', user.id)
      .eq('listing_id', listing_id)
      .maybeSingle();

    if (checkError) {
      console.error('[Track View] Error checking existing view:', checkError);
      // Continue anyway - assume it's a new view if we can't check
    }

    const isNewView = !existingView;
    console.log(`[Track View] Buyer ${user.id} viewing listing ${listing_id}: ${isNewView ? 'NEW VIEW' : 'REPEAT VIEW'}`);

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
      console.error('[Track View] Error tracking view in property_views table:', viewError);
      return NextResponse.json(
        { error: 'Failed to track view', details: viewError.message },
        { status: 500 }
      );
    }

    console.log(`[Track View] Successfully upserted property_view for buyer ${user.id}, listing ${listing_id}`);

    // Only increment listing view count for NEW views (not repeat views)
    // This tracks unique views per property, not total clicks
    let viewCountIncremented = false;
    if (isNewView) {
      // Fetch current view count and increment
      const { data: currentListing, error: selectError } = await supabaseAdmin
        .from('listings')
        .select('views')
        .eq('id', listing_id)
        .single();

      if (selectError) {
        console.error('[Track View] Error fetching current views for increment:', selectError);
        console.error('[Track View] Select error details:', JSON.stringify(selectError));
        // Don't fail the whole request, but log the error
      } else if (currentListing !== null) {
        const oldViewsCount = currentListing.views || 0;
        const newViewsCount = oldViewsCount + 1;
        
        console.log(`[Track View] Attempting to increment views for listing ${listing_id} from ${oldViewsCount} to ${newViewsCount}`);
        
        const { error: updateError, data: updatedListing } = await supabaseAdmin
          .from('listings')
          .update({ views: newViewsCount })
          .eq('id', listing_id)
          .select('views')
          .single();

        if (updateError) {
          console.error('[Track View] Error incrementing views count:', updateError);
          console.error('[Track View] Update error details:', JSON.stringify(updateError));
          console.error('[Track View] Listing ID:', listing_id, 'Attempted count:', newViewsCount);
        } else {
          const actualNewCount = updatedListing?.views || newViewsCount;
          console.log(`[Track View] ✓ Successfully incremented views for listing ${listing_id}: ${oldViewsCount} -> ${actualNewCount}`);
          viewCountIncremented = true;
        }
      } else {
        console.warn(`[Track View] Listing ${listing_id} not found when trying to increment views (currentListing is null)`);
      }
    } else {
      console.log(`[Track View] Skipping view count increment - repeat view (buyer ${user.id} already viewed listing ${listing_id})`);
    }

    return NextResponse.json({
      message: 'View tracked successfully',
      is_new_view: isNewView,
      view_count_incremented: viewCountIncremented,
    });
  } catch (error) {
    console.error('Track view error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
