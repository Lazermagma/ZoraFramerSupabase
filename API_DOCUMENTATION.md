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

**Important Notes:**
- **Access tokens expire after 1 hour** (Supabase default)
- **Refresh tokens are long-lived** and should be stored securely
- When an access token expires, use `/api/auth/refresh` with the refresh token to get a new access token
- Always check token expiration before making API calls and refresh proactively

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
  "first_name": "John",           // optional
  "last_name": "Doe",             // optional
  "name": "John Doe",             // optional (deprecated, kept for backward compatibility)
  "phone": "+1234567890",         // optional
  "country_of_residence": "Jamaica",  // optional
  "parish": "Kingston"            // optional
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

### POST /api/auth/refresh

Refreshes an expired access token using a refresh token.

**Request Body:**
```json
{
  "refresh_token": "refresh_token_from_session"
}
```

**Response (200):**
```json
{
  "session": {
    "access_token": "new_access_token",
    "refresh_token": "new_refresh_token",
    "expires_at": 1234567890
  }
}
```

**Error Responses:**
- `400` - Missing refresh_token
- `401` - Invalid or expired refresh token

**Note:** Access tokens expire after 1 hour. Use this endpoint to get a new access token before it expires. The refresh token is long-lived and should be stored securely.

---

### POST /api/auth/update-password

Updates password for logged-in user.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "email": "user@example.com",
  "new_password": "newpassword123",
  "confirm_password": "newpassword123",
  "current_password": "oldpassword"  // Optional, but recommended for security
}
```

**Validation:**
- `email` must match the logged-in user's email
- `new_password` and `confirm_password` must match
- `new_password` must be at least 6 characters
- `current_password` is optional but recommended for additional security

**Response (200):**
```json
{
  "message": "Password updated successfully"
}
```

**Error Responses:**
- `400` - Email mismatch, passwords don't match, or password too short
- `401` - Unauthorized or current password incorrect (if provided)
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
  "first_name": "John",           // optional
  "last_name": "Doe",             // optional
  "name": "New Name",             // optional (deprecated, kept for backward compatibility)
  "phone": "+1234567890",         // optional
  "country_of_residence": "Jamaica",  // optional
  "parish": "New Parish"          // optional
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

Gets buyer dashboard data including overview cards, recent activity, and analytics.

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
    "role": "buyer",
    "account_status": "active"
  },
  "subscription": {
    "id": "...",
    "status": "active",
    "plan_type": "...",
    "expires_at": "..."
  } | null,
  "overview": {
    "active_applications": 3,
    "properties_viewed": 12,
    "saved_searches": 5
  },
  "applications": [
    {
      "id": "...",
      "listing_id": "...",
      "application_id": "...",
      "agent_id": "...",
      "property_name": "Sunset Villa, Los Angeles",
      "property_type": "Buy" | "Rent" | null,
      "agent_name": "Sarah Johnson",
      "status": "submitted" | "viewed" | "under_review" | "accepted" | "rejected",
      "display_status": "Submitted" | "Viewed" | "Contacted" | "Accepted" | "Rejected",
      "date_applied": "Jan 5, 2026",
      "created_at": "2026-01-05T10:30:00Z",
      "viewed_at": "...",
      "message": "...",
      "documents": [...],  // Array of document URLs (images, PDFs, or other documents)
      "listing": {
        "id": "...",
        "title": "...",
        "location": "...",
        "property_type": "Buy" | "Rent",
        "price": 500000,
        ...
      },
      "agent": {
        "id": "...",
        "first_name": "...",
        "last_name": "...",
        "name": "...",
        "email": "..."
      }
    }
  ],
  "recent_activity": [
    {
      "type": "agent_contacted" | "application_viewed" | "application_submitted",
      "icon": "envelope" | "eye" | "document",
      "title": "Agent contacted you",
      "description": "Sarah Johnson responded to your Sunset Villa inquiry",
      "timestamp": "2024-01-15T10:30:00Z",
      "relative_time": "2 hours ago",
      "application_id": "..." // optional
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

**Response Fields:**
- `user`: Full user profile with first_name, last_name, etc.
- `subscription`: Active subscription details (null if no active subscription)
- `overview.active_applications`: Count of applications in progress (submitted, viewed, under_review)
- `overview.properties_viewed`: Count of properties viewed in last 30 days
- `overview.saved_searches`: Count of saved searches with active alerts
- `recent_activity`: Chronologically sorted list of recent events (messages, application views, submissions)
- `applications`: Array of formatted application objects with:
  - `property_name`: Formatted as "Title, Location" (e.g., "Sunset Villa, Los Angeles")
  - `property_type`: "Buy" or "Rent" (from listing)
  - `agent_name`: Full name formatted as "First Last"
  - `status`: Original status value (submitted, viewed, under_review, accepted, rejected)
  - `display_status`: Formatted status for UI display (Submitted, Viewed, Contacted, Accepted, Rejected)
  - `date_applied`: Formatted date string (e.g., "Jan 5, 2026")
  - `application_id` and `agent_id`: For messaging actions
  - Full `listing` and `agent` objects included for backward compatibility
- `analytics`: Aggregated statistics about applications

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
  "images": ["https://..."],      // optional array of image URLs
  "documents": ["https://..."],   // optional array of document URLs (PDFs, images, or other documents)
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
  "images": [...],          // optional array of image URLs
  "documents": [...],       // optional array of document URLs (PDFs, images, or other documents)
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

Creates a new application (Buyer-only). Includes all buyer/renter application form fields.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

The API accepts both form field names (from frontend) and direct database field names. Form field names are automatically mapped to database columns.

**Form Field Names (from frontend):**
```json
{
  "listing_id": "...",  // optional - if not provided, a new listing will be auto-created (can also use "property_id" or "property")
  "message": "I'm interested...",  // optional
  "application_type": "Rent" | "Buy",  // optional - determines which budget field to use
  "property_type": "Property Seeker (Buyer/ Renter)",  // optional - metadata only
  // User Profile Fields (will update user profile if provided)
  "first_name": "John",  // optional
  "last_name": "Doe",  // optional
  "email": "user@example.com",  // optional
  "phone": "0123456789",  // optional
  "country": "Jamaica",  // optional - maps to country_of_residence
  "parish": "Kingston",  // optional
  // Financial & Employment Info
  "employment_status": "Employed" | "Full-time" | "Part-time" | "Self-employed" | "Unemployed" | "Student" | "Retired",  // optional
  "monthly_income": "J$160,000-J$200,000",  // optional - maps to monthly_income_range
  "budget_range": "J$90,000–J$150,000",  // optional (for renters when application_type is "Rent")
  "purchase_budget": "J$20M–J$40M",  // optional (for buyers when application_type is "Buy") - maps to purchase_budget_range
  "intended_income": "Immediately" | "Within 1 month" | "1-3 months" | "3-6 months" | "6+ months",  // optional - maps to intended_move_in_timeframe
  // Documents (can be filenames or URLs)
  "government_approved": "background cloud.jpg" | "https://...",  // optional - added to documents array
  "job_letter": "background cloud.jpg" | "https://...",  // optional - added to documents array
  "documents": ["https://..."],  // optional array of document URLs (images, PDFs, or other documents)
  // Declarations (checkboxes)
  "checkbox1": true,  // optional - maps to declaration_application_not_approval
  "checkbox2": true,  // optional - maps to declaration_prepared_to_provide_docs
  "checkbox3": true   // optional - maps to declaration_actively_looking
}
```

**Direct Database Field Names (for backward compatibility):**
```json
{
  "listing_id": "...",
  "message": "...",
  "documents": ["https://..."],
  "employment_status": "...",
  "monthly_income_range": "...",
  "budget_range": "...",
  "purchase_budget_range": "...",
  "intended_move_in_timeframe": "...",
  "declaration_application_not_approval": true,
  "declaration_prepared_to_provide_docs": true,
  "declaration_actively_looking": true
}
```

**Response (201):**
```json
{
  "application": {
    "id": "...",
    "listing_id": "...",
    "buyer_id": "...",
    "agent_id": "...",
    "status": "submitted",
    "message": "...",
    "documents": [...],
    "employment_status": "...",
    "monthly_income_range": "...",
    "budget_range": "...",
    "purchase_budget_range": "...",
    "intended_move_in_timeframe": "...",
    "declaration_application_not_approval": true,
    "declaration_prepared_to_provide_docs": true,
    "declaration_actively_looking": true,
    "created_at": "...",
    "updated_at": "..."
  }
}
```

**Field Mappings:**
- `listing_id` (optional) - Can also use `property_id` or `property` as alternative field names. If not provided, the server will automatically create a new draft listing with:
  - Title: Based on `property_type` or `application_type` if available
  - Description: Uses the `message` field if provided
  - Price: Estimated from `purchase_budget`/`purchase_budget_range` (for Buy) or `budget_range` (for Rent)
  - Location: Uses `parish` or `country` if available
  - Property Type: Uses `application_type` if available
  - Status: Created as "draft" (can be updated later)
  - Agent: If user is an agent, uses their ID; otherwise assigns to first available agent
- `country` → `users.country_of_residence` (updates user profile)
- `monthly_income` → `applications.monthly_income_range`
- `purchase_budget` → `applications.purchase_budget_range`
- `intended_income` → `applications.intended_move_in_timeframe`
- `government_approved` → Added to `applications.documents` array
- `job_letter` → Added to `applications.documents` array
- `checkbox1` → `applications.declaration_application_not_approval`
- `checkbox2` → `applications.declaration_prepared_to_provide_docs`
- `checkbox3` → `applications.declaration_actively_looking`

**Postman Testing Example:**
```json
POST https://your-api.vercel.app/api/applications/create
Headers:
  Authorization: Bearer <your_access_token>
  Content-Type: application/json

Body (raw JSON):
{
  "listing_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "message": "I'm interested in this property",
  "application_type": "Rent",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "0123456789",
  "country": "Jamaica",
  "parish": "Kingston",
  "employment_status": "Employed",
  "monthly_income": "J$160,000-J$200,000",
  "budget_range": "J$90,000–J$150,000",
  "intended_income": "Immediately",
  "government_approved": "background cloud.jpg",
  "job_letter": "background cloud.jpg",
  "checkbox1": true,
  "checkbox2": true,
  "checkbox3": true
}
```

**Notes:** 
- `listing_id` is **optional**. If not provided, the server will automatically create a new draft listing. You can also use `property_id` or `property` as alternative field names.
- When auto-creating a listing, the system will:
  - Use the authenticated user's ID as agent if they are an agent
  - Otherwise, assign the listing to the first available agent in the system
  - Create the listing with "draft" status (can be updated/approved later)
  - Estimate the price from budget fields if available
- All financial, employment, and declaration fields are optional. The form can be submitted with just `listing_id` and `message` if needed.
- `documents` field accepts URLs to uploaded files. Supported file types: images (JPG, PNG, etc.), PDFs, and other document formats. Files should be uploaded to Supabase Storage first, then the URLs should be included in the application.
- User profile fields (`first_name`, `last_name`, `phone`, `country`, `parish`) will automatically update the user's profile if provided.
- If `application_type` is "Buy", `purchase_budget` is used and `budget_range` is ignored. If "Rent", `budget_range` is used and `purchase_budget` is ignored.
- If you get "Missing required field: listing_id" error, check that you're sending the field in the request body. The error response will show which fields were received to help debug.

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

## Property Views Endpoints

### POST /api/listings/track-view

Tracks when a buyer views a property listing.

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
  "message": "View tracked successfully"
}
```

---

## Saved Searches Endpoints

### GET /api/saved-searches

Gets all saved searches for the authenticated buyer.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "saved_searches": [
    {
      "id": "...",
      "buyer_id": "...",
      "name": "Downtown Apartments",
      "search_criteria": {
        "location": "Downtown",
        "min_price": 100000,
        "max_price": 500000
      },
      "alerts_enabled": true,
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

---

### POST /api/saved-searches

Creates a new saved search.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Downtown Apartments",
  "search_criteria": {
    "location": "Downtown",
    "min_price": 100000,
    "max_price": 500000
  },
  "alerts_enabled": true
}
```

**Response (201):**
```json
{
  "saved_search": { ... }
}
```

---

### PUT /api/saved-searches

Updates an existing saved search.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "id": "...",
  "name": "Updated Name",           // optional
  "search_criteria": { ... },       // optional
  "alerts_enabled": true            // optional
}
```

**Response (200):**
```json
{
  "saved_search": { ... }
}
```

---

### DELETE /api/saved-searches

Deletes a saved search.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `id`: Saved search ID to delete

**Response (200):**
```json
{
  "message": "Saved search deleted successfully"
}
```

---

## Messages Endpoints

### GET /api/messages

Gets messages for the authenticated user (buyer or agent).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `listing_id` (optional): Filter messages by listing
- `application_id` (optional): Filter messages by application

**Response (200):**
```json
{
  "messages": [
    {
      "id": "...",
      "buyer_id": "...",
      "agent_id": "...",
      "listing_id": "...",
      "application_id": "...",
      "message": "Hello, I'm interested...",
      "sender_role": "buyer" | "agent",
      "read": false,
      "created_at": "...",
      "buyer": { "id": "...", "first_name": "...", "last_name": "...", "name": "...", "email": "..." },
      "agent": { "id": "...", "first_name": "...", "last_name": "...", "name": "...", "email": "..." },
      "listing": { "id": "...", "title": "...", "location": "..." },
      "application": { "id": "...", "status": "..." }
    }
  ]
}
```

---

### POST /api/messages

Sends a new message between buyer and agent.

**Headers:** `Authorization: Bearer <token>`

**Request Body (Buyer sending to Agent):**
```json
{
  "agent_id": "...",
  "listing_id": "...",        // optional
  "application_id": "...",    // optional
  "message": "Hello, I'm interested in this property..."
}
```

**Request Body (Agent sending to Buyer):**
```json
{
  "buyer_id": "...",
  "listing_id": "...",        // optional
  "application_id": "...",    // optional
  "message": "Thank you for your interest..."
}
```

**Response (201):**
```json
{
  "message": {
    "id": "...",
    "buyer_id": "...",
    "agent_id": "...",
    "message": "...",
    "sender_role": "buyer" | "agent",
    "created_at": "...",
    ...
  }
}
```

---

## Storage Endpoints

### POST /api/storage/upload

Uploads documents/files to Supabase Storage. Supports images (JPG, PNG, GIF, etc.), PDFs, and other document formats.

**Headers:** `Authorization: Bearer <token>`

**Request Body:** FormData
- `file`: File to upload (images, PDFs, or documents)
- `folder`: Folder name (optional, default: "uploads")

**Response (200):**
```json
{
  "url": "https://...",
  "path": "folder/filename"
}
```

**Note:** After uploading, use the returned `url` in the `documents` array when creating applications or listings.

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
- `property_views` (id, buyer_id, listing_id, viewed_at) - Tracks property views by buyers
- `saved_searches` (id, buyer_id, name, search_criteria, alerts_enabled, created_at, updated_at) - Stores buyer's saved search criteria
- `messages` (id, buyer_id, agent_id, listing_id, application_id, message, sender_role, read, created_at) - Tracks communications between buyers and agents

Make sure to set up proper Row-Level Security (RLS) policies in Supabase.
