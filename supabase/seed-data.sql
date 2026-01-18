-- ============================================
-- Seed Data for Testing
-- ============================================
-- Run this SQL in your Supabase SQL Editor AFTER running schema.sql and listing-form-schema-update.sql
-- This populates tables with dummy data for testing
-- WARNING: This will insert data. Adjust user IDs if you already have data.
-- ============================================

-- ============================================
-- CLEAR EXISTING DATA (Optional - Uncomment if you want to start fresh)
-- ============================================
-- DELETE FROM public.messages;
-- DELETE FROM public.property_views;
-- DELETE FROM public.saved_searches;
-- DELETE FROM public.applications;
-- DELETE FROM public.listings;
-- DELETE FROM public.subscriptions;
-- DELETE FROM public.users WHERE role != 'admin';

-- ============================================
-- INSERT DUMMY USERS
-- ============================================

-- Insert Agent Users (Lister Information)
INSERT INTO public.users (id, email, role, first_name, last_name, name, phone, country_of_residence, parish, company_name, management_type, is_registered_professional, rebj_registration_number, brokerage_company_name, account_status)
VALUES 
    -- Agent 1: Registered Real Estate Agent
    (
        'a0000000-0000-0000-0000-000000000001'::UUID,
        'john.agent@example.com',
        'agent',
        'John',
        'Smith',
        'John Smith',
        '+1-876-555-0101',
        'Jamaica',
        'Kingston',
        'Smith Realty Group',
        'Real Estate Agent / Broker',
        true,
        'REBJ123456',
        'Premier Real Estate',
        'active'
    ),
    -- Agent 2: Property Developer
    (
        'a0000000-0000-0000-0000-000000000002'::UUID,
        'maria.developer@example.com',
        'agent',
        'Maria',
        'Johnson',
        'Maria Johnson',
        '+1-876-555-0102',
        'Jamaica',
        'St. Andrew',
        'Johnson Developments',
        'Property Developer',
        true,
        'REBJ789012',
        'Johnson Development Company',
        'active'
    ),
    -- Agent 3: Property Owner (Not registered)
    (
        'a0000000-0000-0000-0000-000000000003'::UUID,
        'david.owner@example.com',
        'agent',
        'David',
        'Williams',
        'David Williams',
        '+1-876-555-0103',
        'Jamaica',
        'Montego Bay',
        'Williams Property Management',
        'Property Owner',
        false,
        NULL,
        NULL,
        'active'
    ),
    -- Agent 4: Broker
    (
        'a0000000-0000-0000-0000-000000000004'::UUID,
        'sarah.broker@example.com',
        'agent',
        'Sarah',
        'Brown',
        'Sarah Brown',
        '+1-876-555-0104',
        'Jamaica',
        'Portmore',
        'Brown Brokerage',
        'Real Estate Agent / Broker',
        true,
        'REBJ345678',
        'Brown Real Estate Services',
        'active'
    ),
    -- Buyer Users
    (
        'b0000000-0000-0000-0000-000000000001'::UUID,
        'buyer1@example.com',
        'buyer',
        'Alice',
        'Davis',
        'Alice Davis',
        '+1-876-555-0201',
        'Jamaica',
        'Kingston',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'active'
    ),
    (
        'b0000000-0000-0000-0000-000000000002'::UUID,
        'buyer2@example.com',
        'buyer',
        'Bob',
        'Miller',
        'Bob Miller',
        '+1-876-555-0202',
        'Jamaica',
        'St. Andrew',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'active'
    ),
    (
        'b0000000-0000-0000-0000-000000000003'::UUID,
        'buyer3@example.com',
        'buyer',
        'Carol',
        'Wilson',
        'Carol Wilson',
        '+1-876-555-0203',
        'Jamaica',
        'Montego Bay',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'active'
    )
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- INSERT DUMMY SUBSCRIPTIONS
-- ============================================
INSERT INTO public.subscriptions (id, user_id, status, stripe_subscription_id, stripe_customer_id, plan_type, created_at, updated_at, expires_at)
VALUES 
    (
        'c0000000-0000-0000-0000-000000000001'::UUID,
        'a0000000-0000-0000-0000-000000000001'::UUID,
        'active',
        'sub_test_001',
        'cus_test_001',
        'agent_monthly',
        NOW() - INTERVAL '2 months',
        NOW(),
        NOW() + INTERVAL '10 months'
    ),
    (
        'c0000000-0000-0000-0000-000000000002'::UUID,
        'a0000000-0000-0000-0000-000000000002'::UUID,
        'active',
        'sub_test_002',
        'cus_test_002',
        'agent_yearly',
        NOW() - INTERVAL '6 months',
        NOW(),
        NOW() + INTERVAL '6 months'
    ),
    (
        'c0000000-0000-0000-0000-000000000003'::UUID,
        'a0000000-0000-0000-0000-000000000004'::UUID,
        'active',
        'sub_test_003',
        'cus_test_003',
        'agent_monthly',
        NOW() - INTERVAL '1 month',
        NOW(),
        NOW() + INTERVAL '11 months'
    )
ON CONFLICT DO NOTHING;

-- ============================================
-- INSERT DUMMY LISTINGS
-- ============================================
INSERT INTO public.listings (
    id, 
    agent_id, 
    title, 
    description, 
    price, 
    location, 
    property_type, 
    property_category,
    listing_type,
    street_address,
    parish,
    bedrooms,
    bathrooms,
    interior_details,
    property_size,
    availability_status,
    viewing_instructions,
    status, 
    images, 
    views,
    created_at,
    published_at
)
VALUES 
    -- Listing 1: Modern Apartment for Rent
    (
        'd0000000-0000-0000-0000-000000000001'::UUID,
        'a0000000-0000-0000-0000-000000000001'::UUID,
        'Modern Luxury Apartment in Downtown Kingston',
        'Beautiful 2-bedroom, 2-bathroom apartment with modern amenities. Features include fully furnished interior, gated community, swimming pool, parking space, and backup generator. Located in the heart of Kingston with easy access to shopping, dining, and business districts.',
        120000.00,
        'Kingston, Jamaica',
        'Rent',
        'Apartment',
        'Rent',
        '716 Kings Way',
        'Kingston',
        '2',
        '2',
        ARRAY['Furnished', 'Gated', 'Pool', 'Parking', 'Generator / Water Tank'],
        '1,990 Sqft',
        'Available now',
        'Viewing by appointment only',
        'approved',
        ARRAY[
            'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
            'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
            'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800'
        ],
        45,
        NOW() - INTERVAL '30 days',
        NOW() - INTERVAL '25 days'
    ),
    -- Listing 2: House for Sale
    (
        'd0000000-0000-0000-0000-000000000002'::UUID,
        'a0000000-0000-0000-0000-000000000001'::UUID,
        'Spacious Family Home in St. Andrew',
        'Stunning 4-bedroom, 3-bathroom family home on a large lot. Features include modern kitchen, spacious living areas, gated property with security, swimming pool, parking for multiple vehicles, and backup generator. Perfect for families seeking comfort and security.',
        8500000.00,
        'St. Andrew, Jamaica',
        'Buy',
        'House',
        'Sale',
        '123 Hilltop Drive',
        'St. Andrew',
        '4+',
        '3',
        ARRAY['Gated', 'Pool', 'Parking', 'Generator / Water Tank'],
        '3,500 Sqft',
        'Available now',
        'Open to scheduled viewings',
        'approved',
        ARRAY[
            'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
            'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800'
        ],
        78,
        NOW() - INTERVAL '25 days',
        NOW() - INTERVAL '20 days'
    ),
    -- Listing 3: Townhouse for Rent
    (
        'd0000000-0000-0000-0000-000000000003'::UUID,
        'a0000000-0000-0000-0000-000000000002'::UUID,
        'Contemporary Townhouse in Portmore',
        'Elegant 3-bedroom townhouse with modern finishes. Includes fully furnished interior, gated community access, swimming pool, assigned parking, and water tank. Close to schools, shopping centers, and major highways. Ideal for professionals and families.',
        95000.00,
        'Portmore, Jamaica',
        'Rent',
        'Townhouse',
        'Rent',
        '456 Sunset Boulevard',
        'Portmore',
        '3',
        '2',
        ARRAY['Furnished', 'Gated', 'Pool', 'Parking', 'Generator / Water Tank'],
        '2,200 Sqft',
        'Available now',
        'Viewing by appointment only',
        'approved',
        ARRAY[
            'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
            'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
            'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800'
        ],
        62,
        NOW() - INTERVAL '20 days',
        NOW() - INTERVAL '15 days'
    ),
    -- Listing 4: Condo for Sale
    (
        'd0000000-0000-0000-0000-000000000004'::UUID,
        'a0000000-0000-0000-0000-000000000002'::UUID,
        'Penthouse Condo with Ocean Views',
        'Luxurious penthouse condo featuring 2 bedrooms and 2.5 bathrooms. Includes high-end finishes, modern appliances, gated community, infinity pool, parking space, and backup generator. Breathtaking ocean views from every room. Perfect for luxury living.',
        15000000.00,
        'Montego Bay, Jamaica',
        'Buy',
        'Condo',
        'Sale',
        '789 Ocean Drive',
        'Montego Bay',
        '2',
        '2',
        ARRAY['Furnished', 'Gated', 'Pool', 'Parking', 'Generator / Water Tank'],
        '2,800 Sqft',
        'Under offer',
        'Viewing by appointment only',
        'approved',
        ARRAY[
            'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800',
            'https://images.unsplash.com/photo-1493663284031-b7e3aaa4feda?w=800',
            'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'
        ],
        123,
        NOW() - INTERVAL '15 days',
        NOW() - INTERVAL '10 days'
    ),
    -- Listing 5: Land for Development
    (
        'd0000000-0000-0000-0000-000000000005'::UUID,
        'a0000000-0000-0000-0000-000000000002'::UUID,
        'Prime Development Land in St. Andrew',
        'Large parcel of land suitable for residential or commercial development. Prime location with easy access to major roads, utilities available, clear title. Perfect for investors or developers looking to build their dream project.',
        5000000.00,
        'St. Andrew, Jamaica',
        'Buy',
        'Land',
        'Development',
        'Plot 234 Mountain View Estate',
        'St. Andrew',
        NULL,
        NULL,
        ARRAY[]::TEXT[],
        '25,000 Sqft',
        'Available now',
        'Open to scheduled viewings',
        'approved',
        ARRAY[
            'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800',
            'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800'
        ],
        34,
        NOW() - INTERVAL '10 days',
        NOW() - INTERVAL '5 days'
    ),
    -- Listing 6: Commercial Property for Sale
    (
        'd0000000-0000-0000-0000-000000000006'::UUID,
        'a0000000-0000-0000-0000-000000000004'::UUID,
        'Commercial Building in Downtown Kingston',
        'Well-maintained commercial building in prime downtown location. Features include multiple storefronts, office spaces, parking lot, and security system. Ideal for retail businesses, offices, or mixed-use development. Excellent foot traffic and visibility.',
        12000000.00,
        'Kingston, Jamaica',
        'Buy',
        'Commercial',
        'Sale',
        '321 Business District Avenue',
        'Kingston',
        NULL,
        '3',
        ARRAY['Gated', 'Parking'],
        '5,000 Sqft',
        'Available now',
        'Open to scheduled viewings',
        'approved',
        ARRAY[
            'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
            'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800'
        ],
        56,
        NOW() - INTERVAL '8 days',
        NOW() - INTERVAL '3 days'
    ),
    -- Listing 7: Pre-construction Development
    (
        'd0000000-0000-0000-0000-000000000007'::UUID,
        'a0000000-0000-0000-0000-000000000002'::UUID,
        'Modern Residential Development - Pre-Construction',
        'Exciting new residential development project. Modern 3-bedroom units with contemporary design, gated community, swimming pool, clubhouse, and parking. Completion expected within 12 months. Early bird pricing available for pre-construction buyers.',
        6500000.00,
        'Portmore, Jamaica',
        'Buy',
        'Condo',
        'Development',
        'New Development Complex, Phase 1',
        'Portmore',
        '3',
        '2',
        ARRAY['Gated', 'Pool', 'Parking'],
        '2,100 Sqft',
        'Pre-construction',
        'No viewings until further notice',
        'approved',
        ARRAY[
            'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800',
            'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=800'
        ],
        28,
        NOW() - INTERVAL '5 days',
        NOW() - INTERVAL '2 days'
    ),
    -- Listing 8: Coming Soon Property
    (
        'd0000000-0000-0000-0000-000000000008'::UUID,
        'a0000000-0000-0000-0000-000000000003'::UUID,
        'Luxury Villa - Coming Soon',
        'Stunning luxury villa coming to market soon. Features include 5 bedrooms, 4 bathrooms, private pool, guest house, tennis court, and stunning mountain views. Perfect for those seeking ultimate luxury and privacy. Register interest now.',
        25000000.00,
        'St. Andrew, Jamaica',
        'Buy',
        'House',
        'Sale',
        'Elite Estate, Upper St. Andrew',
        'St. Andrew',
        '4+',
        '4+',
        ARRAY['Gated', 'Pool', 'Parking', 'Generator / Water Tank'],
        '8,500 Sqft',
        'Coming soon',
        'No viewings until further notice',
        'pending_review',
        ARRAY[
            'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800',
            'https://images.unsplash.com/photo-1600585152915-d208bec867a1?w=800'
        ],
        0,
        NOW() - INTERVAL '3 days',
        NULL
    ),
    -- Listing 9: Affordable Apartment for Rent
    (
        'd0000000-0000-0000-0000-000000000009'::UUID,
        'a0000000-0000-0000-0000-000000000001'::UUID,
        'Cozy Studio Apartment in Kingston',
        'Affordable studio apartment perfect for students or young professionals. Features include fully furnished space, modern kitchenette, secure building, and walking distance to universities and business districts. Great starter home with all utilities included.',
        65000.00,
        'Kingston, Jamaica',
        'Rent',
        'Apartment',
        'Rent',
        '234 University Avenue',
        'Kingston',
        '1',
        '1',
        ARRAY['Furnished', 'Parking'],
        '650 Sqft',
        'Available now',
        'Open to scheduled viewings',
        'approved',
        ARRAY[
            'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
            'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'
        ],
        38,
        NOW() - INTERVAL '18 days',
        NOW() - INTERVAL '15 days'
    ),
    -- Listing 10: Luxury Beachfront Villa
    (
        'd0000000-0000-0000-0000-000000000010'::UUID,
        'a0000000-0000-0000-0000-000000000004'::UUID,
        'Beachfront Villa in Montego Bay',
        'Magnificent beachfront villa with direct beach access. Features 5 bedrooms, 4 bathrooms, private infinity pool, outdoor kitchen, multiple balconies with ocean views, and landscaped gardens. Perfect for vacation rental or luxury living.',
        18000000.00,
        'Montego Bay, Jamaica',
        'Buy',
        'House',
        'Sale',
        'Beachfront Drive, Montego Bay',
        'Montego Bay',
        '5',
        '4',
        ARRAY['Gated', 'Pool', 'Parking', 'Generator / Water Tank'],
        '6,200 Sqft',
        'Available now',
        'Viewing by appointment only',
        'approved',
        ARRAY[
            'https://images.unsplash.com/photo-1600585152915-d208bec867a1?w=800',
            'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800'
        ],
        67,
        NOW() - INTERVAL '12 days',
        NOW() - INTERVAL '8 days'
    ),
    -- Listing 11: Modern Loft Apartment
    (
        'd0000000-0000-0000-0000-000000000011'::UUID,
        'a0000000-0000-0000-0000-000000000002'::UUID,
        'Urban Loft in Downtown Kingston',
        'Stylish urban loft apartment in the heart of downtown. Features high ceilings, exposed brick walls, modern appliances, open floor plan, and rooftop access. Perfect for young professionals seeking modern city living.',
        135000.00,
        'Kingston, Jamaica',
        'Rent',
        'Apartment',
        'Rent',
        '567 Downtown Plaza',
        'Kingston',
        '2',
        '2',
        ARRAY['Furnished', 'Parking'],
        '1,200 Sqft',
        'Available now',
        'Open to scheduled viewings',
        'approved',
        ARRAY[
            'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
            'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'
        ],
        42,
        NOW() - INTERVAL '14 days',
        NOW() - INTERVAL '11 days'
    ),
    -- Listing 12: Family Home for Sale
    (
        'd0000000-0000-0000-0000-000000000012'::UUID,
        'a0000000-0000-0000-0000-000000000001'::UUID,
        'Spacious Family Home in Portmore',
        'Beautiful 4-bedroom family home in quiet residential neighborhood. Features large backyard, double car garage, modern kitchen, spacious living areas, and walking distance to schools and parks. Perfect for growing families.',
        7200000.00,
        'Portmore, Jamaica',
        'Buy',
        'House',
        'Sale',
        '789 Family Circle',
        'Portmore',
        '4',
        '3',
        ARRAY['Gated', 'Parking', 'Generator / Water Tank'],
        '3,200 Sqft',
        'Available now',
        'Open to scheduled viewings',
        'approved',
        ARRAY[
            'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'
        ],
        54,
        NOW() - INTERVAL '9 days',
        NOW() - INTERVAL '6 days'
    )
ON CONFLICT DO NOTHING;

-- ============================================
-- INSERT DUMMY APPLICATIONS
-- ============================================
INSERT INTO public.applications (
    id,
    listing_id,
    buyer_id,
    agent_id,
    status,
    message,
    created_at,
    viewed_at
)
VALUES 
    (
        'e0000000-0000-0000-0000-000000000001'::UUID,
        'd0000000-0000-0000-0000-000000000001'::UUID,
        'b0000000-0000-0000-0000-000000000001'::UUID,
        'a0000000-0000-0000-0000-000000000001'::UUID,
        'submitted',
        'I am very interested in this apartment. I am a working professional looking for a comfortable place to rent. Please let me know when we can schedule a viewing.',
        NOW() - INTERVAL '5 days',
        NULL
    ),
    (
        'e0000000-0000-0000-0000-000000000002'::UUID,
        'd0000000-0000-0000-0000-000000000002'::UUID,
        'b0000000-0000-0000-0000-000000000001'::UUID,
        'a0000000-0000-0000-0000-000000000001'::UUID,
        'viewed',
        'This house looks perfect for my family. We have been looking for a home in this area for months. I would like to schedule a viewing as soon as possible.',
        NOW() - INTERVAL '10 days',
        NOW() - INTERVAL '8 days'
    ),
    (
        'e0000000-0000-0000-0000-000000000003'::UUID,
        'd0000000-0000-0000-0000-000000000003'::UUID,
        'b0000000-0000-0000-0000-000000000002'::UUID,
        'a0000000-0000-0000-0000-000000000002'::UUID,
        'under_review',
        'I am interested in renting this townhouse. I am relocating to Portmore for work and this property seems ideal. Please contact me to discuss further.',
        NOW() - INTERVAL '7 days',
        NOW() - INTERVAL '5 days'
    ),
    (
        'e0000000-0000-0000-0000-000000000004'::UUID,
        'd0000000-0000-0000-0000-000000000004'::UUID,
        'b0000000-0000-0000-0000-000000000003'::UUID,
        'a0000000-0000-0000-0000-000000000002'::UUID,
        'accepted',
        'This penthouse is exactly what I have been looking for. I am ready to make an offer. Please let me know the next steps.',
        NOW() - INTERVAL '12 days',
        NOW() - INTERVAL '10 days'
    )
ON CONFLICT DO NOTHING;

-- ============================================
-- INSERT DUMMY PROPERTY VIEWS
-- ============================================
INSERT INTO public.property_views (id, buyer_id, listing_id, viewed_at)
VALUES 
    -- Buyer 1 views (most active viewer)
    ('f0000000-0000-0000-0000-000000000001'::UUID, 'b0000000-0000-0000-0000-000000000001'::UUID, 'd0000000-0000-0000-0000-000000000001'::UUID, NOW() - INTERVAL '2 hours'),
    ('f0000000-0000-0000-0000-000000000002'::UUID, 'b0000000-0000-0000-0000-000000000001'::UUID, 'd0000000-0000-0000-0000-000000000002'::UUID, NOW() - INTERVAL '1 day'),
    ('f0000000-0000-0000-0000-000000000003'::UUID, 'b0000000-0000-0000-0000-000000000001'::UUID, 'd0000000-0000-0000-0000-000000000003'::UUID, NOW() - INTERVAL '5 hours'),
    ('f0000000-0000-0000-0000-000000000004'::UUID, 'b0000000-0000-0000-0000-000000000001'::UUID, 'd0000000-0000-0000-0000-000000000004'::UUID, NOW() - INTERVAL '3 days'),
    ('f0000000-0000-0000-0000-000000000005'::UUID, 'b0000000-0000-0000-0000-000000000001'::UUID, 'd0000000-0000-0000-0000-000000000005'::UUID, NOW() - INTERVAL '6 days'),
    ('f0000000-0000-0000-0000-000000000006'::UUID, 'b0000000-0000-0000-0000-000000000001'::UUID, 'd0000000-0000-0000-0000-000000000006'::UUID, NOW() - INTERVAL '1 week'),
    ('f0000000-0000-0000-0000-000000000007'::UUID, 'b0000000-0000-0000-0000-000000000001'::UUID, 'd0000000-0000-0000-0000-000000000007'::UUID, NOW() - INTERVAL '4 days'),
    -- Buyer 2 views
    ('f0000000-0000-0000-0000-000000000008'::UUID, 'b0000000-0000-0000-0000-000000000002'::UUID, 'd0000000-0000-0000-0000-000000000003'::UUID, NOW() - INTERVAL '12 hours'),
    ('f0000000-0000-0000-0000-000000000009'::UUID, 'b0000000-0000-0000-0000-000000000002'::UUID, 'd0000000-0000-0000-0000-000000000004'::UUID, NOW() - INTERVAL '2 days'),
    ('f0000000-0000-0000-0000-000000000010'::UUID, 'b0000000-0000-0000-0000-000000000002'::UUID, 'd0000000-0000-0000-0000-000000000005'::UUID, NOW() - INTERVAL '3 days'),
    ('f0000000-0000-0000-0000-000000000011'::UUID, 'b0000000-0000-0000-0000-000000000002'::UUID, 'd0000000-0000-0000-0000-000000000006'::UUID, NOW() - INTERVAL '5 days'),
    ('f0000000-0000-0000-0000-000000000012'::UUID, 'b0000000-0000-0000-0000-000000000002'::UUID, 'd0000000-0000-0000-0000-000000000007'::UUID, NOW() - INTERVAL '1 week'),
    ('f0000000-0000-0000-0000-000000000013'::UUID, 'b0000000-0000-0000-0000-000000000002'::UUID, 'd0000000-0000-0000-0000-000000000001'::UUID, NOW() - INTERVAL '8 days'),
    -- Buyer 3 views
    ('f0000000-0000-0000-0000-000000000014'::UUID, 'b0000000-0000-0000-0000-000000000003'::UUID, 'd0000000-0000-0000-0000-000000000004'::UUID, NOW() - INTERVAL '1 day'),
    ('f0000000-0000-0000-0000-000000000015'::UUID, 'b0000000-0000-0000-0000-000000000003'::UUID, 'd0000000-0000-0000-0000-000000000005'::UUID, NOW() - INTERVAL '4 days'),
    ('f0000000-0000-0000-0000-000000000016'::UUID, 'b0000000-0000-0000-0000-000000000003'::UUID, 'd0000000-0000-0000-0000-000000000006'::UUID, NOW() - INTERVAL '6 days'),
    ('f0000000-0000-0000-0000-000000000017'::UUID, 'b0000000-0000-0000-0000-000000000003'::UUID, 'd0000000-0000-0000-0000-000000000001'::UUID, NOW() - INTERVAL '9 days'),
    ('f0000000-0000-0000-0000-000000000018'::UUID, 'b0000000-0000-0000-0000-000000000003'::UUID, 'd0000000-0000-0000-0000-000000000002'::UUID, NOW() - INTERVAL '2 weeks'),
    -- Additional views for more variety
    ('f0000000-0000-0000-0000-000000000019'::UUID, 'b0000000-0000-0000-0000-000000000001'::UUID, 'd0000000-0000-0000-0000-000000000006'::UUID, NOW() - INTERVAL '8 hours'),
    ('f0000000-0000-0000-0000-000000000020'::UUID, 'b0000000-0000-0000-0000-000000000002'::UUID, 'd0000000-0000-0000-0000-000000000002'::UUID, NOW() - INTERVAL '4 days'),
    ('f0000000-0000-0000-0000-000000000021'::UUID, 'b0000000-0000-0000-0000-000000000003'::UUID, 'd0000000-0000-0000-0000-000000000003'::UUID, NOW() - INTERVAL '7 days')
ON CONFLICT DO NOTHING;

-- ============================================
-- INSERT DUMMY SAVED SEARCHES
-- ============================================
INSERT INTO public.saved_searches (id, buyer_id, name, search_criteria, alerts_enabled, created_at, updated_at)
VALUES 
    (
        '10000000-0000-0000-0000-000000000001'::UUID,
        'b0000000-0000-0000-0000-000000000001'::UUID,
        'Kingston Apartments Under $150k',
        '{"location": "Kingston", "max_price": 150000, "property_category": "Apartment", "listing_type": "Rent"}'::JSONB,
        true,
        NOW() - INTERVAL '15 days',
        NOW() - INTERVAL '5 days'
    ),
    (
        '10000000-0000-0000-0000-000000000002'::UUID,
        'b0000000-0000-0000-0000-000000000002'::UUID,
        'Family Homes in St. Andrew',
        '{"location": "St. Andrew", "property_category": "House", "listing_type": "Sale", "bedrooms": "4+"}'::JSONB,
        true,
        NOW() - INTERVAL '20 days',
        NOW() - INTERVAL '10 days'
    ),
    (
        '10000000-0000-0000-0000-000000000003'::UUID,
        'b0000000-0000-0000-0000-000000000003'::UUID,
        'Luxury Properties',
        '{"min_price": 10000000, "listing_type": "Sale"}'::JSONB,
        false,
        NOW() - INTERVAL '10 days',
        NOW() - INTERVAL '3 days'
    )
ON CONFLICT DO NOTHING;

-- ============================================
-- INSERT DUMMY MESSAGES
-- ============================================
INSERT INTO public.messages (id, buyer_id, agent_id, listing_id, application_id, message, sender_role, read, created_at)
VALUES 
    (
        '20000000-0000-0000-0000-000000000001'::UUID,
        'b0000000-0000-0000-0000-000000000001'::UUID,
        'a0000000-0000-0000-0000-000000000001'::UUID,
        'd0000000-0000-0000-0000-000000000001'::UUID,
        'e0000000-0000-0000-0000-000000000001'::UUID,
        'Hello, I submitted an application for the apartment. When can we schedule a viewing?',
        'buyer',
        true,
        NOW() - INTERVAL '5 days'
    ),
    (
        '20000000-0000-0000-0000-000000000002'::UUID,
        'b0000000-0000-0000-0000-000000000001'::UUID,
        'a0000000-0000-0000-0000-000000000001'::UUID,
        'd0000000-0000-0000-0000-000000000001'::UUID,
        'e0000000-0000-0000-0000-000000000001'::UUID,
        'Thank you for your interest! I can schedule a viewing for you this Saturday at 2 PM. Does that work?',
        'agent',
        false,
        NOW() - INTERVAL '4 days'
    ),
    (
        '20000000-0000-0000-0000-000000000003'::UUID,
        'b0000000-0000-0000-0000-000000000002'::UUID,
        'a0000000-0000-0000-0000-000000000002'::UUID,
        'd0000000-0000-0000-0000-000000000003'::UUID,
        'e0000000-0000-0000-0000-000000000003'::UUID,
        'Hi, I am very interested in the townhouse. Could you provide more details about the neighborhood?',
        'buyer',
        true,
        NOW() - INTERVAL '7 days'
    )
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the data was inserted:

-- SELECT COUNT(*) as user_count FROM public.users;
-- SELECT COUNT(*) as listing_count FROM public.listings;
-- SELECT COUNT(*) as application_count FROM public.applications;
-- SELECT COUNT(*) as property_view_count FROM public.property_views;
-- SELECT COUNT(*) as saved_search_count FROM public.saved_searches;
-- SELECT COUNT(*) as message_count FROM public.messages;

-- SELECT * FROM public.listings ORDER BY created_at DESC LIMIT 5;
-- SELECT * FROM public.applications ORDER BY created_at DESC LIMIT 5;
