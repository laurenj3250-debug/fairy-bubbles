# Supabase Authentication Setup Guide

This application now uses Supabase for authentication, optimized for serverless deployment on Vercel.

## Why Supabase?

- **Serverless-ready**: JWT-based auth works perfectly with Vercel's serverless functions
- **No session state**: Unlike express-session, Supabase tokens are stateless
- **Built-in features**: Email verification, password reset, OAuth providers, and more
- **Secure**: Industry-standard JWT tokens with automatic refresh

## Setup Steps

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in/up
2. Click "New Project"
3. Choose your organization and fill in:
   - **Project name**: GoalConnect (or your preferred name)
   - **Database password**: Generate a secure password (save this!)
   - **Region**: Choose closest to your users
4. Wait for project to be created (~2 minutes)

### 2. Get Your API Keys

1. In your Supabase project, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: Starts with `eyJ...`
   - **service_role key**: Starts with `eyJ...` (KEEP THIS SECRET!)

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update your `.env` file with Supabase credentials:
   ```env
   # Supabase Backend (Server)
   SUPABASE_URL="https://xxxxx.supabase.co"
   SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

   # Supabase Frontend (Vite)
   VITE_SUPABASE_URL="https://xxxxx.supabase.co"
   VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   ```

   **Important**:
   - The `VITE_*` variables are used by the frontend
   - The regular variables are used by the backend
   - **NEVER** commit your service role key to git!

### 4. Run Database Migration

Add the `supabase_user_id` column to your users table:

```bash
# Using psql
psql $DATABASE_URL -f migrations/add_supabase_user_id.sql

# OR using any PostgreSQL client, run:
ALTER TABLE users ADD COLUMN IF NOT EXISTS supabase_user_id TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_users_supabase_user_id ON users(supabase_user_id);
```

### 5. Configure Supabase Email Settings (Optional but Recommended)

1. In Supabase dashboard, go to **Authentication** → **Email Templates**
2. Customize your email templates if desired
3. Go to **Authentication** → **URL Configuration**
4. Set **Site URL** to:
   - Development: `http://localhost:5000`
   - Production: `https://your-app.vercel.app`

### 6. Start the Application

```bash
npm run dev
```

The app will now:
- Show a login screen on first visit
- Allow users to sign up with email/password
- Automatically sync users between Supabase Auth and your local database
- Protect all API routes with JWT verification

## How It Works

### Authentication Flow

1. **Signup**:
   - User enters email, password, and name
   - Frontend calls Supabase Auth to create user
   - Supabase sends verification email (if enabled)
   - User is created in local database with `supabase_user_id` link

2. **Login**:
   - User enters email and password
   - Frontend calls Supabase Auth for JWT token
   - Token is stored in localStorage
   - All API requests include `Authorization: Bearer <token>` header

3. **API Requests**:
   - Backend extracts JWT from Authorization header
   - Verifies token with Supabase
   - Looks up/creates user in local database
   - Attaches user to request for route handlers

### User Data Storage

- **Supabase Auth**: Stores authentication credentials (email, hashed password)
- **Your PostgreSQL DB**: Stores app data (habits, goals, todos, pet, etc.)
- **Link**: `users.supabase_user_id` connects the two

This separation allows you to:
- Use Supabase's robust auth features
- Keep your app data in your own database
- Easily migrate or backup your data
- Scale authentication independently

## Testing

### Create a Test User

1. Visit `http://localhost:5000`
2. Click "Sign up"
3. Enter:
   - Name: Test User
   - Email: test@example.com
   - Password: test1234 (min 6 characters)
4. Click "Sign up"
5. Check Supabase dashboard → Authentication → Users

### Verify JWT Flow

1. Open browser DevTools → Network tab
2. Make an API request (e.g., view habits)
3. Check request headers for `Authorization: Bearer eyJ...`
4. Check response - should return data for authenticated user

## Deployment to Vercel

1. Add environment variables in Vercel dashboard:
   - Go to your project → Settings → Environment Variables
   - Add all `SUPABASE_*` and `VITE_SUPABASE_*` variables
   - Add `DATABASE_URL` for your production database

2. Update Supabase Site URL:
   - Go to Supabase → Authentication → URL Configuration
   - Set Site URL to `https://your-app.vercel.app`
   - Add redirect URL: `https://your-app.vercel.app/**`

3. Deploy:
   ```bash
   git push
   ```

   Vercel will automatically redeploy!

## Troubleshooting

### "Authentication service not configured"

- Check that `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in backend `.env`
- Restart your dev server after changing `.env`

### "Invalid or expired token"

- Token may have expired (default: 1 hour)
- Log out and log back in
- Check that frontend and backend are using same Supabase project

### "No authentication token provided"

- Check that frontend is passing `Authorization` header
- Verify token is stored in localStorage: `localStorage.getItem('supabase.auth.token')`
- Check browser console for errors

### Users can't sign up

- Check Supabase dashboard → Authentication → Settings
- Ensure "Enable Email Signup" is checked
- Check email provider settings if using custom SMTP

## Security Notes

- ✅ JWT tokens are httpOnly and secure
- ✅ Service role key is never exposed to frontend
- ✅ All API routes verify tokens before processing
- ✅ Passwords are hashed by Supabase (bcrypt)
- ✅ Users can only access their own data

## Next Steps

- [ ] Enable email verification in Supabase
- [ ] Add OAuth providers (Google, GitHub, etc.)
- [ ] Implement password reset flow
- [ ] Add user profile management
- [ ] Set up production Supabase project
