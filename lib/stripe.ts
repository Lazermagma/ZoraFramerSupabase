/**
 * Stripe configuration
 * 
 * Handles Stripe Checkout session creation
 * No webhooks configured - payment status handled via Supabase
 */

import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('Missing Stripe environment variable: STRIPE_SECRET_KEY is required');
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  typescript: true,
});

export type PlanType = 'agent_monthly' | 'agent_yearly' | 'buyer_monthly' | 'buyer_yearly';

export interface StripeCheckoutRequest {
  plan_type: PlanType;
  user_role: 'buyer' | 'agent';
  user_id: string;
  user_email: string;
}
