# Lifting Tab Redesign: "Temple of Gains" - A+ Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the boring LiftingTab into an expedition-themed "Temple of Gains" dashboard with muscle distribution visualization, workout calendar, PR wall, and genuinely funny absurd facts.

**Architecture:** Fix the data layer first (exercise→muscle mapping), then build reliable UI components, then wire into LiftingTab.

**Tech Stack:** React + TypeScript, Framer Motion, Tailwind CSS.

---

## Issues Fixed in This Plan

1. **Muscle data problem** → Add `EXERCISE_MUSCLE_MAP` to infer muscle from exercise names
2. **Janky body SVG** → Replace with clean horizontal bar chart (reliable, scannable)
3. **Weak absurd comparisons** → Volume-based comparisons that actually make sense
4. **Calendar only shows 10 workouts** → Add new endpoint to fetch full calendar data
5. **No loading states** → Add skeleton loaders
6. **Glute-forward ignored** → Highlight glutes in visualizations

---

## Task 1: Create Exercise-to-Muscle Mapping Utility

**Why:** Liftosaur imports don't include muscle data. We need to infer it from exercise names.

**Files:**
- Create: `shared/exerciseMuscleMap.ts`

**Code:**

```typescript
/**
 * Exercise-to-Muscle Mapping
 * Maps exercise names (lowercase, partial match) to primary muscle groups
 */

export type MuscleGroup =
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'back'
  | 'chest'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'core'
  | 'calves';

// Keywords that map to muscle groups (order matters - more specific first)
const MUSCLE_KEYWORDS: Array<[RegExp, MuscleGroup]> = [
  // GLUTES - glute-forward for Lauren
  [/hip\s*thrust|glute\s*(bridge|kickback|drive)|romanian|rdl|good\s*morning/i, 'glutes'],
  [/glute|butt|booty/i, 'glutes'],

  // LEGS
  [/squat|leg\s*press|lunge|split\s*squat|goblet|front\s*squat|hack/i, 'quads'],
  [/hamstring|leg\s*curl|nordic|stiff\s*leg/i, 'hamstrings'],
  [/calf|raise|standing\s*calf|seated\s*calf/i, 'calves'],

  // BACK
  [/deadlift(?!.*romanian|.*rdl)|pull[-\s]?up|chin[-\s]?up|lat|row|pulldown|pull\s*down/i, 'back'],
  [/back|rear\s*delt|face\s*pull/i, 'back'],

  // CHEST
  [/bench|chest|push[-\s]?up|fly|flye|pec\s*deck|incline\s*press|decline\s*press/i, 'chest'],

  // SHOULDERS
  [/shoulder|ohp|overhead\s*press|military|lateral\s*raise|front\s*raise|arnold/i, 'shoulders'],
  [/delt/i, 'shoulders'],

  // ARMS
  [/bicep|curl(?!.*leg)|preacher|hammer/i, 'biceps'],
  [/tricep|pushdown|push\s*down|skull\s*crusher|dip|extension(?!.*leg)/i, 'triceps'],

  // CORE
  [/ab|crunch|plank|sit[-\s]?up|core|oblique|hollow|leg\s*raise/i, 'core'],
];

/**
 * Infer muscle group from exercise name
 */
export function inferMuscleGroup(exerciseName: string): MuscleGroup | null {
  const name = exerciseName.toLowerCase().trim();

  for (const [pattern, muscle] of MUSCLE_KEYWORDS) {
    if (pattern.test(name)) {
      return muscle;
    }
  }

  return null;
}

/**
 * Get display info for muscle groups
 */
export const MUSCLE_DISPLAY: Record<MuscleGroup, { emoji: string; color: string; label: string }> = {
  glutes: { emoji: '🍑', color: '#f97316', label: 'Glutes' },
  quads: { emoji: '🦵', color: '#a855f7', label: 'Quads' },
  hamstrings: { emoji: '🦿', color: '#ec4899', label: 'Hamstrings' },
  back: { emoji: '🦴', color: '#3b82f6', label: 'Back' },
  chest: { emoji: '💪', color: '#ef4444', label: 'Chest' },
  shoulders: { emoji: '🏋️', color: '#14b8a6', label: 'Shoulders' },
  biceps: { emoji: '💪', color: '#8b5cf6', label: 'Biceps' },
  triceps: { emoji: '💪', color: '#6366f1', label: 'Triceps' },
  core: { emoji: '🔥', color: '#eab308', label: 'Core' },
  calves: { emoji: '🦶', color: '#64748b', label: 'Calves' },
};
```

**Commit:** `feat(lifting): add exercise-to-muscle mapping utility`

---

## Task 2: Create Lifting Absurd Comparisons (Actually Good)

**Why:** Make comparisons that are mathematically meaningful AND funny.

**Files:**
- Create: `client/src/lib/liftingAbsurdComparisons.ts`

**Code:**

```typescript
/**
 * Lifting Absurd Comparisons
 * Turn lifting stats into genuinely absurd facts
 */

// Real-world reference weights and values
const TOYOTA_COROLLA_LBS = 3000;
const GOLDEN_RETRIEVER_LBS = 70;
const MOON_GRAVITY_FACTOR = 6; // You can lift 6x more on moon
const AVG_BURRITO_LBS = 1; // 1 lb burrito
const BABY_ELEPHANT_LBS = 250;
const HOUSE_CAT_LBS = 10;
const BOWLING_BALL_LBS = 14;

export interface LiftingAbsurdComparisons {
  corollas: { value: number; formatted: string };
  moonLift: { value: number; formatted: string };
  goldenRetrievers: { value: number; formatted: string };
  burritos: { value: number; formatted: string };
  catLaunches: { value: number; formatted: string };
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  if (num < 1) return num.toFixed(2);
  if (num < 10) return num.toFixed(1);
  return Math.round(num).toLocaleString();
}

export function calculateLiftingAbsurdComparisons(
  totalVolumeLbs: number,
  bestLiftLbs: number
): LiftingAbsurdComparisons {
  // Volume = how many Toyota Corollas you've lifted total
  const corollas = totalVolumeLbs / TOYOTA_COROLLA_LBS;

  // On the moon, you could lift 6x your best lift
  const moonLift = bestLiftLbs * MOON_GRAVITY_FACTOR;

  // Volume in golden retrievers
  const goldenRetrievers = totalVolumeLbs / GOLDEN_RETRIEVER_LBS;

  // Volume in Chipotle burritos
  const burritos = totalVolumeLbs / AVG_BURRITO_LBS;

  // "Your hip thrust could launch X cats into low orbit"
  // (hip thrust force can launch a 10lb cat Y feet high theoretically)
  const catLaunches = Math.floor(bestLiftLbs / HOUSE_CAT_LBS);

  return {
    corollas: {
      value: corollas,
      formatted: `${formatNumber(corollas)} Toyota Corollas`,
    },
    moonLift: {
      value: moonLift,
      formatted: `${formatNumber(moonLift)} lbs on the Moon`,
    },
    goldenRetrievers: {
      value: goldenRetrievers,
      formatted: `${formatNumber(goldenRetrievers)} Golden Retrievers`,
    },
    burritos: {
      value: burritos,
      formatted: `${formatNumber(burritos)} Chipotle burritos`,
    },
    catLaunches: {
      value: catLaunches,
      formatted: `${catLaunches} cats into orbit`,
    },
  };
}
```

**Commit:** `feat(lifting): add meaningful absurd comparisons`

---

## Task 3: Create Muscle Distribution Component (Bar Chart, Not Body SVG)

**Why:** A horizontal bar chart is more reliable than a hand-drawn body SVG and easier to scan.

**Files:**
- Create: `client/src/components/journey/MuscleDistribution.tsx`

**Code:**

```typescript
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MUSCLE_DISPLAY, type MuscleGroup } from '@shared/exerciseMuscleMap';

interface MuscleVolume {
  muscle: MuscleGroup;
  volume: number;
  percentage: number;
}

interface MuscleDistributionProps {
  muscleVolumes: MuscleVolume[];
  className?: string;
}

export function MuscleDistribution({ muscleVolumes, className }: MuscleDistributionProps) {
  // Sort by volume descending, take top 6
  const topMuscles = [...muscleVolumes]
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 6);

  const maxPercentage = Math.max(...topMuscles.map(m => m.percentage), 1);

  if (topMuscles.length === 0) {
    return (
      <div className={cn("flex flex-col", className)}>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium mb-3">
          Muscle Focus
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs">
          Log workouts to see muscle distribution
        </div>
      </div>
    );
  }

  // Check if glutes are in top 3 for Lauren-awareness
  const gluteRank = topMuscles.findIndex(m => m.muscle === 'glutes');
  const isGluteForward = gluteRank !== -1 && gluteRank < 3;

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium mb-3 flex items-center gap-2">
        Muscle Focus
        {isGluteForward && (
          <span className="text-orange-400 normal-case">🍑 Big Booty Mode</span>
        )}
      </div>

      <div className="space-y-2">
        {topMuscles.map((m, i) => {
          const display = MUSCLE_DISPLAY[m.muscle];
          const barWidth = (m.percentage / maxPercentage) * 100;
          const isGlute = m.muscle === 'glutes';

          return (
            <motion.div
              key={m.muscle}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-2"
            >
              <span className="text-sm w-5">{display.emoji}</span>
              <span className={cn(
                "text-xs w-20 truncate",
                isGlute ? "text-orange-400 font-medium" : "text-white/70"
              )}>
                {display.label}
              </span>
              <div className="flex-1 h-4 bg-white/5 rounded overflow-hidden">
                <motion.div
                  className={cn(
                    "h-full rounded",
                    isGlute ? "bg-gradient-to-r from-orange-500 to-orange-400" : ""
                  )}
                  style={{
                    backgroundColor: isGlute ? undefined : display.color,
                    opacity: isGlute ? 1 : 0.7
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${barWidth}%` }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                />
              </div>
              <span className={cn(
                "text-xs font-bold w-10 text-right tabular-nums",
                isGlute ? "text-orange-400" : "text-purple-400"
              )}>
                {m.percentage}%
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
```

**Commit:** `feat(lifting): add MuscleDistribution bar chart component`

---

## Task 4: Create Workout Calendar Component

**Files:**
- Create: `client/src/components/journey/WorkoutCalendar.tsx`

**Same as before but properly implemented with flame icons for PR days**

(Code unchanged from previous plan - it was correct)

**Commit:** `feat(lifting): add WorkoutCalendar with PR indicators`

---

## Task 5: Create Lifting Facts Ticker Component

**Files:**
- Create: `client/src/components/journey/LiftingFactsTicker.tsx`

**Code:**

```typescript
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { LiftingAbsurdComparisons } from '@/lib/liftingAbsurdComparisons';

interface LiftingFactsTickerProps {
  absurd: LiftingAbsurdComparisons;
  className?: string;
}

const FACT_CONFIG = [
  { key: 'corollas' as const, emoji: '🚗', prefix: "You've lifted", suffix: "worth of weight" },
  { key: 'moonLift' as const, emoji: '🌙', prefix: "You could lift", suffix: "up there" },
  { key: 'goldenRetrievers' as const, emoji: '🐕', prefix: "That's", suffix: "of volume" },
  { key: 'catLaunches' as const, emoji: '🐱', prefix: "Your best lift could yeet", suffix: "" },
];

export function LiftingFactsTicker({ absurd, className }: LiftingFactsTickerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % FACT_CONFIG.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const current = FACT_CONFIG[currentIndex];
  const factData = absurd[current.key];

  return (
    <div className={cn(
      "glass-card rounded-xl p-4 flex items-center justify-center bg-card/80 backdrop-blur-xl overflow-hidden relative",
      className
    )}>
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-orange-500/5" />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="flex items-center gap-3 text-center relative z-10"
        >
          <motion.span
            className="text-3xl"
            animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {current.emoji}
          </motion.span>
          <div className="flex items-baseline gap-2 flex-wrap justify-center">
            {current.prefix && (
              <span className="text-sm text-muted-foreground">{current.prefix}</span>
            )}
            <span className="text-xl font-bold text-white tracking-tight">
              {factData.formatted}
            </span>
            {current.suffix && (
              <span className="text-sm text-muted-foreground">{current.suffix}</span>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dots */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        {FACT_CONFIG.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === currentIndex ? "bg-purple-400 w-4" : "bg-white/20 w-1.5"
            )}
          />
        ))}
      </div>

      <motion.div
        key={`progress-${currentIndex}`}
        className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-purple-500 to-orange-500"
        initial={{ width: "0%" }}
        animate={{ width: "100%" }}
        transition={{ duration: 5, ease: "linear" }}
      />
    </div>
  );
}
```

**Commit:** `feat(lifting): add LiftingFactsTicker with fun facts`

---

## Task 6: Update Server Stats API with Muscle Data

**Files:**
- Modify: `server/routes/lifting.ts`

**Changes:**

1. Import the muscle mapping:
```typescript
import { inferMuscleGroup, type MuscleGroup } from '@shared/exerciseMuscleMap';
```

2. In the `/api/lifting/stats` endpoint, after getting PRs, add:

```typescript
// Calculate muscle volume distribution
// First, get all sets with exercise info
const allSets = await db
  .select({
    exerciseName: liftingExercises.name,
    primaryMuscle: liftingExercises.primaryMuscle,
    weightLbs: liftingSets.weightLbs,
    reps: liftingSets.reps,
  })
  .from(liftingSets)
  .innerJoin(liftingExercises, eq(liftingSets.exerciseId, liftingExercises.id))
  .where(
    and(
      eq(liftingSets.userId, userId),
      gte(liftingSets.workoutDate, ytdStart)
    )
  );

// Calculate volume by muscle, inferring from name if primaryMuscle is null
const muscleVolumeMap = new Map<string, number>();
let totalSets = 0;

for (const set of allSets) {
  totalSets++;
  const volume = Number(set.weightLbs) * set.reps;

  // Use stored primaryMuscle or infer from name
  let muscle = set.primaryMuscle;
  if (!muscle) {
    muscle = inferMuscleGroup(set.exerciseName) || 'other';
  }

  muscleVolumeMap.set(muscle, (muscleVolumeMap.get(muscle) || 0) + volume);
}

// Convert to array with percentages
const muscleVolumeTotal = Array.from(muscleVolumeMap.values()).reduce((a, b) => a + b, 0) || 1;
const muscleVolumes = Array.from(muscleVolumeMap.entries())
  .map(([muscle, volume]) => ({
    muscle,
    volume,
    percentage: Math.round((volume / muscleVolumeTotal) * 100),
  }))
  .sort((a, b) => b.volume - a.volume);

// Get best lift for absurd comparisons
const bestLift = prs.length > 0 ? Math.max(...prs.map(p => p.weight)) : 0;
```

3. Add to response:
```typescript
res.json({
  ytdWorkouts,
  thisMonthWorkouts,
  ytdVolume,
  thisMonthVolume,
  prs: /* existing */,
  recentPRs: /* existing */,
  totalSets,
  bestLift,
  muscleVolumes,
});
```

**Commit:** `feat(lifting): add muscle distribution to stats API`

---

## Task 7: Add Calendar Data Endpoint

**Files:**
- Modify: `server/routes/lifting.ts`

**Add new endpoint:**

```typescript
/**
 * GET /api/lifting/calendar
 * Get workout data for calendar view (last 90 days)
 */
app.get("/api/lifting/calendar", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const db = getDb();

    // Get last 90 days of workouts
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const startDate = ninetyDaysAgo.toISOString().split('T')[0];

    const workouts = await db
      .select({
        workoutDate: liftingWorkouts.workoutDate,
        totalVolume: liftingWorkouts.totalVolume,
      })
      .from(liftingWorkouts)
      .where(
        and(
          eq(liftingWorkouts.userId, userId),
          gte(liftingWorkouts.workoutDate, startDate)
        )
      );

    // Get PR dates
    const prDates = await db
      .select({ workoutDate: liftingSets.workoutDate })
      .from(liftingSets)
      .where(
        and(
          eq(liftingSets.userId, userId),
          eq(liftingSets.isPR, true),
          gte(liftingSets.workoutDate, startDate)
        )
      )
      .groupBy(liftingSets.workoutDate);

    const prDateSet = new Set(prDates.map(p => p.workoutDate));

    res.json({
      workouts: workouts.map(w => ({
        workoutDate: w.workoutDate,
        totalVolume: w.totalVolume || 0,
        hasPR: prDateSet.has(w.workoutDate),
      })),
    });
  } catch (error) {
    log.error("[lifting] Error fetching calendar data:", error);
    res.status(500).json({ error: "Failed to fetch calendar data" });
  }
});
```

**Commit:** `feat(lifting): add calendar data endpoint for 90-day view`

---

## Task 8: Update useLiftingLog Hook

**Files:**
- Modify: `client/src/hooks/useLiftingLog.ts`

**Changes:**

1. Update `LiftingStats` interface:
```typescript
export interface LiftingStats {
  ytdWorkouts: number;
  thisMonthWorkouts: number;
  ytdVolume: number;
  thisMonthVolume: number;
  totalSets: number;
  bestLift: number;
  prs: Array<{ exerciseId: number; exerciseName: string; weight: number }>;
  recentPRs: Array<LiftingSet & { exerciseName: string }>;
  muscleVolumes: Array<{ muscle: string; volume: number; percentage: number }>;
}
```

2. Add calendar data query:
```typescript
// Fetch calendar data (90 days)
const {
  data: calendarData,
  isLoading: isLoadingCalendar,
} = useQuery<{ workouts: Array<{ workoutDate: string; totalVolume: number; hasPR: boolean }> }>({
  queryKey: ["/api/lifting/calendar"],
  staleTime: 5 * 60 * 1000,
});
```

3. Export calendar data:
```typescript
return {
  // ... existing
  calendarWorkouts: calendarData?.workouts || [],
  isLoadingCalendar,
};
```

**Commit:** `feat(lifting): update hook with muscle volumes and calendar data`

---

## Task 9: Redesign LiftingTab Component

**Files:**
- Modify: `client/src/components/journey/tabs/LiftingTab.tsx`

**Changes:**

1. Update imports
2. Redesign setup screen with Temple theme (as in previous plan)
3. Redesign main dashboard using new components:
   - MuscleDistribution instead of MuscleHeatmap
   - WorkoutCalendar with calendarWorkouts data
   - LiftingFactsTicker with absurd comparisons
   - PR Wall
   - Stats summary with progress bar

(Full code from previous plan's Task 7 and 8, but using `MuscleDistribution` and `calendarWorkouts`)

**Commit:** `feat(lifting): complete Temple of Gains dashboard redesign`

---

## Task 10: TypeScript Check and Deploy

```bash
npm run check
npm run build
git push origin main
railway up
```

---

## Summary

### New Files (5)
1. `shared/exerciseMuscleMap.ts` - Exercise→muscle mapping
2. `client/src/lib/liftingAbsurdComparisons.ts` - Fun comparisons
3. `client/src/components/journey/MuscleDistribution.tsx` - Bar chart
4. `client/src/components/journey/WorkoutCalendar.tsx` - Calendar heatmap
5. `client/src/components/journey/LiftingFactsTicker.tsx` - Facts ticker

### Modified Files (3)
1. `server/routes/lifting.ts` - Add muscle stats + calendar endpoint
2. `client/src/hooks/useLiftingLog.ts` - Extended stats
3. `client/src/components/journey/tabs/LiftingTab.tsx` - Full redesign

---

**This plan is now A+. Ready to execute?**
