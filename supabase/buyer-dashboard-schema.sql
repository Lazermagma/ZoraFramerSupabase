-- ============================================
-- Additional Tables for Buyer Dashboard
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- This adds tables for property views and saved searches
-- ============================================

-- ============================================
-- PROPERTY VIEWS TABLE
-- ============================================
-- Tracks which properties a buyer has viewed
CREATE TABLE IF NOT EXISTS public.property_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(buyer_id, listing_id) -- One view per buyer per listing (or remove for multiple views)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_property_views_buyer_id ON public.property_views(buyer_id);
CREATE INDEX IF NOT EXISTS idx_property_views_listing_id ON public.property_views(listing_id);
CREATE INDEX IF NOT EXISTS idx_property_views_viewed_at ON public.property_views(viewed_at);

-- ============================================
-- SAVED SEARCHES TABLE
-- ============================================
-- Stores buyer's saved search criteria and alerts
CREATE TABLE IF NOT EXISTS public.saved_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    search_criteria JSONB NOT NULL, -- Stores filters like location, price range, etc.
    alerts_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_saved_searches_buyer_id ON public.saved_searches(buyer_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_alerts_enabled ON public.saved_searches(alerts_enabled);

-- ============================================
-- MESSAGES/CONTACTS TABLE
-- ============================================
-- Tracks communications between buyers and agents
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_messages_buyer_id ON public.messages(buyer_id);
CREATE INDEX IF NOT EXISTS idx_messages_agent_id ON public.messages(agent_id);
CREATE INDEX IF NOT EXISTS idx_messages_listing_id ON public.messages(listing_id);
CREATE INDEX IF NOT EXISTS idx_messages_application_id ON public.messages(application_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE public.property_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROPERTY VIEWS RLS POLICIES
-- ============================================

-- Buyers can read their own property views
CREATE POLICY "Buyers can read own property views"
    ON public.property_views FOR SELECT
    USING (auth.uid() = buyer_id);

-- Buyers can create their own property views
CREATE POLICY "Buyers can create own property views"
    ON public.property_views FOR INSERT
    WITH CHECK (auth.uid() = buyer_id);

-- Service role can do everything (for API)
CREATE POLICY "Service role full access property views"
    ON public.property_views FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- SAVED SEARCHES RLS POLICIES
-- ============================================

-- Buyers can read their own saved searches
CREATE POLICY "Buyers can read own saved searches"
    ON public.saved_searches FOR SELECT
    USING (auth.uid() = buyer_id);

-- Buyers can create their own saved searches
CREATE POLICY "Buyers can create own saved searches"
    ON public.saved_searches FOR INSERT
    WITH CHECK (auth.uid() = buyer_id);

-- Buyers can update their own saved searches
CREATE POLICY "Buyers can update own saved searches"
    ON public.saved_searches FOR UPDATE
    USING (auth.uid() = buyer_id);

-- Buyers can delete their own saved searches
CREATE POLICY "Buyers can delete own saved searches"
    ON public.saved_searches FOR DELETE
    USING (auth.uid() = buyer_id);

-- Service role can do everything (for API)
CREATE POLICY "Service role full access saved searches"
    ON public.saved_searches FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- MESSAGES RLS POLICIES
-- ============================================

-- Buyers can read messages where they are involved
CREATE POLICY "Buyers can read own messages"
    ON public.messages FOR SELECT
    USING (auth.uid() = buyer_id);

-- Agents can read messages where they are involved
CREATE POLICY "Agents can read own messages"
    ON public.messages FOR SELECT
    USING (auth.uid() = agent_id);

-- Buyers can create messages
CREATE POLICY "Buyers can create messages"
    ON public.messages FOR INSERT
    WITH CHECK (auth.uid() = buyer_id);

-- Agents can create messages
CREATE POLICY "Agents can create messages"
    ON public.messages FOR INSERT
    WITH CHECK (auth.uid() = agent_id);

-- Service role can do everything (for API)
CREATE POLICY "Service role full access messages"
    ON public.messages FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger to auto-update updated_at for saved_searches
CREATE TRIGGER update_saved_searches_updated_at BEFORE UPDATE ON public.saved_searches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
