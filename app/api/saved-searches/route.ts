/**
 * GET /api/saved-searches - Get buyer's saved searches
 * POST /api/saved-searches - Create a new saved search
 * PUT /api/saved-searches - Update a saved search
 * DELETE /api/saved-searches - Delete a saved search
 * 
 * FRAMER REQUEST:
 * GET https://your-api.vercel.app/api/saved-searches
 * Headers: Authorization: Bearer <token>
 * 
 * POST https://your-api.vercel.app/api/saved-searches
 * Headers: Authorization: Bearer <token>
 * Body:
 *   {
 *     "name": "Downtown Apartments",
 *     "search_criteria": {
 *       "location": "Downtown",
 *       "min_price": 100000,
 *       "max_price": 500000
 *     },
 *     "alerts_enabled": true
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

    // Verify user is buyer
    if (user.role !== 'buyer' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Buyers only.' },
        { status: 403 }
      );
    }

    const { data: savedSearches, error } = await supabaseAdmin
      .from('saved_searches')
      .select('*')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch saved searches', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ saved_searches: savedSearches || [] });
  } catch (error) {
    console.error('Get saved searches error:', error);
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

    // Verify user is buyer
    if (user.role !== 'buyer' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Buyers only.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, search_criteria, alerts_enabled = true } = body;

    if (!name || !search_criteria) {
      return NextResponse.json(
        { error: 'Missing required fields: name, search_criteria' },
        { status: 400 }
      );
    }

    const { data: savedSearch, error } = await supabaseAdmin
      .from('saved_searches')
      .insert({
        buyer_id: user.id,
        name,
        search_criteria,
        alerts_enabled: alerts_enabled !== undefined ? alerts_enabled : true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create saved search', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ saved_search: savedSearch }, { status: 201 });
  } catch (error) {
    console.error('Create saved search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Verify user is buyer
    if (user.role !== 'buyer' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Buyers only.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, name, search_criteria, alerts_enabled } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (search_criteria !== undefined) updateData.search_criteria = search_criteria;
    if (alerts_enabled !== undefined) updateData.alerts_enabled = alerts_enabled;
    updateData.updated_at = new Date().toISOString();

    const { data: savedSearch, error } = await supabaseAdmin
      .from('saved_searches')
      .update(updateData)
      .eq('id', id)
      .eq('buyer_id', user.id) // Ensure user owns the saved search
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update saved search', details: error.message },
        { status: 500 }
      );
    }

    if (!savedSearch) {
      return NextResponse.json(
        { error: 'Saved search not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ saved_search: savedSearch });
  } catch (error) {
    console.error('Update saved search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('saved_searches')
      .delete()
      .eq('id', id)
      .eq('buyer_id', user.id); // Ensure user owns the saved search

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete saved search', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Saved search deleted successfully' });
  } catch (error) {
    console.error('Delete saved search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
