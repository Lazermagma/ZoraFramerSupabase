# Supabase Email Configuration Guide

This guide shows how to configure Supabase email templates and redirect URLs for email confirmation and password reset.

## Email Confirmation Setup

### 1. Configure Email Redirect URL

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Find **Site URL** and set it to your app URL:
   - Development: `http://localhost:3000`
   - Production: `https://your-app.vercel.app`

3. Add **Redirect URLs**:
   - `http://localhost:3000/confirm-email`
   - `http://localhost:3000/reset-password`
   - `https://your-app.vercel.app/confirm-email`
   - `https://your-app.vercel.app/reset-password`

### 2. Customize Email Templates

1. Go to **Authentication** → **Email Templates**
2. Select **Confirm signup** template
3. Customize the email content

**Default Template Variables:**
- `{{ .ConfirmationURL }}` - The confirmation link
- `{{ .Email }}` - User's email
- `{{ .SiteURL }}` - Your site URL

**Custom Template Example:**
```html
<h2>Welcome to Our Platform!</h2>
<p>Click the link below to confirm your email:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Email</a></p>
<p>Or copy this link: {{ .ConfirmationURL }}</p>
```

### 3. Password Reset Email Template

1. Go to **Authentication** → **Email Templates**
2. Select **Reset password** template
3. Customize the email content

**Template Variables:**
- `{{ .ConfirmationURL }}` - The reset link
- `{{ .Email }}` - User's email
- `{{ .SiteURL }}` - Your site URL

## Email Settings

### Enable/Disable Email Confirmation

1. Go to **Authentication** → **Settings**
2. Find **Email Auth** section
3. Toggle **"Confirm email"** on/off

**For Development:**
- Turn OFF email confirmation for faster testing
- Users will be signed in immediately after signup

**For Production:**
- Turn ON email confirmation for security
- Users must confirm email before accessing the app

## Custom Redirect URLs in Code

The API routes are already configured to use custom redirect URLs:

### Signup Route
- Redirects to: `/confirm-email`
- Configured in: `app/api/auth/signup/route.ts`

### Forgot Password Route
- Redirects to: `/reset-password`
- Configured in: `app/api/auth/forgot-password/route.ts`

## Testing Email Templates

1. **Test Signup Email:**
   - Sign up a new user
   - Check email inbox
   - Click confirmation link
   - Should redirect to `/confirm-email` page

2. **Test Password Reset Email:**
   - Request password reset
   - Check email inbox
   - Click reset link
   - Should redirect to `/reset-password` page

## Custom Pages

### Email Confirmation Page
- Location: `app/confirm-email/page.tsx`
- Customize: Edit the component to match your design
- Functionality: Automatically confirms email and creates session

### Password Reset Page
- Location: `app/reset-password/page.tsx`
- Customize: Edit the component to match your design
- Functionality: Allows user to set new password

## Environment Variables

Make sure `NEXT_PUBLIC_APP_URL` is set correctly:

```env
# Development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## Troubleshooting

### Emails Not Sending

1. Check **Authentication** → **Settings** → **SMTP Settings**
2. Verify email service is configured (Supabase uses Resend by default)
3. Check spam folder

### Redirect Not Working

1. Verify redirect URLs are added in Supabase Dashboard
2. Check `NEXT_PUBLIC_APP_URL` environment variable
3. Ensure pages exist: `/confirm-email` and `/reset-password`

### Token Expired

- Email confirmation tokens expire after 24 hours (default)
- Password reset tokens expire after 1 hour (default)
- User needs to request a new link if expired

## Customization Tips

1. **Match Framer Design:**
   - Copy colors, fonts, and styling from your Framer site
   - Update the inline styles in `page.tsx` files

2. **Add Logo:**
   - Add your logo image to the confirmation pages
   - Update email templates to include logo

3. **Brand Colors:**
   - Replace gradient colors in page components
   - Update button colors to match your brand

4. **Custom Messages:**
   - Update success/error messages
   - Add helpful instructions
