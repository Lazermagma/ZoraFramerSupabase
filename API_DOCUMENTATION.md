# Complete API Documentation

This document provides comprehensive documentation for all API endpoints in the Framer-Supabase backend.

## Base URL

- **Development**: `http://localhost:3000`
- **Production**: `https://your-api.vercel.app`

## Authentication

All protected endpoints require an `Authorization` header:

```
Authorization: Bearer <supabase_access_token>
```

Get the access token from Supabase auth session in Framer.

---

## Authentication Endpoints

### POST /api/auth/signup

Creates a new user account with role selection.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "buyer" | "agent",
  "first_name": "John",      // optional
  "last_name": "Doe",        // optional
  "name": "John Doe",        // optional (deprecated, kept for backward compatibility)
  "phone": "+1234567890",    // optional
  "parish": "Kingston"       // optional
}
```

**Response (201):**
```json
{
  "user": {
    "id": "...",
    "email": "user@example.com",
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

---

### POST /api/auth/signin

Signs in an existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "user": { ... },
  "session": { ... }
}
```

---

### POST /api/auth/forgot-password

Sends password reset email via Supabase.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "If an account exists with this email, a password reset link has been sent."
}
```

---

### POST /api/auth/reset-password

Resets password using token from email.

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "new_password": "newpassword123"
}
```

**Response (200):**
```json
{
  "message": "Password reset successfully"
}
```

---

### POST /api/auth/update-password

Updates password for logged-in user.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "current_password": "oldpassword",
  "new_password": "newpassword123"
}
```

**Response (200):**
```json
{
  "message": "Password updated successfully"
}
```

---

## User Management Endpoints

### GET /api/user/profile

Gets current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "user": {
    "id": "...",
    "email": "...",
    "first_name": "...",
    "last_name": "...",
    "name": "...",
    "phone": "...",
    "parish": "...",
    "role": "buyer" | "agent" | "admin",
    "account_status": "active" | "inactive"
  }
}
```

---

### PUT /api/user/profile

Updates user profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "first_name": "John",      // optional
  "last_name": "Doe",        // optional
  "name": "New Name",        // optional (deprecated, kept for backward compatibility)
  "phone": "+1234567890",    // optional
  "parish": "New Parish"     // optional
}
```

**Response (200):**
```json
{
  "user": { ... }
}
```

---

### PUT /api/user/email

Updates user email.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "new_email": "newemail@example.com"
}
```

**Response (200):**
```json
{
  "message": "Email updated successfully",
  "user": { ... }
}
```

---

### GET /api/user/account-status

Gets account status.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "account_status": "active" | "inactive",
  "role": "buyer" | "agent" | "admin"
}
```

---

## Dashboard Endpoints

### GET /api/dashboard/buyer

Gets buyer dashboard data.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "applications": [
    {
      "id": "...",
      "listing_id": "...",
      "status": "submitted" | "viewed" | "under_review" | "accepted" | "rejected",
      "listing": { ... }
    }
  ],
  "analytics": {
    "total_applications": 10,
    "submitted_applications": 5,
    "accepted_applications": 3,
    "rejected_applications": 2
  }
}
```

---

### GET /api/dashboard/agent

Gets agent dashboard data.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "listings": [ ... ],
  "applications": [
    {
      "id": "...",
      "buyer": { "id": "...", "name": "...", "email": "...", "phone": "..." },
      "listing": { ... }
    }
  ],
  "analytics": {
    "total_listings": 10,
    "pending_listings": 2,
    "approved_listings": 8,
    "total_applications": 25,
    "pending_applications": 5,
    "accepted_applications": 15
  }
}
```

---

## Listing Endpoints

### POST /api/listings/create

Creates a new listing (Agent-only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Property Title",
  "description": "Property description",
  "price": 500000,
  "location": "123 Main St, City, State",
  "images": ["https://..."],      // optional
  "documents": ["https://..."],   // optional
  "status": "draft" | "pending_review"  // optional, defaults to "draft"
}
```

**Response (201):**
```json
{
  "listing": {
    "id": "...",
    "agent_id": "...",
    "status": "draft" | "pending_review",
    ...
  }
}
```

---

### PUT /api/listings/update

Updates an existing listing (Agent-only, must own listing).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "listing_id": "...",
  "title": "...",           // optional
  "description": "...",      // optional
  "price": 500000,          // optional
  "location": "...",        // optional
  "images": [...],          // optional
  "documents": [...],       // optional
  "status": "draft" | "pending_review" | "approved" | "rejected" | "archived"  // optional
}
```

**Response (200):**
```json
{
  "listing": { ... }
}
```

---

### POST /api/listings/approve

Approves and publishes a listing (Admin-only). Verifies agent has active subscription.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "listing_id": "..."
}
```

**Response (200):**
```json
{
  "listing": {
    "id": "...",
    "status": "approved",
    "published_at": "...",
    ...
  }
}
```

---

### POST /api/listings/reject

Rejects a listing (Admin-only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "listing_id": "...",
  "rejection_reason": "..."  // optional
}
```

**Response (200):**
```json
{
  "listing": { ... },
  "message": "Listing rejected successfully"
}
```

---

### GET /api/listings/browse

Gets all approved and visible listings (Public endpoint, no auth required).

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `location` (optional): Filter by location
- `min_price` (optional): Minimum price filter
- `max_price` (optional): Maximum price filter

**Response (200):**
```json
{
  "listings": [ ... ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

---

## Application Endpoints

### POST /api/applications/create

Creates a new application (Buyer-only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "listing_id": "...",
  "message": "I'm interested...",  // optional
  "documents": ["https://..."]      // optional
}
```

**Response (201):**
```json
{
  "application": {
    "id": "...",
    "listing_id": "...",
    "buyer_id": "...",
    "status": "submitted",
    ...
  }
}
```

---

### POST /api/applications/update-status

Updates application status (Agent-only). Ensures agent owns the listing.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "application_id": "...",
  "status": "submitted" | "viewed" | "under_review" | "accepted" | "rejected"
}
```

**Response (200):**
```json
{
  "application": { ... }
}
```

---

## Payment Endpoints

### POST /api/stripe/checkout

Creates a Stripe Checkout session for subscription plans.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "plan_type": "agent_monthly" | "agent_yearly" | "buyer_monthly" | "buyer_yearly",
  "user_role": "buyer" | "agent"
}
```

**Response (200):**
```json
{
  "checkout_url": "https://checkout.stripe.com/...",
  "session_id": "cs_..."
}
```

---

### POST /api/stripe/payment-success

Handles successful payment and unlocks features.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "session_id": "cs_..."
}
```

**Response (200):**
```json
{
  "message": "Payment successful",
  "subscription": {
    "id": "...",
    "status": "active",
    ...
  }
}
```

---

## Analytics Endpoints

### GET /api/analytics

Gets analytics data for the authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response (200) - Agent:**
```json
{
  "total_listings": 10,
  "pending_listings": 2,
  "approved_listings": 8,
  "total_applications": 25,
  "pending_applications": 5,
  "accepted_applications": 15
}
```

**Response (200) - Buyer:**
```json
{
  "total_applications": 5,
  "submitted_applications": 2,
  "accepted_applications": 2,
  "rejected_applications": 1
}
```

---

## WhatsApp Endpoints

### POST /api/whatsapp/generate-link

Generates a WhatsApp link for messaging.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "phone_number": "+1234567890",
  "message": "Optional pre-filled message"
}
```

**Response (200):**
```json
{
  "whatsapp_url": "https://wa.me/1234567890?text=..."
}
```

---

## Storage Endpoints

### POST /api/storage/upload

Uploads documents/files to Supabase Storage.

**Headers:** `Authorization: Bearer <token>`

**Request Body:** FormData
- `file`: File to upload
- `folder`: Folder name (optional, default: "uploads")

**Response (200):**
```json
{
  "url": "https://...",
  "path": "folder/filename"
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message here"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Security Notes

1. **Row-Level Security (RLS)**: Supabase RLS policies remain enforced. The API adds an additional validation layer.

2. **Service Role Key**: Never exposed to Framer. Only used server-side for admin operations.

3. **Token Validation**: All protected endpoints validate the Supabase access token server-side.

4. **Role-Based Access**: Endpoints enforce role-based permissions (buyer, agent, admin).

5. **Data Ownership**: Users can only access their own data or data they have permission to view.

---

## Database Schema Requirements

Ensure your Supabase database has the following tables:

- `users` (id, email, role, first_name, last_name, name, phone, parish, account_status, created_at, updated_at)
- `listings` (id, agent_id, title, description, price, location, status, images, documents, views, created_at, updated_at, published_at, expires_at)
- `applications` (id, listing_id, buyer_id, agent_id, status, message, documents, created_at, updated_at, viewed_at)
- `subscriptions` (id, user_id, status, stripe_subscription_id, stripe_customer_id, plan_type, created_at, updated_at, expires_at)

Make sure to set up proper Row-Level Security (RLS) policies in Supabase.
