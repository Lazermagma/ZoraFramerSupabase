/**
 * POST /api/applications/create
 * 
 * Creates a new application (Buyer-only)
 * 
 * FRAMER REQUEST:
 * POST https://your-api.vercel.app/api/applications/create
 * Headers: Authorization: Bearer <token>
 * Body: { "listing_id": "...", "message": "...", "documents": [...] }
 * 
 * RESPONSE:
 * {
 *   "application": { ... }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { CreateApplicationRequest } from '@/types/application';

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
        { error: 'Only buyers can submit applications' },
        { status: 403 }
      );
    }

    const body: CreateApplicationRequest = await request.json();
    const { listing_id, message, documents } = body;

    if (!listing_id) {
      return NextResponse.json(
        { error: 'Missing required field: listing_id' },
        { status: 400 }
      );
    }

    // Verify listing exists and is approved
    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('id, agent_id, status')
      .eq('id', listing_id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    if (listing.status !== 'approved') {
      return NextResponse.json(
        { error: 'Listing is not available for applications' },
        { status: 400 }
      );
    }

    // Check if buyer already applied
    const { data: existingApp, error: checkError } = await supabaseAdmin
      .from('applications')
      .select('id')
      .eq('listing_id', listing_id)
      .eq('buyer_id', user.id)
      .single();

    if (existingApp && !checkError) {
      return NextResponse.json(
        { error: 'You have already applied to this listing' },
        { status: 400 }
      );
    }

    // Create application
    const { data: application, error: appError } = await supabaseAdmin
      .from('applications')
      .insert({
        listing_id,
        buyer_id: user.id,
        agent_id: listing.agent_id,
        status: 'submitted',
        message: message || null,
        documents: documents || [],
      })
      .select()
      .single();

    if (appError) {
      return NextResponse.json(
        { error: 'Failed to create application', details: appError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { application },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create application error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
