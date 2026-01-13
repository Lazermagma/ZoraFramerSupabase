# Framer Integration Guide

This document shows how to call each API endpoint from your Framer website.

## Authentication

All requests from Framer must include the Supabase access token in the Authorization header:

```
Authorization: Bearer <supabase_access_token>
```

Get the access token from your Supabase auth session in Framer.

## API Endpoints

### 1. Stripe Checkout

**Endpoint:** `POST /api/stripe/checkout`

**Framer Code (Custom Code):**
```javascript
export async function createCheckoutSession(planType, userRole) {
  const response = await fetch('https://your-api.vercel.app/api/stripe/checkout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      plan_type: planType, // 'agent_monthly', 'agent_yearly', 'buyer_monthly', 'buyer_yearly'
      user_role: userRole, // 'buyer' or 'agent'
    }),
  });

  const data = await response.json();
  
  if (response.ok) {
    // Redirect to checkout URL
    window.location.href = data.checkout_url;
  } else {
    console.error('Error:', data.error);
  }
}
```

### 2. Create Listing

**Endpoint:** `POST /api/listings/create`

**Framer Code:**
```javascript
export async function createListing(listingData) {
  const response = await fetch('https://your-api.vercel.app/api/listings/create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: listingData.title,
      description: listingData.description,
      price: listingData.price,
      location: listingData.location,
      images: listingData.images || [],
    }),
  });

  const data = await response.json();
  
  if (response.ok) {
    return data.listing;
  } else {
    throw new Error(data.error);
  }
}
```

### 3. Approve Listing

**Endpoint:** `POST /api/listings/approve`

**Framer Code:**
```javascript
export async function approveListing(listingId) {
  const response = await fetch('https://your-api.vercel.app/api/listings/approve', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      listing_id: listingId,
    }),
  });

  const data = await response.json();
  
  if (response.ok) {
    return data.listing;
  } else {
    throw new Error(data.error);
  }
}
```

### 4. Update Application Status

**Endpoint:** `POST /api/applications/update-status`

**Framer Code:**
```javascript
export async function updateApplicationStatus(applicationId, status) {
  const response = await fetch('https://your-api.vercel.app/api/applications/update-status', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      application_id: applicationId,
      status: status, // 'approved' or 'rejected'
    }),
  });

  const data = await response.json();
  
  if (response.ok) {
    return data.application;
  } else {
    throw new Error(data.error);
  }
}
```

## Error Handling

All endpoints return errors in this format:
```json
{
  "error": "Error message here"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created (for listing creation)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Testing

You can test endpoints using curl:

```bash
# Health check
curl https://your-api.vercel.app/api

# Create listing (replace TOKEN with actual token)
curl -X POST https://your-api.vercel.app/api/listings/create \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","description":"Test","price":100000,"location":"Test"}'
```
