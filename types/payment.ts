/**
 * Payment and subscription types
 */

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'incomplete';

export interface Subscription {
  id: string;
  user_id: string;
  status: SubscriptionStatus;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  plan_type?: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

export interface PaymentSuccessRequest {
  session_id: string;
}
