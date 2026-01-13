# Framer-Supabase API Backend

A Next.js 16 API-only backend that acts as a secure layer between your Framer website and Supabase.

## 🎯 Overview

This project provides a backend API layer with:
- **No frontend UI** - API routes only
- **Supabase integration** - Auth, Database, Storage
- **Stripe Checkout** - Subscription management
- **Role-based access control** - Buyer, Agent, Admin roles
- **Vercel-ready** - Optimized for serverless deployment

## 📁 Project Structure

```
├── app/
│   └── api/
│       ├── stripe/checkout/route.ts      # Stripe checkout session creation
│       ├── listings/
│       │   ├── create/route.ts           # Create listing (Agent-only)
│       │   └── approve/route.ts         # Approve listing (Admin-only)
│       ├── applications/
│       │   └── update-status/route.ts    # Update application status (Agent-only)
│       └── route.ts                      # Health check endpoint
├── lib/
│   ├── supabaseClient.ts                 # User session validation
│   ├── supabaseAdmin.ts                  # Admin operations (service role)
│   ├── stripe.ts                         # Stripe configuration
│   └── auth.ts                           # JWT + role validation helpers
├── types/
│   ├── user.ts                           # User types and roles
│   ├── listing.ts                        # Listing types
│   └── application.ts                    # Application types
└── package.json
```

## 🚀 Setup

> **⚠️ IMPORTANT**: Before running the API, you must set up your Supabase database schema. See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for complete instructions.

### 1. Set Up Supabase Database

**CRITICAL**: Run the database schema first!

1. Go to your Supabase project: https://app.supabase.com
2. Navigate to **SQL Editor**
3. Open `supabase/schema.sql` from this project
4. Copy and run the entire SQL script
5. Create storage bucket `documents` (see `supabase/storage-setup.sql`)

**Without this step, all API calls will fail!**

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions.

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_AGENT_MONTHLY_PRICE_ID=price_xxx
STRIPE_AGENT_YEARLY_PRICE_ID=price_xxx
STRIPE_BUYER_MONTHLY_PRICE_ID=price_xxx
STRIPE_BUYER_YEARLY_PRICE_ID=price_xxx

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000/api`

## 📡 API Endpoints

### POST /api/stripe/checkout

Creates a Stripe Checkout session for subscription plans.

**Request:**
```bash
curl -X POST https://your-api.vercel.app/api/stripe/checkout \
  -H "Authorization: Bearer <supabase_access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "plan_type": "agent_monthly",
    "user_role": "agent"
  }'
```

**Response:**
```json
{
  "checkout_url": "https://checkout.stripe.com/...",
  "session_id": "cs_..."
}
```

### POST /api/listings/create

Creates a new listing (Agent-only). Listing is created with `status: "pending_review"`.

**Request:**
```bash
curl -X POST https://your-api.vercel.app/api/listings/create \
  -H "Authorization: Bearer <supabase_access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Beautiful Property",
    "description": "Description here",
    "price": 500000,
    "location": "123 Main St, City, State",
    "images": ["https://..."]
  }'
```

**Response:**
```json
{
  "listing": {
    "id": "...",
    "agent_id": "...",
    "title": "...",
    "status": "pending_review",
    ...
  }
}
```

### POST /api/listings/approve

Approves and publishes a listing (Admin-only). Verifies agent has active subscription.

**Request:**
```bash
curl -X POST https://your-api.vercel.app/api/listings/approve \
  -H "Authorization: Bearer <supabase_access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "listing_id": "listing-uuid"
  }'
```

**Response:**
```json
{
  "listing": {
    "id": "...",
    "status": "published",
    "published_at": "...",
    ...
  }
}
```

### POST /api/applications/update-status

Updates application status (Agent-only). Ensures agent owns the listing.

**Request:**
```bash
curl -X POST https://your-api.vercel.app/api/applications/update-status \
  -H "Authorization: Bearer <supabase_access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "application_id": "application-uuid",
    "status": "approved"
  }'
```

**Response:**
```json
{
  "application": {
    "id": "...",
    "status": "approved",
    ...
  }
}
```

## 🔐 Authentication

All endpoints require authentication via Supabase access token:

1. **Framer** authenticates users with Supabase
2. **Framer** sends requests with `Authorization: Bearer <supabase_access_token>` header
3. **API** validates token server-side using `supabaseClient`
4. **API** extracts user role and enforces permissions

### User Roles

- **buyer**: Can view listings and submit applications
- **agent**: Can create listings and manage applications
- **admin**: Can approve listings and manage all content

## 🗄️ Supabase Database Schema

### Required Tables

**users**
```sql
- id (uuid, primary key)
- email (text)
- role (text: 'buyer' | 'agent' | 'admin')
- created_at (timestamp)
- updated_at (timestamp)
```

**listings**
```sql
- id (uuid, primary key)
- agent_id (uuid, foreign key -> users.id)
- title (text)
- description (text)
- price (numeric)
- location (text)
- status (text: 'pending_review' | 'published' | 'archived')
- images (text[])
- created_at (timestamp)
- updated_at (timestamp)
- published_at (timestamp, nullable)
```

**applications**
```sql
- id (uuid, primary key)
- listing_id (uuid, foreign key -> listings.id)
- buyer_id (uuid, foreign key -> users.id)
- agent_id (uuid, foreign key -> users.id)
- status (text: 'pending' | 'approved' | 'rejected')
- message (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

**subscriptions**
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key -> users.id)
- status (text: 'active' | 'canceled' | 'past_due')
- stripe_subscription_id (text)
- created_at (timestamp)
- updated_at (timestamp)
```

## 🚢 Deployment

### Vercel

**Quick Deploy:**
1. Push code to GitHub
2. Import project in Vercel Dashboard
3. Add environment variables in Vercel dashboard
4. Deploy

**Detailed Instructions:**
See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for complete deployment guide.

**Environment Variables Required:**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_AGENT_MONTHLY_PRICE_ID`
- `STRIPE_AGENT_YEARLY_PRICE_ID`
- `STRIPE_BUYER_MONTHLY_PRICE_ID`
- `STRIPE_BUYER_YEARLY_PRICE_ID`
- `NEXT_PUBLIC_APP_URL` (set to your Vercel URL after first deploy)

**Configuration:**
- Project is configured with `output: 'standalone'` for optimal Vercel deployment
- All API routes use Node.js runtime (required for Supabase/Stripe)
- CORS headers configured in `next.config.js`
- Function timeout set to 30 seconds in `vercel.json`

## 🔒 Security Notes

- **Never expose** `SUPABASE_SERVICE_ROLE_KEY` to Framer
- All sensitive operations run server-side
- Supabase RLS policies remain enforced
- API adds additional validation layer
- All routes use Node.js runtime (not Edge)

## 📧 Email Confirmation & Customization

### Email Confirmation Setup

The API supports email confirmation for new user signups. When email confirmation is enabled in Supabase, users receive an email with a confirmation link.

**Custom Confirmation Page:**
- Location: `app/confirm-email/page.tsx`
- Automatically confirms email when user clicks link
- Fully customizable to match your Framer design

**Custom Password Reset Page:**
- Location: `app/reset-password/page.tsx`
- Allows users to set new password
- Fully customizable styling

### Configure Supabase Redirect URLs

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Add these redirect URLs:
   - `http://localhost:3000/confirm-email` (development)
   - `http://localhost:3000/reset-password` (development)
   - `https://your-app.vercel.app/confirm-email` (production)
   - `https://your-app.vercel.app/reset-password` (production)

### Customize Email Templates

1. Go to **Authentication** → **Email Templates** in Supabase
2. Customize:
   - **Confirm signup** template
   - **Reset password** template
3. Use variables: `{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .SiteURL }}`

### Customize Confirmation Pages

**Email Confirmation Page (`app/confirm-email/page.tsx`):**
- Update colors, fonts, and styling to match your brand
- Add your logo
- Modify success/error messages
- Change redirect destinations

**Password Reset Page (`app/reset-password/page.tsx`):**
- Customize form styling
- Update button colors
- Add branding elements

### Enable/Disable Email Confirmation

**For Development (Faster Testing):**
1. Go to **Authentication** → **Settings**
2. Find **"Confirm email"** toggle
3. Turn it **OFF**
4. Users will be signed in immediately after signup

**For Production (Recommended):**
1. Keep **"Confirm email"** toggle **ON**
2. Users must confirm email before accessing the app
3. Provides better security

### Email Confirmation Flow

1. User signs up → Account created
2. If email confirmation enabled:
   - User receives confirmation email
   - Response includes `requires_confirmation: true`
   - User clicks link → Redirects to `/confirm-email` page
   - Page confirms email → Redirects to sign in or dashboard
3. If email confirmation disabled:
   - Session created immediately
   - User can access app right away

**See [SUPABASE_EMAIL_CONFIG.md](./SUPABASE_EMAIL_CONFIG.md) for detailed configuration guide.**

## 📝 Notes

- No webhooks configured for Stripe - payment status handled via Supabase
- All API routes use `runtime = 'nodejs'` for full Node.js compatibility
- TypeScript types are provided for all request/response bodies
- Error responses follow consistent format: `{ error: string }`
- Email confirmation pages are fully customizable
- Password reset uses custom pages instead of Supabase default