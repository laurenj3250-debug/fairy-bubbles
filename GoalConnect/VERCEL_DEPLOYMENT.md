# Vercel Deployment Guide

This guide explains how to deploy your habit tracking app to Vercel.

## What Changed

The app has been configured for Vercel's serverless architecture:

1. **Created `vercel.json`** - Vercel configuration file that:
   - Routes all `/api/*` requests to the serverless function
   - Serves static files from `dist/public`
   - Handles client-side routing properly

2. **Created `api/index.ts`** - Serverless function handler that:
   - Wraps all Express routes in a single serverless function
   - Handles all API endpoints (habits, goals, todos, etc.)
   - Compatible with Vercel's runtime

3. **Created `server/init-db.ts`** - Database initialization module
   - Checks if database is seeded
   - Seeds database with initial data on first run

4. **Updated `package.json`**:
   - Added `@vercel/node` dev dependency
   - Added `build:vercel` script for Vercel builds

## Deployment Steps

### 1. Install Vercel CLI (Optional)
```bash
npm install -g vercel
```

### 2. Set Environment Variables in Vercel

You need to configure the following environment variable in your Vercel project:

- `DATABASE_URL` - Your Neon database connection string

**To add environment variables:**
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add `DATABASE_URL` with your Neon connection string
4. Make sure to add it for all environments (Production, Preview, Development)

### 3. Deploy to Vercel

#### Option A: Deploy via Vercel CLI
```bash
# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

#### Option B: Deploy via GitHub
1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repository
5. Configure build settings:
   - **Build Command**: `npm run build:vercel`
   - **Output Directory**: `dist/public`
   - **Install Command**: `npm install`
6. Add your environment variables (DATABASE_URL)
7. Click "Deploy"

### 4. Initialize Database

After deployment, visit:
```
https://your-app.vercel.app/api/init-database
```

This will seed your database with the initial goals and habits.

## Project Structure

```
GoalConnect/
├── api/
│   └── index.ts          # Serverless function handler
├── server/
│   ├── db.ts             # Database connection
│   ├── db-storage.ts     # Database operations
│   ├── init-db.ts        # Database initialization
│   ├── pet-utils.ts      # Pet calculation utilities
│   └── storage.ts        # Storage singleton
├── client/               # React frontend
├── shared/
│   └── schema.ts         # Database schema
├── dist/
│   └── public/           # Built frontend (generated)
├── vercel.json           # Vercel configuration
└── package.json
```

## Important Notes

1. **Serverless Limitations**:
   - Functions have a maximum execution time (10 seconds on Free plan)
   - No WebSocket support in serverless functions
   - Cold starts may occur on first request

2. **Database Connection**:
   - Already configured for Neon serverless
   - Connection pooling handled automatically

3. **Static Assets**:
   - Frontend is served from `dist/public`
   - `attached_assets` directory is accessible at `/attached_assets/`

4. **API Routes**:
   - All routes are prefixed with `/api/`
   - Example: `/api/habits`, `/api/goals`, `/api/todos`

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Verify TypeScript compilation with `npm run check`

### API Routes Return 404
- Ensure `vercel.json` is properly configured
- Check that environment variables are set in Vercel dashboard

### Database Connection Fails
- Verify `DATABASE_URL` is set in Vercel environment variables
- Make sure your Neon database allows connections from anywhere (0.0.0.0/0)

### Cold Start Issues
- First request may be slow (cold start)
- Consider upgrading to Vercel Pro for better performance
- Use serverless-friendly database connections (already configured)

## Development vs Production

**Development (Local)**:
```bash
npm run dev
```
Runs the full Express server with Vite dev server.

**Production (Vercel)**:
```bash
npm run build:vercel
```
Builds static frontend only. API runs as serverless functions.

## Support

For issues:
- Check [Vercel Documentation](https://vercel.com/docs)
- Check [Neon Documentation](https://neon.tech/docs)
- Review build logs in Vercel dashboard
