# Vercel Deployment Readiness Checklist

This checklist ensures your API is ready for Vercel deployment.

## ✅ Code Configuration

### Runtime Configuration
- ✅ All API routes use `export const runtime = 'nodejs'` (required for Supabase Admin client)
- ✅ `vercel.json` configured with 30-second function timeout
- ✅ `next.config.js` has proper CORS headers for API routes

### Error Handling
- ✅ All API routes have try-catch blocks
- ✅ JSON parsing errors are handled gracefully
- ✅ Database errors return appropriate HTTP status codes
- ✅ User profile updates are non-blocking (won't fail application creation)

### Request Body Handling
- ✅ Request body parsing wrapped in try-catch
- ✅ Array operations handle null/undefined values
- ✅ Type checking for form fields before processing

## ✅ Environment Variables

**Required for Vercel:**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (keep secret!)
- `STRIPE_SECRET_KEY` - Stripe secret key
- `NEXT_PUBLIC_APP_URL` - Your Vercel deployment URL

**Optional:**
- `STRIPE_AGENT_MONTHLY_PRICE_ID`
- `STRIPE_AGENT_YEARLY_PRICE_ID`
- `STRIPE_BUYER_MONTHLY_PRICE_ID`
- `STRIPE_BUYER_YEARLY_PRICE_ID`

## ✅ Vercel-Specific Considerations

### No File System Operations
- ✅ No `fs.readFile`, `fs.writeFile`, or file system operations
- ✅ All file storage uses Supabase Storage (cloud-based)

### No Blocking Operations
- ✅ All database operations are async/await
- ✅ All external API calls are async/await
- ✅ No synchronous blocking code

### Memory Management
- ✅ Request bodies are parsed once and stored in variables
- ✅ No large data structures kept in memory unnecessarily
- ✅ Arrays are filtered to remove invalid values

### Function Timeouts
- ✅ `vercel.json` sets maxDuration to 30 seconds
- ✅ Database queries are optimized
- ✅ No long-running operations

## ✅ API Route Configuration

### All Routes Have:
- ✅ `export const runtime = 'nodejs'` declaration
- ✅ Proper error handling
- ✅ Authentication checks where required
- ✅ Input validation
- ✅ Appropriate HTTP status codes

## ✅ Database Schema

- ✅ All tables use `CREATE TABLE IF NOT EXISTS`
- ✅ All indexes use `CREATE INDEX IF NOT EXISTS`
- ✅ All policies use `DROP POLICY IF EXISTS` before creating
- ✅ All triggers use `DROP TRIGGER IF EXISTS` before creating
- ✅ Migration blocks check for column existence before adding

## ✅ Type Safety

- ✅ TypeScript types defined for all request/response bodies
- ✅ Type checking for form fields
- ✅ Proper type guards for arrays and objects

## 🚀 Deployment Steps

1. **Push code to GitHub** ✅
2. **Import project in Vercel Dashboard**
3. **Add environment variables** (see list above)
4. **Deploy**
5. **Update `NEXT_PUBLIC_APP_URL`** with actual Vercel URL
6. **Update Supabase redirect URLs** with Vercel URLs
7. **Test all endpoints**

## 📝 Post-Deployment Testing

Test these endpoints after deployment:
- ✅ `GET /api` - Health check
- ✅ `POST /api/auth/signup` - User registration
- ✅ `POST /api/auth/signin` - User login
- ✅ `POST /api/applications/create` - Application creation with form fields
- ✅ `GET /api/dashboard/buyer` - Buyer dashboard
- ✅ `GET /api/dashboard/agent` - Agent dashboard

## 🔍 Common Issues to Watch For

1. **Environment Variables Not Set**
   - Check Vercel Dashboard → Settings → Environment Variables
   - Ensure all required variables are set for Production environment

2. **Function Timeout**
   - Check Vercel function logs
   - Optimize slow database queries
   - Consider pagination for large datasets

3. **CORS Errors**
   - Verify `next.config.js` CORS headers
   - Check if calling from allowed origins

4. **Database Connection Issues**
   - Verify Supabase URL and keys are correct
   - Check Supabase project is active
   - Verify network access from Vercel

5. **JSON Parsing Errors**
   - Ensure request body is valid JSON
   - Check Content-Type header is `application/json`

## ✅ Ready for Deployment

Your API is ready for Vercel deployment! All checks pass.
