# Listing Form Setup Guide

This guide explains how to set up the database schema and seed data to support all fields from the listing form.

## Overview

The listing form includes all the following fields which are now supported in the database schema:

### Section A: Lister Information
- First name, Last name
- Email, Phone
- Country of Residence, Parish/State
- Management (Property Owner / Real Estate Agent / Broker / Property Developer)
- Company Name
- Are you a registered real estate professional? (Yes/No)
- REBJ Registration Number
- Brokerage / Development Company Name

### Section B: Property Info
- Property Type (Apartment, House, Townhouse, Condo, Land, Commercial)
- Listing Type (Rent, Sale, Development)
- Street Address
- Parish
- Property Title
- Property Price
- Bedrooms (1, 2, 3, 4+)
- Bathrooms (1, 2, 3, 4+)
- Interior Details (Furnished, Gated, Pool, Parking, Generator/Water Tank)
- Property Size (Area)
- Property Description

### Section C: Property Images
- Property Image 1-6

### Section D: Additional Details
- Availability Status (Available now, Under offer, Pre-construction, Coming soon)
- Viewing Instructions (Viewing by appointment only, Open to scheduled viewings, No viewings until further notice)

## Setup Instructions

### Step 1: Run Schema Updates

1. Go to your Supabase project: https://app.supabase.com
2. Navigate to **SQL Editor**
3. Run `supabase/schema.sql` first (if you haven't already)
4. Run `supabase/listing-form-schema-update.sql` to add all new fields

**What the schema update does:**
- Adds agent/lister fields to `users` table:
  - `company_name`
  - `management_type`
  - `is_registered_professional`
  - `rebj_registration_number`
  - `brokerage_company_name`

- Adds property detail fields to `listings` table:
  - `property_category` (Apartment, House, Townhouse, Condo, Land, Commercial)
  - `listing_type` (Rent, Sale, Development)
  - `street_address`
  - `parish`
  - `bedrooms`
  - `bathrooms`
  - `interior_details` (array)
  - `property_size`
  - `availability_status`
  - `viewing_instructions`

### Step 2: Seed Database with Dummy Data

1. In Supabase SQL Editor, run `supabase/seed-data.sql`

**What the seed data includes:**
- 4 Agent users with full lister information
- 3 Buyer users
- 3 Active subscriptions
- 8 Listings with all new fields populated
- 4 Applications
- 7 Property views (for recently viewed properties)
- 3 Saved searches
- 3 Messages

**Note:** The seed data uses predefined UUIDs to ensure relationships work correctly. If you already have data, you may need to adjust the UUIDs.

### Step 3: Verify Data

Run these queries in SQL Editor to verify:

```sql
-- Check listings with all new fields
SELECT 
    id, 
    title, 
    property_category, 
    listing_type, 
    street_address, 
    parish, 
    bedrooms, 
    bathrooms, 
    availability_status,
    viewing_instructions
FROM public.listings 
LIMIT 5;

-- Check agent users with lister information
SELECT 
    id, 
    email, 
    first_name, 
    last_name, 
    company_name, 
    management_type, 
    is_registered_professional,
    rebj_registration_number
FROM public.users 
WHERE role = 'agent' 
LIMIT 5;

-- Check property views for recently viewed properties
SELECT 
    pv.id,
    u.email as buyer_email,
    l.title as property_title,
    pv.viewed_at
FROM public.property_views pv
JOIN public.users u ON pv.buyer_id = u.id
JOIN public.listings l ON pv.listing_id = l.id
ORDER BY pv.viewed_at DESC
LIMIT 10;
```

## API Usage

### Create Listing with All Fields

```javascript
const response = await fetch('https://your-api.vercel.app/api/listings/create', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabaseAccessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    // Required fields
    title: "Modern Luxury Apartment",
    description: "Beautiful 2-bedroom apartment...",
    price: 120000,
    location: "Kingston, Jamaica",
    
    // Property details
    property_type: "Rent",
    property_category: "Apartment",
    listing_type: "Rent",
    street_address: "716 Kings Way",
    parish: "Kingston",
    bedrooms: "2",
    bathrooms: "2",
    interior_details: ["Furnished", "Gated", "Pool", "Parking", "Generator / Water Tank"],
    property_size: "1,990 Sqft",
    availability_status: "Available now",
    viewing_instructions: "Viewing by appointment only",
    
    // Media
    images: [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg"
    ],
    
    // Status
    status: "pending_review"
  })
});
```

### Get Recently Viewed Properties

You can query property views to get recently viewed properties:

```sql
-- Get recently viewed properties for a buyer
SELECT 
    l.*,
    pv.viewed_at
FROM public.listings l
JOIN public.property_views pv ON l.id = pv.listing_id
WHERE pv.buyer_id = 'buyer-user-id-here'
ORDER BY pv.viewed_at DESC
LIMIT 10;
```

Or create a GET endpoint that returns this data:

```javascript
// In your API route or Framer component
const response = await fetch('https://your-api.vercel.app/api/listings/browse', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${supabaseAccessToken}`,
  }
});

// Then filter by property views or create a new endpoint
```

## Next Steps

1. **Update User Profile API** - Allow agents to update their lister information (company name, REBJ number, etc.)
2. **Create Recently Viewed Properties Endpoint** - Add a dedicated endpoint that returns recently viewed properties for a buyer
3. **Update Listings Browse Endpoint** - Add filters for the new fields (property_category, listing_type, bedrooms, etc.)
4. **Test the Listing Form** - Make sure all form fields map correctly to the API

## Troubleshooting

### "Column does not exist" errors
- Make sure you ran `listing-form-schema-update.sql` after `schema.sql`
- Check that the columns were added: `SELECT column_name FROM information_schema.columns WHERE table_name = 'listings' AND table_schema = 'public';`

### Seed data not inserting
- Check if data already exists with those UUIDs
- You may need to delete existing data first or adjust the UUIDs
- Make sure all foreign key relationships are correct (agent_id references existing users)

### Recently Viewed Properties not showing
- Make sure property views are being tracked when buyers view listings
- Check the `property_views` table has data: `SELECT COUNT(*) FROM public.property_views;`
- Verify the API endpoint is querying `property_views` correctly
