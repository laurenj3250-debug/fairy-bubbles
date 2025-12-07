# F6: Design Document - Fairy Bubbles Homepage

## Design Direction

### Aesthetic Vision: "Alpine Dusk"
A **warm, premium dark theme** that feels like settling into a mountain cabin at golden hour. The climbing metaphor is woven throughout but never forced. Progress feels tangible - like watching the sun set over peaks you've climbed.

### Tone
- **Refined but characterful** - Not corporate sterile, not gamified chaos
- **Warm and inviting** - The dark theme should feel cozy, not cold
- **Satisfying to view** - Every glance should reinforce progress

### What Makes It Memorable
The **glowing orb habits** that pulse with warmth when completed, combined with the **mountain silhouette progress** that makes goals feel like actual summits to reach.

---

## Page Structure

### Homepage (V2Dashboard - Polished)

```tsx
<V2DashboardPolished>
  <TopoBackground />           {/* Subtle contour lines */}

  <NavRail />                  {/* 64px, desktop only */}

  <MainContent>
    <HeaderCard />             {/* Greeting + date + tokens */}

    <PrimaryRow>               {/* 2-column grid */}
      <HabitsCard />           {/* Glowing orbs */}
      <GoalsCard />            {/* Mountain visualization */}
    </PrimaryRow>

    <SecondaryRow>             {/* 3-column grid */}
      <HeatmapWidget />
      <PeakLoreWidget />
      <WeeklyRhythmWidget />
    </SecondaryRow>

    <SummitLogCard />          {/* Monthly accomplishments */}
  </MainContent>

  <TodoPanel />                {/* 320px, desktop only */}

  <BottomNav />                {/* Mobile only */}
</V2DashboardPolished>
```

---

## Component Specifications

### 1. TopoBackground

**Purpose**: Adds subtle depth and climbing context without distraction.

**Implementation**:
```tsx
interface TopoBackgroundProps {
  opacity?: number;  // Default: 0.03
}
```

**Visual Spec**:
- SVG pattern of organic contour lines
- Fixed position, covers full viewport
- Pointer-events: none
- Opacity: 2-5%
- Animates subtly on scroll (parallax at 0.1x speed)

**CSS**:
```css
.topo-background {
  position: fixed;
  inset: 0;
  background-image: url('/topo-pattern.svg');
  background-size: 600px 600px;
  opacity: 0.03;
  pointer-events: none;
  z-index: 0;
}
```

---

### 2. HeaderCard

**Purpose**: Warm greeting, contextual date, token balance.

**Structure**:
```tsx
interface HeaderCardProps {
  // No props - uses context/hooks
}

// Internal state
const greeting = getTimeBasedGreeting(); // "Good morning/afternoon/evening"
const date = formatDate(); // "Saturday, November 29"
const tokens = useTokens(); // From API
```

**States**:
| State | Behavior |
|-------|----------|
| Default | Shows greeting, date, tokens |
| Loading | Tokens show skeleton pulse |
| Token Update | Number animates with spring |

**Visual Spec**:
```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   Good evening, Climber                       🪙 1,234          │
│   📅 Saturday, November 29                                       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

- **Greeting**: Fraunces 28px, weight 600, foreground color
- **Date**: Inter 14px, muted-foreground, with calendar icon
- **Tokens**: Inter 16px bold, orange accent, right-aligned
- **Card**: glass-card styling, 24px padding

**Responsive**:
- Mobile: Single column, greeting 24px, reduced padding (16px)

---

### 3. HabitsCard (GlowingOrbHabits - Polished)

**Purpose**: Show today's habits as tappable orbs with completion glow.

**Props Interface**:
```tsx
interface HabitsCardProps {
  onHabitToggle?: (habitId: number) => void;
}

interface Habit {
  id: number;
  name: string;
  icon: string;
  category: 'mind' | 'foundation' | 'adventure' | 'climbing';
  completed: boolean;
}
```

**States**:
| State | Visual |
|-------|--------|
| Default | Orbs in grid, uncompleted = hollow ring |
| Completed | Filled orb with orange glow pulse |
| Hover | Scale 1.05, enhanced glow |
| Tap/Active | Scale 0.95, haptic feedback |
| Loading | Skeleton orbs |
| Empty | "No habits today" message |
| All Complete | Celebration confetti, enhanced glow on all |

**Visual Spec**:
```
┌────────────────────────────────────────┐
│  Today's Habits                    3/5 │
│                                        │
│  ┌────────┐  ┌────────┐  ┌────────┐   │
│  │   ◉    │  │   ◉    │  │   ○    │   │
│  │  ✓     │  │  ✓     │  │        │   │
│  │ Meditate│  │ Read   │  │Exercise│   │
│  └────────┘  └────────┘  └────────┘   │
│                                        │
│  Progress: ████████░░░░ 60%            │
└────────────────────────────────────────┘
```

**Orb Styling**:
```css
.habit-orb {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 2px solid var(--category-color);
  background: transparent;
  transition: all 150ms ease-out;
}

.habit-orb.completed {
  background: radial-gradient(
    circle at 30% 30%,
    var(--category-color-light),
    var(--category-color)
  );
  box-shadow:
    0 0 20px var(--category-color-glow),
    0 0 40px var(--category-color-glow-faint);
  animation: pulse-glow 2s ease-in-out infinite;
}

.habit-orb:hover {
  transform: scale(1.05);
}

.habit-orb:active {
  transform: scale(0.95);
}
```

**Animation - Pulse Glow**:
```css
@keyframes pulse-glow {
  0%, 100% {
    box-shadow:
      0 0 20px var(--category-color-glow),
      0 0 40px var(--category-color-glow-faint);
  }
  50% {
    box-shadow:
      0 0 30px var(--category-color-glow),
      0 0 60px var(--category-color-glow-faint);
  }
}
```

**Completion Animation** (Framer Motion):
```tsx
const completionVariants = {
  initial: { scale: 1 },
  complete: {
    scale: [1, 1.2, 0.9, 1.05, 1],
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 15,
      duration: 0.6
    }
  }
};
```

**Responsive**:
- Desktop: 2x3 grid of orbs
- Tablet: 3x2 grid
- Mobile: 5 horizontal scrollable orbs

**Accessibility**:
- Role: button
- aria-pressed: true/false
- aria-label: "Mark [habit name] as complete"
- Focus ring: 2px orange outline, 2px offset
- Keyboard: Enter/Space to toggle

---

### 4. GoalsCard (MountainRangeGoals - Polished)

**Purpose**: Visualize goals as mountain summits with progress paths.

**Props Interface**:
```tsx
interface GoalsCardProps {
  onGoalClick?: (goalId: number) => void;
}

interface Goal {
  id: number;
  name: string;
  current: number;
  target: number;
  category: string;
}
```

**States**:
| State | Visual |
|-------|--------|
| Default | Mountain silhouette with progress dots |
| Goal Hover | Mountain section highlights |
| Progress Update | Dot animates along path |
| Goal Complete | Summit flag animation, confetti |
| Loading | Skeleton mountain shape |
| Empty | Single mountain with "Set a goal" CTA |

**Visual Spec**:
```
┌────────────────────────────────────────┐
│  Mountains to Summit                   │
│                                        │
│           ▲                            │
│          ╱ ╲      ▲                    │
│    ▲    ╱   ╲    ╱ ╲      ▲           │
│   ╱ ╲__╱     ╲__╱   ╲    ╱ ╲          │
│  ╱                    ╲__╱   ╲___     │
│  ●━━━━━━━━━━━━━━━━━━━━●━━━━━━━○━━     │
│                       ↑               │
│                    67% here            │
│                                        │
│  🏔️ Read 12 Books    ████████░░ 67%   │
│  🏔️ Run 100mi        ██████░░░░ 50%   │
└────────────────────────────────────────┘
```

**Mountain Path Implementation**:
```tsx
// Bezier curve for mountain silhouette
const mountainPath = `
  M 0 100
  Q 50 80, 80 40
  Q 100 10, 120 40
  Q 140 70, 180 30
  Q 200 0, 220 30
  Q 250 60, 280 50
  L 300 100
  Z
`;

// Progress path (baseline)
const progressPath = `
  M 20 90
  Q 100 85, 180 75
  L 280 90
`;
```

**Progress Dot Animation**:
```tsx
const dotVariants = {
  initial: { pathLength: 0 },
  animate: {
    pathLength: progress / 100,
    transition: {
      duration: 1.5,
      ease: "easeInOut"
    }
  }
};
```

**Responsive**:
- Desktop: Full mountain visualization
- Mobile: Simplified progress bars, mountain as small icon

---

### 5. HeatmapWidget

**Purpose**: GitHub-style contribution grid showing habit activity.

**Visual Spec**:
```
┌──────────────────────┐
│  Activity            │
│                      │
│  ░░▓▓█░░░░░░░░░░░░░ │
│  ░▓▓█░░░░░░░░░░░░░░ │
│  ▓▓█░░░░░░░░░░░░░░░ │
│  ██░░░░░░░░░░░░░░░░ │
│                      │
│  Less ░░▓▓██ More    │
└──────────────────────┘
```

**Cell Colors**:
```css
.heatmap-cell-0 { background: hsl(40 20% 20%); }      /* Empty */
.heatmap-cell-1 { background: hsl(160 60% 25%); }    /* 1-25% */
.heatmap-cell-2 { background: hsl(160 70% 35%); }    /* 26-50% */
.heatmap-cell-3 { background: hsl(160 80% 45%); }    /* 51-75% */
.heatmap-cell-4 { background: hsl(160 90% 50%); }    /* 76-100% */
```

**States**:
- Default: 90-day grid
- Hover cell: Tooltip with date + completion count
- Loading: Skeleton grid

---

### 6. PeakLoreWidget

**Purpose**: Daily climbing wisdom/quotes for motivation.

**Visual Spec**:
```
┌──────────────────────┐
│  ⛰️ Peak Wisdom      │
│                      │
│  "The summit is just │
│   the halfway point" │
│                      │
│  — Ed Viesturs       │
└──────────────────────┘
```

**Styling**:
- Quote: Fraunces 16px italic, foreground
- Attribution: Inter 12px, muted-foreground
- Daily rotation with fade transition

---

### 7. WeeklyRhythmWidget

**Purpose**: This week's completion rhythm at a glance.

**Visual Spec**:
```
┌──────────────────────────────┐
│  This Week                   │
│                              │
│  M    T    W    T    F    S    S │
│  ●    ●    ●    ○    ○    ○    ○ │
│ 100  80   60                      │
│                              │
└──────────────────────────────┘
```

**Day Circle States**:
```css
.day-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid var(--border);
}

.day-circle.complete {
  background: conic-gradient(
    var(--primary) 0deg calc(var(--completion) * 3.6deg),
    transparent calc(var(--completion) * 3.6deg) 360deg
  );
}

.day-circle.today {
  border-color: var(--primary);
}

.day-circle.future {
  opacity: 0.3;
}
```

---

### 8. SummitLogCard

**Purpose**: Monthly accomplishments summary - the "pride" moment.

**Visual Spec**:
```
┌──────────────────────────────────────────────────────────────────┐
│  🏔️ Summit Log — November                                        │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │     45      │  │      7      │  │     3       │              │
│  │   habits    │  │  day streak │  │   goals     │              │
│  │  completed  │  │    🔥       │  │  advancing  │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                  │
│  Recent Wins:                                                    │
│  • Completed "Morning Meditation" streak milestone               │
│  • Reached 67% on "Read 12 Books"                               │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Stat Card Styling**:
```css
.stat-card {
  background: linear-gradient(
    135deg,
    hsl(40 20% 22%),
    hsl(40 20% 18%)
  );
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}

.stat-number {
  font-family: 'Inter', sans-serif;
  font-size: 32px;
  font-weight: 700;
  color: var(--primary);
  font-feature-settings: 'tnum';
}

.stat-label {
  font-size: 12px;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

---

## Shared Styling

### Glass Card Base
```css
.glass-card {
  background: hsl(40 20% 18% / 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid hsl(40 20% 30% / 0.3);
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
}

.glass-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.25);
  transition: all 150ms ease-out;
}
```

### Focus States
```css
:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}
```

### Loading Skeleton
```css
.skeleton {
  background: linear-gradient(
    90deg,
    hsl(40 20% 20%) 0%,
    hsl(40 20% 25%) 50%,
    hsl(40 20% 20%) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 8px;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

---

## Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| ≥1024px (lg) | 3-column: NavRail + Content + TodoPanel |
| 768-1023px (md) | 2-column: Content + TodoPanel |
| <768px (sm) | 1-column: Content + BottomNav |

### Mobile Adaptations
- NavRail → BottomNav
- TodoPanel → Hidden (access via nav)
- Cards stack vertically
- Orbs become horizontal scroll
- Mountain visualization simplifies to progress bars

---

## Animation Summary

| Element | Trigger | Animation | Duration |
|---------|---------|-----------|----------|
| Card hover | mouseenter | translateY(-2px) + shadow | 150ms |
| Habit complete | tap | scale pulse + glow | 600ms |
| Progress update | data change | spring animation | 1000ms |
| Page load | mount | staggered fade-up | 500ms total |
| Confetti | all habits done | canvas burst | 2000ms |
| Skeleton | loading | shimmer | 1500ms loop |

---

## Accessibility Checklist

- [ ] All interactive elements have focus states
- [ ] Color contrast ≥ 4.5:1 for text
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] ARIA labels on icons and interactive elements
- [ ] Reduced motion respects `prefers-reduced-motion`
- [ ] Screen reader announcements for state changes
- [ ] Touch targets ≥ 44x44px

---

## Implementation Order

1. **TopoBackground** - Simple, sets the tone
2. **Glass Card base styles** - Foundation for all cards
3. **HeaderCard** - Quick win, simple structure
4. **HabitsCard** - Core interaction, most important
5. **GoalsCard** - Visual impact, complex SVG
6. **Secondary widgets** - Heatmap, PeakLore, WeeklyRhythm
7. **SummitLogCard** - Celebration moment
8. **Polish pass** - Animations, loading states, empty states
