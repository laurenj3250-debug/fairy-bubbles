# Vercel Deployment Setup for GoalConnect

## Environment Variables Required

Add these environment variables in your Vercel project settings:
**Settings → Environment Variables**

### Database Configuration (Supabase)

```
DATABASE_URL=postgres://postgres.ssvuyqtxwsidsfcdcpmo:R5zEX8ESLlTKJaF0@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
```

```
DATABASE_URL_UNPOOLED=postgres://postgres.ssvuyqtxwsidsfcdcpmo:R5zEX8ESLlTKJaF0@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
```

### Authentication Configuration

```
APP_USERNAME=lauren3250
```

```
APP_PASSWORD=Crumpet11!!
```

```
SESSION_SECRET=super-secret-change-me
```

```
AUTH_DISABLED=false
```

### Supabase Authentication (Optional - for Supabase Auth integration)

```
SUPABASE_URL=https://ssvuyqtxwsidsfcdcpmo.supabase.co
```

```
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzdnV5cXR4d3NpZHNmY2RjcG1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTAxNDMsImV4cCI6MjA3NzQ4NjE0M30.SaZYvTnL8lEVQxZ-jwN3pukhMuy5Z48wIKY3zY2Vz-Q
```

## Important: Set for ALL Environments

Make sure to check all three environment options when adding each variable:
- ✅ Production
- ✅ Preview
- ✅ Development

## After Deployment

1. Once your app is deployed, visit:
   ```
   https://your-app-name.vercel.app/api/init-database
   ```

2. This will initialize your Supabase database with:
   - All your November goals (15 monthly goals)
   - Your weekly habits (10 habits)
   - Initial points (250)
   - Costumes for your pet
   - Your virtual pet (Forest Friend the Gremlin)

3. Then log in with:
   - Username: `lauren3250`
   - Password: `Crumpet11!!`

## Changes Made

1. **Updated database connection** from Neon to Supabase
2. **Fixed pg module import** for ESM compatibility
3. **Configured both pooled and non-pooled connections** for optimal Vercel serverless performance

## Troubleshooting

If you see blank data after deployment:
- Verify DATABASE_URL is set in Vercel environment variables
- Check deployment logs for database connection errors
- Visit /api/database-status to check if database is seeded
- Visit /api/init-database to reinitialize if needed
