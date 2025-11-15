# GitHub OAuth Setup Guide

This guide will help you set up GitHub OAuth authentication for GoalConnect.

## Prerequisites

- A GitHub account
- GoalConnect running locally (or deployed)

## Step 1: Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"OAuth Apps"** in the left sidebar
3. Click **"New OAuth App"** button

## Step 2: Configure Your OAuth App

Fill in the following details:

### For Local Development

- **Application name**: `GoalConnect (Dev)` (or any name you prefer)
- **Homepage URL**: `http://localhost:5000`
- **Application description**: (optional) "Climbing habit tracker with gamification"
- **Authorization callback URL**: `http://localhost:5000/api/auth/github/callback`

### For Production

- **Application name**: `GoalConnect`
- **Homepage URL**: `https://yourdomain.com`
- **Authorization callback URL**: `https://yourdomain.com/api/auth/github/callback`

## Step 3: Get Your Credentials

After creating the app:

1. Copy the **Client ID**
2. Click **"Generate a new client secret"**
3. Copy the **Client Secret** (you won't be able to see it again!)

## Step 4: Configure Environment Variables

Add these to your `.env` file:

```bash
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback
```

For production, update the callback URL:

```bash
GITHUB_CALLBACK_URL=https://yourdomain.com/api/auth/github/callback
```

## Step 5: Test the Integration

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the login page: `http://localhost:5000/login`

3. Click **"Sign in with GitHub"**

4. Authorize the application on GitHub

5. You should be redirected back to GoalConnect and logged in!

## Troubleshooting

### Error: "The redirect_uri MUST match the registered callback URL"

- Make sure your `GITHUB_CALLBACK_URL` in `.env` exactly matches the callback URL you set in GitHub OAuth app settings
- Check for trailing slashes - they must match exactly

### Error: "Bad verification code"

- Your client secret may be incorrect
- Make sure you copied the full secret from GitHub

### GitHub OAuth not available

If you see console warnings like:
```
[github-auth] ⚠️  GitHub OAuth not fully configured
```

This means the `GITHUB_CLIENT_ID` or `GITHUB_CLIENT_SECRET` environment variables are missing. The app will still work with email/password authentication.

## Security Notes

- **Never commit** your `.env` file or expose your client secret
- The client secret should be treated like a password
- For production, use environment variables on your hosting platform (Railway, Vercel, etc.)
- Rotate your client secret if it's ever exposed

## Multiple Environments

You can create separate OAuth apps for development and production:

1. Create two OAuth apps on GitHub
2. Use different callback URLs for each
3. Use different environment variables in each environment

Example:
- Dev app callback: `http://localhost:5000/api/auth/github/callback`
- Production app callback: `https://goalconnect.app/api/auth/github/callback`

## Testing with Playwright

The Playwright tests use email/password authentication by default. GitHub OAuth is only available in the UI.

To test the GitHub OAuth flow manually:
```bash
npm run browse
```

This will launch an authenticated browser where you can test the login flow.
