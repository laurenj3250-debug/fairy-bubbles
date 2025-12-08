# Kilter Board Personality Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current ClimbingTab with a personality-focused Kilter Board experience featuring emoji-forward hero cards, grade milestones, session calendar heatmap, and rotating absurd facts ticker.

**Architecture:** Completely rewrite `ClimbingTab.tsx` with a new 6-column grid layout. Add personality display mapping (internal types → fun display names). Create session calendar component. Keep all existing hooks and data sources unchanged.

**Tech Stack:** React, TypeScript, Tailwind CSS, date-fns, Framer Motion (for ticker animation)

---

## Design Reference

**Grid Layout:**
```
Row 1: [  Personality Hero (4 cols)  ][Max Grade (2)]
Row 2: [Milestones (2)][Pyramid (2)][Angle Perf (2)]
Row 3: [  Recent Sends (3 cols)     ][Session Cal (3)]
Row 4: [     Rotating Absurd Facts Ticker (6 cols)    ]
```

**Personality Type Mapping:**
| Internal Type | Display Name | Emoji | Color |
|--------------|--------------|-------|-------|
| FLASH_MASTER | The Flasher | ⚡ | Emerald (#10b981) |
| PROJECT_CRUSHER | The Projector | 🎯 | Purple (#a855f7) |
| VOLUME_WARRIOR | The Crusher | 💪 | Orange (#f97316) |
| CONSISTENCY_KING | The Consistent | 🎸 | Cyan (#06b6d4) |
| ANGLE_DEMON | The Explorer | 🧭 | Amber (#f59e0b) |

---

## Task 1: Add Personality Display Mapping

**Files:**
- Modify: `client/src/lib/climbingPersonality.ts`

**Step 1: Add display name mapping constant**

Add after the existing `PERSONALITY_DATA` constant (around line 64):

```typescript
export const PERSONALITY_DISPLAY: Record<PersonalityType, {
  displayName: string;
  emoji: string;
  color: string;
  bgGradient: string;
}> = {
  FLASH_MASTER: {
    displayName: 'The Flasher',
    emoji: '⚡',
    color: '#10b981',
    bgGradient: 'from-emerald-500/20 to-emerald-900/10',
  },
  PROJECT_CRUSHER: {
    displayName: 'The Projector',
    emoji: '🎯',
    color: '#a855f7',
    bgGradient: 'from-purple-500/20 to-purple-900/10',
  },
  VOLUME_WARRIOR: {
    displayName: 'The Crusher',
    emoji: '💪',
    color: '#f97316',
    bgGradient: 'from-orange-500/20 to-orange-900/10',
  },
  CONSISTENCY_KING: {
    displayName: 'The Consistent',
    emoji: '🎸',
    color: '#06b6d4',
    bgGradient: 'from-cyan-500/20 to-cyan-900/10',
  },
  ANGLE_DEMON: {
    displayName: 'The Explorer',
    emoji: '🧭',
    color: '#f59e0b',
    bgGradient: 'from-amber-500/20 to-amber-900/10',
  },
};
```

**Step 2: Verify TypeScript compiles**

Run: `npm run check`
Expected: No errors related to climbingPersonality.ts

**Step 3: Commit**

```bash
git add client/src/lib/climbingPersonality.ts
git commit -m "feat: add personality display mapping with emojis and colors"
```

---

## Task 2: Create Session Calendar Component

**Files:**
- Create: `client/src/components/journey/SessionCalendar.tsx`

**Step 1: Create the session calendar component**

```typescript
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { format, subDays, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';

interface SessionCalendarProps {
  sessions: Array<{ sessionDate: string; problemsSent: number }>;
  className?: string;
}

export function SessionCalendar({ sessions, className }: SessionCalendarProps) {
  // Generate last 12 weeks of dates (84 days)
  const calendarData = useMemo(() => {
    const today = new Date();
    const startDate = startOfWeek(subDays(today, 77)); // ~11 weeks ago, start of that week

    const weeks: Date[][] = [];
    let currentDate = startDate;

    for (let w = 0; w < 12; w++) {
      const week: Date[] = [];
      for (let d = 0; d < 7; d++) {
        week.push(currentDate);
        currentDate = addDays(currentDate, 1);
      }
      weeks.push(week);
    }

    return weeks;
  }, []);

  // Create lookup for session data
  const sessionLookup = useMemo(() => {
    const lookup = new Map<string, number>();
    sessions.forEach(s => {
      const dateKey = s.sessionDate.split('T')[0];
      lookup.set(dateKey, (lookup.get(dateKey) || 0) + s.problemsSent);
    });
    return lookup;
  }, [sessions]);

  // Find max for intensity scaling
  const maxSends = Math.max(...Array.from(sessionLookup.values()), 1);

  const getIntensity = (date: Date): number => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const sends = sessionLookup.get(dateKey) || 0;
    if (sends === 0) return 0;
    // Scale 1-4 based on relative activity
    return Math.min(4, Math.ceil((sends / maxSends) * 4));
  };

  const intensityColors = [
    'bg-white/5',           // 0: no activity
    'bg-purple-900/40',     // 1: low
    'bg-purple-700/50',     // 2: medium
    'bg-purple-500/60',     // 3: high
    'bg-purple-400',        // 4: very high
  ];

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
        Session History
      </div>

      {/* Calendar grid */}
      <div className="flex gap-0.5">
        {calendarData.map((week, weekIdx) => (
          <div key={weekIdx} className="flex flex-col gap-0.5">
            {week.map((date, dayIdx) => {
              const intensity = getIntensity(date);
              const isToday = isSameDay(date, new Date());
              const sends = sessionLookup.get(format(date, 'yyyy-MM-dd')) || 0;

              return (
                <div
                  key={dayIdx}
                  className={cn(
                    "w-3 h-3 rounded-sm transition-all",
                    intensityColors[intensity],
                    isToday && "ring-1 ring-purple-400",
                    intensity > 0 && "hover:scale-125 cursor-default"
                  )}
                  title={`${format(date, 'MMM d')}: ${sends} sends`}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
        <span>Less</span>
        {intensityColors.map((color, i) => (
          <div key={i} className={cn("w-2.5 h-2.5 rounded-sm", color)} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `npm run check`
Expected: No errors related to SessionCalendar.tsx

**Step 3: Commit**

```bash
git add client/src/components/journey/SessionCalendar.tsx
git commit -m "feat: add SessionCalendar component with GitHub-style heatmap"
```

---

## Task 3: Create Absurd Facts Ticker Component

**Files:**
- Create: `client/src/components/journey/AbsurdFactsTicker.tsx`

**Step 1: Create the ticker component**

```typescript
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { AbsurdComparisons } from '@/lib/absurdComparisons';

interface AbsurdFactsTickerProps {
  absurd: AbsurdComparisons;
  className?: string;
}

const FACT_CONFIG = [
  { key: 'elephantsLifted', emoji: '🐘', label: 'lifted' },
  { key: 'eiffelTowers', emoji: '🗼', label: 'climbed' },
  { key: 'officeEpisodes', emoji: '📺', label: 'of The Office' },
  { key: 'bananasOfEnergy', emoji: '🍌', label: 'burned' },
] as const;

export function AbsurdFactsTicker({ absurd, className }: AbsurdFactsTickerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % FACT_CONFIG.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const current = FACT_CONFIG[currentIndex];
  const factData = absurd[current.key];

  return (
    <div className={cn(
      "glass-card rounded-xl p-4 flex items-center justify-center bg-card/80 backdrop-blur-xl overflow-hidden",
      className
    )}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3 text-center"
        >
          <span className="text-3xl">{current.emoji}</span>
          <div>
            <span className="text-lg font-bold text-white">
              {factData.formatted}
            </span>
            <span className="text-muted-foreground ml-2">{current.label}</span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dots indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
        {FACT_CONFIG.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-all",
              i === currentIndex ? "bg-purple-400 w-3" : "bg-white/20"
            )}
          />
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `npm run check`
Expected: No errors related to AbsurdFactsTicker.tsx

**Step 3: Commit**

```bash
git add client/src/components/journey/AbsurdFactsTicker.tsx
git commit -m "feat: add AbsurdFactsTicker with rotating facts and animations"
```

---

## Task 4: Rewrite ClimbingTab with Personality Hero

**Files:**
- Modify: `client/src/components/journey/tabs/ClimbingTab.tsx`

**Step 1: Rewrite the entire ClimbingTab component**

Replace the entire file content with:

```typescript
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { ClimbingLogDialog } from "@/components/ClimbingLogDialog";
import type { ClimbingStats } from "@/hooks/useClimbingStats";
import type { ClimbingTick, ClimbingTickInput, ClimbingLogStats } from "@/hooks/useClimbingLog";
import { PERSONALITY_DISPLAY } from "@/lib/climbingPersonality";
import { SessionCalendar } from "../SessionCalendar";
import { AbsurdFactsTicker } from "../AbsurdFactsTicker";

interface ClimbingTabProps {
  yearlyClimbsGoal: number;
  onUpdateGoal: (goalKey: string, value: number) => Promise<void>;
  isUpdating: boolean;
  kilterStats: ClimbingStats | null;
  isLoadingKilter: boolean;
  // Keep other props for compatibility but focus on Kilter
  stravaClimbingStats: unknown;
  isLoadingStravaClimbing: boolean;
  climbingLogTicks: ClimbingTick[];
  climbingLogStats: ClimbingLogStats | undefined;
  isLoadingClimbingLog: boolean;
  onCreateTick: (tick: ClimbingTickInput) => Promise<unknown>;
  onUpdateTick: (tick: Partial<ClimbingTickInput> & { id: number }) => Promise<unknown>;
  onDeleteTick: (id: number) => Promise<unknown>;
  isCreatingTick: boolean;
}

export function ClimbingTab({
  kilterStats,
  isLoadingKilter,
  climbingLogTicks,
  climbingLogStats,
  isLoadingClimbingLog,
  onCreateTick,
  onUpdateTick,
  onDeleteTick,
  isCreatingTick,
}: ClimbingTabProps) {
  const [showLogDialog, setShowLogDialog] = useState(false);

  const isConnected = kilterStats?.isConnected ?? false;
  const personality = kilterStats?.personality;
  const displayInfo = personality ? PERSONALITY_DISPLAY[personality.primary] : null;

  // Grade distribution for pyramid
  const gradeDistribution = kilterStats?.gradeDistribution ?? {};
  const gradePyramid = Object.entries(gradeDistribution)
    .map(([grade, count]) => ({ grade, count }))
    .sort((a, b) => {
      const aNum = parseInt(a.grade.replace('V', '')) || 0;
      const bNum = parseInt(b.grade.replace('V', '')) || 0;
      return aNum - bNum;
    })
    .slice(-5);
  const maxPyramidCount = Math.max(...gradePyramid.map(g => g.count), 1);

  // Recent sends from sessions
  const recentSends = kilterStats?.sessions?.slice(0, 3).flatMap(session =>
    (session.climbs || [])
      .filter(c => c.sent)
      .slice(0, 2)
      .map(climb => ({
        name: climb.name,
        grade: climb.grade,
        angle: session.boardAngle || 40,
        attempts: climb.attempts,
        date: new Date(session.sessionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      }))
  ).slice(0, 6) ?? [];

  // Angle performance - group sends by angle brackets
  const anglePerformance = kilterStats?.sessions?.reduce((acc, session) => {
    const angle = session.boardAngle || 40;
    const bracket = angle < 25 ? 'Slab' : angle < 40 ? 'Vert' : angle < 50 ? 'Steep' : 'Cave';
    acc[bracket] = (acc[bracket] || 0) + session.problemsSent;
    return acc;
  }, {} as Record<string, number>) ?? {};

  // Milestones
  const milestones = [
    { label: 'First V5+', achieved: parseInt(kilterStats?.maxGrade?.replace('V', '') || '0') >= 5 },
    { label: '100 Sends', achieved: (kilterStats?.totalProblemsSent ?? 0) >= 100 },
    { label: '50% Flash', achieved: (kilterStats?.flashRate ?? 0) >= 50 },
    { label: '10 Sessions', achieved: (kilterStats?.totalSessions ?? 0) >= 10 },
  ];

  if (isLoadingKilter) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted-foreground">Loading Kilter data...</div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="text-6xl">🧗</div>
        <div className="text-xl font-semibold text-muted-foreground">Connect Kilter Board</div>
        <div className="text-sm text-muted-foreground">Link your account to see personality insights</div>
      </div>
    );
  }

  return (
    <div className="flex-1 grid grid-cols-6 gap-3 min-h-0">
      {/* ═══════════ ROW 1: Personality Hero + Max Grade ═══════════ */}

      {/* Personality Hero - 4 cols */}
      <div
        className={cn(
          "col-span-4 glass-card rounded-xl p-5 flex items-center gap-5 relative overflow-hidden bg-card/80 backdrop-blur-xl",
          displayInfo && `bg-gradient-to-br ${displayInfo.bgGradient}`
        )}
        style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}
      >
        {displayInfo ? (
          <>
            {/* Giant emoji */}
            <div className="text-7xl flex-shrink-0">{displayInfo.emoji}</div>

            {/* Personality info */}
            <div className="flex-1 min-w-0">
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">
                Your Climbing Personality
              </div>
              <div
                className="text-3xl font-bold truncate"
                style={{ color: displayInfo.color }}
              >
                {displayInfo.displayName}
              </div>
              <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {personality?.tagline}
              </div>

              {/* Trait pills */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {personality?.traits.slice(0, 3).map((trait, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 text-xs rounded-full bg-white/10 text-white/80"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>

            {/* Score badge */}
            <div className="absolute top-3 right-3 text-right">
              <div
                className="text-2xl font-bold"
                style={{ color: displayInfo.color }}
              >
                {personality?.scores[personality.primary]}%
              </div>
              <div className="text-xs text-muted-foreground">match</div>
            </div>
          </>
        ) : (
          <div className="flex-1 text-center py-4">
            <div className="text-4xl mb-2">🔮</div>
            <div className="text-muted-foreground">
              Complete 5+ sessions to unlock your personality
            </div>
            <div className="text-sm text-muted-foreground/70 mt-1">
              {kilterStats?.totalSessions ?? 0} / 5 sessions
            </div>
          </div>
        )}
      </div>

      {/* Max Grade - 2 cols */}
      <div className="col-span-2 glass-card rounded-xl p-4 flex flex-col justify-center bg-card/80 backdrop-blur-xl">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          Highest Send
        </div>
        <div className="text-5xl font-bold text-purple-400 mt-1">
          {kilterStats?.maxGrade ?? 'V0'}
        </div>
        <div className="flex items-center gap-3 mt-2 text-sm">
          <span className="text-emerald-400">{kilterStats?.totalProblemsSent ?? 0} sends</span>
          <span className="text-muted-foreground">{kilterStats?.totalSessions ?? 0} sessions</span>
        </div>
      </div>

      {/* ═══════════ ROW 2: Milestones + Pyramid + Angle ═══════════ */}

      {/* Milestones - 2 cols */}
      <div className="col-span-2 glass-card rounded-xl p-4 bg-card/80 backdrop-blur-xl">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">
          Milestones
        </div>
        <div className="space-y-2">
          {milestones.map((m, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className={cn(
                "text-lg",
                m.achieved ? "" : "grayscale opacity-40"
              )}>
                {m.achieved ? '✅' : '⬜'}
              </span>
              <span className={cn(
                "text-sm",
                m.achieved ? "text-white" : "text-muted-foreground"
              )}>
                {m.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Grade Pyramid - 2 cols */}
      <div className="col-span-2 glass-card rounded-xl p-4 bg-card/80 backdrop-blur-xl">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
          Grade Pyramid
        </div>
        <div className="flex-1 flex flex-col justify-center gap-1">
          {gradePyramid.map(({ grade, count }) => (
            <div key={grade} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-6 text-right font-medium">{grade}</span>
              <div className="flex-1 h-3 bg-muted/30 rounded overflow-hidden">
                <div
                  className="h-full rounded bg-purple-500"
                  style={{ width: `${(count / maxPyramidCount) * 100}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-purple-400 w-6">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Angle Performance - 2 cols */}
      <div className="col-span-2 glass-card rounded-xl p-4 bg-card/80 backdrop-blur-xl">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
          Angle Performance
        </div>
        <div className="flex-1 grid grid-cols-2 gap-2">
          {['Slab', 'Vert', 'Steep', 'Cave'].map(bracket => (
            <div key={bracket} className="text-center">
              <div className="text-lg font-bold text-cyan-400">
                {anglePerformance[bracket] ?? 0}
              </div>
              <div className="text-xs text-muted-foreground">{bracket}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════ ROW 3: Recent Sends + Session Calendar ═══════════ */}

      {/* Recent Sends - 3 cols */}
      <div className="col-span-3 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl overflow-hidden">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2 flex items-center justify-between">
          <span>Recent Sends</span>
          <button
            onClick={() => setShowLogDialog(true)}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Log
          </button>
        </div>
        <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto">
          {recentSends.length > 0 ? recentSends.map((climb, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg border",
                climb.attempts === 1
                  ? "bg-gradient-to-r from-emerald-500/10 to-transparent border-emerald-500/30"
                  : "bg-white/[0.02] border-border/20"
              )}
            >
              <div className="text-center flex-shrink-0">
                <div className="text-sm font-bold text-purple-400">{climb.grade}</div>
                <div className="text-[10px] text-muted-foreground">{climb.angle}°</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{climb.name}</div>
                <div className="text-xs text-muted-foreground">
                  {climb.attempts === 1 ? '⚡ Flash' : `↻ ${climb.attempts} tries`}
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{climb.date}</span>
            </div>
          )) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              No recent sends
            </div>
          )}
        </div>
      </div>

      {/* Session Calendar - 3 cols */}
      <div className="col-span-3 glass-card rounded-xl p-4 bg-card/80 backdrop-blur-xl">
        <SessionCalendar
          sessions={kilterStats?.sessions ?? []}
        />
      </div>

      {/* ═══════════ ROW 4: Absurd Facts Ticker ═══════════ */}

      {kilterStats?.absurd && (
        <AbsurdFactsTicker
          absurd={kilterStats.absurd}
          className="col-span-6 relative"
        />
      )}

      {/* Climbing Log Dialog */}
      <ClimbingLogDialog
        open={showLogDialog}
        onOpenChange={setShowLogDialog}
        onSubmit={async (tick) => {
          await onCreateTick(tick);
        }}
        isSubmitting={isCreatingTick}
      />
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `npm run check`
Expected: No errors related to ClimbingTab.tsx

**Step 3: Run dev server and verify visual appearance**

Run: `npm run dev`
Expected: Navigate to Journey page, Climbing tab shows new personality-focused layout

**Step 4: Commit**

```bash
git add client/src/components/journey/tabs/ClimbingTab.tsx
git commit -m "feat: redesign ClimbingTab with personality hero and grid layout"
```

---

## Task 5: Polish and Responsive Adjustments

**Files:**
- Modify: `client/src/components/journey/tabs/ClimbingTab.tsx`

**Step 1: Add row height constraints for proper grid sizing**

Update the grid container className from:
```typescript
className="flex-1 grid grid-cols-6 gap-3 min-h-0"
```

To:
```typescript
className="flex-1 grid grid-cols-6 grid-rows-[auto_1fr_1fr_auto] gap-3 min-h-0"
```

**Step 2: Verify layout displays correctly at different viewport sizes**

Run: `npm run dev`
Expected: Grid rows expand appropriately, no overflow issues

**Step 3: Commit**

```bash
git add client/src/components/journey/tabs/ClimbingTab.tsx
git commit -m "fix: add row height constraints to climbing grid layout"
```

---

## Task 6: Final Testing and Cleanup

**Step 1: Run type checker**

Run: `npm run check`
Expected: No TypeScript errors

**Step 2: Test with real Kilter data**

1. Login with account that has Kilter Board connected
2. Navigate to Journey page → Climbing tab
3. Verify:
   - Personality hero shows correct type/emoji/color
   - Max grade displays correctly
   - Milestones reflect actual achievements
   - Grade pyramid renders with real data
   - Session calendar shows activity heatmap
   - Absurd facts ticker rotates through 4 facts

**Step 3: Test empty/loading states**

1. Test with account that has NO Kilter Board connected
2. Verify "Connect Kilter Board" empty state displays
3. Verify loading state during data fetch

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete Kilter Board personality redesign"
```

---

## Summary of Changes

| File | Action | Description |
|------|--------|-------------|
| `client/src/lib/climbingPersonality.ts` | Modified | Added PERSONALITY_DISPLAY mapping with emojis and colors |
| `client/src/components/journey/SessionCalendar.tsx` | Created | GitHub-style session heatmap component |
| `client/src/components/journey/AbsurdFactsTicker.tsx` | Created | Rotating facts ticker with Framer Motion |
| `client/src/components/journey/tabs/ClimbingTab.tsx` | Rewritten | Complete redesign with personality-focused grid layout |

## Key Data Sources (unchanged)

- `useClimbingStats` hook provides: personality, absurd, sessions, gradeDistribution
- `calculatePersonality` returns: primary type, scores, description, traits, tagline
- `calculateAllAbsurdComparisons` returns: elephants, eiffel towers, office episodes, bananas
