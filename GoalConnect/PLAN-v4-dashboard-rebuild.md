# Implementation Plan: V4 Dashboard Rebuild

## Summary
Rebuild the V4 dashboard to fix layout chaos, eliminate duplicate habit trackers, maximize information density, and create a cohesive visual identity. The goal is a clean, functional dashboard that combines the best of V2's visual flair with V3's solid information architecture.

## The Problems (from roast)
1. **3 duplicate habit trackers**: GlowingOrbHabits, HabitHeatmap "This Week", WeeklyRhythm radar
2. **Chaotic grid**: Nothing aligns, widgets are different heights
3. **Empty Route Beta**: 90% gray boxes, no tasks visible
4. **Poor To-Do density**: Shows 1 task despite having 4/5
5. **Low-value widgets**: "Peak of the Day" trivia, placeholder climbing goal
6. **Visual inconsistency**: Glass card opacity varies, orange glow clashes

## Requirements

### Functional
- [ ] Single, unified habit tracker (one source of truth)
- [ ] Visible task content in Route Beta (not empty boxes)
- [ ] To-Do panel shows at least 5 incomplete tasks
- [ ] Goals display with clear progress
- [ ] XP/streak tracking in header

### Non-Functional
- [ ] Consistent widget heights within rows
- [ ] Coherent color palette (unified with climbing theme)
- [ ] Responsive on tablet/desktop (mobile can defer to V3)
- [ ] Smooth animations without excessive particle effects

## Architecture Overview

**Keep from V4:**
- Glass card aesthetic
- XP/Coins header badges
- Climbing theme branding

**Adopt from V3:**
- `HabitGrid` component (proven, functional)
- `TodoDayColumn` for Route Beta
- `ProgressArc` for goals
- Layout structure and responsive patterns

**Remove:**
- `GlowingOrbHabits` (replaced by HabitGrid)
- `HabitHeatmap` "This Week" (duplicate)
- `WeeklyRhythm` radar chart (duplicate visualization)
- `PeakLoreWidget` (low value)

**Modify:**
- `TodoPanel` → increase max visible items
- Climbing Goal → integrate into goals or remove

## Implementation Phases

---

### Phase 1: Core Layout Fix - [Medium Complexity]

**Goal**: Establish a clean 12-column grid with consistent row heights

**Tasks:**
1. [ ] Remove duplicate components (GlowingOrbHabits, WeeklyRhythm, HabitHeatmap)
2. [ ] Import V3's HabitGrid, TodoDayColumn, ProgressArc components
3. [ ] Restructure to 3-row layout:
   - **Row 1**: Header with XP/Streak badges (full width)
   - **Row 2**: Goals (60%) + To-Do (40%)
   - **Row 3**: Habit Grid (full width)
   - **Row 4**: Route Beta todo calendar (full width)
4. [ ] Use consistent `min-h-[X]` for same-row widgets

**Files to Modify:**
- `client/src/pages/DashboardV4.tsx` - complete rewrite

**Verification Criteria:**
- [ ] All widgets in same row have equal height
- [ ] No duplicate habit trackers visible
- [ ] Grid columns align properly

**Commit Message**: "refactor(v4): Clean grid layout with V3 components"

---

### Phase 2: Functional Habit Tracking - [Simple]

**Goal**: Replace 3 habit trackers with single HabitGrid from V3

**Tasks:**
1. [ ] Import HabitGrid, HabitGridSkeleton from V3
2. [ ] Wire up with existing data fetching (habits-with-data, habit-logs)
3. [ ] Maintain toggle mutation with confetti
4. [ ] Keep streak display in header

**Data Flow:**
1. Fetch `/api/habits-with-data`
2. Fetch `/api/habit-logs/range/{start}/{end}`
3. Build completionMap
4. Render HabitGrid with toggle callbacks

**Files to Modify:**
- `client/src/pages/DashboardV4.tsx`

**Verification Criteria:**
- [ ] Single habit grid shows all habits
- [ ] Clicking toggles completion with confetti
- [ ] Week view shows Mon-Sun correctly

**Commit Message**: "feat(v4): Single habit grid replacing 3 duplicate trackers"

---

### Phase 3: Working Route Beta - [Simple]

**Goal**: Route Beta shows actual tasks instead of empty boxes

**Tasks:**
1. [ ] Import TodoDayColumn from V3
2. [ ] Use existing todosByDay computation
3. [ ] Enable inline task creation (onAddTodo)
4. [ ] Enable task completion (onToggleTodo)

**Files to Modify:**
- `client/src/pages/DashboardV4.tsx`

**Verification Criteria:**
- [ ] Each day column shows scheduled tasks
- [ ] Today column is highlighted
- [ ] Tasks can be checked off
- [ ] New tasks can be added to any day

**Commit Message**: "feat(v4): Working Route Beta with TodoDayColumn"

---

### Phase 4: Enhanced To-Do Panel - [Simple]

**Goal**: Show more tasks with better density

**Tasks:**
1. [ ] Increase `slice(0, 10)` limit in TodoPanel query display
2. [ ] Show priority colors consistently
3. [ ] Add quick-add inline (already exists)
4. [ ] Ensure panel fills available height

**Files to Modify:**
- `client/src/components/TodoPanel.tsx` (minor tweak)
- `client/src/pages/DashboardV4.tsx` (sizing)

**Verification Criteria:**
- [ ] Panel shows up to 8 incomplete tasks
- [ ] Priority colors visible
- [ ] Can add tasks inline

**Commit Message**: "fix(v4): To-Do panel shows more tasks"

---

### Phase 5: Goals Display Polish - [Simple]

**Goal**: Unified goals section with weekly + monthly

**Tasks:**
1. [ ] Keep Weekly Goals list format (works well)
2. [ ] Keep Monthly Summits progress rings
3. [ ] Remove climbing goal widget (or integrate as a goal)
4. [ ] Ensure consistent card heights

**Files to Modify:**
- `client/src/pages/DashboardV4.tsx`

**Verification Criteria:**
- [ ] Weekly goals show with checkmarks
- [ ] Monthly goals show progress %
- [ ] Cards are equal height

**Commit Message**: "polish(v4): Consistent goals display"

---

### Phase 6: Visual Polish - [Medium]

**Goal**: Cohesive visual identity

**Tasks:**
1. [ ] Standardize glass-card opacity to 0.85
2. [ ] Remove orange glow from completed holds (too bright)
3. [ ] Use `hsl(var(--primary))` consistently
4. [ ] Add subtle entrance animations (stagger)
5. [ ] Test dark theme compatibility

**Files to Modify:**
- `client/src/pages/DashboardV4.tsx`
- Possibly component tweaks

**Verification Criteria:**
- [ ] Uniform card appearance
- [ ] Colors work on both light/dark
- [ ] Animations are subtle, not distracting

**Commit Message**: "style(v4): Visual polish and consistency"

---

## Proposed Final Layout

```
┌─────────────────────────────────────────────────────────────┐
│  This Week ⛰️                               ⚡ XP  🔥 Streak │
│  December 1-7, 2024                         [415]   [7]     │
├─────────────────────────────────────┬───────────────────────┤
│  🎯 Weekly Goals                    │  📋 To-Do    [4/5]    │
│  ☑ Climb 4/4                        │  ○ Dentist appointment│
│  ○ Run 3 miles (1/3)                │  ○ Review PR          │
│  ○ Study Spanish (2/5)              │  ○ Grocery shopping   │
├─────────────────────────────────────┤  ○ Email Sarah        │
│  🏔️ Monthly Summits                 │  ○ Read chapter 5     │
│  [70%] Fitness  [50%] Learning      │  View all tasks →     │
├─────────────────────────────────────┴───────────────────────┤
│  ⚡ Daily Pitches                                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Habit      M   T   W   T   F   S   S  │ Streak         │ │
│  │ RemNote   [●] [●] [●] [ ] [ ] [ ] [ ] │ 3 days         │ │
│  │ Pimsleur  [ ] [●] [●] [●] [ ] [ ] [ ] │ 3 days         │ │
│  │ Gym       [●] [ ] [●] [ ] [ ] [ ] [ ] │ 2 days         │ │
│  └────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  📅 Route Beta   December 1-7                                │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐               │
│  │ Mon │ Tue │ Wed │ Thu │*Fri*│ Sat │ Sun │               │
│  │     │     │ Call│     │Dent│     │     │               │
│  │     │     │ Mom │     │ ist │     │     │               │
│  └─────┴─────┴─────┴─────┴─────┴─────┴─────┘               │
└─────────────────────────────────────────────────────────────┘
```

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| V3 components don't fit V4 styling | Medium | Low | Use same glass-card wrapper |
| Data fetching conflicts | Low | Medium | Reuse existing queries |
| Mobile layout breaks | Medium | Medium | Test responsive, fall back to V3 on mobile |

## Testing Strategy

### Manual Testing Checklist
- [ ] Load /v4 dashboard
- [ ] Toggle a habit - confirm confetti and state update
- [ ] Complete a todo - confirm it disappears
- [ ] Add a todo via Route Beta inline
- [ ] Check goals progress updates
- [ ] Resize window for responsive behavior
- [ ] Check dark/light mode

## Documentation Checklist
- [ ] Update DashboardV4 file header comment
- [ ] Remove old component imports if unused

## Success Criteria
This implementation is complete when:
- [ ] Single habit tracker (HabitGrid) replaces 3 duplicates
- [ ] Route Beta shows actual tasks per day
- [ ] To-Do panel shows 5+ items
- [ ] Grid layout is clean and aligned
- [ ] Visual style is consistent
- [ ] All interactions work (toggle, add, complete)

---

## Questions Before Starting
1. **Keep climbing theme?** (holds sent, Route Beta naming, etc.) → Assume yes
2. **Mobile priority?** → Defer to V3 for mobile, V4 is tablet/desktop focused
3. **Include Expeditions tab?** → Not in Phase 1, can add later

---

**Ready to proceed? Approve this plan to begin implementation.**
