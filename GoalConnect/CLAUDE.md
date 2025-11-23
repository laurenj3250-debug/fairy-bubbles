# GoalConnect - Claude Code Configuration

## Project Overview
GoalConnect is a full-stack habit tracking and accountability application that helps users build consistent habits through social accountability and gamification. Built with a modern tech stack optimized for rapid development and deployment.

### Core Features
- **Habit Tracking**: Daily check-ins with streak tracking and completion statistics
- **Social Accountability**: Connect with friends and share progress
- **Hold System**: Custom accountability mechanisms with rewards/consequences
- **Gamification**: Points, badges, and achievements for motivation
- **Analytics**: Detailed insights into habit patterns and progress

### Target Users
- Individuals seeking to build better habits
- Accountability partners and coaching relationships
- Small groups working toward shared goals
- Anyone wanting to track personal development

## Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js 4.x
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Session Management**: Express Session with connect-pg-simple
- **Authentication**: bcryptjs for password hashing
- **Validation**: Zod for runtime type validation
- **Cron Jobs**: node-cron for scheduled tasks
- **Logging**: Winston for structured logging

### Frontend
- **Library**: React 18 with TypeScript
- **Routing**: Wouter (lightweight routing)
- **State Management**: TanStack Query (React Query) for server state
- **Forms**: React Hook Form with Hookform Resolvers
- **UI Components**: Radix UI primitives (30+ components)
- **Styling**: Tailwind CSS with custom design system
- **Animations**: Framer Motion for smooth transitions
- **Date Handling**: date-fns and chrono-node
- **Visualizations**: Recharts for habit analytics
- **Confetti Effects**: canvas-confetti for celebrations

### Development & Testing
- **Build Tool**: Vite 5 with React plugin
- **Testing Framework**: Playwright for E2E tests, Vitest for unit tests
- **Linting**: ESLint with TypeScript support
- **Pre-commit Hooks**: Husky with lint-staged
- **API Documentation**: Swagger (swagger-jsdoc + swagger-ui-express)

## Project Structure

```
GoalConnect/
├── client/                  # Frontend React application
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utility functions and API client
│   │   ├── pages/           # Page components (routed via Wouter)
│   │   └── main.tsx         # React entry point
│   ├── index.html
│   └── public/              # Static assets
├── server/                  # Backend Express application
│   ├── api/                 # API route handlers
│   ├── routes.ts            # Route definitions
│   ├── db.ts                # Drizzle database setup
│   ├── db-storage.ts        # Database storage layer
│   ├── error-handler.ts     # Global error handling
│   └── index.ts             # Express server entry point
├── db/                      # Database migrations and schema
│   ├── migrations/          # Drizzle migration files
│   └── schema.ts            # Database schema definitions
├── scripts/                 # Utility scripts
│   ├── run-migrations.ts
│   ├── ensure-unique-constraint.ts
│   └── browse-authenticated.sh
├── tests/                   # Playwright E2E tests
│   ├── playwright.config.ts
│   └── *.spec.ts
├── .claude/                 # Claude Code configuration
│   ├── agents/              # Custom subagents
│   ├── commands/            # Slash commands
│   └── skills/              # Custom skills
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Development Commands

```bash
# Development
npm run dev                  # Start dev server with tsx watch mode
npm run build                # Production build (Vite + esbuild)
npm start                    # Start production server

# Database
npm run db:push              # Push schema changes to database
npm run db:migrate           # Run migrations
npm run db:verify            # Verify database constraints

# Testing
npm test                     # Run Playwright E2E tests
npm run test:ui              # Run tests with Playwright UI
npm run test:headed          # Run tests in headed browser
npm run test:unit            # Run Vitest unit tests
npm run test:unit:ui         # Run unit tests with Vitest UI
npm run test:unit:coverage   # Run tests with coverage

# Code Quality
npm run check                # TypeScript type checking

# Utilities
npm run screenshot           # Screenshot all pages (via script)
npm run browse               # Open authenticated browser for testing
```

## Database Schema Overview

### Core Tables
- **users**: User accounts with authentication
- **habits**: Habit definitions with metadata
- **habit_logs**: Daily check-ins and completions
- **holds**: Accountability mechanisms
- **friendships**: Social connections between users
- **achievements**: Gamification rewards

### Key Relationships
- Users have many Habits
- Habits have many HabitLogs (one per day)
- Users have many Friendships (bidirectional)
- Users have many Holds (accountability contracts)

## API Architecture

### Authentication
- Session-based auth with express-session
- PostgreSQL session store (connect-pg-simple)
- Password hashing with bcryptjs
- Session validation middleware

### API Routes
All API routes follow REST conventions under `/api`:
- `/api/auth/*` - Authentication endpoints
- `/api/habits/*` - Habit CRUD operations
- `/api/logs/*` - Habit check-in logging
- `/api/holds/*` - Accountability system
- `/api/users/*` - User management
- `/api/friends/*` - Social features
- `/api/stats/*` - Analytics and insights

### Validation Pattern
- Zod schemas for request validation
- Type-safe responses with TypeScript
- Consistent error format with zod-validation-error

### Error Handling
- Global error handler middleware
- Custom error classes (errors.ts)
- Structured error responses
- Winston logging for debugging

## Frontend Patterns

### State Management
- **Server State**: TanStack Query for API data
- **Local State**: React useState/useReducer
- **Form State**: React Hook Form

### API Integration
Use the centralized API client in `client/src/lib/api.ts`:
```typescript
import { api } from '@/lib/api';

// GET request
const habits = await api.get<Habit[]>('/api/habits');

// POST request with data
const newHabit = await api.post<Habit>('/api/habits', { name: '...' });

// Error handling is built-in
```

### Component Structure
- Functional components with hooks
- Radix UI for accessible primitives
- Tailwind for styling with utility-first approach
- Framer Motion for animations
- Compound component patterns for complex UI

### Form Handling
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional()
});

const form = useForm({
  resolver: zodResolver(schema)
});
```

## Coding Standards

### TypeScript
- **Strict mode enabled** - No implicit any
- Use interfaces for object shapes
- Use type for unions and intersections
- Export types from shared locations
- Avoid `any` - use `unknown` if necessary

### React Components
- Functional components only (no classes)
- Use custom hooks for shared logic
- Keep components focused and composable
- Prop drilling max 2 levels (use context if deeper)
- Always type component props

### API Routes
- Validate all inputs with Zod
- Use try-catch with proper error handling
- Return consistent response formats
- Log errors with Winston
- Use TypeScript for type safety

### Database
- Use Drizzle ORM for all queries
- Write migrations for schema changes
- Test migrations up AND down
- Use transactions for multi-step operations
- Index foreign keys and search fields

### Styling
- Tailwind utility classes preferred
- Custom classes only when needed
- Follow mobile-first responsive design
- Use design tokens from Tailwind config
- Keep consistent spacing scale (4px grid)

## Testing Strategy

### E2E Tests (Playwright)
Test critical user flows:
- Authentication (signup, login, logout)
- Habit creation and editing
- Daily check-ins and streak tracking
- Social features (friend requests, sharing)
- Analytics and visualizations

### Unit Tests (Vitest)
Test business logic and utilities:
- Date calculations and streak logic
- Validation schemas
- Utility functions
- Complex state transformations

### Test Organization
- Tests mirror source structure
- Use descriptive test names
- Setup/teardown database for E2E
- Mock external services in unit tests

## Common Workflows

### Adding a New Feature
1. **Plan** (use `/plan` command)
   - Define requirements and acceptance criteria
   - Break into phases
   - Identify affected components

2. **Backend First** (if needed)
   - Add Zod validation schema
   - Create API route handler
   - Add database queries (Drizzle)
   - Write API tests

3. **Frontend Implementation**
   - Create React components
   - Add form handling if needed
   - Integrate with API
   - Add loading/error states

4. **Testing**
   - Write Playwright E2E test
   - Test edge cases
   - Verify responsive design

5. **Review & Commit**
   - Use `/review` command for self-review
   - Run all tests
   - Use `/commit` for quality commit message

### Debugging Issues
Use `/debug` command for systematic investigation:
- Check server logs (Winston)
- Verify API request/response
- Check database state
- Test in isolation
- Add logging if needed

### Database Changes
Use `/migrate` command workflow:
- Design schema change
- Create migration file
- Test migration up/down
- Update TypeScript types
- Update seed data if needed

## Deployment

### Railway Configuration
- **Project**: fairy-bubbles (assumed based on path)
- **Environment Variables**: Set in Railway dashboard
  - `DATABASE_URL` - PostgreSQL connection string
  - `SESSION_SECRET` - Random secure string
  - `NODE_ENV` - "production"

### Build Process
```bash
# Railway runs:
npm run build
# Then starts with:
npm start
```

### Pre-deployment Checklist
- [ ] All tests passing
- [ ] TypeScript compilation successful
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Error handling tested
- [ ] Logging configured

## Security Considerations

### Authentication
- Passwords hashed with bcryptjs (10 rounds)
- Session cookies httpOnly and secure
- Session expiration configured
- No sensitive data in client storage

### Input Validation
- All inputs validated with Zod
- SQL injection prevented by Drizzle ORM
- XSS prevention via React (automatic escaping)
- Rate limiting on auth endpoints

### Database
- Parameterized queries only (via Drizzle)
- Least privilege database user
- Connection pooling configured
- Backup strategy in place

## Performance Optimization

### Frontend
- Code splitting with Vite
- Lazy loading for routes
- Optimized images and assets
- React Query caching
- Debounced search inputs

### Backend
- Database query optimization
- Connection pooling
- Response compression
- Efficient data fetching (avoid N+1)

### Monitoring
- Winston logging for errors
- Database query performance logging
- API response time tracking

## Known Issues & Solutions

### Development
- **Issue**: Hot reload not working
  - **Solution**: Restart dev server, check Vite config

- **Issue**: Database connection errors
  - **Solution**: Verify DATABASE_URL, check PostgreSQL is running

### Production
- **Issue**: Session persistence
  - **Solution**: Verify connect-pg-simple table created

- **Issue**: Build failures
  - **Solution**: Check TypeScript errors, verify all imports

## Best Practices

### DO
- ✅ Use TypeScript strictly
- ✅ Validate all inputs with Zod
- ✅ Write tests for new features
- ✅ Follow REST conventions
- ✅ Use TanStack Query for server state
- ✅ Keep components small and focused
- ✅ Log errors with context
- ✅ Use Tailwind utility classes
- ✅ Run type check before committing

### DON'T
- ❌ Use `any` type without justification
- ❌ Skip input validation
- ❌ Mutate props directly
- ❌ Store sensitive data in localStorage
- ❌ Use inline styles (use Tailwind)
- ❌ Commit without running tests
- ❌ Create database queries without Drizzle
- ❌ Skip error handling
- ❌ Use deprecated React patterns (class components)

## Quick Reference

### Environment Variables
```bash
DATABASE_URL=postgresql://...
SESSION_SECRET=your-secret-here
NODE_ENV=development|production
PORT=3000
```

### Common Imports
```typescript
// API client
import { api } from '@/lib/api';

// UI Components
import { Button } from '@/components/ui/button';

// Forms
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Validation
import { z } from 'zod';

// Database
import { db } from '@/server/db';
```

### Helpful Commands
```bash
# Reset database
npm run db:push

# Check types
npm run check

# Run specific test
npx playwright test tests/auth.spec.ts

# View test report
npm run test:report

# Debug test
npm run test:debug
```

## Resources

- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Radix UI Docs](https://www.radix-ui.com/primitives/docs/overview/introduction)
- [Playwright Docs](https://playwright.dev/docs/intro)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

Last Updated: 2025-11-21
