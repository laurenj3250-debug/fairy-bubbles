# GoalConnect Authentication & User Data Management Overview

## Executive Summary

GoalConnect currently implements a **single-user, hardcoded authentication system** with two primary modes:

1. **Fallback Mode** (Default): Single hardcoded user account with credentials from environment variables
2. **Supabase Mode** (Optional): Integrates with Supabase Auth, but still limited to single-user-per-session

The system is **not designed for multi-user** functionality. All API endpoints use the authenticated user's ID from the session, and the database schema supports multiple users, but the authentication layer only handles one user at a time.

---

## Part 1: User Models & Database Schema

### Location: `/server/shared/schema.ts`

#### Users Table
```typescript
users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})
```

**Type Definition:**
```typescript
export type User = {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}
```

### Data Associated with Users

Every major data entity has a `userId` foreign key relationship:

1. **Habits** - User's recurring daily/weekly activities
   - Links: `userId` → users.id

2. **Habit Logs** - Individual completion records for habits
   - Links: `userId` → users.id, `habitId` → habits.id
   - Unique constraint on (habitId, userId, date) - one log per habit per day per user

3. **Goals** - Long-term objectives with target values
   - Links: `userId` → users.id

4. **Goal Updates** - Progress tracking for goals
   - Links: `goalId` → goals.id, `userId` → users.id

5. **Virtual Pets** - User's companion creature
   - Links: `userId` → users.id (UNIQUE - one pet per user)

6. **User Settings** - Preferences (dark mode, notifications)
   - Links: `userId` → users.id (PRIMARY KEY)

7. **User Points** - Gamification currency tracking
   - Links: `userId` → users.id (PRIMARY KEY)
   - Tracks: totalEarned, totalSpent, available

8. **Point Transactions** - Audit trail of point changes
   - Links: `userId` → users.id

9. **User Costumes** - Pet outfit purchases
   - Links: `userId` → users.id, `costumeId` → costumes.id

10. **Todos** - Task list items
    - Links: `userId` → users.id

**Result:** The database schema fully supports multi-user data isolation at the schema level.

---

## Part 2: Authentication System

### Location: `/server/auth.ts`

#### Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  Request arrives                                    │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ Check AUTH_DISABLED  │
        └──────────┬───────────┘
                   │
          ┌────────┴────────┐
          │                 │
    YES ──▶ USE DEFAULT      │ NO
    Hardcoded User     │
          │                 │
          └────────┬────────┘
                   ▼
        ┌──────────────────────┐
        │ Session Middleware   │
        │ (express-session)    │
        └──────────┬───────────┘
                   ▼
        ┌──────────────────────┐
        │ POST /api/auth/login │
        └──────────┬───────────┘
                   │
          ┌────────┴────────┐
          │                 │
      ┌───▶ Supabase?  ───┐ │ No
      │   (if enabled)   └─▶ Local Login
  YES │                     ▼
      │              Compare credentials
      │              vs APP_USERNAME/
      │              APP_PASSWORD
      │              (from .env)
      │
      └─ Supabase.auth
         .signInWithPassword()
         ▼
    Get Supabase User
    Validate email/password
    Get access + refresh tokens
```

#### Environment Variables Controlling Auth

```env
# Disable authentication entirely (for development)
AUTH_DISABLED=true|false  (default: false)

# Session security
SESSION_SECRET="unique-random-string"  (default: "goalconnect-session-secret")

# Fallback local auth (when Supabase not configured)
APP_USERNAME="laurenj3250"              (default: "laurenj3250")
APP_PASSWORD="demo1234"                 (default: "demo1234")
APP_USER_NAME="Lauren"                  (default: "Lauren")
APP_USER_EMAIL="laurenj3250@goalconnect.local"

# Optional: Supabase Auth Integration
SUPABASE_URL="https://xxxx.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIs..."
```

#### Authentication Modes

**Mode 1: AUTH_DISABLED=true**
- Skip login screen entirely
- Automatically inject default user into all requests
- Loads first user from database or creates one
- Used for rapid local development

**Mode 2: Local Auth (APP_USERNAME/APP_PASSWORD)**
- Single hardcoded credential pair
- Validates username matches `APP_USERNAME`
- Validates password matches `APP_PASSWORD`
- Creates session cookie with 7-day expiry
- Session stored in memory (MemoryStore)

**Mode 3: Supabase Auth (SUPABASE_URL/SUPABASE_ANON_KEY)**
- Full OAuth-like flow through Supabase
- Validates credentials against Supabase Auth
- Still requires user to exist in GoalConnect database
- Stores access + refresh tokens in session
- Falls back to local auth if Supabase returns error

#### Session Structure

```typescript
declare module "express-session" {
  interface SessionData {
    user?: AuthenticatedUser;
    supabaseTokens?: SupabaseSessionTokens;
  }
}

type AuthenticatedUser = {
  id: number;
  email: string;
  name: string;
  supabaseUserId?: string;  // Optional - only if using Supabase
}

type SupabaseSessionTokens = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number | null;
}
```

#### Key Functions

**`resolveDefaultUser()`** - Finds or creates default user
- Looks up user by `APP_USER_EMAIL` 
- Falls back to first user in database
- Caches result in memory (`cachedDefaultUser`)
- Called when AUTH_DISABLED or for fallback

**`handleSupabaseLogin(req, res)`** - Supabase authentication flow
- Calls `supabase.auth.signInWithPassword()`
- Validates user exists in GoalConnect database
- Stores tokens in session
- Returns user with optional `supabaseUserId`

**`handleLocalLogin(req, res)`** - Local credential validation
- Compares `req.body.username/email` vs `APP_USERNAME`
- Compares `req.body.password` vs `APP_PASSWORD`
- Resolves default user, creates session
- Returns authenticated user

**`authenticateRequest(middleware)`** - Route protection
- Checks if `req.user` or `req.session.user` exists
- Returns 401 if not authenticated
- Allows: `/api/auth/*`, `/api/init-database`, `/api/database-status`

---

## Part 3: Frontend Authentication State Management

### Location: `/client/src/lib/auth.ts` and `/client/src/hooks/use-session.ts`

#### Client-Side Auth Module

```typescript
interface SessionUser {
  id: number;
  email: string;
  name: string;
}

interface SessionResponse {
  authenticated: boolean;
  user?: SessionUser;
}

export async function fetchSession(): Promise<SessionResponse>
export async function login(email: string, password: string): Promise<SessionResponse>
export async function logout(): Promise<void>
```

**Key Features:**
- Uses `credentials: "include"` for cookie-based sessions
- Sends POST to `/api/auth/login` with email + password
- Handles both email and username fields in login form
- Error messages passed back in response JSON

#### React Query Hook for Session

**Location:** `/client/src/hooks/use-session.ts`

```typescript
export function useSession() {
  return useQuery<SessionResponse>({
    queryKey: ["session"],
    queryFn: fetchSession,
    staleTime: 5 * 60 * 1000,  // 5 minutes cache
    retry: false,
  });
}
```

**Usage Pattern:**
- Fetches session on mount
- Caches for 5 minutes (staleTime)
- No automatic retries on failure
- Returns: `{ data: SessionResponse, isLoading, error }`

#### AuthGate Component

**Location:** `/client/src/components/AuthGate.tsx`

```typescript
export function AuthGate({ children }: AuthGateProps) {
  // TEMPORARY: Skip all authentication checks - just render the app
  return <>{children}</>;
}
```

**⚠️ IMPORTANT:** Authentication is currently **DISABLED** in the frontend!
- The `AuthGate` component is a pass-through
- No login page is shown
- No session validation happens
- This is marked as "TEMPORARY"

#### Login Page

**Location:** `/client/src/pages/Login.tsx`

- Accepts "Username or Email" input
- Posts both email and password to `/api/auth/login`
- Handles errors and submitting states
- Calls `onSuccess()` callback after successful login
- **Currently not used** (AuthGate is disabled)

#### App Integration

**Location:** `/client/src/App.tsx`

```typescript
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <EnchantedForestBackground />
        <Toaster />
        <AuthGate>          {/* ← Currently just passes through */}
          <Router />
          <BottomNav />
        </AuthGate>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
```

---

## Part 4: Data Association with Users

### How User Data is Isolated

**At the Database Level:**
Every data-fetching query filters by `userId`:

```typescript
// Example: Storage layer (server/db-storage.ts)
async getHabits(userId: number): Promise<Habit[]> {
  return await this.db
    .select()
    .from(schema.habits)
    .where(eq(schema.habits.userId, userId));
}
```

**At the API Level:**
Every endpoint extracts the user ID from the authenticated session:

```typescript
// In routes.ts
app.get("/api/habits", async (req, res) => {
  const userId = getUserId(req);  // Extract from req.user
  const habits = await storage.getHabits(userId);
  res.json(habits);
});
```

**The `getUserId()` Helper:**
```typescript
const getUserId = (req: Request) => requireUser(req).id;

function requireUser(req: Request): AuthenticatedUser {
  if (authDisabled) {
    if (req.user) return req.user;
    return getCachedDefaultUser();  // Use fallback
  }
  const user = req.user ?? req.session?.user;
  if (!user) throw new Error("Missing authenticated user");
  return user;
}
```

### API Endpoints

**All endpoints require authentication (except /api/auth/*):**

```
Authentication Endpoints (Public):
  POST   /api/auth/login        - Login with credentials
  POST   /api/auth/logout       - Logout (clears session)
  GET    /api/auth/session      - Check auth status

User Data Endpoints (Protected):
  GET    /api/habits            - User's habits
  POST   /api/habits            - Create habit
  PATCH  /api/habits/:id        - Update habit
  DELETE /api/habits/:id        - Delete habit
  
  GET    /api/habit-logs        - User's habit logs
  GET    /api/habit-logs/:date  - Logs for specific date
  POST   /api/habit-logs        - Create log
  PATCH  /api/habit-logs/:id    - Update log
  DELETE /api/habit-logs/:id    - Delete log
  POST   /api/habit-logs/toggle - Toggle completion
  
  GET    /api/goals             - User's goals
  POST   /api/goals             - Create goal
  PATCH  /api/goals/:id         - Update goal
  DELETE /api/goals/:id         - Delete goal
  
  GET    /api/goal-updates/:goalId  - Goal progress updates
  POST   /api/goal-updates          - Record goal progress
  
  GET    /api/settings          - User's preferences
  POST   /api/settings          - Update preferences
  
  GET    /api/pet               - User's virtual pet
  PATCH  /api/pet/:id           - Update pet
  
  GET    /api/points            - User's points balance
  GET    /api/points/transactions - Points transaction history
  
  GET    /api/user-costumes     - User's costume collection
  POST   /api/costumes/purchase - Buy costume
  POST   /api/costumes/equip    - Equip costume
  POST   /api/costumes/unequip  - Remove costume
  
  GET    /api/todos             - User's todos
  POST   /api/todos             - Create todo
  PATCH  /api/todos/:id         - Update todo
  DELETE /api/todos/:id         - Delete todo
  POST   /api/todos/:id/complete - Mark complete
```

---

## Part 5: What's Missing for Multi-User Support

### Current Limitations

#### 1. **Single Hardcoded User in Fallback Mode**
   - When `AUTH_DISABLED=true`, app always uses first user in database
   - No way to switch users or add new users
   - Good for development, not production

#### 2. **Credential-Based Auth Only**
   - Single username/password pair (from .env)
   - No user registration system
   - No password reset
   - No account management UI

#### 3. **Frontend Auth is Disabled**
   - `AuthGate` component is a pass-through
   - Login page exists but isn't routed to
   - No session check on load
   - No redirect to login if unauthorized

#### 4. **In-Memory Session Storage**
   - Uses `express-session` with `memorystore`
   - Sessions lost on server restart
   - Not suitable for distributed systems
   - No session persistence

#### 5. **No User Management Endpoints**
   Missing:
   - `/api/auth/register` - User signup
   - `/api/auth/user` - Get current user details
   - `/api/users/:id` - User profiles
   - `/api/users` - User listing (admin)
   - No password change/reset
   - No account deletion

#### 6. **No Authorization (Role-Based Access Control)**
   - All authenticated users have same access
   - No admin vs regular user distinction
   - No resource ownership verification
   - API doesn't validate user owns their data (just filters by userId)

#### 7. **Hardcoded User in Serverless API**
   - `/api/index.ts` (Vercel function) has:
   ```typescript
   const USER_ID = 1;
   const USERNAME = 'laurenj3250';
   ```
   - Can't handle multiple users
   - Only works for one person per deployment

---

## Part 6: Database Schema Readiness

### What's Already in Place

✅ **User ID foreign keys** - All tables reference `users(id)`
✅ **Data isolation** - Unique constraints prevent cross-user conflicts
✅ **Relationships** - Proper foreign key constraints
✅ **Query patterns** - All storage methods filter by `userId`

### Example: Habit Logs Isolation

```sql
CREATE TABLE habit_logs (
  id SERIAL PRIMARY KEY,
  habit_id INTEGER REFERENCES habits(id),
  user_id INTEGER REFERENCES users(id),
  date VARCHAR(10),
  completed BOOLEAN,
  UNIQUE(habit_id, user_id, date)  -- Prevents duplicate entries
);
```

The database **already supports** multiple users having:
- Different habits
- Different logs for the same habit on same day
- Different goals
- Different pets
- Different costumes
- Different points

---

## Part 7: Storage Implementation

### Two Storage Layers

#### 1. In-Memory Storage (MemStorage)
**Location:** `/server/storage.ts`

- Maps instead of database queries
- Auto-seeded with default November user
- Used when DATABASE_URL not configured
- Data lost on restart
- Synchronous interface wrapped in async

#### 2. Database Storage (DbStorage)
**Location:** `/server/db-storage.ts`

- Uses Drizzle ORM with PostgreSQL
- Fully async
- Properly filters queries by userId
- Used when DATABASE_URL configured
- Atomic transactions for goal updates

### How Storage is Selected

**Location:** `/server/index.ts` (implied in routes setup)

```
if (DATABASE_URL is set) {
  use DbStorage (PostgreSQL)
} else {
  use MemStorage (in-memory)
}
```

The actual selection logic is in the initialization code that determines whether to use database or memory storage based on environment variables.

---

## Part 8: Current Default User

**Seeded User (in all new databases):**
- Name: `Lauren`
- Email: `laurenj3250@goalconnect.local`
- User ID: `1` (or first assigned by database)
- Username: `laurenj3250` (for fallback login)
- Password: `demo1234` (for fallback login)

**Customizable via .env:**
- `APP_USERNAME` - Login username
- `APP_PASSWORD` - Login password
- `APP_USER_NAME` - Display name
- `APP_USER_EMAIL` - Email in database

---

## Summary: What Exists vs. What's Missing

### ✅ What's WORKING

| Feature | Status | Details |
|---------|--------|---------|
| User Model | ✅ | id, name, email, createdAt |
| User Data Isolation | ✅ | All tables have userId FK |
| Database Schema | ✅ | Supports multi-user at schema level |
| Session Management | ✅ | 7-day express-session cookies |
| Local Auth (single user) | ✅ | APP_USERNAME/PASSWORD fallback |
| Supabase Integration | ✅ | OAuth through Supabase Auth |
| Request Auth Check | ✅ | Middleware validates req.user |
| Frontend Auth Module | ✅ | login(), logout(), fetchSession() |
| React Query Hook | ✅ | useSession() hook available |

### ❌ What's MISSING

| Feature | Status | Details |
|---------|--------|---------|
| User Registration | ❌ | No signup endpoint |
| User Management | ❌ | No /api/users endpoints |
| Frontend Auth UI | ❌ | AuthGate disabled, no login flow |
| Multiple User Sessions | ❌ | Only one user per server instance |
| RBAC / Permissions | ❌ | No role-based access control |
| Password Reset | ❌ | No password recovery |
| Account Settings | ❌ | No account management UI |
| Session Persistence | ❌ | In-memory only, lost on restart |
| Multi-Device Support | ❌ | No token-based auth for cross-device |
| Admin Panel | ❌ | No admin user management |
| Audit Logging | ❌ | No activity logs per user |

---

## Architecture Diagram

```
User Request
    ▼
[Express Server]
    ▼
[Auth Middleware]
    ▼
┌──────────────────────┐
│ Extract User from:   │
│ 1. req.user          │ ← Set by Passport or manual
│ 2. req.session.user  │ ← Set by /api/auth/login
└──┬───────────────────┘
   │
   ▼
[Check if Authenticated]
   │
   ├─ If NO → 401 Unauthorized
   │
   └─ If YES → Continue to Route Handler
      │
      ▼
   [API Route Handler]
      │
      ├─ Extract userId = req.user.id
      │
      ├─ Query Storage with userId filter
      │
      └─ Return user-specific data
         │
         ▼
      [Database / In-Memory Store]
         │
         └─ All queries filtered by userId
```

---

## Recommendations for Multi-User Support

To make GoalConnect truly multi-user, you would need:

1. **User Registration Endpoint**
   ```
   POST /api/auth/register
   { email, password, name }
   ```

2. **Enable Frontend Auth UI**
   - Implement AuthGate properly
   - Show login screen until authenticated
   - Redirect to login on 401 responses

3. **Session Persistence**
   - Switch to Redis or PostgreSQL session store
   - Enable cross-server session sharing

4. **User Management**
   - Profile endpoint: GET /api/auth/user
   - Account settings: PATCH /api/users/:id
   - Password change: POST /api/auth/change-password

5. **Token-Based Auth (Optional)**
   - JWT for API authentication
   - Enables mobile app support
   - Better for serverless deployments

6. **Database Migrations**
   - Add password hashing to users table
   - Add created_at, updated_at timestamps
   - Add last_login tracking
   - Consider soft deletes for accounts

---

**Document Version:** 1.0
**Last Updated:** November 5, 2025
**Scope:** GoalConnect authentication and data management system analysis
