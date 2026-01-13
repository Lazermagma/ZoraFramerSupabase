/**
 * GET /api/listings/browse
 * 
 * Gets all approved and visible listings (Public endpoint, no auth required)
 * 
 * FRAMER REQUEST:
 * GET https://your-api.vercel.app/api/listings/browse
 * Query params: ?page=1&limit=20&location=...
 * 
 * RESPONSE:
 * {
 *   "listings": [...],
 *   "total": 100,
 *   "page": 1,
 *   "limit": 20
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const location = searchParams.get('location');
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');

    let query = supabaseAdmin
      .from('listings')
      .select('*', { count: 'exact' })
      .eq('status', 'approved')
      .order('published_at', { ascending: false });

    // Apply filters
    if (location) {
      query = query.ilike('location', `%${location}%`);
    }

    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice));
    }

    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice));
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: listings, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch listings', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      listings: listings || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('Browse listings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
