# Fixing Netlify Secret Scanning for NEXT_PUBLIC_APP_URL

## Issue

Netlify's secret scanner flags `NEXT_PUBLIC_APP_URL` as a potential secret. **This is a FALSE POSITIVE.**

## Why It's Not a Secret

- `NEXT_PUBLIC_APP_URL` is a **public** environment variable
- The `NEXT_PUBLIC_` prefix in Next.js means it's **safe to expose** to client-side code
- It's just a URL (like `https://your-site.netlify.app`), not a secret key
- It's already designed to be public and accessible in the browser

## Solutions Implemented

### 1. Auto-Detection from Request Headers

The code now automatically detects the app URL from request headers if `NEXT_PUBLIC_APP_URL` is not set:

```typescript
let appUrl = process.env.NEXT_PUBLIC_APP_URL;
if (!appUrl) {
  const host = request.headers.get('host');
  const origin = request.headers.get('origin');
  appUrl = origin || (host ? `https://${host}` : 'http://localhost:3000');
}
```

**Benefits:**
- Works automatically on Netlify (uses the deployment URL)
- No need to set the variable if you don't want to
- Avoids secret scanning false positives

### 2. Documentation Excluded from Build

- `.netlifyignore` excludes all documentation files
- Prevents secret scanner from scanning example values in docs

### 3. Netlify Configuration

If Netlify still flags it, you have these options:

**Option A: Set the Variable in Netlify Dashboard**
1. Go to Site settings → Environment variables
2. Add `NEXT_PUBLIC_APP_URL` with your Netlify URL
3. Netlify will recognize it as a public variable

**Option B: Let Auto-Detection Work**
- Don't set `NEXT_PUBLIC_APP_URL` at all
- The code will auto-detect from request headers
- Works automatically on Netlify

**Option C: Disable Secret Scanning for This Variable**
1. Go to Netlify Dashboard → Site settings → Build & deploy
2. Under "Build settings" → "Secret scanning"
3. Add `NEXT_PUBLIC_APP_URL` to allowed/ignored variables

## Recommended Approach

**For Netlify Deployment:**

1. **Don't set `NEXT_PUBLIC_APP_URL` initially** - let auto-detection work
2. If you need a specific URL, set it in Netlify environment variables
3. The code will use the environment variable if set, otherwise auto-detect

This approach:
- ✅ Avoids secret scanning false positives
- ✅ Works automatically
- ✅ Still allows manual override if needed

## Verification

After deployment, verify the URL is detected correctly:

```bash
curl https://your-site.netlify.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","role":"buyer"}'
```

The email confirmation link should use the correct Netlify URL automatically.
