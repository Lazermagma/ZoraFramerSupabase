-- ============================================
-- Framer-Supabase Backend Database Schema
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- This creates all required tables, RLS policies, and indexes
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('buyer', 'agent', 'admin')),
    name TEXT,
    phone TEXT,
    parish TEXT,
    account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_account_status ON public.users(account_status);

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete')),
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    plan_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);

-- ============================================
-- LISTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL CHECK (price > 0),
    location TEXT NOT NULL,
    property_type TEXT CHECK (property_type IN ('Buy', 'Rent')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'archived')),
    images TEXT[] DEFAULT '{}',
    documents TEXT[] DEFAULT '{}',
    views INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);

-- Add property_type column if it doesn't exist (for existing databases)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'listings' 
                   AND column_name = 'property_type') THEN
        ALTER TABLE public.listings ADD COLUMN property_type TEXT CHECK (property_type IN ('Buy', 'Rent'));
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_listings_agent_id ON public.listings(agent_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_published_at ON public.listings(published_at);
CREATE INDEX IF NOT EXISTS idx_listings_location ON public.listings(location);
CREATE INDEX IF NOT EXISTS idx_listings_price ON public.listings(price);

-- ============================================
-- APPLICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'viewed', 'under_review', 'accepted', 'rejected')),
    message TEXT,
    documents TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    viewed_at TIMESTAMPTZ,
    UNIQUE(listing_id, buyer_id) -- Prevent duplicate applications
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_applications_listing_id ON public.applications(listing_id);
CREATE INDEX IF NOT EXISTS idx_applications_buyer_id ON public.applications(buyer_id);
CREATE INDEX IF NOT EXISTS idx_applications_agent_id ON public.applications(agent_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS RLS POLICIES
-- ============================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- Service role can do everything (for API)
CREATE POLICY "Service role full access"
    ON public.users FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- SUBSCRIPTIONS RLS POLICIES
-- ============================================

-- Users can read their own subscriptions
CREATE POLICY "Users can read own subscriptions"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Service role can do everything (for API)
CREATE POLICY "Service role full access subscriptions"
    ON public.subscriptions FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- LISTINGS RLS POLICIES
-- ============================================

-- Anyone can read approved listings (public browsing)
CREATE POLICY "Anyone can read approved listings"
    ON public.listings FOR SELECT
    USING (status = 'approved');

-- Agents can read their own listings
CREATE POLICY "Agents can read own listings"
    ON public.listings FOR SELECT
    USING (auth.uid() = agent_id);

-- Agents can create their own listings
CREATE POLICY "Agents can create own listings"
    ON public.listings FOR INSERT
    WITH CHECK (auth.uid() = agent_id);

-- Agents can update their own listings
CREATE POLICY "Agents can update own listings"
    ON public.listings FOR UPDATE
    USING (auth.uid() = agent_id);

-- Service role can do everything (for API admin operations)
CREATE POLICY "Service role full access listings"
    ON public.listings FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- APPLICATIONS RLS POLICIES
-- ============================================

-- Buyers can read their own applications
CREATE POLICY "Buyers can read own applications"
    ON public.applications FOR SELECT
    USING (auth.uid() = buyer_id);

-- Agents can read applications for their listings
CREATE POLICY "Agents can read applications for own listings"
    ON public.applications FOR SELECT
    USING (auth.uid() = agent_id);

-- Buyers can create applications
CREATE POLICY "Buyers can create applications"
    ON public.applications FOR INSERT
    WITH CHECK (auth.uid() = buyer_id);

-- Agents can update applications for their listings
CREATE POLICY "Agents can update applications for own listings"
    ON public.applications FOR UPDATE
    USING (auth.uid() = agent_id);

-- Service role can do everything (for API)
CREATE POLICY "Service role full access applications"
    ON public.applications FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON public.listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STORAGE BUCKET SETUP
-- ============================================
-- Note: Storage buckets need to be created via Supabase Dashboard or Storage API
-- This is a reference for what needs to be created:
-- Bucket name: "documents"
-- Public: false (private bucket)
-- File size limit: 10MB (adjust as needed)
-- Allowed MIME types: application/pdf, image/*, etc.

-- ============================================
-- INITIAL ADMIN USER (Optional)
-- ============================================
-- Uncomment and modify to create an initial admin user
-- Make sure to set a secure password and update the email

/*
INSERT INTO public.users (id, email, role, account_status)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@example.com',
    'admin',
    'active'
) ON CONFLICT (email) DO NOTHING;
*/

-- ============================================
-- PROPERTY VIEWS TABLE
-- ============================================
-- Tracks which properties a buyer has viewed
CREATE TABLE IF NOT EXISTS public.property_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(buyer_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_property_views_buyer_id ON public.property_views(buyer_id);
CREATE INDEX IF NOT EXISTS idx_property_views_listing_id ON public.property_views(listing_id);
CREATE INDEX IF NOT EXISTS idx_property_views_viewed_at ON public.property_views(viewed_at);

-- ============================================
-- SAVED SEARCHES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.saved_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    search_criteria JSONB NOT NULL,
    alerts_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_buyer_id ON public.saved_searches(buyer_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_alerts_enabled ON public.saved_searches(alerts_enabled);

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
    application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    sender_role TEXT NOT NULL CHECK (sender_role IN ('buyer', 'agent')),
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_buyer_id ON public.messages(buyer_id);
CREATE INDEX IF NOT EXISTS idx_messages_agent_id ON public.messages(agent_id);
CREATE INDEX IF NOT EXISTS idx_messages_listing_id ON public.messages(listing_id);
CREATE INDEX IF NOT EXISTS idx_messages_application_id ON public.messages(application_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- ============================================
-- RLS FOR NEW TABLES
-- ============================================

ALTER TABLE public.property_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Property Views RLS
CREATE POLICY "Buyers can read own property views"
    ON public.property_views FOR SELECT
    USING (auth.uid() = buyer_id);

CREATE POLICY "Buyers can create own property views"
    ON public.property_views FOR INSERT
    WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Service role full access property views"
    ON public.property_views FOR ALL
    USING (auth.role() = 'service_role');

-- Saved Searches RLS
CREATE POLICY "Buyers can read own saved searches"
    ON public.saved_searches FOR SELECT
    USING (auth.uid() = buyer_id);

CREATE POLICY "Buyers can manage own saved searches"
    ON public.saved_searches FOR ALL
    USING (auth.uid() = buyer_id);

CREATE POLICY "Service role full access saved searches"
    ON public.saved_searches FOR ALL
    USING (auth.role() = 'service_role');

-- Messages RLS
CREATE POLICY "Buyers can read own messages"
    ON public.messages FOR SELECT
    USING (auth.uid() = buyer_id);

CREATE POLICY "Agents can read own messages"
    ON public.messages FOR SELECT
    USING (auth.uid() = agent_id);

CREATE POLICY "Buyers can create messages"
    ON public.messages FOR INSERT
    WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Agents can create messages"
    ON public.messages FOR INSERT
    WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Service role full access messages"
    ON public.messages FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- TRIGGERS FOR NEW TABLES
-- ============================================

CREATE TRIGGER update_saved_searches_updated_at BEFORE UPDATE ON public.saved_searches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the schema was created correctly:

-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name IN ('users', 'listings', 'applications', 'subscriptions', 'property_views', 'saved_searches', 'messages');

-- SELECT * FROM pg_policies WHERE tablename IN ('users', 'listings', 'applications', 'subscriptions', 'property_views', 'saved_searches', 'messages');
