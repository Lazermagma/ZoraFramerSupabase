/**
 * GET /api/dashboard/buyer
 * 
 * Gets buyer dashboard data
 * 
 * FRAMER REQUEST:
 * GET https://your-api.vercel.app/api/dashboard/buyer
 * Headers: Authorization: Bearer <token>
 * 
 * RESPONSE:
 * {
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

    // Verify user is buyer
    if (user.role !== 'buyer' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Buyer dashboard only.' },
        { status: 403 }
      );
    }

    // Get buyer's applications
    const { data: applications, error: appError } = await supabaseAdmin
      .from('applications')
      .select('*, listing:listings(*)')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false });

    if (appError) {
      console.error('Error fetching applications:', appError);
    }

    // Calculate analytics
    const totalApplications = applications?.length || 0;
    const submittedApplications = applications?.filter(a => a.status === 'submitted').length || 0;
    const acceptedApplications = applications?.filter(a => a.status === 'accepted').length || 0;
    const rejectedApplications = applications?.filter(a => a.status === 'rejected').length || 0;

    return NextResponse.json({
      applications: applications || [],
      analytics: {
        total_applications: totalApplications,
        submitted_applications: submittedApplications,
        accepted_applications: acceptedApplications,
        rejected_applications: rejectedApplications,
      },
    });
  } catch (error) {
    console.error('Buyer dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
