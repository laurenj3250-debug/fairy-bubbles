# Strava Full Integration Plan

**Goal:** Get all Strava data working, integrated, and used across the app.

## Current State Assessment

### What's Already Working
| Component | Status | Notes |
|-----------|--------|-------|
| OAuth flow | ✅ Complete | Auth, callback, disconnect, token refresh |
| Activity sync | ✅ Complete | Imports to `externalWorkouts` table |
| Strava hooks | ✅ Complete | `useStravaStats`, `useStravaClimbingActivities` |
| Activity API | ✅ Complete | GET/POST endpoints for activities |
| Journey page | ⚠️ Partial | Uses real data with mock fallbacks |
| Outdoor climbing log | ✅ Complete | Full CRUD, stats, dialog |
| Habit auto-complete service | ⚠️ Exists | Service written but NOT wired to Strava |
| Habit mapping table | ⚠️ Exists | Schema exists, no UI |

### What's Missing
1. **Strava sync → habit auto-complete connection** - Activities import but don't trigger habit matching
2. **Habit mapping UI** - No way to configure which activities auto-complete which habits
3. **Journey page cleanup** - Remove mock data fallbacks, use real API data only
4. **Gamification integration** - Activities don't feed climbing XP/level system

---

## Implementation Phases

### Phase 1: Wire Strava Sync to Habit Auto-Complete
**Effort:** 30 min | **Impact:** HIGH

The `habit-auto-complete.ts` service exists but isn't called from Strava sync.

**Changes:**
1. In `server/routes/strava.ts` → `performSync()` function:
   - After inserting new activity, call `applyWorkoutMatches(workout, userId)`
   - Import the function from `../services/habit-auto-complete`

```typescript
// In performSync, after inserting new activity:
import { applyWorkoutMatches } from "../services/habit-auto-complete";

// After insert:
const [insertedWorkout] = await db.insert(externalWorkouts).values({...}).returning();
if (insertedWorkout) {
  await applyWorkoutMatches(insertedWorkout, userId);
}
```

**Files:**
- `server/routes/strava.ts` - Add auto-complete call

---

### Phase 2: Habit Mapping Configuration UI
**Effort:** 1-2 hours | **Impact:** HIGH

Users need a way to configure which Strava activity types auto-complete which habits.

**UI Design:**
- Add "Auto-Complete Rules" section to Import Settings page
- Show user's habits with dropdown to link to activity types
- Support matching criteria: activity type, min duration, keywords

**Changes:**
1. Add `GET/POST/DELETE /api/habit-mappings` endpoints
2. Create `HabitMappingCard` component for ImportSettings
3. Add `useHabitMappings` hook

**Files:**
- `server/routes/habit-mappings.ts` - New routes file
- `client/src/hooks/useHabitMappings.ts` - New hook
- `client/src/pages/ImportSettings.tsx` - Add mapping UI section

**UI Mockup:**
```
┌─────────────────────────────────────────────────────┐
│ Auto-Complete Rules                                  │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ 🧗 Climbing Habit                                │ │
│ │ Auto-complete when: Rock Climbing, Bouldering   │ │
│ │ Min duration: 30 min                            │ │
│ │ [Edit] [Delete]                                 │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 🚴 Cycling Habit                                 │ │
│ │ Auto-complete when: Ride, VirtualRide           │ │
│ │ Min duration: 20 min                            │ │
│ │ [Edit] [Delete]                                 │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ [+ Add Rule]                                        │
└─────────────────────────────────────────────────────┘
```

---

### Phase 3: Journey Page - Remove Mock Data
**Effort:** 1 hour | **Impact:** MEDIUM

Replace hardcoded mock data with real API data. Show empty states when no data.

**Changes:**
1. Remove `cyclingData`, `liftosaurData`, `stravaLiftingData`, `outdoorClimbingData`, `kilterData`, `redpointData` mock objects
2. Update `CyclingTab` to use only `stravaStats` with loading states
3. Update `LiftingTab` to use only real data
4. Update `ClimbingTab` - already mostly done, just cleanup
5. Add proper empty states for each tab

**Files:**
- `client/src/pages/Journey.tsx` - Remove mock data, add empty states

---

### Phase 4: Kilter Board Section in Climbing Tab
**Effort:** 30 min | **Impact:** MEDIUM

The `kilterStats` hook is imported but not fully displayed in ClimbingTab.

**Changes:**
1. Add Kilter Board stats card to ClimbingTab
2. Show: sessions, problems sent, highest grade, send rate
3. Link to Kilter connection if not connected

**Files:**
- `client/src/pages/Journey.tsx` - Add Kilter section to ClimbingTab

---

### Phase 5: Strava Climbing Section in Climbing Tab
**Effort:** 30 min | **Impact:** MEDIUM

The `stravaClimbingStats` hook is imported but data isn't displayed.

**Changes:**
1. Add Strava climbing stats card to ClimbingTab
2. Show: recent activities, weekly/monthly time, calories, heart rate
3. Different from outdoor log - this is gym sessions tracked via Strava

**Files:**
- `client/src/pages/Journey.tsx` - Add Strava climbing section

---

### Phase 6: Gamification Integration
**Effort:** 1 hour | **Impact:** MEDIUM

Strava activities should contribute to climbing XP and level progression.

**Approach:**
- Climbing activities → XP based on duration + intensity
- Cycling/running → Different XP category (cardio)

**Changes:**
1. In Strava sync, after importing climbing activity:
   - Calculate XP: `durationMinutes * 2 + (heartRateAvg > 140 ? 20 : 0)`
   - Call climbing stats update API

2. Add `POST /api/climbing/xp` endpoint to award XP from activities

**Files:**
- `server/routes/strava.ts` - Add XP calculation after sync
- `server/routes/climbing.ts` - Add XP award endpoint

---

### Phase 7: Security - Real Credential Encryption
**Effort:** 30 min | **Impact:** HIGH (security)

Current credentials use base64 encoding (not secure).

**Changes:**
1. Use `crypto.createCipheriv()` with AES-256-GCM
2. Store encryption key in environment variable
3. Add migration to re-encrypt existing credentials

**Files:**
- `server/routes/strava.ts` - Update encrypt/decrypt functions
- `server/routes/kilter-board.ts` - Same update
- `.env.example` - Add `ENCRYPTION_KEY`

---

## Priority Order

1. **Phase 1: Wire auto-complete** - This is the core missing piece
2. **Phase 2: Habit mapping UI** - Without this, Phase 1 is useless
3. **Phase 3: Remove mock data** - Clean up Journey page
4. **Phase 7: Security** - Important for production
5. **Phase 4-6: Polish** - Nice to have

---

## Testing Checklist

- [ ] Connect Strava account
- [ ] Sync activities manually
- [ ] Create habit mapping for climbing activity
- [ ] Log climbing on Strava → habit auto-completes
- [ ] Check habit log shows "Strava" as source
- [ ] Disconnect Strava cleanly
- [ ] Journey page shows real data (no mock fallbacks)
- [ ] Empty states work when no data

---

## Estimated Total Effort

| Phase | Effort |
|-------|--------|
| Phase 1 | 30 min |
| Phase 2 | 1-2 hrs |
| Phase 3 | 1 hr |
| Phase 4 | 30 min |
| Phase 5 | 30 min |
| Phase 6 | 1 hr |
| Phase 7 | 30 min |
| **Total** | **5-6 hrs** |

---

## Notes

- The hard work is done - OAuth, sync, parsing, services all exist
- Main gap is connecting the pieces together
- UI for habit mapping is the biggest new work
- Consider webhook support later for real-time sync (not in this plan)
