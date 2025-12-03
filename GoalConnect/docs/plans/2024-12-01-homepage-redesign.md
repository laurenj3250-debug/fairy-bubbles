# Homepage Redesign: Weekly Planning View

## Problem Statement

The current homepage (BaseCamp) focuses on TODAY's habits as the hero element. This doesn't help users:
- Plan their week
- See what needs to be done for their goals
- Understand monthly focus areas
- Feel a sense of progress over time

November goals are still showing in December - there's no month boundary handling.

## Design Goals

1. **Week as the default view** - See all 7 days at once, today highlighted
2. **Monthly goals** - Fresh goals each month, with progress tracking
3. **Flexible task planning** - Add tasks anytime, optionally link to goals
4. **Habits separate** - Don't mix with tasks, show as their own tracker
5. **Quick stats** - Tasks completed this week, streak (small, not dominating)

## Information Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│  DECEMBER GOALS                                             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌────────────────┐ │
│  │ Goal 1 ████░░░░ │ │ Goal 2 ██░░░░░░ │ │ Goal 3 ░░░░░░░ │ │
│  └─────────────────┘ └─────────────────┘ └────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  WEEK OF DEC 1-7                              [< prev] [next >] │
│  ┌───────┬───────┬───────┬───────┬───────┬───────┬───────┐ │
│  │ Mon 1 │ Tue 2 │ Wed 3 │*Thu 4*│ Fri 5 │ Sat 6 │ Sun 7 │ │
│  │       │       │       │ TODAY │       │       │       │ │
│  │ task  │ task  │ task  │ task  │       │       │       │ │
│  │ task  │       │ task  │ task  │       │       │       │ │
│  │ +add  │ +add  │ +add  │ +add  │ +add  │ +add  │ +add  │ │
│  └───────┴───────┴───────┴───────┴───────┴───────┴───────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────┐  ┌──────────────────────────┐ │
│  │ HABITS                   │  │ THIS WEEK                │ │
│  │ ○○●●● Mon-Fri tracker    │  │ 12 tasks completed       │ │
│  │ Streak: 12 days          │  │ 3 goals progressed       │ │
│  └──────────────────────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Key Behaviors

### Monthly Goal Lifecycle
- At month start: Prompt user to set new goals
- Previous month's goals: Archive automatically
- Goals have progress bars based on linked task completion
- 2-4 goals max per month (enforce focus)

### Task Management
- Click "+add" on any day to add task
- Tasks can optionally link to a goal (dropdown)
- Click task to edit inline
- Drag tasks between days to reschedule
- Check off to complete

### Week Navigation
- Default shows current week
- Arrow buttons to navigate prev/next week
- Today always highlighted
- Past days show completed/incomplete status

### Habits Section
- Compact tracker (not the climbing route)
- Shows week's habit completion dots
- Streak counter
- Links to full habits page

### Stats Section
- Tasks completed this week
- Goals progressed
- Keep small - motivation not overwhelm

## Technical Changes Required

### New Data Model
- Tasks need a `date` field (which day)
- Tasks optionally link to a goal (`goalId`)
- Goals need a `month` field (2024-12)
- Goals need `archived` boolean

### New API Endpoints
- `GET /api/tasks?week=2024-W49` - tasks for a week
- `POST /api/tasks` - create task with date
- `PATCH /api/tasks/:id` - update task (including moving date)
- `GET /api/goals?month=2024-12` - goals for current month
- `POST /api/goals/archive` - archive previous month's goals

### Component Changes
- New `WeeklyPlanner` component (replaces ClimbingRouteView as hero)
- New `MonthlyGoals` component
- Compact `HabitTracker` component (new)
- Keep existing Goals page for detailed goal management

## Design Aesthetic

- Clean, minimal (not the heavy climbing metaphor)
- Cards for each day with subtle shadows
- Today highlighted with accent color
- Smooth animations for adding/completing tasks
- Mobile: Stack days vertically, swipe between them

## Migration Path

1. Create new Tasks table (separate from Todos)
2. Add month field to Goals
3. Build WeeklyPlanner component
4. Create new homepage route (keep old as fallback)
5. Migrate users when ready
