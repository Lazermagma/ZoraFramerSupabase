/**
 * GET /api/messages - Get messages for the authenticated user
 * POST /api/messages - Send a new message
 * 
 * FRAMER REQUEST:
 * GET https://your-api.vercel.app/api/messages
 * Headers: Authorization: Bearer <token>
 * Query: ?listing_id=... (optional), ?application_id=... (optional)
 * 
 * POST https://your-api.vercel.app/api/messages
 * Headers: Authorization: Bearer <token>
 * Body:
 *   {
 *     "agent_id": "...",
 *     "listing_id": "...",        // optional
 *     "application_id": "...",    // optional
 *     "message": "Hello, I'm interested..."
 *   }
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
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listing_id');
    const applicationId = searchParams.get('application_id');

    let query = supabaseAdmin
      .from('messages')
      .select(`
        *,
        buyer:users!messages_buyer_id_fkey(id, first_name, last_name, name, email, phone),
        agent:users!messages_agent_id_fkey(id, first_name, last_name, name, email, phone),
        listing:listings(id, title, location),
        application:applications(id, status)
      `);

    // Filter based on user role
    if (user.role === 'buyer') {
      query = query.eq('buyer_id', user.id);
    } else if (user.role === 'agent') {
      query = query.eq('agent_id', user.id);
    }

    // Optional filters
    if (listingId) {
      query = query.eq('listing_id', listingId);
    }
    if (applicationId) {
      query = query.eq('application_id', applicationId);
    }

    const { data: messages, error } = await query
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch messages', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const body = await request.json();
    const { agent_id, listing_id, application_id, message } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Missing required field: message' },
        { status: 400 }
      );
    }

    // Determine sender role and IDs
    let buyerId: string;
    let agentId: string;
    let senderRole: 'buyer' | 'agent';

    if (user.role === 'buyer') {
      buyerId = user.id;
      if (!agent_id) {
        return NextResponse.json(
          { error: 'Missing required field: agent_id' },
          { status: 400 }
        );
      }
      agentId = agent_id;
      senderRole = 'buyer';
    } else if (user.role === 'agent') {
      agentId = user.id;
      if (!body.buyer_id) {
        return NextResponse.json(
          { error: 'Missing required field: buyer_id' },
          { status: 400 }
        );
      }
      buyerId = body.buyer_id;
      senderRole = 'agent';
    } else {
      return NextResponse.json(
        { error: 'Only buyers and agents can send messages' },
        { status: 403 }
      );
    }

    // Verify agent exists
    const { data: agentData } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('id', agentId)
      .single();

    if (!agentData || agentData.role !== 'agent') {
      return NextResponse.json(
        { error: 'Invalid agent_id' },
        { status: 400 }
      );
    }

    // Verify buyer exists (if agent is sending)
    if (user.role === 'agent') {
      const { data: buyerData } = await supabaseAdmin
        .from('users')
        .select('id, role')
        .eq('id', buyerId)
        .single();

      if (!buyerData || buyerData.role !== 'buyer') {
        return NextResponse.json(
          { error: 'Invalid buyer_id' },
          { status: 400 }
        );
      }
    }

    const { data: newMessage, error } = await supabaseAdmin
      .from('messages')
      .insert({
        buyer_id: buyerId,
        agent_id: agentId,
        listing_id: listing_id || null,
        application_id: application_id || null,
        message,
        sender_role: senderRole,
        read: false,
      })
      .select(`
        *,
        buyer:users!messages_buyer_id_fkey(id, first_name, last_name, name, email, phone),
        agent:users!messages_agent_id_fkey(id, first_name, last_name, name, email, phone),
        listing:listings(id, title, location),
        application:applications(id, status)
      `)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to send message', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: newMessage }, { status: 201 });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
