# Plan: Make Climbing Tab Functional

## Overview
Replace hardcoded climbing data in Journey.tsx with real data from:
1. **Kilter Board** - Existing hook, just needs wiring
2. **Strava Climbing Activities** - Filter existing Strava data for climbing types
3. **Manual Climbing Log** - New feature to replace Mountain Project dependency

---

## Phase 1: Wire Up Kilter Board (Quick Win)

### What exists:
- `useClimbingStats` hook at `client/src/hooks/useClimbingStats.ts`
- Backend routes at `server/routes/kilter-board.ts`
- Database table `climbingSessions`

### Changes needed:
1. **Journey.tsx** - Import and use `useClimbingStats` hook
2. **ClimbingTab** - Replace hardcoded `kilterData` with real stats:
   - `stats.totalSessions` → sessions count
   - `stats.totalProblemsSent` → total sends
   - `stats.maxGrade` → highest grade
   - `stats.gradeDistribution` → pyramid data
   - `stats.flashRate`, `stats.sendRate` → stats
   - `stats.sessions` → recent climbs

---

## Phase 2: Strava Climbing Activities

### What exists:
- `useStravaStats` hook focuses on cycling (rides only)
- Backend stores ALL activity types in `externalWorkouts` table
- `GET /api/import/strava/activities` returns all activities

### Changes needed:

1. **New hook: `useStravaClimbingActivities.ts`**
   ```typescript
   // Fetch activities and filter for climbing types
   const CLIMBING_TYPES = ['Rock Climbing', 'Indoor Climbing', 'Bouldering'];

   // Filter externalWorkouts where workoutType matches
   ```

2. **New API endpoint (optional, for efficiency):**
   ```
   GET /api/import/strava/activities?type=climbing
   ```
   Add query param to filter by workoutType on server side

3. **ClimbingTab** - Replace `redpointData` with real Strava climbing activities:
   - Recent climbing activities (name, duration, location, calories)
   - This week/month stats (time, elevation, activities)

---

## Phase 3: Manual Climbing Log (Outdoor Ticks)

### Purpose:
Replace Mountain Project with a simple manual climbing log where users can record outdoor sends.

### Database Schema:
Add new table `outdoorClimbingTicks`:

```sql
CREATE TABLE outdoor_climbing_ticks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  route_name TEXT NOT NULL,
  grade TEXT NOT NULL,                    -- "5.12a", "V8", etc.
  route_type VARCHAR(20) NOT NULL,        -- 'sport', 'trad', 'boulder'
  ascent_style VARCHAR(20) NOT NULL,      -- 'onsight', 'flash', 'redpoint', 'send'
  date VARCHAR(10) NOT NULL,              -- YYYY-MM-DD
  location TEXT,                          -- "Smith Rock, OR"
  area TEXT,                              -- "Dihedrals"
  pitches INTEGER DEFAULT 1,
  stars INTEGER,                          -- 1-5 rating
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### API Routes:
```
POST   /api/climbing-log           - Create tick
GET    /api/climbing-log           - List ticks (paginated, filterable)
GET    /api/climbing-log/stats     - Aggregated stats
PUT    /api/climbing-log/:id       - Update tick
DELETE /api/climbing-log/:id       - Delete tick
```

### Frontend:
1. **New hook: `useClimbingLog.ts`**
   - CRUD operations for ticks
   - Stats aggregation (highest grade, total ticks, grade pyramid)

2. **ClimbingTab updates:**
   - Replace `outdoorClimbingData` with real data
   - Add "Log Climb" button to record new ticks
   - Show recent ticks list
   - Grade pyramid from actual data

3. **New component: `ClimbingLogDialog.tsx`**
   - Form to add/edit climbing ticks
   - Grade selector with auto-complete
   - Style selector (onsight/flash/redpoint)
   - Optional fields (location, stars, notes)

---

## Phase 4: UI Integration

### ClimbingTab Props Update:
```typescript
interface ClimbingTabProps {
  yearlyClimbsGoal: number;
  onUpdateGoal: (goalKey: string, value: number) => Promise<void>;
  isUpdating: boolean;
  // NEW:
  kilterStats: ClimbingStats | null;
  stravaClimbingActivities: StravaActivity[];
  outdoorTicks: OutdoorTick[];
  onAddTick: () => void;
}
```

### Data Flow:
```
Journey.tsx
  ├── useClimbingStats()           → Kilter Board data
  ├── useStravaClimbingActivities() → Strava climbing sessions
  └── useClimbingLog()             → Manual outdoor ticks
        ↓
    ClimbingTab (receives all data as props)
        ├── Kilter Hero Card
        ├── Outdoor Hero Card (from manual log)
        ├── Strava Activity Card
        ├── Recent Ticks Lists
        └── Grade Pyramids
```

---

## Implementation Order

1. **Phase 1** (30 min) - Wire Kilter Board
   - Import `useClimbingStats` in Journey.tsx
   - Pass data to ClimbingTab
   - Update ClimbingTab to use real Kilter data

2. **Phase 2** (1 hour) - Strava Climbing
   - Create `useStravaClimbingActivities` hook
   - Filter activities by climbing type
   - Update ClimbingTab Strava section

3. **Phase 3** (2-3 hours) - Manual Climbing Log
   - Add database schema
   - Create API routes
   - Create `useClimbingLog` hook
   - Build `ClimbingLogDialog` component
   - Update ClimbingTab outdoor section

4. **Phase 4** (30 min) - Polish
   - Handle loading/error states
   - Empty states for each section
   - Connect goal tracking to real tick count

---

## Files to Create/Modify

### New Files:
- `shared/schema.ts` - Add `outdoorClimbingTicks` table
- `server/routes/climbing-log.ts` - API routes
- `client/src/hooks/useStravaClimbingActivities.ts`
- `client/src/hooks/useClimbingLog.ts`
- `client/src/components/ClimbingLogDialog.tsx`

### Modified Files:
- `client/src/pages/Journey.tsx` - Import hooks, wire up data
- `server/routes.ts` - Register new routes
- `db/migrations/` - New migration for table

---

## Fallback Behavior

When data source is not connected:
- **Kilter not connected** → Show "Connect Kilter Board" CTA
- **Strava not connected** → Show "Connect Strava" CTA
- **No manual ticks** → Show "Log Your First Climb" CTA

This ensures the UI works even with partial data.
