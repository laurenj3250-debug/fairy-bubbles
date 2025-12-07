# Journey Page Improvements Plan

## Overview
Fix broken Kilter integration, add Liftosaur support, and enhance cycling visualization.

---

## Part 1: Fix Kilter Board Integration

### Problem Analysis
The Kilter hook (`useClimbingStats`) expects session data with climbs array, but there's a data mapping issue between what the API returns and what the frontend expects.

### Investigation Needed
1. Check if `climbingSessions.climbs` is properly stored as JSONB
2. Verify the sessions endpoint returns the `climbs` array in each session
3. Confirm the hook properly parses the session data

### Fix Tasks
1. **Debug the data flow** - Add logging to see what's actually returned
2. **Verify climbs JSON storage** - Ensure climbs are stored and retrieved correctly
3. **Add manual sync button** - Allow users to trigger a fresh sync from the UI

---

## Part 2: Liftosaur Integration

### Research Findings
- **No public API** - Liftosaur doesn't have a documented REST API
- **Open source** - AGPL-3.0 licensed, source available on GitHub
- **Apple Health sync** - Liftosaur syncs to Apple Health (iOS only)
- **JSON export** - Programs can be exported as JSON

### Integration Strategy: Manual Import + Apple Health

Since there's no API, we have two realistic options:

#### Option A: Manual JSON Import (Recommended First)
1. User exports workout history from Liftosaur (if available)
2. Upload JSON file to our app
3. Parse and display the data

#### Option B: Apple Health Bridge (iOS users)
1. Liftosaur syncs to Apple Health
2. Our app reads from Apple Health
3. Display combined data

### Implementation Plan

#### Phase 1: Manual Entry Mode
Create a simple lifting log where users can:
- Log exercises, sets, reps, weight
- Track PRs per exercise
- View workout history
- Calculate volume and progression

#### Database Schema
```sql
CREATE TABLE lifting_exercises (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name TEXT NOT NULL,
  category TEXT, -- 'push', 'pull', 'legs', 'core'
  equipment TEXT, -- 'barbell', 'dumbbell', 'machine', 'bodyweight'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE lifting_sets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  exercise_id INTEGER REFERENCES lifting_exercises(id),
  workout_date DATE NOT NULL,
  set_number INTEGER,
  reps INTEGER,
  weight_lbs DECIMAL(6,2),
  rpe INTEGER, -- 1-10
  is_pr BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### LiftingTab Redesign
```
┌──────────────────────────────────────────────────────────────┐
│ LIFTING                                                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │ WORKOUTS    │  │ VOLUME      │  │ PRs THIS    │           │
│  │    42       │  │   125k lbs  │  │ MONTH: 3    │           │
│  │ This Year   │  │ This Month  │  │             │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ RECENT WORKOUTS                           [+ Log]      │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │ Dec 1 - Push Day                          45 min       │  │
│  │   Bench 185x5x3, OHP 115x8x3, Tricep...  12,450 lbs   │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │ Nov 29 - Pull Day                         52 min       │  │
│  │   Deadlift 315x3x3, Rows 135x8x4...      15,200 lbs   │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ PR TRACKER                                              │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │ Bench Press      185 lbs (Nov 28)        ↑ 5 lbs      │  │
│  │ Squat            225 lbs (Nov 15)        ↑ 10 lbs     │  │
│  │ Deadlift         315 lbs (Nov 29)        NEW PR!      │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  [ Volume Chart - Last 12 Weeks ]                            │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Part 3: Enhanced Cycling Tab

### Current Problems
- Just shows YTD numbers in a static grid
- No visualizations or trends
- No recent ride details
- Nothing engaging or motivating

### Research-Backed Improvements

Based on analysis of Strava, TrainingPeaks, and Garmin:

#### Key Metrics to Display
1. **Distance & Elevation** (already have)
2. **Recent rides list** with details
3. **Weekly/monthly trends** with charts
4. **Pace/speed stats**
5. **Personal bests** highlighting

#### Gamification Elements
1. **Streak counter** - consecutive active weeks
2. **Monthly challenges** - miles goal for month
3. **PRs and achievements** - fastest ride, longest ride
4. **Progress indicators** - visual goal tracking

### New CyclingTab Layout
```
┌──────────────────────────────────────────────────────────────┐
│ CYCLING                                              [Sync]  │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ ┌───────────────────┐ ┌───────────────────┐ ┌──────────────┐ │
│ │   YTD MILES       │ │   ELEVATION       │ │  STREAK      │ │
│ │     1,247         │ │    52,400 ft      │ │  🔥 8 weeks  │ │
│ │  +156 ahead       │ │    ↑12% vs avg    │ │              │ │
│ └───────────────────┘ └───────────────────┘ └──────────────┘ │
│                                                               │
│ ┌────────────────────────────────────────────────────────────┐│
│ │ WEEKLY DISTANCE (Last 12 Weeks)                           ││
│ │ ▄▃▅▆▄▅▇▅▆▄▅█                                              ││
│ │ Goal: 40 mi/week ─────────────────────                    ││
│ └────────────────────────────────────────────────────────────┘│
│                                                               │
│ ┌────────────────────────────────────────────────────────────┐│
│ │ RECENT RIDES                                               ││
│ ├────────────────────────────────────────────────────────────┤│
│ │ 🚴 Morning Commute                    Dec 1    12.4 mi    ││
│ │    32 min • 23.2 mph avg • 420 ft ↑               156 cal ││
│ ├────────────────────────────────────────────────────────────┤│
│ │ 🚴 Weekend Long Ride                  Nov 30   45.2 mi    ││
│ │    2h 15m • 20.1 mph avg • 1,850 ft ↑    ⭐ PR    892 cal ││
│ ├────────────────────────────────────────────────────────────┤│
│ │ 🚴 Evening Spin                       Nov 29   18.3 mi    ││
│ │    52 min • 21.1 mph avg • 680 ft ↑               312 cal ││
│ └────────────────────────────────────────────────────────────┘│
│                                                               │
│ ┌───────────────┐ ┌───────────────┐ ┌──────────────────────┐ │
│ │ PERSONAL BESTS│ │ THIS MONTH    │ │ GOAL PROGRESS        │ │
│ │ Longest: 62mi │ │ 186 miles     │ │ ████████░░ 82%       │ │
│ │ Fastest: 28mph│ │ 8 rides       │ │ 1,247 / 1,500 mi     │ │
│ │ Most Elev:4.2k│ │ 14.2 hours    │ │ 22 weeks left        │ │
│ └───────────────┘ └───────────────┘ └──────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Implementation Details

#### New API Endpoints Needed
```typescript
// GET /api/import/strava/activities/recent
// Returns last 10 activities with full details

// GET /api/import/strava/stats/weekly
// Returns weekly aggregates for trend charts
```

#### New Hook: useStravaActivities
```typescript
// Fetches recent activities with:
// - Name, date, distance, duration
// - Speed (avg, max)
// - Elevation gain
// - Calories
// - Heart rate (if available)
// - Whether it's a PR for any metric
```

---

## Implementation Order

### Phase 1: Fix Kilter (Quick Win)
1. Add debug logging to Kilter endpoints
2. Verify session climbs are returned
3. Test with actual Kilter account

### Phase 2: Cycling Enhancements
1. Create `/api/import/strava/activities/recent` endpoint
2. Add `useStravaActivities` hook
3. Redesign CyclingTab with:
   - Recent rides list
   - Weekly trend chart
   - Personal bests section
   - Streak counter

### Phase 3: Lifting Tab
1. Create database schema for exercises and sets
2. Create API endpoints for lifting data
3. Build workout logging dialog
4. Build LiftingTab with:
   - Recent workouts list
   - PR tracker
   - Volume chart
   - Quick log button

---

## Files to Modify/Create

### Backend
- `server/routes/strava.ts` - Add activities/recent endpoint
- `server/routes/lifting.ts` - NEW: Lifting CRUD endpoints
- `shared/schema.ts` - Add lifting tables

### Frontend
- `client/src/components/journey/tabs/CyclingTab.tsx` - Complete redesign
- `client/src/components/journey/tabs/LiftingTab.tsx` - Complete redesign
- `client/src/hooks/useStravaActivities.ts` - NEW
- `client/src/hooks/useLiftingLog.ts` - NEW
- `client/src/components/LiftingLogDialog.tsx` - NEW

---

## Time Estimates
- Phase 1 (Kilter Fix): 1-2 hours
- Phase 2 (Cycling): 3-4 hours
- Phase 3 (Lifting): 4-6 hours

Total: ~8-12 hours of work
