# Quick Fix: Netlify Secret Scanning Error for NEXT_PUBLIC_APP_URL

## The Problem

Netlify's secret scanner is flagging `NEXT_PUBLIC_APP_URL` as a potential secret. **This is a FALSE POSITIVE** - it's a public variable, not a secret.

## The Solution

You need to configure Netlify to ignore this variable. Here's how:

### Step 1: Go to Netlify Dashboard

1. Log in to https://app.netlify.com
2. Select your site
3. Go to **Site settings** → **Build & deploy** → **Environment variables**

### Step 2: Add Environment Variable to Ignore Secret Scanning

Add a new environment variable:

- **Key:** `SECRETS_SCAN_OMIT_KEYS`
- **Value:** `NEXT_PUBLIC_APP_URL`
- **Scopes:** Select all (Production, Deploy previews, Branch deploys)

Click **Save**.

### Step 3: Redeploy

1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**
3. The build should now pass without secret scanning errors

## Alternative: Don't Set NEXT_PUBLIC_APP_URL

If you don't want to configure secret scanning, you can:

1. **Don't set `NEXT_PUBLIC_APP_URL` in Netlify environment variables**
2. The code will auto-detect the URL from request headers
3. This works automatically on Netlify
4. No secret scanning issues

## Why This Works

- `NEXT_PUBLIC_APP_URL` is a **public** environment variable (safe to expose)
- The `NEXT_PUBLIC_` prefix in Next.js means it's designed to be client-accessible
- It's just a URL, not a secret key
- By telling Netlify to ignore it, we prevent false positives

## Verification

After adding `SECRETS_SCAN_OMIT_KEYS`, your next deployment should:
- ✅ Build successfully
- ✅ Pass secret scanning
- ✅ Deploy without errors

## Still Having Issues?

If Netlify still flags it after adding `SECRETS_SCAN_OMIT_KEYS`:

1. **Check the variable name is exact:** `SECRETS_SCAN_OMIT_KEYS` (case-sensitive)
2. **Verify it's set for all scopes:** Production, Deploy previews, Branch deploys
3. **Try disabling secret scanning entirely** (not recommended):
   - Add environment variable: `SECRETS_SCAN_ENABLED` = `false`

## Summary

**Quick Fix:**
1. Netlify Dashboard → Site settings → Environment variables
2. Add: `SECRETS_SCAN_OMIT_KEYS` = `NEXT_PUBLIC_APP_URL`
3. Redeploy

That's it! The build should now pass.
