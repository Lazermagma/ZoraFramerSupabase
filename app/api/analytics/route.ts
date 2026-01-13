/**
 * GET /api/analytics
 * 
 * Gets analytics data for the authenticated user
 * 
 * FRAMER REQUEST:
 * GET https://your-api.vercel.app/api/analytics
 * Headers: Authorization: Bearer <token>
 * 
 * RESPONSE (Agent):
 * {
 *   "total_listings": 10,
 *   "pending_listings": 2,
 *   "approved_listings": 8,
 *   "total_applications": 25,
 *   "pending_applications": 5,
 *   "accepted_applications": 15
 * }
 * 
 * RESPONSE (Buyer):
 * {
 *   "total_applications": 5,
 *   "submitted_applications": 2,
 *   "accepted_applications": 2,
 *   "rejected_applications": 1
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

    if (user.role === 'agent' || user.role === 'admin') {
      // Agent analytics
      const { data: listings, error: listingsError } = await supabaseAdmin
        .from('listings')
        .select('status')
        .eq('agent_id', user.id);

      const { data: applications, error: appError } = await supabaseAdmin
        .from('applications')
        .select('status')
        .eq('agent_id', user.id);

      const totalListings = listings?.length || 0;
      const pendingListings = listings?.filter((l: any) => l.status === 'pending_review').length || 0;
      const approvedListings = listings?.filter((l: any) => l.status === 'approved').length || 0;
      const totalApplications = applications?.length || 0;
      const pendingApplications = applications?.filter((a: any) => 
        a.status === 'submitted' || a.status === 'under_review'
      ).length || 0;
      const acceptedApplications = applications?.filter((a: any) => a.status === 'accepted').length || 0;

      return NextResponse.json({
        total_listings: totalListings,
        pending_listings: pendingListings,
        approved_listings: approvedListings,
        total_applications: totalApplications,
        pending_applications: pendingApplications,
        accepted_applications: acceptedApplications,
      });
    } else {
      // Buyer analytics
      const { data: applications, error: appError } = await supabaseAdmin
        .from('applications')
        .select('status')
        .eq('buyer_id', user.id);

      const totalApplications = applications?.length || 0;
      const submittedApplications = applications?.filter(a => a.status === 'submitted').length || 0;
      const acceptedApplications = applications?.filter(a => a.status === 'accepted').length || 0;
      const rejectedApplications = applications?.filter(a => a.status === 'rejected').length || 0;

      return NextResponse.json({
        total_applications: totalApplications,
        submitted_applications: submittedApplications,
        accepted_applications: acceptedApplications,
        rejected_applications: rejectedApplications,
      });
    }
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
