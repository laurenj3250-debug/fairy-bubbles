# F6: Design Document - Strava Journey Page

## Overview

A dedicated page for Strava integration that transforms raw activity data into an epic, celebratory experience. Follows Summit Journal energy with Strava's orange accent color.

**Route:** `/strava` or `/journey/strava`
**File:** `client/src/pages/StravaJourney.tsx`

---

## Component Hierarchy

```
StravaJourney (page)
├── PageHeader
│   ├── BackButton → /settings/imports
│   └── Title "Strava Journey" + subtitle
├── HeroSection
│   ├── MicroLabel ("YOUR RUNNING JOURNEY")
│   ├── BigComparison ("47 marathons")
│   ├── SupportingText
│   └── QuickStatsRow (3 stats)
├── BentoGrid
│   ├── WeeklyProgressCard (large)
│   │   └── ProgressRing + Stats
│   ├── ActivityBreakdownCard (medium)
│   │   └── DonutChart (run/ride/swim)
│   ├── PersonalRecordsCard (medium)
│   │   └── PRList with medals
│   ├── TrendChartCard (large)
│   │   └── AreaChart (12 week trend)
│   ├── ConsistencyCalendar (medium)
│   │   └── CalendarHeatmap
│   └── RecentActivities (medium)
│       └── ActivityList
├── LoadingState
├── ErrorState
└── NotConnectedState
```

---

## Props Interfaces

```typescript
// From useStravaStats hook
interface StravaStats {
  isConnected: boolean;
  
  // Totals
  totalDistanceKm: number;
  totalDurationMinutes: number;
  totalCalories: number;
  totalActivities: number;
  
  // By activity type
  runs: { count: number; distanceKm: number; durationMinutes: number };
  rides: { count: number; distanceKm: number; durationMinutes: number };
  swims: { count: number; distanceKm: number; durationMinutes: number };
  
  // Progress
  weeklyGoal: { target: number; current: number; unit: string };
  currentStreak: number;
  longestStreak: number;
  
  // Personal records
  prs: {
    longestRun?: { distanceKm: number; date: string };
    fastestPace?: { paceMinKm: number; date: string };
    longestRide?: { distanceKm: number; date: string };
    mostCalories?: { calories: number; date: string };
  };
  
  // Trends
  weeklyTrend: Array<{ week: string; distanceKm: number }>;
  
  // Activity calendar
  activityDays: Array<{ date: string; count: number; type: string }>;
  
  // Recent
  recentActivities: Array<{
    id: number;
    name: string;
    type: string;
    distanceKm: number;
    durationMinutes: number;
    date: string;
  }>;
}

// Running comparisons
interface RunningComparison {
  name: string;
  emoji: string;
  distanceKm: number; // e.g., marathon = 42.195
}
```

---

## Component States

### Default (Connected with Data)
- Full dashboard with all cards
- Animated entry on mount
- Real-time sync status indicator

### Loading
- Skeleton placeholders for all cards
- Spinning indicator in hero

### Error
- Error message with retry button
- Suggestion to check connection

### Not Connected
- CTA to connect Strava
- Preview of what they'll see
- Link to /settings/imports

### Empty (Connected, No Data)
- Encouraging message
- Suggestion to sync or go for a run

---

## Responsive Behavior

### Mobile (< 640px)
```
[Hero - full width]
[Card - full width]
[Card - full width]
[Card - full width]
...
```

### Tablet (640-1023px)
```
[Hero - full width]
[Card] [Card]
[Card - full width]
[Card] [Card]
```

### Desktop (≥ 1024px)
```
[Hero - full width]
[Large Card  ] [Medium Card]
[Medium Card ] [Medium Card]
[Large Card - trend chart  ]
```

---

## Accessibility Requirements

### Semantic HTML
- `<main>` wrapper
- `<section>` for each major area
- `<h1>` for page title
- `<h2>` for card titles
- `<button>` for interactive elements

### ARIA
- `aria-label` on icon-only buttons
- `aria-live="polite"` on dynamic content
- `role="img"` on SVG charts with `aria-label`

### Keyboard Navigation
- Tab order follows visual flow
- Focus visible on all interactive elements
- Escape closes any modals

### Screen Reader
- Alt text on all meaningful images
- Announce loading/error states
- Describe chart data in text

---

## Animations

### Page Entry
```tsx
// Stagger children
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};
```

### Hero Number CountUp
```tsx
// 1.5s ease-out count from 0 to value
const count = useMotionValue(0);
useEffect(() => {
  animate(count, value, { duration: 1.5, ease: "easeOut" });
}, [value]);
```

### Progress Ring
```tsx
// Animate stroke-dashoffset
<motion.circle
  initial={{ strokeDashoffset: circumference }}
  animate={{ strokeDashoffset: circumference * (1 - progress) }}
  transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
/>
```

### Hover States
```css
.glass-card {
  transition: border-color 150ms ease;
}
.glass-card:hover {
  border-color: rgba(255,255,255,0.2);
}
```

---

## Running Comparisons

```typescript
const RUNNING_COMPARISONS: RunningComparison[] = [
  { name: "Marathon", emoji: "🏃", distanceKm: 42.195 },
  { name: "NYC to Boston", emoji: "🗽", distanceKm: 346 },
  { name: "Central Park Loop", emoji: "🌳", distanceKm: 10 },
  { name: "Ironman Run", emoji: "🏊", distanceKm: 42.195 },
  { name: "Ultra Marathon", emoji: "🏔️", distanceKm: 100 },
  { name: "NYC to Miami", emoji: "🌴", distanceKm: 2054 },
];

function getBestComparison(distanceKm: number): { comparison: RunningComparison; times: number } {
  // Find comparison where times >= 1 and looks most impressive
  // ...
}
```

---

## Data Hook

```typescript
// hooks/useStravaStats.ts
export function useStravaStats() {
  const { data: status } = useQuery({
    queryKey: ["/api/import/strava/status"],
  });
  
  const { data: activities } = useQuery({
    queryKey: ["/api/import/strava/activities"],
    enabled: status?.connected,
  });
  
  const { data: stravaStats } = useQuery({
    queryKey: ["/api/import/strava/stats"],
    enabled: status?.connected,
  });
  
  // Compute derived stats
  const stats = useMemo(() => {
    if (!activities || !stravaStats) return null;
    
    return {
      isConnected: status?.connected ?? false,
      totalDistanceKm: stravaStats.local?.totalDistance ?? 0,
      // ... compute all stats
    };
  }, [activities, stravaStats, status]);
  
  return { stats, isLoading, error, refetch };
}
```

---

## Key Components Detail

### HeroSection
```tsx
<motion.div className="rounded-2xl bg-gradient-to-br from-[#FC4C02]/20 via-background to-[#FF6B35]/10 p-6 md:p-8">
  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
    Your running journey
  </div>
  <div className="flex items-baseline gap-2 mb-2">
    <span className="text-5xl md:text-6xl font-bold text-[#FC4C02]">
      <CountUp value={comparison.times} decimals={0} />
    </span>
    <span className="text-2xl md:text-3xl font-semibold">
      {comparison.name}s
    </span>
    <span className="text-3xl">{comparison.emoji}</span>
  </div>
  <p className="text-muted-foreground">
    That's {formatDistance(totalDistanceKm)} of running!
  </p>
  <QuickStatsRow runs={runs} hours={hours} calories={calories} />
</motion.div>
```

### ProgressRing
```tsx
<svg viewBox="0 0 100 100" className="w-32 h-32">
  {/* Track */}
  <circle
    cx="50" cy="50" r="40"
    fill="none"
    stroke="hsl(var(--muted))"
    strokeWidth="8"
  />
  {/* Progress */}
  <motion.circle
    cx="50" cy="50" r="40"
    fill="none"
    stroke="url(#orangeGradient)"
    strokeWidth="8"
    strokeLinecap="round"
    strokeDasharray={circumference}
    initial={{ strokeDashoffset: circumference }}
    animate={{ strokeDashoffset: circumference * (1 - progress) }}
    transform="rotate(-90 50 50)"
  />
  {/* Gradient def */}
  <defs>
    <linearGradient id="orangeGradient">
      <stop offset="0%" stopColor="#FC4C02" />
      <stop offset="100%" stopColor="#FF6B35" />
    </linearGradient>
  </defs>
</svg>
```

### ActivityBreakdown (Donut)
```tsx
// Using recharts PieChart
<PieChart>
  <Pie
    data={[
      { name: "Runs", value: runs.count, fill: "#FC4C02" },
      { name: "Rides", value: rides.count, fill: "#3B82F6" },
      { name: "Swims", value: swims.count, fill: "#06B6D4" },
    ]}
    innerRadius={60}
    outerRadius={80}
    paddingAngle={2}
  />
</PieChart>
```

---

## File Structure

```
client/src/
├── pages/
│   └── StravaJourney.tsx       # Main page component
├── hooks/
│   └── useStravaStats.ts       # Data fetching hook
├── lib/
│   └── runningComparisons.ts   # Distance comparisons
└── components/
    └── (reuse existing ui components)
```

---

## Implementation Priority

1. **P0 - Core Layout**
   - Page structure with routing
   - HeroSection with comparison
   - Basic data hook

2. **P1 - Key Visualizations**
   - WeeklyProgressCard with ring
   - TrendChartCard with area chart
   - PersonalRecordsCard

3. **P2 - Supporting Features**
   - ActivityBreakdown donut
   - ConsistencyCalendar heatmap
   - RecentActivities list

4. **P3 - Polish**
   - All animations
   - Empty/error/loading states
   - Accessibility audit
