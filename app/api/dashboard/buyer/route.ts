/**
 * GET /api/dashboard/buyer
 * 
 * Gets buyer dashboard data including overview cards, recent activity, and analytics
 * 
 * FRAMER REQUEST:
 * GET https://your-api.vercel.app/api/dashboard/buyer
 * Headers: Authorization: Bearer <token>
 * 
 * RESPONSE:
 * {
 *   "user": { ... },
 *   "subscription": { ... },
 *   "overview": {
 *     "active_applications": 3,
 *     "properties_viewed": 12,
 *     "saved_searches": 5
 *   },
 *   "applications": [...],
 *   "recent_activity": [...],
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

    // Get full user profile
    const { data: userProfile, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Error fetching user profile:', userError);
    }

    // Get subscription status
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subError && subError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching subscription:', subError);
    }

    // Get buyer's applications with listing and agent details
    const { data: applications, error: appError } = await supabaseAdmin
      .from('applications')
      .select(`
        *,
        listing:listings(*),
        agent:users!applications_agent_id_fkey(id, first_name, last_name, name, email)
      `)
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false });

    if (appError) {
      console.error('Error fetching applications:', appError);
    }

    // Calculate active applications (in progress: submitted, viewed, under_review)
    const activeApplications = applications?.filter(a => 
      ['submitted', 'viewed', 'under_review'].includes(a.status)
    ).length || 0;

    // Get properties viewed in last 30 days
    let propertiesViewed = 0;
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count, error: viewsError } = await supabaseAdmin
        .from('property_views')
        .select('*', { count: 'exact', head: true })
        .eq('buyer_id', user.id)
        .gte('viewed_at', thirtyDaysAgo.toISOString());

      if (viewsError) {
        console.error('Error fetching property views:', viewsError);
      } else {
        propertiesViewed = count || 0;
      }
    } catch (error) {
      console.error('Property views table may not exist:', error);
    }

    // Get saved searches with active alerts
    let savedSearches: any[] = [];
    try {
      const { data, error: searchesError } = await supabaseAdmin
        .from('saved_searches')
        .select('*')
        .eq('buyer_id', user.id)
        .eq('alerts_enabled', true);

      if (searchesError) {
        console.error('Error fetching saved searches:', searchesError);
      } else {
        savedSearches = data || [];
      }
    } catch (error) {
      console.error('Saved searches table may not exist:', error);
    }

    // Get recent messages/contacts
    let recentMessages: any[] = [];
    try {
      const { data, error: messagesError } = await supabaseAdmin
        .from('messages')
        .select(`
          *,
          agent:users!messages_agent_id_fkey(id, first_name, last_name, name),
          listing:listings(id, title, location)
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
      } else {
        recentMessages = data || [];
      }
    } catch (error) {
      console.error('Messages table may not exist:', error);
    }

    // Build recent activity feed
    const recentActivity: any[] = [];

    // Add recent messages
    if (recentMessages) {
      recentMessages.forEach((message) => {
        const agentName = message.agent?.first_name && message.agent?.last_name
          ? `${message.agent.first_name} ${message.agent.last_name}`
          : message.agent?.name || 'Agent';
        const listingTitle = message.listing?.title || 'property';
        
        recentActivity.push({
          type: 'agent_contacted',
          icon: 'envelope',
          title: 'Agent contacted you',
          description: `${agentName} responded to your ${listingTitle} inquiry`,
          timestamp: message.created_at,
          relative_time: getRelativeTime(message.created_at),
        });
      });
    }

    // Add application views (when agent viewed buyer's application)
    if (applications) {
      applications
        .filter(a => a.viewed_at && a.status === 'viewed')
        .forEach((application) => {
          const agentName = application.agent?.first_name && application.agent?.last_name
            ? `${application.agent.first_name} ${application.agent.last_name}`
            : application.agent?.name || 'Agent';
          const listingTitle = application.listing?.title || 'property';
          
          recentActivity.push({
            type: 'application_viewed',
            icon: 'eye',
            title: 'Application viewed',
            description: `${agentName} viewed your ${listingTitle} application`,
            timestamp: application.viewed_at,
            relative_time: getRelativeTime(application.viewed_at),
            application_id: application.id,
          });
        });
    }

    // Add submitted applications
    if (applications) {
      applications
        .filter(a => a.status === 'submitted')
        .forEach((application) => {
          const listingTitle = application.listing?.title || 'property';
          const location = application.listing?.location || '';
          
          recentActivity.push({
            type: 'application_submitted',
            icon: 'document',
            title: 'Application submitted',
            description: `You submitted an application for ${listingTitle}${location ? `, ${location}` : ''}`,
            timestamp: application.created_at,
            relative_time: getRelativeTime(application.created_at),
            application_id: application.id,
          });
        });
    }

    // Sort recent activity by timestamp (most recent first)
    recentActivity.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Limit to 10 most recent
    const topRecentActivity = recentActivity.slice(0, 10);

    // Calculate analytics
    const totalApplications = applications?.length || 0;
    const submittedApplications = applications?.filter(a => a.status === 'submitted').length || 0;
    const acceptedApplications = applications?.filter(a => a.status === 'accepted').length || 0;
    const rejectedApplications = applications?.filter(a => a.status === 'rejected').length || 0;

    return NextResponse.json({
      user: userProfile || null,
      subscription: subscription || null,
      overview: {
        active_applications: activeApplications,
        properties_viewed: propertiesViewed,
        saved_searches: savedSearches.length,
      },
      applications: applications || [],
      recent_activity: topRecentActivity,
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

// Helper function to get relative time (e.g., "2 hours ago")
function getRelativeTime(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`;
  
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
}
