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

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

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

### 3. Run Development Server

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

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

The project is configured with `output: 'standalone'` for optimal Vercel deployment.

## 🔒 Security Notes

- **Never expose** `SUPABASE_SERVICE_ROLE_KEY` to Framer
- All sensitive operations run server-side
- Supabase RLS policies remain enforced
- API adds additional validation layer
- All routes use Node.js runtime (not Edge)

## 📝 Notes

- No webhooks configured for Stripe - payment status handled via Supabase
- All API routes use `runtime = 'nodejs'` for full Node.js compatibility
- TypeScript types are provided for all request/response bodies
- Error responses follow consistent format: `{ error: string }`
