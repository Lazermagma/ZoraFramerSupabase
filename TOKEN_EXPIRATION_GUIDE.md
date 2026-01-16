# Token Expiration Guide

## Why Tokens Expire

Supabase access tokens expire after **1 hour** by default. This is a security feature to limit the window of exposure if a token is compromised.

## The Problem

When an access token expires, API calls will return:
```json
{
  "error": "Invalid or expired token"
}
```

## The Solution

Use the **refresh token** to get a new access token before it expires.

## How It Works

1. **Access Token**: Short-lived (1 hour), used for API authentication
2. **Refresh Token**: Long-lived, used to get new access tokens
3. **Expires At**: Timestamp when the access token expires

## Implementation

### 1. Store Both Tokens

When signing in, store both tokens:
```javascript
const sessionData = {
  token: data.session.access_token,
  refresh_token: data.session.refresh_token,  // IMPORTANT!
  expires_at: data.session.expires_at,
  user: data.user
}
localStorage.setItem('auth_session', JSON.stringify(sessionData))
```

### 2. Check Token Expiration

Before making API calls, check if the token is expired:
```javascript
function isTokenExpired(expiresAt) {
  if (!expiresAt) return false
  
  // Convert to milliseconds if in seconds
  const expiresAtMs = expiresAt < 10000000000 ? expiresAt * 1000 : expiresAt
  
  // Check if expired or expires within 5 minutes (refresh early)
  const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000)
  return Date.now() >= expiresAtMs || expiresAtMs <= fiveMinutesFromNow
}
```

### 3. Refresh Token Automatically

When the token is expired or about to expire, refresh it:
```javascript
async function refreshAccessToken(refreshToken) {
  const response = await fetch('https://your-api.vercel.app/api/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })

  if (!response.ok) {
    throw new Error('Failed to refresh token')
  }

  const data = await response.json()
  return data.session
}

// Usage
const sessionData = JSON.parse(localStorage.getItem('auth_session'))

if (isTokenExpired(sessionData.expires_at)) {
  const newSession = await refreshAccessToken(sessionData.refresh_token)
  
  // Update stored session
  sessionData.token = newSession.access_token
  sessionData.refresh_token = newSession.refresh_token
  sessionData.expires_at = newSession.expires_at
  
  localStorage.setItem('auth_session', JSON.stringify(sessionData))
}
```

### 4. Automatic Refresh on API Calls

Create a wrapper function that automatically refreshes tokens:
```javascript
async function authenticatedFetch(url, options = {}) {
  let sessionData = JSON.parse(localStorage.getItem('auth_session'))
  
  // Check if token needs refresh
  if (isTokenExpired(sessionData.expires_at)) {
    const newSession = await refreshAccessToken(sessionData.refresh_token)
    sessionData.token = newSession.access_token
    sessionData.refresh_token = newSession.refresh_token
    sessionData.expires_at = newSession.expires_at
    localStorage.setItem('auth_session', JSON.stringify(sessionData))
  }
  
  // Make the API call with current token
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${sessionData.token}`,
    },
  })
  
  // If token expired during the call, refresh and retry once
  if (response.status === 401) {
    const newSession = await refreshAccessToken(sessionData.refresh_token)
    sessionData.token = newSession.access_token
    sessionData.refresh_token = newSession.refresh_token
    sessionData.expires_at = newSession.expires_at
    localStorage.setItem('auth_session', JSON.stringify(sessionData))
    
    // Retry the request
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${sessionData.token}`,
      },
    })
  }
  
  return response
}
```

## Best Practices

1. **Refresh Proactively**: Refresh tokens 5 minutes before they expire
2. **Store Refresh Token**: Always store the refresh token securely
3. **Handle Refresh Failures**: If refresh fails, redirect to login
4. **Periodic Checks**: Check token expiration every 10 minutes
5. **Retry Logic**: Retry failed requests once after refreshing

## Supabase Configuration

You can configure token expiration in Supabase Dashboard:
1. Go to **Authentication** → **Settings**
2. Adjust **JWT expiry time** (default: 3600 seconds = 1 hour)
3. Note: Shorter times = more secure but require more frequent refreshes

## Troubleshooting

### "Invalid or expired token" immediately after login

- Check if `expires_at` is being stored correctly
- Verify the token format (should be a JWT string)
- Check server time sync

### Refresh token also expires

- Refresh tokens can expire if not used for 30 days (Supabase default)
- User will need to sign in again
- Consider implementing "remember me" functionality

### Token expires too quickly

- Check Supabase JWT expiry settings
- Verify `expires_at` timestamp format (seconds vs milliseconds)
- Ensure timezone is correct

## Example: Complete Token Management

```javascript
class TokenManager {
  constructor(storageKey = 'auth_session') {
    this.storageKey = storageKey
  }

  getSession() {
    const stored = localStorage.getItem(this.storageKey)
    return stored ? JSON.parse(stored) : null
  }

  setSession(session) {
    localStorage.setItem(this.storageKey, JSON.stringify(session))
  }

  isTokenExpired(expiresAt) {
    if (!expiresAt) return false
    const expiresAtMs = expiresAt < 10000000000 ? expiresAt * 1000 : expiresAt
    const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000)
    return Date.now() >= expiresAtMs || expiresAtMs <= fiveMinutesFromNow
  }

  async refreshToken() {
    const session = this.getSession()
    if (!session?.refresh_token) {
      throw new Error('No refresh token available')
    }

    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    })

    if (!response.ok) {
      throw new Error('Failed to refresh token')
    }

    const data = await response.json()
    const updatedSession = {
      ...session,
      token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    }

    this.setSession(updatedSession)
    return updatedSession
  }

  async ensureValidToken() {
    const session = this.getSession()
    if (!session) return null

    if (this.isTokenExpired(session.expires_at)) {
      return await this.refreshToken()
    }

    return session
  }

  async authenticatedFetch(url, options = {}) {
    const session = await this.ensureValidToken()
    if (!session) {
      throw new Error('No valid session')
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${session.token}`,
      },
    })

    // If 401, try refreshing once more
    if (response.status === 401) {
      const refreshed = await this.refreshToken()
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${refreshed.token}`,
        },
      })
    }

    return response
  }
}

// Usage
const tokenManager = new TokenManager()

// Make authenticated API call
const response = await tokenManager.authenticatedFetch('/api/user/profile')
```
