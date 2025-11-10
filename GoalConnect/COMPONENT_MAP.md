# Dashboard Component Map

## Component Hierarchy

```
DashboardNew (Main Container)
│
├─ WeatherMoodSystem
│  └─ Dynamic background gradient based on weather
│     └─ Parallax cloud animations
│
├─ ExpeditionHeader (48px fixed)
│  ├─ Season Progress (left)
│  ├─ Climbing Grade + Rank (center)
│  └─ Week Summary + View Week link (right)
│
├─ Main Canvas (max-w-1440 mx-auto)
│  │
│  ├─ Row 1: Hero Band (grid-cols-12, gap-6)
│  │  │
│  │  ├─ TodaysPitchEnhanced (col-span-7, 62%)
│  │  │  ├─ GraniteTexture overlay
│  │  │  ├─ Header (title + date + completion)
│  │  │  └─ Grouped Habits
│  │  │     ├─ MIND category
│  │  │     │  └─ HabitRow[] (checkbox + name + grade + effort)
│  │  │     ├─ FOUNDATION category
│  │  │     │  └─ HabitRow[]
│  │  │     ├─ ADVENTURE category
│  │  │     │  └─ HabitRow[] (only if scheduled for day)
│  │  │     └─ Adventure CTA (if unscheduled)
│  │  │        └─ Opens DayPickerModal
│  │  │
│  │  └─ Right Column (col-span-5, 34%)
│  │     │
│  │     ├─ RoutesPanelEnhanced
│  │     │  ├─ GraniteTexture overlay
│  │     │  ├─ Header (title + sent count)
│  │     │  └─ RouteRow[]
│  │     │     ├─ Icon + Name + Grade
│  │     │     ├─ Pitch dots (●●○○○)
│  │     │     ├─ Progress bar
│  │     │     ├─ Expand/collapse button
│  │     │     └─ Inline details (when expanded)
│  │     │
│  │     └─ Basecamp Status Card
│  │        ├─ GraniteTexture overlay
│  │        ├─ BasecampIndicator
│  │        │  └─ Animated campfire/tent
│  │        └─ Stats (routes sent, season %)
│  │
│  ├─ Row 2: Ridge Traverse (full-width)
│  │  │
│  │  └─ RidgeTraverseEnhanced
│  │     ├─ TopoProgressLines background
│  │     ├─ Header (title + peaks count)
│  │     ├─ Ridge visualization (7 peaks)
│  │     │  └─ DayPeak[] (Mon-Sun)
│  │     │     ├─ Summit flag (if 100%)
│  │     │     ├─ Selection indicator (if selected)
│  │     │     ├─ SVG mountain peak
│  │     │     ├─ Hover tooltip
│  │     │     └─ Day label
│  │     │
│  │     └─ Quick Actions pill (absolute overlay)
│  │        ├─ Add Habit button
│  │        └─ Week View button
│  │
│  └─ Row 3: Notification Strip (conditional)
│     │
│     ├─ Routes Sent Notification (if routesSent > 0)
│     │  └─ "Route sent - clean redpoint!"
│     │
│     └─ Missed Days Nudge (if missedDays >= 3)
│        └─ "Weather break? Conditions improving."
│
└─ Modals (conditional)
   └─ DayPickerModal (when scheduling adventure)
      └─ Week calendar picker
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      React Query                             │
│  ┌──────────┬──────────┬──────────┬────────────────┐        │
│  │ habits   │ allLogs  │todayLogs │ climbingStats  │        │
│  └─────┬────┴─────┬────┴─────┬────┴────────┬───────┘        │
└────────┼──────────┼──────────┼─────────────┼────────────────┘
         │          │          │             │
         v          v          v             v
    ┌────────────────────────────────────────────────┐
    │         DashboardNew (Parent State)            │
    │  ┌──────────────────────────────────────┐      │
    │  │ selectedDate: string | null          │      │
    │  │ → Controls which day to show         │      │
    │  └──────────────────────────────────────┘      │
    │                                                 │
    │  Computed Values:                               │
    │  ├─ seasonProgress {current, total}            │
    │  ├─ longestStreak                              │
    │  ├─ weekProgress {mind, foundation, adventure} │
    │  ├─ missedDaysThisWeek                         │
    │  ├─ weather (sunny/cloudy/storm)               │
    │  ├─ completionPercentage                       │
    │  └─ routesSent                                 │
    └─────────────────────────────────────────────────┘
         │          │          │          │
         v          v          v          v
    ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐
    │Weather │ │Exped.  │ │Today's │ │ Routes   │
    │Mood    │ │Header  │ │Pitch   │ │Panel     │
    └────────┘ └────────┘ └────────┘ └──────────┘
                              │            │
                              v            v
                         ┌─────────┐  ┌─────────┐
                         │Habit    │  │Route    │
                         │Mutation │  │Data     │
                         └─────────┘  └─────────┘
                              │
                              v
                         ┌──────────────┐
                         │ Query        │
                         │ Invalidation │
                         └──────────────┘
```

---

## State Management

### Parent State (DashboardNew)
```typescript
const [selectedDate, setSelectedDate] = useState<string | null>(null);
// Controls which day to display in Today's Pitch
// null = today, ISO string = specific day
```

### Child Component State

**TodaysPitchEnhanced**
```typescript
const [schedulingHabit, setSchedulingHabit] = useState<Habit | null>(null);
// Opens DayPickerModal for adventure scheduling
```

**RoutesPanelEnhanced**
```typescript
const [expandedRouteId, setExpandedRouteId] = useState<number | null>(null);
// Inline expansion of route details
```

---

## Props Interface

### WeatherMoodSystem
```typescript
{
  weather: WeatherType;  // "sunny" | "partly-cloudy" | "cloudy" | "storm"
  className?: string;
}
```

### ExpeditionHeader
```typescript
{
  seasonProgress: { current: number; total: number };
  climbingGrade: string;        // e.g., "5.9"
  climbingRank: string;         // e.g., "Crux Panicker"
  weekSummary: {
    mind: { completed: number; target: number };
    foundation: { completed: number; target: number };
    adventure: { completed: number; target: number };
  };
  onViewWeek?: () => void;
}
```

### TodaysPitchEnhanced
```typescript
{
  className?: string;
  selectedDate?: string;  // ISO date, defaults to today
}
```

### RoutesPanelEnhanced
```typescript
{
  className?: string;
}
```

### RidgeTraverseEnhanced
```typescript
{
  onDayClick?: (date: string) => void;
  selectedDate?: string;
  seasonProgress: number;  // 0-90 days
}
```

### BasecampIndicator
```typescript
{
  progressPercentage: number;  // 0-100
  className?: string;
}
```

### TopoProgressLines
```typescript
{
  seasonProgress: number;  // 0-90 days
  className?: string;
}
```

### GraniteTexture
```typescript
{
  className?: string;
  opacity?: number;  // defaults to 0.03
}
```

---

## Event Handlers

### User Actions → Effects

```typescript
// 1. Log habit (1-tap)
onClick={handleToggle(habitId)}
  → toggleHabitMutation.mutate({ habitId })
  → Optimistic UI update
  → Toast notification
  → Query invalidation

// 2. Switch day (click ridge peak)
onClick={() => setSelectedDate(date)}
  → Parent state updates
  → TodaysPitchEnhanced re-renders with new date
  → Query fetches logs for that date

// 3. Expand route (inline)
onClick={() => setExpandedRouteId(routeId)}
  → Local state toggle
  → Conditional render of details

// 4. Schedule adventure
onClick={() => setSchedulingHabit(habit)}
  → Opens DayPickerModal
  → User selects day
  → scheduleHabitMutation.mutate({ habitId, scheduledDay })
  → Query invalidation
  → Modal closes
```

---

## Computed Values Pipeline

### Season Progress
```typescript
seasonProgress = useMemo(() => {
  const completedLogs = allLogs.filter(log => log.completed);
  const uniqueDays = new Set(completedLogs.map(log => log.date));
  return { current: uniqueDays.size, total: 90 };
}, [allLogs]);
```

### Longest Streak
```typescript
longestStreak = useMemo(() => {
  // Sort dates, find longest consecutive sequence
  // Returns: number (0-N days)
}, [allLogs]);
```

### Week Progress
```typescript
weekProgress = useMemo(() => {
  // For each category (mind, foundation, adventure):
  //   - Count target (sum of habit targetPerWeek)
  //   - Count completed (logs this week)
  // Returns: { mind: {completed, target}, ... }
}, [habits, allLogs]);
```

### Weather State
```typescript
weather = getWeatherFromStreak(longestStreak, missedDaysThisWeek)
// Returns: "sunny" | "partly-cloudy" | "cloudy" | "storm"
```

### Routes Sent
```typescript
routesSent = useMemo(() => {
  return habits.filter(habit => {
    const weekLogs = allLogs.filter(/* this week + this habit */);
    return weekLogs.length >= target;
  }).length;
}, [habits, allLogs]);
```

---

## Animation Triggers

### On Mount
```typescript
// Ridge peaks
animation: peak-grow 0.5s ease-out ${index * 0.08}s backwards

// Route pitch dots (when filled)
animation: pitch-fill 0.3s ease-out ${i * 0.05}s backwards
```

### On User Action
```typescript
// Habit checkbox
className: "scale-110 active:scale-95"
duration: 120ms

// Route dot fill
onSuccess → optimistic update → dot fills with animation

// Basecamp glow
progressPercentage changes → glow intensity scales smoothly
```

### Continuous
```typescript
// Cloud parallax
animation: cloud-drift-near 40s linear infinite
animation: cloud-drift-far 80s linear infinite

// Campfire pulse
className: "animate-pulse-subtle"  // 3s ease-in-out infinite
```

---

## Responsive Breakpoints

```css
/* Mobile (<768px) */
.grid-cols-1  /* Everything stacks */
.px-4         /* Reduced padding */

/* Tablet (768-1024px) */
.lg:grid-cols-12  /* Still stacks, not enough width */

/* Desktop (1024+) */
.lg:grid-cols-12  /* Two-column hero layout */
.lg:col-span-7    /* Today's Pitch 62% */
.lg:col-span-5    /* Routes Panel 34% */

/* Large Desktop (1440+) */
.max-w-[1440px]   /* Optimal layout container */
```

---

## Query Keys

```typescript
// Habits
["/api/habits"]

// Habit logs (all)
["/api/habit-logs/all"]

// Habit logs (specific day)
["/api/habit-logs", date]  // date = "2025-11-10"

// Climbing stats
["/api/climbing/stats"]
```

---

## Mutation Keys & Invalidation

### Toggle Habit
```typescript
mutationFn: POST /api/habit-logs/toggle
  body: { habitId, date }

onSuccess:
  invalidate ["/api/habit-logs", date]
  invalidate ["/api/habit-logs"]
  invalidate ["/api/habit-logs/all"]
  invalidate ["/api/points"]
```

### Schedule Adventure
```typescript
mutationFn: PATCH /api/habits/${habitId}/schedule
  body: { scheduledDay }

onSuccess:
  invalidate ["/api/habits"]
```

---

## CSS Utility Classes

### New (Dashboard Redesign)
```css
.rope-texture          /* Woven rope pattern */
.granite-overlay       /* Granite grain SVG filter */
```

### Existing (Used)
```css
.topo-pattern          /* Topographic contour lines */
.mountain-card-depth   /* Enhanced shadow depth */
.ice-crystal-border    /* Shimmer on hover */
.card-tilt             /* 3D tilt on hover */
.animate-pulse-subtle  /* Gentle pulse (3s) */
```

---

## File Size Reference

```
Component Sizes (estimated):

WeatherMoodSystem.tsx       ~3KB   (weather gradients + parallax)
BasecampIndicator.tsx       ~2KB   (campfire animation)
TopoProgressLines.tsx       ~2KB   (SVG contour lines)
GraniteTexture.tsx          ~1KB   (SVG filter)
ExpeditionHeader.tsx        ~3KB   (header bar)
TodaysPitchEnhanced.tsx    ~10KB   (main habit panel)
RoutesPanelEnhanced.tsx     ~9KB   (routes with expansion)
RidgeTraverseEnhanced.tsx   ~8KB   (7-day ridge)

DashboardNew.tsx           ~12KB   (main container + logic)

Total: ~50KB new code
```

---

## Browser DevTools Reference

### Useful Selectors
```css
/* Weather background */
[data-weather="sunny"]

/* Ridge peaks */
.ridge-traverse svg polygon

/* Habit rows */
.habit-row

/* Route items */
.route-item

/* Basecamp indicator */
[class*="BasecampIndicator"]
```

### State Inspection
```javascript
// In React DevTools:

// Check selected date
DashboardNew → selectedDate

// Check habit completion
TodaysPitchEnhanced → habitsWithCompletion

// Check route progress
RoutesPanelEnhanced → routeProgress

// Check weather state
DashboardNew → weather
```

---

## Testing Selectors (for future tests)

```typescript
// Dashboard container
screen.getByRole('main') || container.querySelector('[data-weather]')

// Expedition header
screen.getByText(/Season: \d+\/\d+ days/)

// Today's Pitch
screen.getByRole('heading', { name: /Today's Pitch/ })

// Habit rows
screen.getAllByRole('button', { name: /[✓○]/ })

// Routes
screen.getByRole('heading', { name: /This Week's Routes/ })

// Ridge peaks
container.querySelectorAll('svg polygon')

// Basecamp indicator
screen.getByText(/Basecamp/)

// Quick actions
screen.getByRole('button', { name: /Add Habit/ })
screen.getByRole('button', { name: /Week View/ })
```

---

## Performance Notes

### Optimized
- Memoized computed values (seasonProgress, weekProgress, routesSent)
- Optimistic UI updates (no loading states for mutations)
- Conditional rendering (notifications only when needed)
- SVG-based textures (lightweight, scalable)

### Potential Optimizations (if needed)
- [ ] Virtual scrolling for habits (if 100+ habits)
- [ ] Debounced weather transitions
- [ ] Lazy load modals
- [ ] Code-split dashboard from other pages

---

## Known Limitations

1. **Weather transitions**: 3s may feel slow if switching rapidly
   - Mitigation: User unlikely to change weather conditions rapidly

2. **Ridge Traverse**: Fixed 7-day week view
   - Future: Add month/season view

3. **Route expansion**: Only one at a time
   - Design decision: reduce visual clutter

4. **Optimistic updates**: May flash on error
   - Mitigation: Rollback on error, show toast

---

## Accessibility Notes

### Keyboard Navigation
- All buttons keyboard-accessible
- Ridge peaks: tab → enter to select
- Habit rows: tab → space/enter to toggle
- Route expansion: tab → enter to expand

### Screen Readers
- Semantic HTML (`<button>`, `<heading>`)
- aria-label on collapse/expand buttons
- Role="main" on dashboard container

### Color Contrast
- All text meets WCAG AA on backgrounds
- Granite texture opacity kept low (0.03) for readability
- Hover states visible even without color

---

This component map provides a complete reference for understanding the dashboard architecture, data flow, and implementation details.
