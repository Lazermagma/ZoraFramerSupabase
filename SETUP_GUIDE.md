# Complete Setup Guide

Follow these steps to set up your Framer-Supabase backend.

## Step 1: Supabase Database Setup

### 1.1 Create Tables

1. Go to your Supabase project: https://app.supabase.com
2. Navigate to **SQL Editor** (left sidebar)
3. Open `supabase/schema.sql` from this project
4. Copy the entire contents
5. Paste into Supabase SQL Editor
6. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`)

**Expected Output:**
- ✅ 4 tables created: `users`, `listings`, `applications`, `subscriptions`
- ✅ All indexes created
- ✅ RLS policies enabled
- ✅ Triggers set up

### 1.2 Create Storage Bucket

1. In Supabase Dashboard, go to **Storage** (left sidebar)
2. Click **New bucket**
3. Configure:
   - **Name**: `documents`
   - **Public**: **No** (unchecked - private bucket)
   - **File size limit**: 10MB (or your preference)
4. Click **Create bucket**

**OR** run the SQL:
1. Go to **SQL Editor**
2. Open `supabase/storage-setup.sql`
3. Copy and run the SQL

### 1.3 Verify Setup

Run this in SQL Editor to verify:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'listings', 'applications', 'subscriptions');

-- Should return 4 rows
```

## Step 2: Environment Variables

Update your `.env.local` file with actual values:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_AGENT_MONTHLY_PRICE_ID=price_xxx
STRIPE_AGENT_YEARLY_PRICE_ID=price_xxx
STRIPE_BUYER_MONTHLY_PRICE_ID=price_xxx
STRIPE_BUYER_YEARLY_PRICE_ID=price_xxx

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Where to find Supabase keys:**
1. Go to Supabase Dashboard
2. Click **Settings** → **API**
3. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ Keep this secret!

## Step 3: Test the Setup

### 3.1 Test Signup Endpoint

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser123@gmail.com",
    "password": "Password123",
    "role": "buyer",
    "name": "John Doe",
    "phone": "+1234567890",
    "parish": "Kingston"
  }'
```

**Expected Response:**
```json
{
  "user": {
    "id": "...",
    "email": "testuser123@gmail.com",
    "role": "buyer",
    ...
  },
  "session": {
    "access_token": "...",
    "refresh_token": "...",
    "expires_at": 1234567890
  }
}
```

### 3.2 Test Signin

```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser123@gmail.com",
    "password": "Password123"
  }'
```

### 3.3 Test Create Listing (Agent)

First, create an agent account, then:

```bash
curl -X POST http://localhost:3000/api/listings/create \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Beautiful Property",
    "description": "Great location",
    "price": 500000,
    "location": "Kingston, Jamaica",
    "status": "pending_review"
  }'
```

## Step 4: Common Issues & Solutions

### Issue: "Could not find the table 'public.users'"

**Solution:**
- Run `supabase/schema.sql` in Supabase SQL Editor
- Verify tables exist using the verification query above

### Issue: "Failed to create user profile"

**Possible causes:**
1. Table doesn't exist → Run schema.sql
2. RLS blocking insert → Check RLS policies (service role should bypass)
3. Missing columns → Verify schema matches exactly

### Issue: "Storage bucket not found"

**Solution:**
- Create the `documents` bucket in Supabase Storage
- Or run `supabase/storage-setup.sql`

### Issue: "Invalid API key"

**Solution:**
- Verify `.env.local` has correct Supabase keys
- Restart the dev server after updating `.env.local`

## Step 5: Database Schema Reference

### Users Table
```sql
- id (UUID, Primary Key)
- email (TEXT, Unique)
- role (TEXT: 'buyer' | 'agent' | 'admin')
- name (TEXT, nullable)
- phone (TEXT, nullable)
- parish (TEXT, nullable)
- account_status (TEXT: 'active' | 'inactive')
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### Listings Table
```sql
- id (UUID, Primary Key)
- agent_id (UUID, Foreign Key → users.id)
- title (TEXT)
- description (TEXT)
- price (NUMERIC)
- location (TEXT)
- status (TEXT: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'archived')
- images (TEXT[])
- documents (TEXT[])
- views (INTEGER)
- created_at, updated_at, published_at, expires_at (TIMESTAMPTZ)
```

### Applications Table
```sql
- id (UUID, Primary Key)
- listing_id (UUID, Foreign Key → listings.id)
- buyer_id (UUID, Foreign Key → users.id)
- agent_id (UUID, Foreign Key → users.id)
- status (TEXT: 'submitted' | 'viewed' | 'under_review' | 'accepted' | 'rejected')
- message (TEXT, nullable)
- documents (TEXT[])
- created_at, updated_at, viewed_at (TIMESTAMPTZ)
- UNIQUE(listing_id, buyer_id)
```

### Subscriptions Table
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → users.id)
- status (TEXT: 'active' | 'canceled' | 'past_due' | 'incomplete')
- stripe_subscription_id (TEXT, nullable)
- stripe_customer_id (TEXT, nullable)
- plan_type (TEXT, nullable)
- created_at, updated_at, expires_at (TIMESTAMPTZ)
```

## Step 6: Deploy to Vercel

1. Push code to GitHub (already done ✅)
2. Go to https://vercel.com
3. Import your GitHub repository
4. Add environment variables in Vercel dashboard
5. Deploy

## Next Steps

- ✅ Test all endpoints
- ✅ Connect Framer website
- ✅ Set up Stripe products and prices
- ✅ Configure email templates in Supabase (for password reset)
