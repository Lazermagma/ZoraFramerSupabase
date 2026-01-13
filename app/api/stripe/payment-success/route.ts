/**
 * POST /api/stripe/payment-success
 * 
 * Handles successful payment and unlocks features
 * 
 * FRAMER REQUEST:
 * POST https://your-api.vercel.app/api/stripe/payment-success
 * Headers: Authorization: Bearer <token>
 * Body: { "session_id": "cs_..." }
 * 
 * RESPONSE:
 * {
 *   "message": "Payment successful",
 *   "subscription": { ... }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { PaymentSuccessRequest } from '@/types/payment';

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

    const body: PaymentSuccessRequest = await request.json();
    const { session_id } = body;

    if (!session_id) {
      return NextResponse.json(
        { error: 'Missing required field: session_id' },
        { status: 400 }
      );
    }

    // Retrieve Stripe checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (!session || session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Verify session belongs to user
    if (session.metadata?.user_id !== authResult.user.id) {
      return NextResponse.json(
        { error: 'Session does not belong to user' },
        { status: 403 }
      );
    }

    // Get or create subscription record
    const { data: existingSub, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', authResult.user.id)
      .eq('status', 'active')
      .single();

    if (subError && subError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error checking subscription:', subError);
    }

    // Create or update subscription
    const subscriptionData = {
      user_id: authResult.user.id,
      status: 'active' as const,
      stripe_subscription_id: session.subscription as string || null,
      stripe_customer_id: session.customer as string || null,
      plan_type: session.metadata?.plan_type || null,
      updated_at: new Date().toISOString(),
    };

    let subscription;
    if (existingSub) {
      // Update existing subscription
      const { data: updatedSub, error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update(subscriptionData)
        .eq('id', existingSub.id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update subscription', details: updateError.message },
          { status: 500 }
        );
      }
      subscription = updatedSub;
    } else {
      // Create new subscription
      const { data: newSub, error: createError } = await supabaseAdmin
        .from('subscriptions')
        .insert({
          ...subscriptionData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json(
          { error: 'Failed to create subscription', details: createError.message },
          { status: 500 }
        );
      }
      subscription = newSub;
    }

    return NextResponse.json({
      message: 'Payment successful',
      subscription,
    });
  } catch (error) {
    console.error('Payment success error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
