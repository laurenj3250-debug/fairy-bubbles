# Project Structure

This document explains the correct file structure for this Railway-deployed application.

## Directory Layout

```
GoalConnect/
├── client/                     # Frontend (React + Vite)
│   ├── public/                # Static assets (copied to dist/public/)
│   │   ├── favicon.png       # App icon
│   │   └── manifest.json     # PWA manifest
│   ├── src/                   # React source code
│   │   ├── components/       # React components
│   │   ├── contexts/         # React contexts (auth, etc.)
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utilities
│   │   ├── App.tsx           # Root component
│   │   └── main.tsx          # Entry point
│   └── index.html             # HTML template
│
├── server/                     # Backend (Express + Node)
│   ├── index.ts              # Main server entry point
│   ├── routes.ts             # API route definitions
│   ├── simple-auth.ts        # Session-based authentication
│   ├── db.ts                 # Database connection
│   ├── db-storage.ts         # Database operations
│   ├── storage.ts            # Storage interface
│   ├── vite.ts               # Vite dev server & static serving
│   ├── load-env.ts           # Environment variable loader
│   ├── init-db.ts            # Database initialization
│   └── pet-utils.ts          # Pet calculations
│
├── shared/                     # Shared between frontend/backend
│   └── schema.ts             # Database schema (Drizzle ORM)
│
├── migrations/                 # Database migrations
│   └── railway_migration.sql
│
├── scripts/                    # Utility scripts
│   └── ensure-unique-constraint.ts
│
├── attached_assets/            # Custom assets
│   └── custom_costumes/
│       └── costumes.json
│
├── dist/                       # Build output (gitignored)
│   ├── public/               # Frontend build output
│   └── index.js              # Server build output
│
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite bundler configuration
├── railway.json                # Railway deployment config
├── nixpacks.toml               # Railway build config
├── .env.example                # Environment variables template
└── RAILWAY_DEPLOY.md           # Deployment instructions

```

## Build Process

### Frontend Build (Vite)
```bash
vite build
```
- **Input**: `client/**`
- **Output**: `dist/public/**`
- **Copies**: Files from `client/public/` → `dist/public/`

### Server Build (esbuild)
```bash
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
```
- **Input**: `server/index.ts`
- **Output**: `dist/index.js`

### Production Execution
```bash
NODE_ENV=production node dist/index.js
```
- Server runs from `dist/index.js`
- Serves static files from `dist/public/`

## Important File Locations

### Static Assets MUST go in `client/public/`
- `favicon.png`, `manifest.json`, `robots.txt`, etc.
- These are copied to `dist/public/` during build
- **DO NOT** put them in a root `public/` directory

### Frontend Source MUST go in `client/src/`
- All React components, pages, hooks, etc.
- Vite treats `client/` as the root

### Backend Source MUST go in `server/`
- All Express routes, middleware, database code
- Entry point: `server/index.ts`

### Shared Code goes in `shared/`
- Database schemas
- Types used by both frontend and backend

## Common Mistakes

❌ **DON'T** create a `public/` directory at project root
✅ **DO** put static assets in `client/public/`

❌ **DON'T** build from `api/index.ts` (old Vercel structure)
✅ **DO** build from `server/index.ts` (Railway structure)

❌ **DON'T** serve static files from `server/public/`
✅ **DO** serve from `dist/public/` (Vite build output)

## Environment Variables

Required in production:
- `DATABASE_URL` - PostgreSQL connection (auto-set by Railway)
- `SESSION_SECRET` - Session encryption key (set manually)
- `NODE_ENV` - Set to "production" (auto-set by Railway)
- `PORT` - Server port (auto-set by Railway)

## Authentication

This app uses **session-based authentication**:
- No JWT tokens
- No Supabase
- PostgreSQL session store (`connect-pg-simple`)
- Password hashing with `bcryptjs`
- Session cookies with `express-session`

## Deployment

See `RAILWAY_DEPLOY.md` for complete deployment instructions.
