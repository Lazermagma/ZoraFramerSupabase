/**
 * GET /api/dashboard/agent
 * 
 * Gets agent dashboard data
 * 
 * FRAMER REQUEST:
 * GET https://your-api.vercel.app/api/dashboard/agent
 * Headers: Authorization: Bearer <token>
 * 
 * RESPONSE:
 * {
 *   "listings": [...],
 *   "applications": [...],
 *   "analytics": { ... }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
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

    // Verify user is agent
    if (user.role !== 'agent' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Agent dashboard only.' },
        { status: 403 }
      );
    }

    // Get agent's listings
    const { data: listings, error: listingsError } = await supabaseAdmin
      .from('listings')
      .select('*')
      .eq('agent_id', user.id)
      .order('created_at', { ascending: false });

    if (listingsError) {
      console.error('Error fetching listings:', listingsError);
    }

    // Get applications for agent's listings
    const listingIds = listings?.map(l => l.id) || [];
    const { data: applications, error: appError } = listingIds.length > 0
      ? await supabaseAdmin
          .from('applications')
          .select('*, buyer:users!applications_buyer_id_fkey(id, name, email, phone), listing:listings(*)')
          .in('listing_id', listingIds)
          .order('created_at', { ascending: false })
      : { data: [], error: null };

    if (appError) {
      console.error('Error fetching applications:', appError);
    }

    // Calculate analytics
    const totalListings = listings?.length || 0;
    const pendingListings = listings?.filter(l => l.status === 'pending_review').length || 0;
    const approvedListings = listings?.filter(l => l.status === 'approved').length || 0;
    const totalApplications = applications?.length || 0;
    const pendingApplications = applications?.filter(a => a.status === 'submitted' || a.status === 'under_review').length || 0;
    const acceptedApplications = applications?.filter(a => a.status === 'accepted').length || 0;

    return NextResponse.json({
      listings: listings || [],
      applications: applications || [],
      analytics: {
        total_listings: totalListings,
        pending_listings: pendingListings,
        approved_listings: approvedListings,
        total_applications: totalApplications,
        pending_applications: pendingApplications,
        accepted_applications: acceptedApplications,
      },
    });
  } catch (error) {
    console.error('Agent dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
