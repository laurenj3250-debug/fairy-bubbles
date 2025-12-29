# Yearly Goals Dashboard Widget Design

## Summary

Add a full-width yearly goals section to the main IcyDash page, positioned below the Schedule and above Monthly Progress. Displays all yearly goals as a flat list sorted by progress (closest to completion first), with the ability to interact with each goal.

## Goal

Surface yearly goals directly on the main dashboard so users can track and update progress without navigating to a separate page.

## Architecture

- **New component:** `YearlyGoalsDashboard` at `client/src/components/dashboard/YearlyGoalsDashboard.tsx`
- **Data:** Reuse existing `useYearlyGoals` hook - no new API endpoints needed
- **Placement:** Full-width section in IcyDash.tsx between Schedule and Monthly Progress

## UI Design

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  Yearly Goals                              12/20 · 60%  │
├─────────────────────────────────────────────────────────┤
│  ████████████░░░░ Read 50 books              47/50  94% │
│  ████████████░░░░ Run 100 miles              88/100 88% │
│  ██████████░░░░░░ Complete Go course         ☑ Done     │
│  ████████░░░░░░░░ Climb V8 outdoors          6/10   60% │
│  ...                                                    │
└─────────────────────────────────────────────────────────┘
```

### Header
- Title: "Yearly Goals"
- Summary stats: completed/total count + percentage (e.g., "12/20 · 60%")

### Goal Rows
- Flat list (no category grouping)
- Sorted by progress percentage descending (closest to completion first)
- Each row shows:
  - Progress bar (thin horizontal)
  - Goal title (truncate if needed)
  - Value display: "47/50" for count goals, checkbox for binary
  - Percentage badge

### Interactions by Goal Type
| Type | Display | Action |
|------|---------|--------|
| Binary | Checkbox | Click to toggle complete |
| Count | +/- buttons | Increment or decrement value |
| Compound | Expandable | Show sub-items, toggle each |

## Data Flow

### Fetching
- Use existing `useYearlyGoals(currentYear)` hook
- Endpoint: `GET /api/yearly-goals/with-progress?year={year}`

### Sorting
```typescript
goals.sort((a, b) => {
  const progressA = (a.currentValue + a.computedValue) / a.targetValue;
  const progressB = (b.currentValue + b.computedValue) / b.targetValue;
  return progressB - progressA; // Descending
});
```

### Mutations
Reuse existing mutations from `useYearlyGoals`:
- `toggleGoal` - binary goals
- `incrementGoal` - count goals
- `toggleSubItem` - compound goal sub-items
- `claimReward` - XP rewards

### Optimistic Updates
Same pattern as existing yearly goals page - update UI immediately, rollback on error.

## Styling

- Use existing `glass-card` CSS class
- Match IcyDash design system (backdrop blur, borders, padding)
- Full-width layout like Schedule component
- Responsive: stack elements on mobile if needed

## Files to Create/Modify

**Create:**
- `client/src/components/dashboard/YearlyGoalsDashboard.tsx` - main component

**Modify:**
- `client/src/pages/IcyDash.tsx` - add YearlyGoalsDashboard between Schedule and Monthly Progress
