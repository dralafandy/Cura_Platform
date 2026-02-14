# OAuth Implementation Plan

## Database Updates
- [x] Add OAuth fields to user_profiles table
- [x] Create migration script for OAuth support

## AuthContext Updates
- [x] Add Google OAuth login function with proper scopes
- [x] Add Facebook OAuth login function with proper scopes
- [x] Update user profile fetching for OAuth users
- [x] Handle OAuth user linking to existing profiles

## LoginPage Updates
- [x] Add Google login button
- [x] Add Facebook login button
- [x] Update UI to support multiple login methods
- [x] Add i18n support for OAuth buttons
- [x] Improve OAuth error handling

## UserManagement Updates
- [x] Add OAuth account linking functionality
- [x] Display OAuth provider information
- [x] Add OAuth unlink functionality

## Dependencies
- [x] OAuth uses Supabase built-in OAuth (no additional packages needed)

## Testing
- [ ] Test Google OAuth login
- [ ] Test Facebook OAuth login
- [ ] Test existing username/password login
- [ ] Test OAuth account linking

---

## 🚨 ERROR: "Unsupported provider: provider is not enabled"

If you see this error when trying to login with Google/Facebook:

### Root Cause
The OAuth providers are **NOT enabled** in your Supabase Dashboard.

### Solution: Enable OAuth in Supabase

#### Step 1: Access Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **xiaolhekiioawkymvjwb**
3. Go to **Authentication → Providers**

#### Step 2: Enable Google OAuth

1. Click on **Google** provider
2. Toggle **Enable Google** to **ON**
3. Fill in the required credentials:
   - **Client ID**: Get from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
     - Create a new OAuth 2.0 Client ID
     - Add your Supabase URL as authorized redirect URI
   - **Client Secret**: Copy from Google Cloud Console
4. **Important**: Add the following **Redirect URL** in Google Cloud Console:
   ```
   https://xiaolhekiioawkymvjwb.supabase.co/auth/v1/callback
   ```
5. Click **Save**

#### Step 3: Enable Facebook OAuth

1. Click on **Facebook** provider
2. Toggle **Enable Facebook** to **ON**
3. Fill in the required credentials:
   - **App ID**: Get from [Facebook Developers](https://developers.facebook.com/apps)
   - **App Secret**: Copy from Facebook Developers dashboard
4. **Important**: Add the following **OAuth Redirect URL** in Facebook App settings:
   ```
   https://xiaolhekiioawkymvjwb.supabase.co/auth/v1/callback
   ```
5. Click **Save**

#### Step 4: Configure Allowed Redirect URLs

In Supabase Dashboard:
1. Go to **Authentication → URL Configuration**
2. Add your app's URLs to **Redirect URLs**:
   - `http://localhost:5173` (development)
   - `http://localhost:3000` (alternative dev port)
   - Your production URL

#### Step 5: Test OAuth Login

After completing the configuration:
1. Go to your app's login page
2. Click "Continue with Google" or "Continue with Facebook"
3. If configured correctly, you should see the OAuth provider's consent screen

---

## Supabase Configuration Required (Quick Reference)

### For Google OAuth:
1. Create project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add redirect URL: `https://xiaolhekiioawkymvjwb.supabase.co/auth/v1/callback`
5. Copy Client ID and Client Secret to Supabase Dashboard

### For Facebook OAuth:
1. Create app in [Facebook Developers](https://developers.facebook.com/apps)
2. Add Facebook Login product
3. Add redirect URL: `https://xiaolhekiioawkymvjwb.supabase.co/auth/v1/callback`
4. Copy App ID and App Secret to Supabase Dashboard

### Supabase Settings:
1. Authentication → Providers → Enable Google/Facebook
2. Authentication → URL Configuration → Add redirect URLs

---

## Environment Variables (If Using Custom Setup)

If you prefer environment variables instead of Supabase Dashboard:
```env
SUPABASE_URL=https://xiaolhekiioawkymvjwb.supabase.co
SUPABASE_ANON_KEY=your_anon_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Facebook OAuth
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
```

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| `"Unsupported provider: provider is not enabled"` | Enable provider in Supabase Dashboard → Authentication → Providers |
| `"Invalid redirect URL"` | Add redirect URL to Supabase Authentication → URL Configuration AND to OAuth provider |
| `"Access denied"` | Check OAuth credentials are correct in Supabase Dashboard |
| OAuth popup closes immediately | Check browser console for errors, ensure popup blockers allow the redirect |
