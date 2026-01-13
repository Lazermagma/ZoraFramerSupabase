# Supabase Database Setup

This directory contains SQL schema files for setting up your Supabase database.

## Quick Setup

1. **Open Supabase Dashboard**
   - Go to your Supabase project: https://app.supabase.com
   - Navigate to **SQL Editor**

2. **Run the Schema**
   - Open `schema.sql`
   - Copy the entire contents
   - Paste into Supabase SQL Editor
   - Click **Run** or press `Ctrl+Enter`

3. **Verify Tables Created**
   - Go to **Table Editor** in Supabase Dashboard
   - You should see 4 tables:
     - `users`
     - `listings`
     - `applications`
     - `subscriptions`

## Storage Bucket Setup

1. **Create Storage Bucket**
   - Go to **Storage** in Supabase Dashboard
   - Click **New bucket**
   - Name: `documents`
   - Public: **No** (private bucket)
   - Click **Create bucket**

2. **Set Bucket Policies** (Optional)
   - Go to **Storage** → **Policies**
   - Add policies as needed for file uploads

## Row-Level Security (RLS)

All tables have RLS enabled with the following policies:

- **Users**: Can read/update their own profile
- **Subscriptions**: Users can read their own subscriptions
- **Listings**: 
  - Public can read approved listings
  - Agents can manage their own listings
- **Applications**:
  - Buyers can read their own applications
  - Agents can read applications for their listings
  - Buyers can create applications
  - Agents can update applications for their listings

**Note**: The API uses the service role key which bypasses RLS. RLS provides an additional security layer for direct database access.

## Verification

After running the schema, verify everything is set up:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'listings', 'applications', 'subscriptions');

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'listings', 'applications', 'subscriptions');

-- Check policies exist
SELECT * FROM pg_policies 
WHERE tablename IN ('users', 'listings', 'applications', 'subscriptions');
```

## Troubleshooting

### Error: "relation already exists"
- Tables already exist. You can either:
  - Drop existing tables (⚠️ **WARNING**: This deletes all data)
  - Or modify the schema to use `CREATE TABLE IF NOT EXISTS` (already included)

### Error: "permission denied"
- Make sure you're running the SQL as a user with proper permissions
- Try running as the postgres user or service role

### RLS Policies Not Working
- Make sure RLS is enabled: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
- Check policies are created: `SELECT * FROM pg_policies WHERE tablename = 'table_name';`

## Schema Details

### Users Table
- Stores user accounts with roles (buyer, agent, admin)
- Linked to Supabase Auth via `id` (UUID)

### Listings Table
- Stores property listings
- Status workflow: draft → pending_review → approved/rejected → archived
- Only approved listings are visible to buyers

### Applications Table
- Stores buyer applications for listings
- Status workflow: submitted → viewed → under_review → accepted/rejected
- Prevents duplicate applications (unique constraint on listing_id + buyer_id)

### Subscriptions Table
- Stores Stripe subscription information
- Links users to their subscription status
- Required for listing approval

## Next Steps

After setting up the schema:

1. ✅ Test signup endpoint: `POST /api/auth/signup`
2. ✅ Test creating a listing: `POST /api/listings/create`
3. ✅ Test creating an application: `POST /api/applications/create`
4. ✅ Verify RLS is working correctly
