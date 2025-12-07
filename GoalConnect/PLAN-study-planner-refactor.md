# Implementation Plan: Study Planner Refactor & Enhancement

## Summary
Refactor the monolithic 750-line `StudyPlanner.tsx` into well-structured components and custom hooks, add configurable weekly schedules, implement actual linking between weekly tasks and tracking items, and add streaks/analytics visualization.

## Requirements

### Functional
- [ ] Break monolithic component into 6-8 smaller, focused components
- [ ] Extract data fetching into custom hooks (`useStudyPlanner`)
- [ ] Make weekly schedule configurable (which tasks on which days)
- [ ] Link weekly task completions to actual items (when checking "Chapter Work", select which chapter)
- [ ] Add streak tracking for RemNote daily reviews
- [ ] Add completion trends/history visualization
- [ ] Add "Reset Week" button for manual schedule clearing
- [ ] Show completion rates (this week vs all time)

### Non-Functional
- [ ] Each component under 150 lines
- [ ] Type definitions in shared location
- [ ] Follow existing hook patterns (see `useLiftingStats.ts`)
- [ ] Maintain dark forest theme styling

## Architecture Overview

### Current State (Problems)
```
StudyPlanner.tsx (750+ lines)
├── 16 useState hooks
├── 12 useMutation hooks
├── 4 useQuery hooks
├── Inline types (not shared)
├── Hardcoded WEEKLY_SCHEDULE constant
├── No actual linking logic
└── No analytics/streaks
```

### Target State
```
pages/
└── StudyPlanner.tsx (~100 lines, orchestrator only)

hooks/
└── useStudyPlanner.ts (queries + mutations)

components/study/
├── StudyStatsBar.tsx        (progress cards)
├── WeeklyScheduleGrid.tsx   (week view + checkboxes)
├── WeeklyScheduleRow.tsx    (single task row)
├── BooksList.tsx            (collapsible books)
├── BookChapterItem.tsx      (chapter with 2-step workflow)
├── PapersList.tsx           (papers checklist)
├── MriLecturesList.tsx      (lectures checklist)
├── StudyItemDialog.tsx      (shared add/edit dialog)
├── TaskLinkingPopover.tsx   (select item when completing weekly task)
├── StudyStreakChart.tsx     (RemNote streak visualization)
└── StudyTrendsChart.tsx     (weekly completion trends)

shared/
└── types/study.ts           (shared type definitions)
```

---

## Implementation Phases

### Phase 1: Extract Types & Hook - Complexity: Simple

**Goal**: Move types to shared location, create `useStudyPlanner` hook

**Tasks:**
1. [ ] Create `shared/types/study.ts` with all study planner types
2. [ ] Create `client/src/hooks/useStudyPlanner.ts` with all queries/mutations
3. [ ] Update `StudyPlanner.tsx` to import from new locations
4. [ ] Verify app still works

**Files to Create:**
- `shared/types/study.ts`: Type definitions for StudyBook, StudyChapter, StudyPaper, StudyMriLecture, StudyScheduleLog, WeekData, StudyStats
- `client/src/hooks/useStudyPlanner.ts`: Custom hook with all useQuery/useMutation calls

**Files to Modify:**
- `client/src/pages/StudyPlanner.tsx`: Import types and hook

**Verification:**
- [ ] TypeScript compiles without errors
- [ ] App loads /study route without errors
- [ ] All CRUD operations still work

**Commit**: "refactor(study): extract types and useStudyPlanner hook"

---

### Phase 2: Extract UI Components - Complexity: Medium

**Goal**: Break StudyPlanner.tsx into focused components

**Tasks:**
1. [ ] Create `StudyStatsBar.tsx` (the 4 stat cards at top)
2. [ ] Create `WeeklyScheduleGrid.tsx` (week table with nav)
3. [ ] Create `BooksList.tsx` (collapsible books + chapters)
4. [ ] Create `PapersList.tsx` (papers with checkboxes)
5. [ ] Create `MriLecturesList.tsx` (lectures with checkboxes)
6. [ ] Create `StudyItemDialog.tsx` (reusable add dialog)
7. [ ] Refactor `StudyPlanner.tsx` to compose these components

**Files to Create:**
- `client/src/components/study/StudyStatsBar.tsx`
- `client/src/components/study/WeeklyScheduleGrid.tsx`
- `client/src/components/study/BooksList.tsx`
- `client/src/components/study/PapersList.tsx`
- `client/src/components/study/MriLecturesList.tsx`
- `client/src/components/study/StudyItemDialog.tsx`
- `client/src/components/study/index.ts` (barrel export)

**Files to Modify:**
- `client/src/pages/StudyPlanner.tsx`: Reduce to ~100 lines

**Verification:**
- [ ] StudyPlanner.tsx under 150 lines
- [ ] Each new component under 150 lines
- [ ] All existing functionality preserved
- [ ] No visual regressions

**Commit**: "refactor(study): extract UI into focused components"

---

### Phase 3: Configurable Schedule - Complexity: Medium

**Goal**: Move hardcoded schedule to database, add UI to configure

**Tasks:**
1. [ ] Add `study_schedule_config` table to schema
2. [ ] Add API routes for schedule config CRUD
3. [ ] Create default config on first load
4. [ ] Add schedule config UI (which tasks on which days)
5. [ ] Update `WeeklyScheduleGrid` to read from config

**Schema Addition:**
```typescript
study_schedule_config = pgTable("study_schedule_config", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  taskType: studyTaskTypeEnum("task_type").notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sun, 6=Sat
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});
```

**Files to Create:**
- Schema addition in `shared/schema.ts`
- `server/routes/study-planner.ts`: Add config routes

**Files to Modify:**
- `client/src/hooks/useStudyPlanner.ts`: Add config query
- `client/src/components/study/WeeklyScheduleGrid.tsx`: Use config
- `client/src/pages/StudyPlanner.tsx`: Add settings gear icon

**Verification:**
- [ ] Can toggle which tasks appear on which days
- [ ] Config persists across sessions
- [ ] Default config created for new users

**Commit**: "feat(study): configurable weekly schedule"

---

### Phase 4: Task-Item Linking - Complexity: Medium

**Goal**: When completing a weekly task, prompt to select which item was worked on

**Tasks:**
1. [ ] Create `TaskLinkingPopover.tsx` component
2. [ ] When user checks "Chapter Work", show popover to select chapter
3. [ ] Update schedule log with `linkedItemId` and `linkedItemType`
4. [ ] Show linked item name in the weekly grid cell (tooltip or mini-badge)
5. [ ] Optionally auto-update the chapter/paper/lecture completion status

**Files to Create:**
- `client/src/components/study/TaskLinkingPopover.tsx`

**Files to Modify:**
- `client/src/components/study/WeeklyScheduleGrid.tsx`: Show popover on task types that link
- `client/src/hooks/useStudyPlanner.ts`: Update toggle mutation to accept linked item
- `server/routes/study-planner.ts`: Update log creation to handle linking

**Verification:**
- [ ] Clicking "Chapter" checkbox shows chapter selector
- [ ] Selected chapter ID saved to schedule log
- [ ] Hovering completed task shows which item was linked
- [ ] Linking optional (can dismiss popover)

**Commit**: "feat(study): link weekly tasks to specific items"

---

### Phase 5: Streaks & Analytics - Complexity: Medium

**Goal**: Add streak tracking and completion trend visualization

**Tasks:**
1. [ ] Enhance `/api/study/stats` endpoint with:
   - Current RemNote streak (consecutive days)
   - Longest streak
   - Weekly completion rates (last 4 weeks)
   - Completion by task type
2. [ ] Create `StudyStreakChart.tsx` (flame icon + current/longest streak)
3. [ ] Create `StudyTrendsChart.tsx` (bar chart like `WeeklyProgressChart.tsx`)
4. [ ] Add "never miss twice" indicator (if missed yesterday, highlight today's task)

**Files to Create:**
- `client/src/components/study/StudyStreakChart.tsx`
- `client/src/components/study/StudyTrendsChart.tsx`

**Files to Modify:**
- `server/routes/study-planner.ts`: Enhance stats endpoint
- `client/src/hooks/useStudyPlanner.ts`: Add enhanced stats type
- `client/src/components/study/StudyStatsBar.tsx`: Add streak display
- `client/src/pages/StudyPlanner.tsx`: Add trends section

**API Enhancement:**
```typescript
interface EnhancedStudyStats {
  // Existing
  chapters: { total, imagesCompleted, cardsCompleted, fullyCompleted },
  papers: { total, completed },
  mriLectures: { total, completed },
  remnoteReviews: { totalDays },

  // New
  streaks: {
    remnoteCurrentStreak: number,
    remnoteLongestStreak: number,
    lastMissedDate: string | null,
  },
  weeklyTrends: Array<{
    weekStart: string,
    tasksCompleted: number,
    tasksPossible: number,
  }>,
  completionByType: Record<string, { completed: number, total: number }>,
}
```

**Verification:**
- [ ] Streak counter shows correct consecutive days
- [ ] Trends chart shows last 4 weeks
- [ ] "Missed yesterday" indicator appears when applicable
- [ ] Stats update in real-time after completions

**Commit**: "feat(study): add streaks and completion trends"

---

### Phase 6: Polish & Reset - Complexity: Simple

**Goal**: Add weekly reset, visual polish, edge cases

**Tasks:**
1. [ ] Add "Reset Week" button to clear current week's logs
2. [ ] Add confirmation dialog before reset
3. [ ] Add empty states for each list
4. [ ] Add loading skeletons
5. [ ] Add keyboard shortcuts (? for help)
6. [ ] Mobile responsive improvements

**Files to Modify:**
- `client/src/components/study/WeeklyScheduleGrid.tsx`: Add reset button
- `client/src/hooks/useStudyPlanner.ts`: Add reset mutation
- `server/routes/study-planner.ts`: Add reset endpoint
- Various components: Loading states, empty states

**Verification:**
- [ ] Reset clears all logs for current week only
- [ ] Confirmation prevents accidental reset
- [ ] Lists show helpful empty state messages
- [ ] Loading spinners during data fetch
- [ ] Works on mobile screens

**Commit**: "feat(study): weekly reset and polish"

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing functionality during refactor | Medium | High | Verify each phase before proceeding, keep old code until confirmed |
| Database migration issues | Low | High | Schema changes are additive only, no breaking changes |
| Performance regression with enhanced stats | Low | Medium | Use efficient SQL queries, add indexes if needed |

## Testing Strategy

### Manual Testing Checklist
- [ ] Add new book with chapters
- [ ] Toggle chapter images/cards checkboxes
- [ ] Add new paper and lecture
- [ ] Complete weekly task with/without linking
- [ ] Navigate between weeks
- [ ] Reset current week
- [ ] Verify streak counter accuracy
- [ ] Test on mobile viewport

## File Summary

**New Files (13):**
- `shared/types/study.ts`
- `client/src/hooks/useStudyPlanner.ts`
- `client/src/components/study/StudyStatsBar.tsx`
- `client/src/components/study/WeeklyScheduleGrid.tsx`
- `client/src/components/study/BooksList.tsx`
- `client/src/components/study/PapersList.tsx`
- `client/src/components/study/MriLecturesList.tsx`
- `client/src/components/study/StudyItemDialog.tsx`
- `client/src/components/study/TaskLinkingPopover.tsx`
- `client/src/components/study/StudyStreakChart.tsx`
- `client/src/components/study/StudyTrendsChart.tsx`
- `client/src/components/study/index.ts`

**Modified Files (3):**
- `shared/schema.ts` (add schedule config table)
- `server/routes/study-planner.ts` (enhance stats, add config routes)
- `client/src/pages/StudyPlanner.tsx` (reduce to orchestrator)

---

## Success Criteria

This implementation is complete when:
- [ ] `StudyPlanner.tsx` is under 150 lines
- [ ] All 6 phases implemented and tested
- [ ] Weekly schedule is user-configurable
- [ ] Weekly tasks can link to specific items
- [ ] Streak counter shows accurate consecutive days
- [ ] Trends chart shows 4-week history
- [ ] Reset week functionality works
- [ ] No visual regressions from current implementation

---

**Ready to proceed? Approve this plan to begin implementation.**
