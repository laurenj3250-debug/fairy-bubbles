# Yearly Goals Feature - Implementation Plan v4 (Final)

## Design Philosophy
**Deep integration, not duplication.** Yearly goals become the central hub that aggregates and displays progress from ALL existing app systems - habits, Journey stats, Dream Scroll, expeditions - while also supporting manual tracking for goals that don't fit existing patterns.

---

## Architecture Overview

```
                        ┌─────────────────────────────────┐
                        │      YEARLY GOALS PAGE          │
                        │    (Central Progress Hub)       │
                        └─────────────────────────────────┘
                                      │
                                      ▼
                        ┌─────────────────────────────────┐
                        │  GET /api/yearly-goals/         │
                        │     with-progress?year=2026     │
                        │  (Single aggregated endpoint)   │
                        └─────────────────────────────────┘
                                      │
         ┌────────────────────────────┼────────────────────────────┐
         │                            │                            │
         ▼                            ▼                            ▼
┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
│  AUTO-TRACKED   │        │  HABIT-LINKED   │        │    MANUAL       │
│  (Journey/API)  │        │   (Habits)      │        │  (User Input)   │
└─────────────────┘        └─────────────────┘        └─────────────────┘
```

**Key Change from v3**: Server-side aggregation via single endpoint instead of 6 client hooks.

---

## Schema Design

### New Table: `yearly_goals`

```sql
CREATE TABLE yearly_goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year VARCHAR(4) NOT NULL,  -- "2026"

  -- Basic info
  title TEXT NOT NULL,
  description TEXT,
  category VARCHAR(30) NOT NULL,  -- 'residency', 'climbing', 'fitness', etc.
  position INTEGER NOT NULL DEFAULT 0,

  -- Goal type & tracking
  goal_type VARCHAR(20) NOT NULL DEFAULT 'binary',  -- 'binary' | 'count' | 'compound'
  target_value INTEGER NOT NULL DEFAULT 1,
  current_value INTEGER NOT NULL DEFAULT 0,  -- Only used for manual tracking

  -- Integration links (mutually exclusive - only one can be set)
  linked_habit_id INTEGER REFERENCES habits(id) ON DELETE SET NULL,
  linked_journey_key VARCHAR(50),  -- 'lifting_workouts', 'cycling_miles', 'kilter_climbs', 'outdoor_days'
  linked_dream_scroll_category VARCHAR(20),  -- Link to Dream Scroll category for bucket list counting

  -- Compound goals: nested sub-items as JSONB (max 20 items)
  sub_items JSONB DEFAULT '[]',
  -- Format: [{ id: uuid, title: string, completed: boolean, completedAt?: string }]

  -- Completion tracking
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMP,

  -- Rewards
  xp_reward INTEGER NOT NULL DEFAULT 100,  -- XP awarded on completion
  reward_claimed BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,

  -- Ensure one goal per title per year per user
  UNIQUE(user_id, year, title)
);

CREATE INDEX yearly_goals_user_year_idx ON yearly_goals(user_id, year);
CREATE INDEX yearly_goals_category_idx ON yearly_goals(category);
```

### New Table: `yearly_goal_progress_logs`

```sql
CREATE TABLE yearly_goal_progress_logs (
  id SERIAL PRIMARY KEY,
  goal_id INTEGER NOT NULL REFERENCES yearly_goals(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  change_type VARCHAR(20) NOT NULL,  -- 'increment', 'decrement', 'toggle_sub_item', 'complete', 'uncomplete'
  previous_value INTEGER,
  new_value INTEGER,
  sub_item_id VARCHAR(50),

  source VARCHAR(30) NOT NULL,  -- 'manual', 'habit_sync', 'journey_sync', 'sub_item'
  note TEXT,

  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX yearly_goal_progress_logs_goal_idx ON yearly_goal_progress_logs(goal_id);

-- Retention: Delete logs older than 2 years (add to cron job)
-- DELETE FROM yearly_goal_progress_logs WHERE created_at < NOW() - INTERVAL '2 years';
```

### Point Transaction Type Addition

```sql
-- Add new point transaction types
ALTER TYPE point_transaction_type ADD VALUE 'yearly_goal_complete';
ALTER TYPE point_transaction_type ADD VALUE 'yearly_goal_sub_item';
ALTER TYPE point_transaction_type ADD VALUE 'yearly_category_complete';
```

---

## Category Order (Hardcoded)

```typescript
export const YEARLY_GOAL_CATEGORY_ORDER = [
  'residency',
  'fitness',
  'climbing',
  'outdoor',
  'german',
  'books',
  'piano',
  'travel',
  'relationship',
  'social',
  'financial',
  'bucket_list',
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  residency: 'Residency',
  fitness: 'Fitness',
  climbing: 'Climbing',
  outdoor: 'Outdoor',
  german: 'German',
  books: 'Books',
  piano: 'Piano',
  travel: 'Travel',
  relationship: 'Relationship',
  social: 'Social',
  financial: 'Financial',
  bucket_list: 'Bucket List',
};
```

---

## API Endpoints

### Main Aggregated Endpoint (Server-side computation)

```typescript
// GET /api/yearly-goals/with-progress?year=2026
// Returns all goals with computed progress from all sources
// This is THE main endpoint - handles all integration server-side

interface YearlyGoalWithProgress {
  // Base goal fields
  id: number;
  title: string;
  category: string;
  goalType: 'binary' | 'count' | 'compound';
  targetValue: number;
  currentValue: number;  // Stored value (for manual goals)
  subItems: SubItem[];

  // Computed fields (calculated server-side)
  computedValue: number;  // Actual progress from linked source
  source: 'manual' | 'auto';
  sourceLabel?: string;   // "Apple Watch", "Strava", "Kilter Board"
  isCompleted: boolean;
  progressPercent: number;

  // Rewards
  xpReward: number;
  rewardClaimed: boolean;
}

// Server queries all sources for the given year:
// - Lifting workouts: COUNT WHERE date BETWEEN '2026-01-01' AND '2026-12-31'
// - Cycling miles: SUM(distance) WHERE date in year
// - Outdoor ticks: COUNT WHERE date in year
// - Habit logs: COUNT WHERE habitId=X AND date in year AND completed=true
// - Dream Scroll: COUNT WHERE category=X AND completedAt in year
```

### CRUD Endpoints

```typescript
// POST /api/yearly-goals
// Create new yearly goal
{
  year: "2026",
  title: "200 lifting days",
  category: "fitness",
  goalType: "count",
  targetValue: 200,
  linkedJourneyKey: "lifting_workouts",
  xpReward: 150
}

// PATCH /api/yearly-goals/:id
// Update goal properties (CANNOT change goalType or subItems structure)
{
  title?: string,
  description?: string,
  targetValue?: number,
  xpReward?: number,
  position?: number,
}

// DELETE /api/yearly-goals/:id
```

### Progress Tracking Endpoints

```typescript
// POST /api/yearly-goals/:id/increment
// Manual +1 for count goals (or custom amount)
{ amount?: number, note?: string }

// POST /api/yearly-goals/:id/toggle
// Toggle binary goal completion

// POST /api/yearly-goals/:id/sub-item/:subItemId/toggle
// Toggle compound goal sub-item
```

### Rewards Endpoint

```typescript
// POST /api/yearly-goals/:id/claim-reward
// Claim XP reward for completed goal
// Awards xpReward points via existing pointTransactions system
// Returns { success: true, pointsAwarded: 100, newTotal: 5420 }
```

### Copy Year Endpoint

```typescript
// POST /api/yearly-goals/copy-year
{ fromYear: "2025", toYear: "2026" }

// Copies all goals from one year to another
// Resets: currentValue=0, completed=false, rewardClaimed=false, subItems all uncompleted
// Keeps: title, category, goalType, targetValue, linkedX fields, xpReward
```

### Stats Endpoint (for dashboard widget)

```typescript
// GET /api/yearly-goals/stats?year=2026
{
  totalGoals: 27,
  completedGoals: 8,
  progressPercent: 30,
  byCategory: {
    fitness: { total: 4, completed: 1, progressPercent: 45 },
    climbing: { total: 4, completed: 2, progressPercent: 62 },
    // ...
  }
}
```

---

## Server-Side Integration Logic

```typescript
// server/routes/yearly-goals.ts

async function computeGoalProgress(goal: YearlyGoal, year: string, userId: number) {
  let computedValue = goal.currentValue;
  let source: 'manual' | 'auto' = 'manual';
  let sourceLabel: string | undefined;

  // Journey integrations
  if (goal.linkedJourneyKey) {
    source = 'auto';
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    switch (goal.linkedJourneyKey) {
      case 'lifting_workouts':
        sourceLabel = 'Apple Watch';
        computedValue = await db.select({ count: count() })
          .from(externalWorkouts)
          .where(and(
            eq(externalWorkouts.userId, userId),
            sql`workout_type IN ('HKWorkoutActivityTypeFunctionalStrengthTraining', 'HKWorkoutActivityTypeTraditionalStrengthTraining')`,
            sql`start_time >= ${startDate}`,
            sql`start_time <= ${endDate}`
          ));
        break;

      case 'cycling_miles':
        sourceLabel = 'Strava';
        // Query Strava stats for year (via existing stats endpoint logic)
        computedValue = await getStravaCyclingMiles(userId, year);
        break;

      case 'outdoor_days':
        sourceLabel = 'Climbing Log';
        computedValue = await db.select({ count: countDistinct(outdoorClimbingTicks.date) })
          .from(outdoorClimbingTicks)
          .where(and(
            eq(outdoorClimbingTicks.userId, userId),
            sql`date >= ${startDate}`,
            sql`date <= ${endDate}`
          ));
        break;

      case 'kilter_climbs':
        sourceLabel = 'Kilter Board';
        computedValue = await db.select({ count: sum(climbingSessions.problemsSent) })
          .from(climbingSessions)
          .where(and(
            eq(climbingSessions.userId, userId),
            sql`session_date >= ${startDate}`,
            sql`session_date <= ${endDate}`
          ));
        break;

      case 'kilter_max_grade':
        sourceLabel = 'Kilter Board';
        const maxGrade = await getKilterMaxGrade(userId, year);
        const targetGrade = goal.title.match(/V(\d+)/)?.[1] || '5';
        computedValue = gradeToNumeric(maxGrade) >= parseInt(targetGrade) ? 1 : 0;
        break;
    }
  }

  // Habit integration
  if (goal.linkedHabitId) {
    source = 'auto';
    sourceLabel = 'Habit';
    computedValue = await db.select({ count: count() })
      .from(habitLogs)
      .where(and(
        eq(habitLogs.habitId, goal.linkedHabitId),
        eq(habitLogs.completed, true),
        sql`date >= ${year}-01-01`,
        sql`date <= ${year}-12-31`
      ));
  }

  // Dream Scroll integration
  if (goal.linkedDreamScrollCategory) {
    source = 'auto';
    sourceLabel = 'Bucket List';
    computedValue = await db.select({ count: count() })
      .from(dreamScrollItems)
      .where(and(
        eq(dreamScrollItems.userId, userId),
        eq(dreamScrollItems.category, goal.linkedDreamScrollCategory),
        eq(dreamScrollItems.completed, true),
        sql`EXTRACT(YEAR FROM completed_at) = ${year}`
      ));
  }

  // Compound goals: compute from sub-items
  if (goal.goalType === 'compound') {
    computedValue = goal.subItems.filter(item => item.completed).length;
  }

  const isCompleted = goal.goalType === 'binary'
    ? computedValue >= 1
    : computedValue >= goal.targetValue;

  return {
    ...goal,
    computedValue,
    source,
    sourceLabel,
    isCompleted,
    progressPercent: Math.min(100, Math.round((computedValue / goal.targetValue) * 100)),
  };
}
```

---

## Linked Source Deletion Handling

When a linked habit is deleted, `linkedHabitId` becomes NULL (via FK ON DELETE SET NULL).

```typescript
// In the frontend, detect orphaned goals:
if (goal.linkedHabitId === null && goal.linkedJourneyKey === null && goal.source === 'auto') {
  // Goal was previously auto-tracked but source is gone
  // Show warning icon and allow manual tracking
  return {
    ...goal,
    source: 'manual',
    sourceLabel: 'Linked source deleted - now manual',
    showWarning: true,
  };
}
```

---

## Frontend Architecture

### Files Structure

```
client/src/
├── pages/
│   └── YearlyGoals.tsx              # Main page
├── components/
│   └── yearly-goals/
│       ├── YearlyGoalsHeader.tsx    # Year selector, overall progress
│       ├── YearlyCategory.tsx       # Collapsible category section
│       ├── YearlyGoalRow.tsx        # Individual goal row (all variants)
│       ├── SubItemList.tsx          # Nested sub-items for compound goals
│       ├── GoalProgressBar.tsx      # Visual progress indicator
│       ├── AddGoalDialog.tsx        # Create/edit goal modal
│       └── GoalRewardCelebration.tsx # Confetti + XP animation
└── hooks/
    └── useYearlyGoals.ts            # Simple hook - just fetches aggregated data
```

### Main Hook (Simplified)

```typescript
// useYearlyGoals.ts - Much simpler than v3!
export function useYearlyGoals(year: string) {
  const { data, isLoading, error, refetch } = useQuery<YearlyGoalWithProgress[]>({
    queryKey: ['/api/yearly-goals/with-progress', { year }],
    staleTime: 30000, // 30 seconds
  });

  const goals = data ?? [];

  // Group by category in display order
  const goalsByCategory = useMemo(() => {
    const grouped: Record<string, YearlyGoalWithProgress[]> = {};

    for (const category of YEARLY_GOAL_CATEGORY_ORDER) {
      const categoryGoals = goals.filter(g => g.category === category);
      if (categoryGoals.length > 0) {
        grouped[category] = categoryGoals.sort((a, b) => a.position - b.position);
      }
    }

    return grouped;
  }, [goals]);

  return {
    goals,
    goalsByCategory,
    categories: Object.keys(goalsByCategory),
    isLoading,
    error,
    refetch,
    // Stats
    totalGoals: goals.length,
    completedGoals: goals.filter(g => g.isCompleted).length,
    overallProgress: goals.length > 0
      ? Math.round(goals.reduce((sum, g) => sum + g.progressPercent, 0) / goals.length)
      : 0,
  };
}
```

### Query Invalidation

```typescript
// When any related data changes, invalidate yearly goals
const mutations = {
  toggleHabit: useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/yearly-goals/with-progress']);
    }
  }),

  incrementGoal: useMutation({
    mutationFn: (goalId: number, amount: number = 1) =>
      apiRequest(`/api/yearly-goals/${goalId}/increment`, 'POST', { amount }),
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/yearly-goals/with-progress']);
    }
  }),

  // etc...
};
```

---

## Milestone Celebrations

```typescript
// In YearlyGoalRow.tsx
function handleProgressUpdate(prevValue: number, newValue: number, targetValue: number) {
  const milestones = [25, 50, 75, 100];
  const prevPercent = Math.floor((prevValue / targetValue) * 100);
  const newPercent = Math.floor((newValue / targetValue) * 100);

  for (const milestone of milestones) {
    if (prevPercent < milestone && newPercent >= milestone) {
      if (milestone === 100) {
        // Full completion
        triggerConfetti({ particleCount: 200 });
        showToast(`Goal completed! +${goal.xpReward} XP`);
      } else {
        // Partial milestone
        triggerConfetti({ particleCount: 50 });
        showToast(`${milestone}% milestone reached!`);
      }
      break;
    }
  }
}
```

---

## Mobile Responsive Design

```typescript
// YearlyGoalRow.tsx - responsive layout
<div className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4">
  {/* Checkbox - touch-friendly 44px tap target */}
  <button className="w-11 h-11 flex items-center justify-center">
    <CheckCircle className="w-6 h-6" />
  </button>

  {/* Title and progress */}
  <div className="flex-1 min-w-0">
    <div className="text-sm sm:text-base font-medium truncate">{goal.title}</div>
    {goal.goalType === 'count' && (
      <GoalProgressBar
        value={goal.computedValue}
        max={goal.targetValue}
        className="h-1.5 sm:h-2 mt-1"
      />
    )}
  </div>

  {/* Actions - stack on mobile */}
  <div className="flex items-center gap-1 sm:gap-2">
    {goal.source === 'manual' && goal.goalType === 'count' && (
      <>
        <button className="w-10 h-10 sm:w-8 sm:h-8">-</button>
        <span className="text-xs sm:text-sm w-12 text-center">
          {goal.computedValue}/{goal.targetValue}
        </span>
        <button className="w-10 h-10 sm:w-8 sm:h-8">+</button>
      </>
    )}
    {goal.source === 'auto' && (
      <span className="text-xs text-muted-foreground">{goal.sourceLabel}</span>
    )}
  </div>
</div>

// SubItemList.tsx - less indent on mobile
<div className="ml-4 sm:ml-8 space-y-1">
  {subItems.map(item => (
    <SubItemRow key={item.id} item={item} />
  ))}
</div>
```

---

## Reward System Integration

### Point Values

| Achievement | XP Reward |
|-------------|-----------|
| Binary goal completed | 100 XP (default) |
| Count goal completed | 150 XP (default) |
| Compound goal completed | 200 XP (default) |
| Sub-item completed | 25 XP |
| Category fully completed | 500 XP bonus |
| All yearly goals completed | 2000 XP bonus |

### Implementation

```typescript
// POST /api/yearly-goals/:id/claim-reward
async function claimReward(goalId: number, userId: number) {
  const goal = await getGoal(goalId);

  if (!goal.isCompleted || goal.rewardClaimed) {
    throw new Error('Cannot claim reward');
  }

  // Award XP
  await db.insert(pointTransactions).values({
    userId,
    amount: goal.xpReward,
    type: 'yearly_goal_complete',
    relatedId: goalId,
    description: `Completed: ${goal.title}`,
  });

  // Update user points
  await db.update(userPoints)
    .set({
      available: sql`available + ${goal.xpReward}`,
      totalEarned: sql`total_earned + ${goal.xpReward}`,
    })
    .where(eq(userPoints.userId, userId));

  // Mark reward as claimed
  await db.update(yearlyGoals)
    .set({ rewardClaimed: true })
    .where(eq(yearlyGoals.id, goalId));

  // Check for category completion bonus
  await checkCategoryCompletion(userId, goal.category, goal.year);

  return {
    success: true,
    pointsAwarded: goal.xpReward,
  };
}

async function checkCategoryCompletion(userId: number, category: string, year: string) {
  const categoryGoals = await db.select()
    .from(yearlyGoals)
    .where(and(
      eq(yearlyGoals.userId, userId),
      eq(yearlyGoals.category, category),
      eq(yearlyGoals.year, year),
    ));

  const allCompleted = categoryGoals.every(g => g.completed);
  const bonusClaimed = categoryGoals.some(g => /* check if bonus already claimed */);

  if (allCompleted && !bonusClaimed) {
    // Award 500 XP category completion bonus
    await awardPoints(userId, 500, 'yearly_category_complete', `${category} category complete!`);
  }
}
```

---

## Validation

```typescript
// Zod schemas
const subItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(100),
  completed: z.boolean(),
  completedAt: z.string().optional(),
});

const createYearlyGoalSchema = z.object({
  year: z.string().regex(/^\d{4}$/),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.enum(YEARLY_GOAL_CATEGORY_ORDER),
  goalType: z.enum(['binary', 'count', 'compound']),
  targetValue: z.number().int().min(1).max(10000),
  subItems: z.array(subItemSchema).max(20).default([]),  // MAX 20 sub-items
  linkedHabitId: z.number().int().optional(),
  linkedJourneyKey: z.string().max(50).optional(),
  linkedDreamScrollCategory: z.string().max(20).optional(),
  xpReward: z.number().int().min(0).max(1000).default(100),
});

const updateYearlyGoalSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  targetValue: z.number().int().min(1).max(10000).optional(),
  position: z.number().int().min(0).optional(),
  xpReward: z.number().int().min(0).max(1000).optional(),
  // NOTE: Cannot update goalType or subItems structure - only toggle individual sub-items
});
```

---

## Implementation Phases

### Phase 1: Foundation (Backend)
1. Create migration for `yearly_goals` and `yearly_goal_progress_logs` tables
2. Add point transaction types to enum
3. Add Drizzle schema definitions to `shared/schema.ts`
4. Implement CRUD API endpoints in `server/routes/yearly-goals.ts`
5. Implement server-side progress computation logic

### Phase 2: Core Frontend
6. Create `useYearlyGoals.ts` hook
7. Create `YearlyGoals.tsx` page with basic layout
8. Build `YearlyCategory.tsx` (collapsible sections)
9. Build `YearlyGoalRow.tsx` (all three variants: binary, count, compound)
10. Build `SubItemList.tsx` for compound goals
11. Build `GoalProgressBar.tsx`

### Phase 3: Interactions
12. Implement increment/decrement mutations for count goals
13. Implement toggle mutation for binary goals
14. Implement sub-item toggle mutation
15. Add confetti and milestone celebrations
16. Integrate with existing point system

### Phase 4: Polish
17. Add `AddGoalDialog.tsx` for creating/editing goals
18. Add year navigation (< 2025 | 2026 | 2027 >)
19. Add copy-year functionality
20. Mobile responsive refinements
21. Create seed script for 2026 goals

### Phase 5: Dashboard Integration
22. Add yearly goals widget to IcyDash
23. Add route to App.tsx

### Phase 6: Testing
24. E2E: Create goal, increment, complete, verify XP
25. E2E: Compound goal sub-item toggle
26. Integration: Auto-tracked goal progress
27. Unit: Progress calculation, milestone detection

---

## Deferred Features (Not in MVP)

- **Drag-and-drop reordering** - Use position field + manual reorder later
- **Expedition bonuses** - Cut from MVP, add in v2 if expedition game is active
- **Complex year rollover** - Each year is independent, no carryover logic

---

## Files Changed

### Modified
- `shared/schema.ts` - Add yearly_goals tables and types
- `server/routes.ts` - Register yearly goals routes
- `client/src/App.tsx` - Add /yearly-goals route

### New Files
- `server/routes/yearly-goals.ts` - All API endpoints
- `client/src/pages/YearlyGoals.tsx` - Main page
- `client/src/hooks/useYearlyGoals.ts` - Data hook
- `client/src/components/yearly-goals/YearlyGoalsHeader.tsx`
- `client/src/components/yearly-goals/YearlyCategory.tsx`
- `client/src/components/yearly-goals/YearlyGoalRow.tsx`
- `client/src/components/yearly-goals/SubItemList.tsx`
- `client/src/components/yearly-goals/GoalProgressBar.tsx`
- `client/src/components/yearly-goals/AddGoalDialog.tsx`
- `client/src/components/yearly-goals/GoalRewardCelebration.tsx`
- `scripts/seed-2026-goals.ts`
- `db/migrations/XXXX_add_yearly_goals.sql`

---

## Seed Data (2026 Goals)

```typescript
const goals2026 = [
  // RESIDENCY
  { category: 'residency', title: 'Complete a solo hemilaminectomy', goalType: 'binary', targetValue: 1, xpReward: 200 },
  { category: 'residency', title: 'Finish de Lahunta', goalType: 'binary', targetValue: 1, xpReward: 150 },
  { category: 'residency', title: 'Finish year one of residency', goalType: 'binary', targetValue: 1, xpReward: 500 },

  // FITNESS
  { category: 'fitness', title: '200 lifting days', goalType: 'count', targetValue: 200, linkedJourneyKey: 'lifting_workouts', xpReward: 300 },
  { category: 'fitness', title: '10 pull-ups in a row', goalType: 'binary', targetValue: 1, xpReward: 100 },
  { category: 'fitness', title: '10 chin-ups in a row', goalType: 'binary', targetValue: 1, xpReward: 100 },

  // CLIMBING
  { category: 'climbing', title: '12 outdoor climbing days', goalType: 'count', targetValue: 12, linkedJourneyKey: 'outdoor_days', xpReward: 150 },
  { category: 'climbing', title: 'Climbing trip (New River Gorge)', goalType: 'binary', targetValue: 1, xpReward: 150 },
  { category: 'climbing', title: 'Ice climbing in Adirondacks once', goalType: 'binary', targetValue: 1, xpReward: 150 },
  { category: 'climbing', title: 'V5 on Kilter', goalType: 'binary', targetValue: 1, linkedJourneyKey: 'kilter_max_grade', xpReward: 200 },

  // OUTDOOR
  { category: 'outdoor', title: '52 outdoor days (1/week)', goalType: 'count', targetValue: 52, xpReward: 200 },

  // GERMAN
  {
    category: 'german',
    title: 'Finish Pimsleur Modules 3, 4, 5',
    goalType: 'compound',
    targetValue: 3,
    xpReward: 200,
    subItems: [
      { id: crypto.randomUUID(), title: 'Module 3', completed: false },
      { id: crypto.randomUUID(), title: 'Module 4', completed: false },
      { id: crypto.randomUUID(), title: 'Module 5', completed: false },
    ]
  },
  { category: 'german', title: 'Finish Paul Noble Intermediate', goalType: 'binary', targetValue: 1, xpReward: 100 },
  { category: 'german', title: 'German Vocabulary Course (Michel Thomas)', goalType: 'binary', targetValue: 1, xpReward: 100 },
  { category: 'german', title: 'Intermediate German (Michel Thomas)', goalType: 'binary', targetValue: 1, xpReward: 100 },
  { category: 'german', title: 'Easy Pod German Book 1', goalType: 'binary', targetValue: 1, xpReward: 100 },

  // BOOKS
  { category: 'books', title: '6 audiobooks', goalType: 'count', targetValue: 6, xpReward: 100 },
  { category: 'books', title: '2 physical books', goalType: 'count', targetValue: 2, xpReward: 100 },

  // PIANO
  { category: 'piano', title: 'Start taking lessons', goalType: 'binary', targetValue: 1, xpReward: 100 },
  { category: 'piano', title: 'Learn 1 piece to completion', goalType: 'binary', targetValue: 1, xpReward: 150 },

  // TRAVEL
  { category: 'travel', title: 'Visit Scotland once', goalType: 'binary', targetValue: 1, xpReward: 200 },

  // RELATIONSHIP
  { category: 'relationship', title: '4 in-person visits with Adam', goalType: 'count', targetValue: 4, xpReward: 150 },

  // SOCIAL
  { category: 'social', title: '12 non-work hangouts (1/month)', goalType: 'count', targetValue: 12, xpReward: 150 },
  { category: 'social', title: 'Make 1 climbing friend', goalType: 'binary', targetValue: 1, xpReward: 100 },
  { category: 'social', title: 'Attend 1 climbing event', goalType: 'binary', targetValue: 1, xpReward: 100 },

  // FINANCIAL
  { category: 'financial', title: 'Save up for ring', goalType: 'binary', targetValue: 1, xpReward: 300 },

  // BUCKET LIST
  { category: 'bucket_list', title: '12 bucket list items', goalType: 'count', targetValue: 12, linkedDreamScrollCategory: 'experience', xpReward: 400 },
];
```

---

## Summary

| Metric | Value |
|--------|-------|
| New tables | 2 |
| New API endpoints | 9 |
| New frontend files | 11 |
| Integration points | 5 (lifting, cycling, outdoor, kilter, habits, dream scroll) |
| Lines of code estimate | ~1800 |
| Deferred features | 3 (drag-drop, expedition bonuses, year rollover) |
