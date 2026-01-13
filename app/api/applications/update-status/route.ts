/**
 * POST /api/applications/update-status
 * 
 * Updates application status (Agent-only)
 * Ensures agent owns the listing associated with the application
 * 
 * FRAMER REQUEST:
 * POST https://your-api.vercel.app/api/applications/update-status
 * Headers:
 *   Authorization: Bearer <supabase_access_token>
 *   Content-Type: application/json
 * Body:
 *   {
 *     "application_id": "application-uuid",
 *     "status": "approved" | "rejected"
 *   }
 * 
 * RESPONSE:
 * {
 *   "application": {
 *     "id": "...",
 *     "status": "approved",
 *     ...
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAgent } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { UpdateApplicationStatusRequest, ApplicationStatus } from '@/types/application';

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

    // Check if user is agent or admin
    if (!isAgent(user.role)) {
      return NextResponse.json(
        { error: 'Only agents can update application status' },
        { status: 403 }
      );
    }

    // Parse request body
    const body: UpdateApplicationStatusRequest = await request.json();
    const { application_id, status } = body;

    if (!application_id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: application_id, status' },
        { status: 400 }
      );
    }

    // Validate status value
    const validStatuses = ['submitted', 'viewed', 'under_review', 'accepted', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Fetch application with listing info
    const { data: application, error: appError } = await supabaseAdmin
      .from('applications')
      .select('*, listing:listings(agent_id)')
      .eq('id', application_id)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Verify agent owns the listing
    // Handle both direct agent_id and nested listing.agent_id
    const listingAgentId = application.listing?.agent_id || application.agent_id;
    
    if (listingAgentId !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'You do not have permission to update this application' },
        { status: 403 }
      );
    }

    // Update application status
    const updateData: any = {
      status: status as ApplicationStatus,
      updated_at: new Date().toISOString(),
    };

    // Set viewed_at if status is 'viewed'
    if (status === 'viewed' && !application.viewed_at) {
      updateData.viewed_at = new Date().toISOString();
    }

    const { data: updatedApplication, error: updateError } = await supabaseAdmin
      .from('applications')
      .update(updateData)
      .eq('id', application_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating application:', updateError);
      return NextResponse.json(
        { error: 'Failed to update application status', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      application: updatedApplication,
    });
  } catch (error) {
    console.error('Update application status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
