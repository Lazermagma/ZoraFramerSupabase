# Netlify Deployment Guide

This guide will help you deploy your Framer-Supabase API backend to Netlify.

## Prerequisites

- GitHub repository with your code
- Netlify account (sign up at https://netlify.com)
- Supabase project set up
- Stripe account (if using payments)

## Step 1: Prepare Your Repository

1. **Ensure all code is pushed to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for Netlify deployment"
   git push origin main
   ```

2. **Verify your project structure:**
   - `package.json` exists
   - `next.config.js` is configured
   - `netlify.toml` is present
   - All API routes are in `app/api/`
   - No hardcoded secrets in code files

## Step 2: Deploy to Netlify

### Option A: Deploy via Netlify Dashboard (Recommended)

1. **Go to Netlify Dashboard:**
   - Visit https://app.netlify.com
   - Sign in or create an account

2. **Import Your Project:**
   - Click **"Add new site"** → **"Import an existing project"**
   - Connect to GitHub
   - Select your repository: `ZoraFramerSupabase`

3. **Configure Build Settings:**
   - **Build command:** `npm run build` (or `npm run netlify-build`)
   - **Publish directory:** `.next` (or leave default)
   - **Base directory:** `./` (root)

4. **Add Environment Variables:**
   Click **"Show advanced"** → **"New variable"** and add:

   ```
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_AGENT_MONTHLY_PRICE_ID=price_xxx
   STRIPE_AGENT_YEARLY_PRICE_ID=price_xxx
   STRIPE_BUYER_MONTHLY_PRICE_ID=price_xxx
   STRIPE_BUYER_YEARLY_PRICE_ID=price_xxx
   NEXT_PUBLIC_APP_URL=https://your-site.netlify.app
   ```

   **Important:**
   - Add these for **Production**, **Deploy previews**, and **Branch deploys**
   - Replace `NEXT_PUBLIC_APP_URL` with your actual Netlify URL after first deploy

5. **Deploy:**
   - Click **"Deploy site"**
   - Wait for build to complete (usually 3-5 minutes)

### Option B: Deploy via Netlify CLI

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify:**
   ```bash
   netlify login
   ```

3. **Initialize Site:**
   ```bash
   netlify init
   ```

4. **Deploy:**
   ```bash
   netlify deploy --prod
   ```

## Step 3: Configure Next.js for Netlify

**Important:** Next.js API routes on Netlify require the `@netlify/next` adapter.

1. **Install Netlify Next.js Plugin:**
   ```bash
   npm install @netlify/plugin-nextjs
   ```

2. **Update `netlify.toml`:**
   The configuration is already set up in `netlify.toml`

## Step 4: Update Environment Variables

After your first deployment:

1. **Get your Netlify deployment URL:**
   - Format: `https://your-site-name.netlify.app`
   - Or custom domain if configured

2. **Update `NEXT_PUBLIC_APP_URL`:**
   - Go to Netlify Dashboard → Site settings → Environment variables
   - Update `NEXT_PUBLIC_APP_URL` to your actual Netlify URL
   - Redeploy to apply changes

3. **Update Supabase Redirect URLs:**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add your Netlify URLs:
     - `https://your-site.netlify.app/confirm-email`
     - `https://your-site.netlify.app/reset-password`

## Step 5: Fix Secret Scanning Issues

Netlify's secret scanning may flag documentation files. To fix:

1. **Ensure `.netlifyignore` is present:**
   - This file excludes documentation from builds
   - Already created in the project

2. **Verify no secrets in code:**
   - All secrets should be in environment variables only
   - Documentation files use placeholder values (e.g., `your_key_here`)

3. **If still flagged:**
   - Go to Netlify Dashboard → Site settings → Build & deploy
   - Under "Build settings", you can disable secret scanning for specific files
   - Or ensure `.netlifyignore` properly excludes documentation

## Step 6: Verify Deployment

1. **Test Health Check:**
   ```bash
   curl https://your-site.netlify.app/api
   ```

2. **Test Signup Endpoint:**
   ```bash
   curl -X POST https://your-site.netlify.app/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "test123",
       "role": "buyer"
     }'
   ```

3. **Check Logs:**
   - Go to Netlify Dashboard → Your Site → Functions
   - View function logs for debugging

## Netlify Configuration Details

### Build Configuration

- **Build Command:** `npm run build`
- **Publish Directory:** `.next`
- **Node Version:** 20 (configured in `netlify.toml`)

### Function Configuration

- **Runtime:** Node.js 20
- **Bundler:** esbuild
- **Timeout:** 10 seconds (default, can be increased)

### Redirects

All routes are configured to work with Next.js:
- API routes: `/api/*` → Next.js functions
- Pages: `/*` → Next.js functions

## Troubleshooting

### Build Fails

**Error: "Module not found"**
- Ensure all dependencies are in `package.json`
- Run `npm install` locally to verify

**Error: "TypeScript errors"**
- Fix TypeScript errors locally first
- Run `npm run build` locally to test

### Secret Scanning Errors

**Error: "Secrets scanning detected secrets"**
- Ensure `.netlifyignore` excludes documentation files
- Verify no actual secrets are in code files
- Only use environment variables for secrets

**Solution:**
1. Check that `.netlifyignore` includes `*.md` (except README.md)
2. Verify all secrets are in Netlify environment variables
3. Rebuild the site

### Runtime Errors

**Error: "Environment variable not found"**
- Check all environment variables are set in Netlify
- Ensure variable names match exactly (case-sensitive)
- Redeploy after adding variables

**Error: "Function timeout"**
- Increase function timeout in `netlify.toml`
- Optimize slow operations
- Consider background jobs for long tasks

### API Routes Not Working

**404 on API routes**
- Verify routes are in `app/api/` directory
- Check `netlify.toml` redirects are configured
- Ensure `@netlify/plugin-nextjs` is installed

**CORS errors**
- Headers are configured in `next.config.js`
- Verify `Access-Control-Allow-Origin` settings
- Check if calling from allowed domains

### Database Connection Issues

**Supabase connection fails**
- Verify `SUPABASE_URL` and keys are correct
- Check Supabase project is active
- Verify network access from Netlify

## Performance Optimization

1. **Enable Edge Functions:**
   - For faster response times
   - Configure in Netlify Dashboard

2. **Optimize Bundle Size:**
   - Use dynamic imports for large dependencies
   - Tree-shake unused code

3. **Monitor Performance:**
   - Use Netlify Analytics (if enabled)
   - Check function logs for slow operations

## Security Checklist

- ✅ `SUPABASE_SERVICE_ROLE_KEY` is never exposed to client
- ✅ All sensitive operations run server-side
- ✅ Environment variables are set in Netlify (not in code)
- ✅ CORS headers are properly configured
- ✅ API routes validate authentication
- ✅ `.netlifyignore` excludes documentation from builds
- ✅ No secrets in code files

## Continuous Deployment

Netlify automatically deploys:
- **Production:** Pushes to `main` branch
- **Preview:** Pull requests and other branches

To disable auto-deployment:
- Go to Site settings → Build & deploy → Continuous Deployment
- Configure deployment settings

## Quick Reference

**Deploy Command:**
```bash
netlify deploy --prod
```

**View Logs:**
```bash
netlify logs
```

**List Sites:**
```bash
netlify sites:list
```

**Open Site:**
```bash
netlify open
```

## Support

- **Netlify Docs:** https://docs.netlify.com
- **Next.js on Netlify:** https://docs.netlify.com/integrations/frameworks/nextjs
- **Netlify Support:** https://www.netlify.com/support
