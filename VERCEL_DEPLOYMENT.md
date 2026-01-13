# Vercel Deployment Guide

This guide will help you deploy your Framer-Supabase API backend to Vercel.

## Prerequisites

- GitHub repository with your code
- Vercel account (sign up at https://vercel.com)
- Supabase project set up
- Stripe account (if using payments)

## Step 1: Prepare Your Repository

1. **Ensure all code is pushed to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Verify your project structure:**
   - `package.json` exists
   - `next.config.js` is configured
   - All API routes are in `app/api/`
   - Environment variables are documented

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard:**
   - Visit https://vercel.com
   - Sign in or create an account

2. **Import Your Project:**
   - Click **"Add New..."** → **"Project"**
   - Import your GitHub repository
   - Select the repository: `ZoraFramerSupabase`

3. **Configure Project:**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (root)
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `.next` (auto-detected)
   - **Install Command:** `npm install` (auto-detected)

4. **Add Environment Variables:**
   Click **"Environment Variables"** and add:

   ```
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_AGENT_MONTHLY_PRICE_ID=price_xxx
   STRIPE_AGENT_YEARLY_PRICE_ID=price_xxx
   STRIPE_BUYER_MONTHLY_PRICE_ID=price_xxx
   STRIPE_BUYER_YEARLY_PRICE_ID=price_xxx
   NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
   ```

   **Important:**
   - Add these for **Production**, **Preview**, and **Development** environments
   - Replace `NEXT_PUBLIC_APP_URL` with your actual Vercel deployment URL after first deploy

5. **Deploy:**
   - Click **"Deploy"**
   - Wait for build to complete (usually 2-3 minutes)

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Follow the prompts:**
   - Link to existing project or create new
   - Add environment variables when prompted

5. **Deploy to Production:**
   ```bash
   vercel --prod
   ```

## Step 3: Update Environment Variables

After your first deployment:

1. **Get your Vercel deployment URL:**
   - Format: `https://your-project-name.vercel.app`
   - Or custom domain if configured

2. **Update `NEXT_PUBLIC_APP_URL`:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Update `NEXT_PUBLIC_APP_URL` to your actual Vercel URL
   - Redeploy to apply changes

3. **Update Supabase Redirect URLs:**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add your Vercel URLs:
     - `https://your-project.vercel.app/confirm-email`
     - `https://your-project.vercel.app/reset-password`

## Step 4: Verify Deployment

1. **Test Health Check:**
   ```bash
   curl https://your-project.vercel.app/api
   ```

2. **Test Signup Endpoint:**
   ```bash
   curl -X POST https://your-project.vercel.app/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "test123",
       "role": "buyer"
     }'
   ```

3. **Check Logs:**
   - Go to Vercel Dashboard → Your Project → Deployments
   - Click on a deployment → View Function Logs

## Step 5: Configure Custom Domain (Optional)

1. **Add Domain in Vercel:**
   - Go to Project Settings → Domains
   - Add your custom domain
   - Follow DNS configuration instructions

2. **Update Environment Variables:**
   - Update `NEXT_PUBLIC_APP_URL` to your custom domain
   - Update Supabase redirect URLs

## Vercel Configuration Details

### Runtime Configuration

All API routes use Node.js runtime (not Edge):
- Required for Supabase Admin client
- Required for Stripe SDK
- Better compatibility with database connections

### Function Timeouts

- Default: 10 seconds
- Configured in `vercel.json`: 30 seconds max
- For longer operations, consider background jobs

### Environment Variables

**Required for Production:**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (keep secret!)
- `STRIPE_SECRET_KEY` - Stripe secret key
- `NEXT_PUBLIC_APP_URL` - Your Vercel deployment URL

**Optional:**
- Stripe price IDs (if using different products)

### Build Settings

Vercel automatically detects:
- Framework: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

### Region Selection

Default region: `iad1` (US East)
- Configured in `vercel.json`
- Change based on your user base location
- Options: `iad1`, `sfo1`, `hnd1`, `syd1`, etc.

## Troubleshooting

### Build Fails

**Error: "Module not found"**
- Ensure all dependencies are in `package.json`
- Run `npm install` locally to verify

**Error: "TypeScript errors"**
- Fix TypeScript errors locally first
- Run `npm run build` locally to test

### Runtime Errors

**Error: "Environment variable not found"**
- Check all environment variables are set in Vercel
- Ensure variable names match exactly (case-sensitive)
- Redeploy after adding variables

**Error: "Function timeout"**
- Increase timeout in `vercel.json`
- Optimize slow operations
- Consider background jobs for long tasks

### API Routes Not Working

**404 on API routes**
- Verify routes are in `app/api/` directory
- Check route file names match URL paths
- Ensure `route.ts` files export proper handlers

**CORS errors**
- Headers are configured in `next.config.js`
- Verify `Access-Control-Allow-Origin` settings
- Check if calling from allowed domains

### Database Connection Issues

**Supabase connection fails**
- Verify `SUPABASE_URL` and keys are correct
- Check Supabase project is active
- Verify network access from Vercel

## Performance Optimization

1. **Enable Edge Caching:**
   - Static assets are automatically cached
   - API routes can use cache headers

2. **Optimize Bundle Size:**
   - Use dynamic imports for large dependencies
   - Tree-shake unused code

3. **Monitor Performance:**
   - Use Vercel Analytics (if enabled)
   - Check function logs for slow operations

## Security Checklist

- ✅ `SUPABASE_SERVICE_ROLE_KEY` is never exposed to client
- ✅ All sensitive operations run server-side
- ✅ Environment variables are set in Vercel (not in code)
- ✅ CORS headers are properly configured
- ✅ API routes validate authentication
- ✅ Rate limiting considered (add if needed)

## Continuous Deployment

Vercel automatically deploys:
- **Production:** Pushes to `main` branch
- **Preview:** Pull requests and other branches

To disable auto-deployment:
- Go to Project Settings → Git
- Configure deployment settings

## Support

- **Vercel Docs:** https://vercel.com/docs
- **Next.js on Vercel:** https://vercel.com/docs/frameworks/nextjs
- **Vercel Support:** https://vercel.com/support

## Quick Reference

**Deploy Command:**
```bash
vercel --prod
```

**View Logs:**
```bash
vercel logs
```

**List Projects:**
```bash
vercel ls
```

**Remove Deployment:**
```bash
vercel remove
```
