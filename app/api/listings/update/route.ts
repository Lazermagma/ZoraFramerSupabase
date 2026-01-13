/**
 * PUT /api/listings/update
 * 
 * Updates an existing listing (Agent-only, must own listing)
 * 
 * FRAMER REQUEST:
 * PUT https://your-api.vercel.app/api/listings/update
 * Headers: Authorization: Bearer <token>
 * Body: { "listing_id": "...", "title": "...", ... }
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAgent } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { UpdateListingRequest } from '@/types/listing';

export const runtime = 'nodejs';

export async function PUT(request: NextRequest) {
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

    if (!isAgent(user.role)) {
      return NextResponse.json(
        { error: 'Only agents can update listings' },
        { status: 403 }
      );
    }

    const body: UpdateListingRequest = await request.json();
    const { listing_id, ...updateData } = body;

    if (!listing_id) {
      return NextResponse.json(
        { error: 'Missing required field: listing_id' },
        { status: 400 }
      );
    }

    // Verify agent owns the listing
    const { data: existingListing, error: fetchError } = await supabaseAdmin
      .from('listings')
      .select('agent_id, status')
      .eq('id', listing_id)
      .single();

    if (fetchError || !existingListing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    if (existingListing.agent_id !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'You do not have permission to update this listing' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateFields: any = {
      updated_at: new Date().toISOString(),
    };

    if (updateData.title !== undefined) updateFields.title = updateData.title;
    if (updateData.description !== undefined) updateFields.description = updateData.description;
    if (updateData.price !== undefined) updateFields.price = updateData.price;
    if (updateData.location !== undefined) updateFields.location = updateData.location;
    if (updateData.images !== undefined) updateFields.images = updateData.images;
    if (updateData.documents !== undefined) updateFields.documents = updateData.documents;
    if (updateData.status !== undefined) {
      // Validate status transitions
      const validStatuses = ['draft', 'pending_review', 'approved', 'rejected', 'archived'];
      if (!validStatuses.includes(updateData.status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        );
      }
      updateFields.status = updateData.status;
    }

    const { data: updatedListing, error: updateError } = await supabaseAdmin
      .from('listings')
      .update(updateFields)
      .eq('id', listing_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update listing', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ listing: updatedListing });
  } catch (error) {
    console.error('Update listing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
