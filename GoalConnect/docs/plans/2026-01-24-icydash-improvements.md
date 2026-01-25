# IcyDash Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix IcyDash mobile issues, remove unused Study Planner, and add Adventure photo timeline for "look back" feature.

**Architecture:** Three independent phases - (1) fix existing IcyDash responsive/UX issues, (2) remove unused Study Planner code entirely, (3) add Adventure timeline view with IcyDash widget integration.

**Tech Stack:** React 18, TypeScript, TanStack Query, Tailwind CSS, Wouter routing, date-fns

**Production Checklist:**
- [x] Centralized config (no magic strings/numbers in 2+ places)
- [x] Error boundaries around risky components
- [x] Skeleton loading states
- [x] Toast notifications for mutations
- [x] Optimistic updates where applicable
- [x] Mobile-friendly touch targets (44px+)
- [ ] E2E tests for critical paths
- [x] Accessibility basics (ARIA, keyboard nav)

---

## Phase 1: IcyDash Fixes

### Task 1.1: Fix MountainHero Responsive Margin

**Problem:** `MountainHero.tsx:42` has hardcoded `ml-[300px]` which breaks on mobile/tablet.

**Files:**
- Modify: `client/src/components/MountainHero.tsx:42-43`

**Step 1: Update MountainHero to use responsive margin**

Replace the hardcoded margin with responsive classes:

```tsx
// Before (line 42-43):
<div className="ml-[300px] max-w-[750px]">

// After:
<div className="ml-0 md:ml-[200px] lg:ml-[300px] max-w-full md:max-w-[750px] px-4 md:px-0">
```

**Step 2: Verify on multiple breakpoints**

Test at: 375px (mobile), 768px (tablet), 1440px (desktop)

**Step 3: Commit**

```bash
git add client/src/components/MountainHero.tsx
git commit -m "fix(MountainHero): responsive margin for mobile/tablet"
```

---

### Task 1.2: Make GoalsDeadlinesWidget Actions Visible on Mobile

**Problem:** `GoalsDeadlinesWidget.tsx:143` has `opacity-0 group-hover:opacity-100` which hides action buttons on touch devices.

**Files:**
- Modify: `client/src/components/GoalsDeadlinesWidget.tsx:133-149`

**Step 1: Update action button visibility**

```tsx
// Before (line 133-149):
<button
  onClick={() => onIncrement(goal.goalId)}
  disabled={isIncrementing}
  className={cn(
    "w-6 h-6 rounded flex items-center justify-center transition-all",
    "bg-white/5 hover:bg-peach-400/20",
    "text-[var(--text-muted)] hover:text-peach-400",
    "opacity-0 group-hover:opacity-100",  // PROBLEM: hidden on mobile
    "disabled:opacity-50"
  )}
>

// After:
<button
  onClick={() => onIncrement(goal.goalId)}
  disabled={isIncrementing}
  className={cn(
    "w-8 h-8 min-w-[44px] min-h-[44px] rounded-lg flex items-center justify-center transition-all",
    "bg-white/5 hover:bg-peach-400/20 active:bg-peach-400/30",
    "text-[var(--text-muted)] hover:text-peach-400",
    "opacity-100 md:opacity-0 md:group-hover:opacity-100",  // Always visible on mobile
    "disabled:opacity-50"
  )}
>
```

**Step 2: Commit**

```bash
git add client/src/components/GoalsDeadlinesWidget.tsx
git commit -m "fix(GoalsDeadlinesWidget): show action buttons on mobile touch devices"
```

---

### Task 1.3: Add Loading Skeleton to IcyDash

**Problem:** No loading skeleton - content pops in after data loads.

**Files:**
- Modify: `client/src/pages/IcyDash.tsx:418-514`

**Step 1: Create skeleton component for dashboard sections**

Add after imports (around line 45):

```tsx
function DashboardSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-40 bg-white/5 rounded" />
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="w-10 h-10 rounded-full bg-white/5" />
          ))}
        </div>
        <div className="flex gap-4">
          <div className="h-5 w-16 bg-white/5 rounded" />
          <div className="h-5 w-16 bg-white/5 rounded" />
        </div>
      </div>

      {/* Main grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Habits card */}
        <div className="md:col-span-2 glass-card frost-accent p-4">
          <div className="h-5 w-24 bg-white/5 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-4 w-20 bg-white/5 rounded" />
                <div className="flex gap-1 flex-1">
                  {[1, 2, 3, 4, 5, 6, 7].map(j => (
                    <div key={j} className="w-5 h-5 rounded-full bg-white/5" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar skeleton */}
        <div className="space-y-4">
          <div className="glass-card frost-accent p-4 h-32 bg-white/5 rounded" />
          <div className="glass-card frost-accent p-4 h-40 bg-white/5 rounded" />
        </div>
      </div>

      {/* Goals skeleton */}
      <div className="glass-card frost-accent p-4">
        <div className="h-5 w-32 bg-white/5 rounded mb-4" />
        <div className="flex gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 w-full bg-white/5 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Use skeleton when loading**

Find where `habitsLoading` is used (around line 418) and wrap the main content:

```tsx
{/* Main dashboard content */}
<div className="relative z-10 px-5 md:px-8 pb-24">
  <div className="max-w-[900px] ml-0 md:ml-[188px] space-y-5">
    {habitsLoading ? (
      <DashboardSkeleton />
    ) : (
      <>
        {/* existing content */}
      </>
    )}
  </div>
</div>
```

**Step 3: Commit**

```bash
git add client/src/pages/IcyDash.tsx
git commit -m "feat(IcyDash): add loading skeleton for better perceived performance"
```

---

### Task 1.4: Reduce Animated Particles on Mobile

**Problem:** 35 stars + 20 snowflakes = 55 animated elements, causing performance issues on mobile.

**Files:**
- Modify: `client/src/components/ForestBackground.tsx:55-99`

**Step 1: Add useMediaQuery hook check**

At top of ForestBackground component:

```tsx
import { useEffect, useState } from 'react';

export function ForestBackground() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const starCount = isMobile ? 10 : 35;
  const snowCount = isMobile ? 6 : 20;
```

**Step 2: Update star and snow generation to use variables**

```tsx
// Stars (line ~55)
{[...Array(starCount)].map((_, i) => (

// Snow (line ~85)
{[...Array(snowCount)].map((_, i) => (
```

**Step 3: Commit**

```bash
git add client/src/components/ForestBackground.tsx
git commit -m "perf(ForestBackground): reduce animated particles on mobile for better performance"
```

---

### Task 1.5: Set YearlyGoalsSection defaultHidden to false

**Problem:** Most important section starts collapsed - users don't see their goals.

**Files:**
- Modify: `client/src/pages/IcyDash.tsx:496-512`

**Step 1: Change defaultHidden prop**

```tsx
// Before:
<YearlyGoalsSection
  // ... other props
  defaultHidden  // or defaultHidden={true}
/>

// After:
<YearlyGoalsSection
  // ... other props
  defaultHidden={false}
/>
```

**Step 2: Commit**

```bash
git add client/src/pages/IcyDash.tsx
git commit -m "fix(IcyDash): show yearly goals expanded by default"
```

---

## Phase 2: Remove Study Planner

### Task 2.1: Remove Study Planner Route from App.tsx

**Files:**
- Modify: `client/src/App.tsx:32,265`

**Step 1: Remove import**

```tsx
// Delete line 32:
import StudyPlanner from "@/pages/StudyPlanner";
```

**Step 2: Remove route**

```tsx
// Delete or comment out line ~265:
<Route path="/study">
  <RequireAuth><StudyPlanner /></RequireAuth>
</Route>
```

**Step 3: Commit**

```bash
git add client/src/App.tsx
git commit -m "chore: remove StudyPlanner route"
```

---

### Task 2.2: Remove Study Links from Navigation

**Files:**
- Modify: `client/src/pages/StudyPlanner.tsx` (will be deleted)
- Modify: `client/src/pages/Habits.tsx`
- Modify: `client/src/pages/Goals.tsx`
- Modify: `client/src/pages/Todos.tsx`
- Modify: `client/src/pages/Journey.tsx`
- Modify: `client/src/pages/Settings.tsx`

**Step 1: Remove /study links from all navigation sidebars**

In each file, find and remove:
```tsx
<Link href="/study">
  <span className="...">study</span>
</Link>
```

**Step 2: Commit**

```bash
git add client/src/pages/*.tsx
git commit -m "chore: remove study links from navigation"
```

---

### Task 2.3: Delete Study Planner Files

**Files:**
- Delete: `client/src/pages/StudyPlanner.tsx`
- Delete: `client/src/components/study/` (entire folder)
- Delete: `client/src/hooks/useStudyPlanner.ts`

**Step 1: Remove files**

```bash
rm client/src/pages/StudyPlanner.tsx
rm -rf client/src/components/study/
rm client/src/hooks/useStudyPlanner.ts
```

**Step 2: Verify build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: delete unused StudyPlanner feature"
```

---

### Task 2.4: Remove AddBookDialog from IcyDash (Optional)

**Problem:** IcyDash has `AddBookDialog` that was for adding study books. Review if still needed.

**Files:**
- Review: `client/src/pages/IcyDash.tsx:546-555`

**Decision:** If `AddBookDialog` is only for study planner, remove it. If it's used for Media Library books, keep it.

**Step 1: Check what AddBookDialog does**

If it's study-only:
```tsx
// Remove import
// Remove state: const [addBookDialogOpen, setAddBookDialogOpen] = useState(false);
// Remove the dialog component
// Remove onAddBook callback from YearlyGoalsSection
```

**Step 2: Commit if changed**

```bash
git add client/src/pages/IcyDash.tsx
git commit -m "chore: remove study-related AddBookDialog from IcyDash"
```

---

## Phase 3: Adventure Photo Timeline

### Task 3.1: Create Timeline View Component

**Files:**
- Create: `client/src/components/adventures/AdventureTimeline.tsx`

**Step 1: Create the timeline component**

```tsx
/**
 * AdventureTimeline
 * Photo-forward scrollable timeline grouped by month/year
 */

import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { MapPin, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Adventure } from "@/hooks/useAdventures";

interface AdventureTimelineProps {
  adventures: Adventure[];
  onAdventureClick?: (adventure: Adventure) => void;
}

interface GroupedAdventures {
  label: string;
  yearMonth: string;
  adventures: Adventure[];
}

export function AdventureTimeline({ adventures, onAdventureClick }: AdventureTimelineProps) {
  // Group adventures by year-month
  const grouped = useMemo(() => {
    const groups: Record<string, Adventure[]> = {};

    adventures.forEach((adventure) => {
      const yearMonth = adventure.date.substring(0, 7); // "2026-01"
      if (!groups[yearMonth]) {
        groups[yearMonth] = [];
      }
      groups[yearMonth].push(adventure);
    });

    // Sort by date desc, convert to array
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([yearMonth, items]): GroupedAdventures => ({
        yearMonth,
        label: format(parseISO(`${yearMonth}-01`), "MMMM yyyy"),
        adventures: items.sort((a, b) => b.date.localeCompare(a.date)),
      }));
  }, [adventures]);

  if (adventures.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--text-muted)]">
        No adventures yet. Start logging your outdoor days!
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {grouped.map((group) => (
        <div key={group.yearMonth}>
          {/* Month header */}
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-lg font-heading text-peach-400">
              {group.label}
            </h3>
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-sm text-[var(--text-muted)]">
              {group.adventures.length} {group.adventures.length === 1 ? 'day' : 'days'}
            </span>
          </div>

          {/* Photo grid for this month */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {group.adventures.map((adventure) => (
              <button
                key={adventure.id}
                onClick={() => onAdventureClick?.(adventure)}
                className="group relative aspect-square rounded-lg overflow-hidden bg-white/5 border border-white/10 hover:border-peach-500/30 transition-all hover:scale-[1.02]"
              >
                {/* Photo */}
                {adventure.thumbPath ? (
                  <img
                    src={adventure.thumbPath}
                    alt={adventure.activity}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-peach-500/10 to-orange-500/10">
                    <Calendar className="w-8 h-8 text-peach-400/50" />
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Info on hover */}
                <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform">
                  <div className="text-xs text-white font-medium truncate">
                    {adventure.activity}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-white/70">
                    <span>{format(parseISO(adventure.date), "MMM d")}</span>
                    {adventure.location && (
                      <>
                        <span>•</span>
                        <MapPin className="w-2.5 h-2.5" />
                        <span className="truncate">{adventure.location}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Date badge (always visible) */}
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 rounded text-[10px] text-white font-medium">
                  {format(parseISO(adventure.date), "d")}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add client/src/components/adventures/AdventureTimeline.tsx
git commit -m "feat(adventures): add photo timeline component"
```

---

### Task 3.2: Add Timeline Tab to Adventures Page

**Files:**
- Modify: `client/src/pages/Adventures.tsx`

**Step 1: Import timeline component**

```tsx
import { AdventureTimeline } from "@/components/adventures/AdventureTimeline";
```

**Step 2: Add "Memory Lane" tab**

Update the Tab type and add new tab button:

```tsx
type Tab = "adventures" | "birds" | "timeline";

// In the tabs section, add:
<button
  onClick={() => setActiveTab("timeline")}
  className={cn(
    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
    activeTab === "timeline"
      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
      : "bg-white/5 text-[var(--text-muted)] border border-white/10 hover:bg-white/10"
  )}
>
  <Clock className="w-4 h-4" />
  Memory Lane
</button>
```

**Step 3: Add tab content**

```tsx
{activeTab === "timeline" && (
  <TimelineTab />
)}
```

**Step 4: Create TimelineTab component**

```tsx
function TimelineTab() {
  const { adventures, isLoading } = useAdventures({ limit: 100 });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="glass-card frost-accent p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="text-lg font-bold text-[var(--text-primary)]">
              Memory Lane
            </div>
            <div className="text-xs text-[var(--text-muted)]">
              Your outdoor adventures through time
            </div>
          </div>
        </div>
      </div>

      <AdventureTimeline
        adventures={adventures}
        onAdventureClick={(adventure) => {
          // Could open a detail modal or navigate
          console.log("View adventure:", adventure);
        }}
      />
    </div>
  );
}
```

**Step 5: Add Clock import**

```tsx
import { Clock } from "lucide-react";
```

**Step 6: Commit**

```bash
git add client/src/pages/Adventures.tsx
git commit -m "feat(adventures): add Memory Lane timeline tab"
```

---

### Task 3.3: Create Recent Adventures Widget for IcyDash

**Files:**
- Create: `client/src/components/RecentAdventuresWidget.tsx`

**Step 1: Create widget component**

```tsx
/**
 * RecentAdventuresWidget
 * Compact widget showing recent outdoor adventures with photos
 */

import { Link } from "wouter";
import { Mountain, ChevronRight, Calendar, MapPin } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useAdventures } from "@/hooks/useAdventures";

export function RecentAdventuresWidget() {
  const currentYear = new Date().getFullYear().toString();
  const { adventures, isLoading } = useAdventures({ year: currentYear, limit: 4 });

  // Count unique dates
  const uniqueDates = new Set(adventures.map(a => a.date)).size;

  return (
    <div className="glass-card frost-accent h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="card-title flex items-center gap-2">
          <Mountain className="w-4 h-4 text-peach-400" />
          Adventures
        </span>
        <Link href="/adventures">
          <a className="flex items-center gap-0.5 text-xs text-[var(--text-muted)] hover:text-peach-400 transition-colors">
            {uniqueDates} days
            <ChevronRight className="w-3 h-3" />
          </a>
        </Link>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-peach-400/20 border-t-peach-400 rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && adventures.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center py-6">
          <Mountain className="w-8 h-8 text-[var(--text-muted)]/50 mb-2" />
          <p className="text-xs text-[var(--text-muted)]">No adventures yet</p>
          <Link href="/adventures">
            <a className="text-xs text-peach-400 mt-1 hover:underline">+ Log adventure</a>
          </Link>
        </div>
      )}

      {/* Recent adventures grid */}
      {!isLoading && adventures.length > 0 && (
        <div className="grid grid-cols-2 gap-2 flex-1">
          {adventures.slice(0, 4).map((adventure) => (
            <Link key={adventure.id} href="/adventures?tab=timeline">
              <a className="group relative aspect-square rounded-lg overflow-hidden bg-white/5 hover:ring-1 hover:ring-peach-400/30 transition-all">
                {adventure.thumbPath ? (
                  <img
                    src={adventure.thumbPath}
                    alt={adventure.activity}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-peach-500/10 to-orange-500/10">
                    <Calendar className="w-5 h-5 text-peach-400/50" />
                  </div>
                )}

                {/* Date overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/70 to-transparent">
                  <div className="text-[10px] text-white/90 font-medium">
                    {format(parseISO(adventure.date), "MMM d")}
                  </div>
                </div>
              </a>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add client/src/components/RecentAdventuresWidget.tsx
git commit -m "feat: add RecentAdventuresWidget for IcyDash sidebar"
```

---

### Task 3.4: Add Widget to IcyDash Sidebar

**Files:**
- Modify: `client/src/pages/IcyDash.tsx`

**Step 1: Import widget**

```tsx
import { RecentAdventuresWidget } from '@/components/RecentAdventuresWidget';
```

**Step 2: Add to sidebar (after MediaWidget)**

Find the sidebar section (~line 479-487) and add:

```tsx
{/* RIGHT SIDEBAR: Stacked widgets */}
<div className="space-y-4">
  {/* Currently Reading/Watching */}
  <MediaWidget />

  {/* Recent Adventures */}
  <RecentAdventuresWidget />

  {/* Monthly Progress */}
  <MilestoneDonutWidget />
</div>
```

**Step 3: Commit**

```bash
git add client/src/pages/IcyDash.tsx
git commit -m "feat(IcyDash): add RecentAdventuresWidget to sidebar"
```

---

### Task 3.5: Create Index Export for Adventures Components

**Files:**
- Create: `client/src/components/adventures/index.ts`

**Step 1: Create index file**

```tsx
export { AdventureTimeline } from './AdventureTimeline';
```

**Step 2: Commit**

```bash
git add client/src/components/adventures/index.ts
git commit -m "chore: add adventures component index"
```

---

## Verification

### Final Checklist

After completing all tasks:

1. **Build verification**
   ```bash
   npm run build
   ```
   Expected: Build succeeds with no TypeScript errors

2. **Manual testing**
   - [ ] IcyDash loads with skeleton, then shows content
   - [ ] MountainHero title visible on mobile (375px)
   - [ ] GoalsDeadlinesWidget +1 buttons visible on mobile
   - [ ] YearlyGoals section expanded by default
   - [ ] No /study route or navigation links
   - [ ] Adventures page has "Memory Lane" tab
   - [ ] IcyDash sidebar shows recent adventures

3. **Performance check**
   - [ ] Mobile should have ~16 animated particles (not 55)

---

## Summary

| Phase | Tasks | Commits |
|-------|-------|---------|
| 1. IcyDash Fixes | 5 | 5 |
| 2. Remove Study | 4 | 4 |
| 3. Adventure Timeline | 5 | 5 |
| **Total** | **14** | **14** |

**Estimated effort:** 2-3 hours for experienced developer
