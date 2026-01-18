-- ============================================
-- Listing Form Schema Update
-- Adds all fields from the listing form
-- ============================================
-- Run this SQL in your Supabase SQL Editor AFTER running schema.sql
-- This adds all missing fields for the listing form
-- ============================================

-- ============================================
-- UPDATE USERS TABLE (Agent/Lister Information)
-- ============================================
DO $$ 
BEGIN
    -- Add company_name for agents/listers
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'company_name') THEN
        ALTER TABLE public.users ADD COLUMN company_name TEXT;
    END IF;
    
    -- Add management_type (Property Owner, Real Estate Agent/Broker, Property Developer)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'management_type') THEN
        ALTER TABLE public.users ADD COLUMN management_type TEXT;
    END IF;
    
    -- Add is_registered_professional (Yes/No)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'is_registered_professional') THEN
        ALTER TABLE public.users ADD COLUMN is_registered_professional BOOLEAN;
    END IF;
    
    -- Add REBJ registration number
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'rebj_registration_number') THEN
        ALTER TABLE public.users ADD COLUMN rebj_registration_number TEXT;
    END IF;
    
    -- Add brokerage/development company name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'brokerage_company_name') THEN
        ALTER TABLE public.users ADD COLUMN brokerage_company_name TEXT;
    END IF;
END $$;

-- Create indexes for new user fields
CREATE INDEX IF NOT EXISTS idx_users_management_type ON public.users(management_type);
CREATE INDEX IF NOT EXISTS idx_users_company_name ON public.users(company_name);

-- ============================================
-- UPDATE LISTINGS TABLE (Property Information)
-- ============================================
DO $$ 
BEGIN
    -- Add property_category (Apartment, House, Townhouse, Condo, Land, Commercial)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'listings' 
                   AND column_name = 'property_category') THEN
        ALTER TABLE public.listings ADD COLUMN property_category TEXT 
            CHECK (property_category IN ('Apartment', 'House', 'Townhouse', 'Condo', 'Land', 'Commercial'));
    END IF;
    
    -- Add listing_type (Rent, Sale, Development) - separate from property_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'listings' 
                   AND column_name = 'listing_type') THEN
        ALTER TABLE public.listings ADD COLUMN listing_type TEXT 
            CHECK (listing_type IN ('Rent', 'Sale', 'Development'));
    END IF;
    
    -- Update property_type to include Development option
    -- First, drop the constraint if it exists
    ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_property_type_check;
    -- Add new constraint with Development option
    ALTER TABLE public.listings ADD CONSTRAINT listings_property_type_check 
        CHECK (property_type IN ('Buy', 'Rent', 'Development') OR property_type IS NULL);
    
    -- Add street_address (separate from location)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'listings' 
                   AND column_name = 'street_address') THEN
        ALTER TABLE public.listings ADD COLUMN street_address TEXT;
    END IF;
    
    -- Add parish (separate from location)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'listings' 
                   AND column_name = 'parish') THEN
        ALTER TABLE public.listings ADD COLUMN parish TEXT;
    END IF;
    
    -- Add bedrooms (1, 2, 3, 4+)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'listings' 
                   AND column_name = 'bedrooms') THEN
        ALTER TABLE public.listings ADD COLUMN bedrooms TEXT;
    END IF;
    
    -- Add bathrooms (1, 2, 3, 4+)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'listings' 
                   AND column_name = 'bathrooms') THEN
        ALTER TABLE public.listings ADD COLUMN bathrooms TEXT;
    END IF;
    
    -- Add interior_details (array: Furnished, Gated, Pool, Parking, Generator/Water Tank)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'listings' 
                   AND column_name = 'interior_details') THEN
        ALTER TABLE public.listings ADD COLUMN interior_details TEXT[] DEFAULT '{}';
    END IF;
    
    -- Add property_size (e.g., "1,990 Sqft")
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'listings' 
                   AND column_name = 'property_size') THEN
        ALTER TABLE public.listings ADD COLUMN property_size TEXT;
    END IF;
    
    -- Add availability_status (Available now, Under offer, Pre-construction, Coming soon)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'listings' 
                   AND column_name = 'availability_status') THEN
        ALTER TABLE public.listings ADD COLUMN availability_status TEXT 
            CHECK (availability_status IN ('Available now', 'Under offer', 'Pre-construction', 'Coming soon'));
    END IF;
    
    -- Add viewing_instructions (Viewing by appointment only, Open to scheduled viewings, No viewings until further notice)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'listings' 
                   AND column_name = 'viewing_instructions') THEN
        ALTER TABLE public.listings ADD COLUMN viewing_instructions TEXT 
            CHECK (viewing_instructions IN ('Viewing by appointment only', 'Open to scheduled viewings', 'No viewings until further notice'));
    END IF;
END $$;

-- Create indexes for new listing fields
CREATE INDEX IF NOT EXISTS idx_listings_property_category ON public.listings(property_category);
CREATE INDEX IF NOT EXISTS idx_listings_listing_type ON public.listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_listings_parish ON public.listings(parish);
CREATE INDEX IF NOT EXISTS idx_listings_bedrooms ON public.listings(bedrooms);
CREATE INDEX IF NOT EXISTS idx_listings_bathrooms ON public.listings(bathrooms);
CREATE INDEX IF NOT EXISTS idx_listings_availability_status ON public.listings(availability_status);

-- ============================================
-- VERIFICATION
-- ============================================
-- Run these queries to verify the new columns were added:

-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
--   AND table_name = 'users'
--   AND column_name IN ('company_name', 'management_type', 'is_registered_professional', 'rebj_registration_number', 'brokerage_company_name')
-- ORDER BY column_name;

-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
--   AND table_name = 'listings'
--   AND column_name IN ('property_category', 'listing_type', 'street_address', 'parish', 'bedrooms', 'bathrooms', 'interior_details', 'property_size', 'availability_status', 'viewing_instructions')
-- ORDER BY column_name;
