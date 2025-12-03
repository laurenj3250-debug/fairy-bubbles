# Journey.tsx Refactoring Plan

**Goal:** Break up the 1295-line Journey.tsx monolith into maintainable, focused components.

## Current Problems

1. **Single file with 1295 lines** - Unmaintainable
2. **5 internal components** all defined inline:
   - `EditableGoal` (lines 14-79)
   - `CyclingTab` (lines 184-359)
   - `LiftingTab` (lines 370-449)
   - `ClimbingTab` (lines 468-1034)
   - Shared components: `HeroCell`, `StatCell`, `MonthlyBars`, `ProgressRing`, `PRItem` (lines 1036-1295)
3. **Duplicated empty states** - "Connect Strava" inline JSX repeated
4. **ClimbingTab is 566 lines** - A monster in its own right

## Architecture Design

```
client/src/
├── pages/
│   └── Journey.tsx                 # Slim orchestrator (~100 lines)
└── components/
    └── journey/
        ├── index.ts                # Barrel exports
        ├── tabs/
        │   ├── CyclingTab.tsx      # Strava cycling stats
        │   ├── LiftingTab.tsx      # Lifting stats (Liftosaur coming soon)
        │   └── ClimbingTab.tsx     # Kilter + Strava + Outdoor log
        ├── shared/
        │   ├── HeroCell.tsx        # Large stat display
        │   ├── StatCell.tsx        # Smaller stat card
        │   ├── MonthlyBars.tsx     # Bar chart component
        │   ├── ProgressRing.tsx    # Circular progress
        │   ├── PRItem.tsx          # Personal record item
        │   └── EditableGoal.tsx    # Inline editable goal
        └── EmptyState.tsx          # Reusable empty state
```

## Implementation Phases

### Phase 1: Create Shared Components
**Effort:** 30 min | **Complexity:** Simple

Extract shared components first (no logic changes, just move code).

**Files to Create:**
- `client/src/components/journey/shared/HeroCell.tsx`
- `client/src/components/journey/shared/StatCell.tsx`
- `client/src/components/journey/shared/MonthlyBars.tsx`
- `client/src/components/journey/shared/ProgressRing.tsx`
- `client/src/components/journey/shared/PRItem.tsx`
- `client/src/components/journey/shared/EditableGoal.tsx`
- `client/src/components/journey/EmptyState.tsx`
- `client/src/components/journey/shared/index.ts`

**EmptyState Design:**
```tsx
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}
```

**Verification:**
- [ ] TypeScript compiles
- [ ] Journey page renders unchanged
- [ ] All tabs display correctly

---

### Phase 2: Extract Tab Components
**Effort:** 45 min | **Complexity:** Medium

Move each tab to its own file. Props pass-through from parent.

**Files to Create:**
- `client/src/components/journey/tabs/CyclingTab.tsx`
- `client/src/components/journey/tabs/LiftingTab.tsx`
- `client/src/components/journey/tabs/ClimbingTab.tsx`
- `client/src/components/journey/tabs/index.ts`

**Files to Create:**
- `client/src/components/journey/index.ts` (barrel)

**Verification:**
- [ ] TypeScript compiles
- [ ] All tabs work with same functionality
- [ ] No visual changes

---

### Phase 3: Slim Down Journey.tsx
**Effort:** 20 min | **Complexity:** Simple

Journey.tsx becomes a thin orchestrator:
- Imports hooks
- Passes data to tabs
- Handles tab switching

**Target:** ~100 lines max

**Files to Modify:**
- `client/src/pages/Journey.tsx` - Replace inline components with imports

**Verification:**
- [ ] File is under 150 lines
- [ ] Clean imports
- [ ] All functionality preserved

---

### Phase 4: Fix ClimbingTab Complexity
**Effort:** 30 min | **Complexity:** Medium

ClimbingTab is 566 lines - too big. Extract:

**Sub-components to create:**
- `components/journey/climbing/KilterBoardSection.tsx`
- `components/journey/climbing/StravaClimbingSection.tsx`
- `components/journey/climbing/OutdoorLogSection.tsx`
- `components/journey/climbing/ClimbingLogTable.tsx`

**Verification:**
- [ ] ClimbingTab.tsx under 200 lines
- [ ] All sub-sections work
- [ ] Outdoor log dialog still works

---

## File Size Targets

| File | Current | Target |
|------|---------|--------|
| Journey.tsx | 1295 lines | ~100 lines |
| CyclingTab.tsx | N/A | ~150 lines |
| LiftingTab.tsx | N/A | ~100 lines |
| ClimbingTab.tsx | N/A | ~200 lines |
| Shared components | N/A | ~50 lines each |

---

## Testing Strategy

**Manual Testing:**
- [ ] Cycling tab shows Strava data or empty state
- [ ] Lifting tab shows "Coming Soon"
- [ ] Climbing tab shows all 3 sections
- [ ] Outdoor log CRUD works
- [ ] Editable goals work
- [ ] Tab switching works

**TypeScript:**
- [ ] `npm run check` passes

---

## Rollback Plan

If something breaks:
1. Git checkout the original Journey.tsx
2. Delete `components/journey/` directory

---

## What This Plan Does NOT Do

- **No logic changes** - Pure refactoring
- **No new features** - Same functionality
- **No hook refactoring** - Hooks stay in `/hooks`
- **No API changes** - Backend untouched

---

## Estimated Total Effort

| Phase | Effort |
|-------|--------|
| Phase 1: Shared components | 30 min |
| Phase 2: Tab components | 45 min |
| Phase 3: Slim Journey.tsx | 20 min |
| Phase 4: ClimbingTab breakdown | 30 min |
| **Total** | **~2 hours** |

---

## Success Criteria

- [ ] Journey.tsx under 150 lines
- [ ] No single component file over 200 lines
- [ ] All existing functionality works
- [ ] TypeScript compiles cleanly
- [ ] Reusable EmptyState component exists
