/**
 * POST /api/stripe/checkout
 * 
 * Creates a Stripe Checkout session for subscription plans
 * 
 * FRAMER REQUEST:
 * POST https://your-api.vercel.app/api/stripe/checkout
 * Headers:
 *   Authorization: Bearer <supabase_access_token>
 *   Content-Type: application/json
 * Body:
 *   {
 *     "plan_type": "agent_monthly" | "agent_yearly" | "buyer_monthly" | "buyer_yearly",
 *     "user_role": "buyer" | "agent"
 *   }
 * 
 * RESPONSE:
 * {
 *   "checkout_url": "https://checkout.stripe.com/..."
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { stripe, StripeCheckoutRequest } from '@/lib/stripe';

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

    // Parse request body
    const body: StripeCheckoutRequest = await request.json();
    const { plan_type, user_role } = body;

    // Validate plan type matches user role
    if (
      (user_role === 'agent' && !plan_type.startsWith('agent_')) ||
      (user_role === 'buyer' && !plan_type.startsWith('buyer_'))
    ) {
      return NextResponse.json(
        { error: 'Plan type does not match user role' },
        { status: 400 }
      );
    }

    // Validate user role matches authenticated user
    if (user.role !== user_role) {
      return NextResponse.json(
        { error: 'User role mismatch' },
        { status: 403 }
      );
    }

    // Define plan prices (update these with your actual Stripe price IDs)
    const priceMap: Record<string, string> = {
      agent_monthly: process.env.STRIPE_AGENT_MONTHLY_PRICE_ID || '',
      agent_yearly: process.env.STRIPE_AGENT_YEARLY_PRICE_ID || '',
      buyer_monthly: process.env.STRIPE_BUYER_MONTHLY_PRICE_ID || '',
      buyer_yearly: process.env.STRIPE_BUYER_YEARLY_PRICE_ID || '',
    };

    const priceId = priceMap[plan_type];
    if (!priceId) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      );
    }

    // Get app URL for redirects
    // Auto-detect from request headers to avoid secret scanning issues
    let appUrl: string | null = null;
    try {
      const host = request.headers?.get('host');
      const origin = request.headers?.get('origin');
      const protocol = request.headers?.get('x-forwarded-proto') || 'https';
      appUrl = process.env.NEXT_PUBLIC_APP_URL || 
               origin || 
               (host ? `${protocol}://${host}` : null);
    } catch (error) {
      console.error('Error getting app URL from headers:', error);
      appUrl = process.env.NEXT_PUBLIC_APP_URL || null;
    }
    
    if (!appUrl) {
      return NextResponse.json(
        { error: 'Unable to determine app URL. Please configure the app URL in environment variables.' },
        { status: 500 }
      );
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: user.email,
      metadata: {
        user_id: user.id,
        user_role: user_role,
        plan_type: plan_type,
      },
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cancel`,
    });

    return NextResponse.json({
      checkout_url: session.url,
      session_id: session.id,
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
