# Gremlin Dashboard

## Overview

Gremlin Dashboard is a production-ready Progressive Web App (PWA) for habit and goal tracking. Built with a focus on motivational feedback and clean design, it combines Linear's minimalism with Duolingo-style engagement patterns. The application provides users with daily habit tracking, goal progress monitoring, streak tracking, and visual progress representations through heatmaps and charts.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18+ with TypeScript using Vite as the build tool

**UI Component System**: 
- Built on shadcn/ui component primitives (Radix UI + Tailwind CSS)
- Custom design system following the "new-york" style variant
- Component structure emphasizes reusability with dedicated UI components in `client/src/components/ui/`
- Custom domain components for habits, goals, and dashboard features in `client/src/components/`

**Styling Approach**:
- Tailwind CSS with extensive customization via `tailwind.config.ts`
- Custom CSS variables for theming (supports dark/light modes)
- Design guidelines documented in `design_guidelines.md` emphasizing clarity-first information hierarchy
- Touch-optimized with minimum 44×44px tap targets for mobile
- Inter font family for exceptional legibility

**State Management**:
- TanStack Query (React Query) v5 for server state management
- React Hook Form with Zod validation for form handling
- No global state management library; relies on React Query's caching and local component state

**Routing**:
- Wouter for lightweight client-side routing
- Bottom navigation pattern for mobile-first experience
- Routes: Dashboard (/), Habits (/habits), Goals (/goals), Settings (/settings)

**Progressive Web App**:
- PWA manifest configured for standalone mobile experience
- Service worker ready (via manifest.json)
- Optimized for portrait-primary orientation
- App shortcuts for quick habit logging

### Backend Architecture

**Server Framework**: Express.js with TypeScript running on Node.js

**API Structure**:
- RESTful API design with resource-based endpoints
- Routes organized in `server/routes.ts`
- API endpoints follow pattern: `/api/[resource]` (habits, goals, habit-logs, goal-updates, settings)
- Single-user mode with hardcoded USER_ID = 1 (authentication not yet implemented)

**Data Access Layer**:
- Storage abstraction interface (`IStorage`) defined in `server/storage.ts`
- Database storage implementation (`DbStorage`) currently active
- Using Drizzle ORM with PostgreSQL database

**Development Setup**:
- Vite dev server integrated with Express in development mode
- Hot Module Replacement (HMR) enabled
- Custom error overlay for runtime errors
- Replit-specific plugins for cartographer and dev banner

### Data Storage

**Current State**: PostgreSQL database using Drizzle ORM

**Database Setup**: 
- Drizzle ORM configured for PostgreSQL via `drizzle.config.ts`
- Neon serverless PostgreSQL driver installed (`@neondatabase/serverless`)
- Schema definitions in `shared/schema.ts` with Drizzle table definitions
- Database migrations managed via `npm run db:push`
- Seeded with demo data via `server/seed.ts`

**Data Models**:
- **Users**: Basic user information (id, name, email)
- **Habits**: User habits with title, description, icon, color, cadence (daily/weekly)
- **HabitLogs**: Completion tracking per date with optional notes
- **Goals**: Target-based goals with current/target values, deadlines, categories
- **GoalUpdates**: Progress updates for goals with date and value tracking
- **UserSettings**: User preferences and configuration

**Validation**: 
- Zod schemas using `drizzle-zod` for runtime validation
- Type-safe data flow from client to server via shared schema definitions

### External Dependencies

**UI Component Libraries**:
- Radix UI primitives (accordion, alert-dialog, avatar, checkbox, dialog, dropdown-menu, etc.)
- All Radix components version-locked for stability

**Utility Libraries**:
- `date-fns` for date manipulation and formatting
- `class-variance-authority` for component variant styling
- `clsx` and `tailwind-merge` for conditional className handling
- `lucide-react` for icon system

**Form Management**:
- `react-hook-form` for form state and validation
- `@hookform/resolvers` for Zod integration

**Data Fetching**:
- `@tanstack/react-query` v5 for server state synchronization
- Custom fetch wrapper with error handling in `lib/queryClient.ts`

**Development Tools**:
- TypeScript for type safety
- ESBuild for production bundling
- Vite plugins for Replit integration
- PostCSS with Tailwind and Autoprefixer

**Database (Prepared)**:
- `drizzle-orm` for type-safe database queries
- `drizzle-kit` for schema migrations
- `@neondatabase/serverless` for PostgreSQL connection
- `connect-pg-simple` for session storage (currently unused)

**PWA Features**:
- Standard Web Manifest for installability
- Icons for various sizes (192px, 512px)
- Viewport fit for safe area handling on mobile devices

**Session Management (Prepared)**:
- Express session middleware configured but not yet integrated
- PostgreSQL session store ready via `connect-pg-simple`

## Recent Changes

### Replit Environment Setup (October 31, 2025)

**Setup Completed**:
- Configured Node.js 20 environment
- Installed all npm dependencies (478 packages)
- Created PostgreSQL database with Replit's built-in database service
- Ran database migrations using `npm run db:push`
- Seeded database with demo data including:
  - Demo user account
  - 4 sample habits (Morning Exercise, Read 30 minutes, Meditate, Weekly Review)
  - 21 habit log entries for the past 7 days
  - 4 goals with progress tracking
  - 12 costumes for the virtual pet shop
  - Initial points balance (250 points)
  - Virtual pet (Forest Friend, Level 3)

**Bug Fixes**:
- Added missing `getAllHabitLogs` method to `DbStorage` class
  - This method was defined in the `IStorage` interface but not implemented in the database storage layer
  - Fixed 500 error on `/api/stats` endpoint that was preventing streak and weekly completion stats from loading

**Deployment Configuration**:
- Set up autoscale deployment target
- Build command: `cd GoalConnect && npm run build`
- Run command: `cd GoalConnect && npm run start`
- Server runs on port 5000 (both frontend and backend on same port)

**Workflow Configuration**:
- Created "GoalConnect Dev Server" workflow
- Command: `cd GoalConnect && npm run dev`
- Port: 5000 (configured for webview)
- Server configured with `allowedHosts: true` for Replit's proxy environment

**Current Status**: ✅ Fully functional
- All API endpoints working correctly (200/304 status codes)
- Frontend rendering properly with all features operational
- Database connected and seeded with demo data
- Development server running on port 5000
- Ready for deployment to production