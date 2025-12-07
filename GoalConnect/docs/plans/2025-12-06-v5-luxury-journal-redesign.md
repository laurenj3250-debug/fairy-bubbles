# Fairybubbles v5 - Luxury Journal Redesign

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the v4 dashboard from a functional interface into a cohesive "luxury journal" aesthetic that integrates the ice climbing illustration with the UI, unifies typography, harmonizes the peach color palette, and elevates all data visualizations to feel hand-crafted and editorial.

**Architecture:** The redesign modifies existing files rather than creating new ones. Core changes target: (1) CSS theme variables in `enchanted.css`, (2) Tailwind config for tokens, (3) DashboardV4.tsx for layout composition, (4) Individual card components for refined visualizations. The illustration integration happens through CSS (grounding, organic shapes) rather than changing the background image itself.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Framer Motion, Radix UI, CSS custom properties

---

## Phase 1: Typography System Overhaul

### Task 1.1: Update Font Imports

**Files:**
- Modify: `client/src/styles/enchanted.css:1-75`

**Step 1: Update Google Fonts import**

Replace the existing font import with luxury journal fonts:

```css
/* Import luxury journal fonts */
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=Cormorant+SC:wght@300;400;500;600;700&family=Source+Sans+3:wght@300;400;500;600&display=swap');
```

**Step 2: Define typography CSS custom properties**

Add after the font import:

```css
:root {
  /* Typography tokens */
  --font-heading: 'Cormorant Garamond', Georgia, serif;
  --font-heading-sc: 'Cormorant SC', Georgia, serif;
  --font-body: 'Source Sans 3', system-ui, sans-serif;
  --font-display: 'Cormorant Garamond', Georgia, serif;

  /* Font sizes - editorial scale */
  --text-hero: 3.5rem;      /* 56px - script hero */
  --text-h1: 1.75rem;       /* 28px - page titles */
  --text-h2: 1.25rem;       /* 20px - card headers */
  --text-h3: 1rem;          /* 16px - section headers */
  --text-body: 0.875rem;    /* 14px - body text */
  --text-small: 0.75rem;    /* 12px - labels */
  --text-tiny: 0.625rem;    /* 10px - tiny labels */

  /* Line heights */
  --leading-tight: 1.2;
  --leading-normal: 1.5;
  --leading-relaxed: 1.7;

  /* Letter spacing */
  --tracking-tight: -0.01em;
  --tracking-normal: 0;
  --tracking-wide: 0.05em;
  --tracking-wider: 0.1em;
  --tracking-widest: 0.2em;
}
```

**Step 3: Update typography rules**

Replace the existing typography section with:

```css
/* ===== TYPOGRAPHY ===== */

/* Hero titles - Elegant italic script */
.hero-title {
  font-family: var(--font-display);
  font-weight: 400;
  font-style: italic;
  font-size: var(--text-hero);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
  color: var(--text-primary);
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.5);
}

/* Logo text - refined small caps */
.logo-text {
  font-family: var(--font-heading-sc);
  font-weight: 400;
  font-size: var(--text-body);
  letter-spacing: var(--tracking-widest);
  color: var(--text-primary);
}

/* Card headers - Elegant serif */
.card-header {
  font-family: var(--font-heading);
  font-weight: 500;
  font-size: var(--text-h2);
  line-height: var(--leading-tight);
  color: var(--text-primary);
}

/* Body text - Clean readable sans */
.body-text {
  font-family: var(--font-body);
  font-weight: 400;
  font-size: var(--text-body);
  line-height: var(--leading-relaxed);
  color: var(--text-secondary);
}

/* Data numbers - Elegant serif numerals */
.stat-number {
  font-family: var(--font-heading);
  font-weight: 300;
  letter-spacing: var(--tracking-wide);
  color: var(--text-primary);
}

/* Labels - Small caps or italic */
.label-text {
  font-family: var(--font-heading);
  font-style: italic;
  font-size: var(--text-small);
  color: var(--text-muted);
}

.label-caps {
  font-family: var(--font-heading-sc);
  font-size: var(--text-tiny);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
}
```

**Step 4: Verify fonts load**

Run: `npm run dev`
Expected: App loads with new fonts visible

**Step 5: Commit**

```bash
git add client/src/styles/enchanted.css
git commit -m "feat(typography): implement luxury journal font system"
```

---

### Task 1.2: Update Tailwind Typography Config

**Files:**
- Modify: `tailwind.config.ts:124-132`

**Step 1: Update fontFamily config**

Replace the existing fontFamily section:

```typescript
fontFamily: {
  sans: ["Source Sans 3", "system-ui", "sans-serif"],
  serif: ["Cormorant Garamond", "Georgia", "serif"],
  mono: ["var(--font-mono)"],
  heading: ["Cormorant Garamond", "Georgia", "serif"],
  "heading-sc": ["Cormorant SC", "Georgia", "serif"],
  body: ["Source Sans 3", "system-ui", "sans-serif"],
  display: ["Cormorant Garamond", "Georgia", "serif"],
},
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds without errors

**Step 3: Commit**

```bash
git add tailwind.config.ts
git commit -m "feat(tailwind): add luxury journal font families"
```

---

## Phase 2: Color System Unification

### Task 2.1: Define Unified Peach Palette

**Files:**
- Modify: `client/src/styles/enchanted.css` (add to :root)

**Step 1: Add unified peach color tokens**

Add to the `:root` section:

```css
:root {
  /* ... existing tokens ... */

  /* ===== UNIFIED PEACH PALETTE ===== */
  --peach-50:  #fdf8f6;
  --peach-100: #fdf6f0;
  --peach-200: #f8e4d6;
  --peach-300: #f0c9ae;
  --peach-400: #e4a880;  /* PRIMARY - use everywhere */
  --peach-500: #d4936a;
  --peach-600: #c07850;

  /* Semantic peach usage */
  --accent-primary: var(--peach-400);
  --accent-hover: var(--peach-300);
  --accent-active: var(--peach-500);
  --accent-glow: rgba(228, 168, 128, 0.4);
  --accent-subtle: rgba(228, 168, 128, 0.15);

  /* ===== BACKGROUND PALETTE ===== */
  --bg-deep: #070f1a;
  --bg-primary: #0c1a28;
  --bg-card: #0f2433;
  --bg-card-alpha: rgba(15, 36, 51, 0.78);
  --bg-elevated: rgba(15, 36, 51, 0.85);

  /* ===== TEXT PALETTE ===== */
  --text-primary: #f5f2ed;    /* Warm off-white */
  --text-secondary: #b8c4d0;  /* Blue-gray */
  --text-muted: #7a8a9a;      /* Muted */
  --text-accent: var(--peach-400);

  /* ===== BORDERS ===== */
  --border-subtle: rgba(255, 255, 255, 0.05);
  --border-card: rgba(228, 168, 128, 0.08);
  --border-accent: rgba(228, 168, 128, 0.3);
}
```

**Step 2: Commit**

```bash
git add client/src/styles/enchanted.css
git commit -m "feat(colors): add unified peach palette and semantic tokens"
```

---

### Task 2.2: Update Tailwind Color Config

**Files:**
- Modify: `tailwind.config.ts:21-52`

**Step 1: Add peach palette to Tailwind**

Update the colors section, adding after the forest colors:

```typescript
colors: {
  // ... existing forest colors ...

  // Unified Peach Palette
  peach: {
    '50': '#fdf8f6',
    '100': '#fdf6f0',
    '200': '#f8e4d6',
    '300': '#f0c9ae',
    '400': '#e4a880',
    '500': '#d4936a',
    '600': '#c07850',
  },

  // Ice Theme (for v5)
  ice: {
    'deep': '#070f1a',
    'primary': '#0c1a28',
    'card': '#0f2433',
    'frost': '#1a3a4a',
    'glow': '#7dd3fc',
  },

  // ... rest of existing colors ...
},
```

**Step 2: Verify build**

Run: `npm run check`
Expected: TypeScript check passes

**Step 3: Commit**

```bash
git add tailwind.config.ts
git commit -m "feat(tailwind): add unified peach and ice color scales"
```

---

## Phase 3: Card System Redesign

### Task 3.1: Create Base Card Styles

**Files:**
- Modify: `client/src/styles/enchanted.css`

**Step 1: Add luxury card base styles**

Add after the color tokens:

```css
/* ===== LUXURY CARD SYSTEM ===== */

.glass-card {
  background: var(--bg-card-alpha);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--border-card);
  border-radius: 20px;
  padding: 28px;
  position: relative;
  overflow: hidden;

  /* Grounding shadow */
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);

  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.glass-card:hover {
  transform: translateY(-2px);
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

/* Frost texture overlay */
.glass-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.015;
  pointer-events: none;
  border-radius: inherit;
}

/* Card header styling */
.glass-card .card-title {
  font-family: var(--font-heading);
  font-weight: 500;
  font-size: var(--text-h2);
  color: var(--text-primary);
  margin-bottom: 16px;
}
```

**Step 2: Add organic frost accent class**

```css
/* Frost corner accents */
.frost-accent {
  position: relative;
}

.frost-accent::after {
  content: '';
  position: absolute;
  top: -1px;
  right: -1px;
  width: 40px;
  height: 40px;
  background: linear-gradient(
    135deg,
    rgba(228, 168, 128, 0.1) 0%,
    transparent 50%
  );
  border-radius: 0 20px 0 20px;
  pointer-events: none;
}
```

**Step 3: Commit**

```bash
git add client/src/styles/enchanted.css
git commit -m "feat(cards): add luxury glassmorphism card system"
```

---

### Task 3.2: Add Card Grounding Styles

**Files:**
- Modify: `client/src/styles/enchanted.css`

**Step 1: Add ground plane gradient**

```css
/* ===== GROUNDING ELEMENTS ===== */

/* Ground plane beneath cards */
.ground-plane {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 35vh;
  background: linear-gradient(
    to top,
    rgba(7, 15, 26, 0.95) 0%,
    rgba(7, 15, 26, 0.6) 40%,
    transparent 100%
  );
  pointer-events: none;
  z-index: 1;
}

/* Card grid grounding shadow */
.card-grid-shadow {
  filter: drop-shadow(0 40px 60px rgba(0, 0, 0, 0.4));
}
```

**Step 2: Commit**

```bash
git add client/src/styles/enchanted.css
git commit -m "feat(layout): add card grounding visual treatment"
```

---

## Phase 4: Data Visualization Refinement

### Task 4.1: Create Progress Ring Component

**Files:**
- Create: `client/src/components/LuxuryProgressRing.tsx`

**Step 1: Write the component**

```tsx
import { cn } from '@/lib/utils';

interface LuxuryProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

export function LuxuryProgressRing({
  progress,
  size = 72,
  strokeWidth = 6,
  label,
  className,
}: LuxuryProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // Half circle
  const offset = circumference - (progress / 100) * circumference;

  const isEmpty = progress === 0;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative" style={{ width: size, height: size / 2 + 8 }}>
        <svg
          viewBox={`0 0 ${size} ${size / 2 + 8}`}
          className="w-full h-full overflow-visible"
        >
          {/* Track with subtle peach tint */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke="rgba(228, 168, 128, 0.15)"
            strokeWidth={strokeWidth}
            className={cn(isEmpty && "animate-shimmer")}
          />
          {/* Progress fill */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke="var(--peach-400)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 0.5s ease',
              filter: progress > 0 ? 'drop-shadow(0 0 6px rgba(228, 168, 128, 0.5))' : 'none',
            }}
          />
        </svg>
        {/* Percentage */}
        <span
          className="absolute font-heading text-sm font-medium"
          style={{
            bottom: '4px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'var(--text-primary)',
          }}
        >
          {progress}%
        </span>
      </div>
      {/* Label */}
      {label && (
        <span
          className="font-heading italic text-xs text-center max-w-[70px] truncate"
          style={{ color: 'var(--text-muted)' }}
          title={label}
        >
          {label}
        </span>
      )}
    </div>
  );
}
```

**Step 2: Add shimmer animation to enchanted.css**

```css
/* Empty state shimmer */
@keyframes shimmer {
  0%, 100% { opacity: 0.15; }
  50% { opacity: 0.25; }
}

.animate-shimmer {
  animation: shimmer 3s ease-in-out infinite;
}
```

**Step 3: Commit**

```bash
git add client/src/components/LuxuryProgressRing.tsx client/src/styles/enchanted.css
git commit -m "feat(components): add LuxuryProgressRing with shimmer empty state"
```

---

### Task 4.2: Create Refined Weekly Rhythm Chart

**Files:**
- Create: `client/src/components/LuxuryWeeklyRhythm.tsx`

**Step 1: Write the component**

```tsx
import { cn } from '@/lib/utils';

interface DayData {
  day: string;
  height: number;
  isToday: boolean;
}

interface LuxuryWeeklyRhythmProps {
  data: DayData[];
  className?: string;
}

export function LuxuryWeeklyRhythm({ data, className }: LuxuryWeeklyRhythmProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      {/* Bars container */}
      <div className="flex items-end justify-around h-24 mb-3">
        {data.map((item, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            {/* Bar */}
            <div
              className={cn(
                "w-3 rounded-t-md transition-all duration-300",
                item.isToday && "shadow-[0_0_12px_rgba(228,168,128,0.4)]"
              )}
              style={{
                height: `${Math.max(item.height, 4)}%`,
                background: item.isToday
                  ? 'linear-gradient(to top, var(--peach-500), var(--peach-400))'
                  : 'linear-gradient(to top, var(--peach-400), var(--peach-300))',
                opacity: item.height === 0 ? 0.3 : 1,
              }}
            />
          </div>
        ))}
      </div>

      {/* Baseline */}
      <div className="h-px bg-white/10 mb-2" />

      {/* Day labels */}
      <div className="flex justify-around">
        {data.map((item, i) => (
          <span
            key={i}
            className={cn(
              "font-heading-sc text-[10px] tracking-wide",
              item.isToday ? "text-peach-400" : "text-[var(--text-muted)]"
            )}
          >
            {item.day}
          </span>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add client/src/components/LuxuryWeeklyRhythm.tsx
git commit -m "feat(components): add LuxuryWeeklyRhythm bar chart"
```

---

### Task 4.3: Create Refined Habit Grid

**Files:**
- Create: `client/src/components/LuxuryHabitGrid.tsx`

**Step 1: Write the component**

```tsx
import { cn } from '@/lib/utils';

interface HabitRow {
  name: string;
  days: boolean[]; // 7 booleans for S-S
  completed: number;
  total: number;
}

interface LuxuryHabitGridProps {
  habits: HabitRow[];
  dayLabels?: string[];
  className?: string;
}

export function LuxuryHabitGrid({
  habits,
  dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  className,
}: LuxuryHabitGridProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Day headers */}
      <div className="flex items-center gap-2">
        <div className="w-16" /> {/* Spacer for habit names */}
        <div className="flex-1 grid grid-cols-7 gap-1">
          {dayLabels.map((day, i) => (
            <span
              key={i}
              className="font-heading-sc text-[10px] text-center text-[var(--text-muted)]"
            >
              {day}
            </span>
          ))}
        </div>
        <div className="w-8" /> {/* Spacer for count */}
      </div>

      {/* Habit rows */}
      {habits.map((habit, i) => (
        <div key={i} className="flex items-center gap-2">
          {/* Habit name */}
          <span
            className="w-16 font-heading text-xs text-[var(--text-secondary)] truncate"
            title={habit.name}
          >
            {habit.name}
          </span>

          {/* Day circles */}
          <div className="flex-1 grid grid-cols-7 gap-1">
            {habit.days.map((completed, j) => (
              <div
                key={j}
                className={cn(
                  "w-3.5 h-3.5 rounded-full mx-auto transition-all",
                  completed
                    ? "bg-peach-400 shadow-[0_0_6px_rgba(228,168,128,0.4)]"
                    : "bg-white/10 border border-white/5"
                )}
              />
            ))}
          </div>

          {/* Completion count */}
          <span className="w-8 font-heading text-xs text-right text-[var(--text-muted)]">
            {habit.completed}/{habit.total}
          </span>
        </div>
      ))}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add client/src/components/LuxuryHabitGrid.tsx
git commit -m "feat(components): add LuxuryHabitGrid with proper labels"
```

---

### Task 4.4: Create Editorial Goal Item

**Files:**
- Create: `client/src/components/LuxuryGoalItem.tsx`

**Step 1: Write the component**

```tsx
import { cn } from '@/lib/utils';

interface LuxuryGoalItemProps {
  title: string;
  current: number;
  target: number;
  isComplete?: boolean;
  className?: string;
}

export function LuxuryGoalItem({
  title,
  current,
  target,
  isComplete,
  className,
}: LuxuryGoalItemProps) {
  const progress = Math.min((current / target) * 100, 100);
  const complete = isComplete ?? current >= target;

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl transition-all",
        complete ? "bg-peach-400/10" : "bg-white/5",
        className
      )}
    >
      {/* Checkmark circle */}
      <div
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all",
          complete
            ? "bg-peach-400 text-ice-deep shadow-[0_0_10px_rgba(228,168,128,0.4)]"
            : "border-2 border-white/20"
        )}
      >
        {complete && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>

      {/* Title */}
      <span
        className={cn(
          "flex-1 font-heading text-sm",
          complete ? "text-[var(--text-muted)] line-through" : "text-[var(--text-primary)]"
        )}
      >
        {title}
      </span>

      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        {/* Mini progress bar */}
        <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${progress}%`,
              background: complete ? 'var(--peach-400)' : 'var(--peach-300)',
            }}
          />
        </div>
        {/* Count */}
        <span
          className={cn(
            "font-heading text-xs font-medium min-w-[32px] text-right",
            complete ? "text-peach-400" : "text-[var(--text-muted)]"
          )}
        >
          {current}/{target}
        </span>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add client/src/components/LuxuryGoalItem.tsx
git commit -m "feat(components): add LuxuryGoalItem with progress bar"
```

---

### Task 4.5: Create Editorial Study Tracker

**Files:**
- Create: `client/src/components/LuxuryStudyTracker.tsx`

**Step 1: Write the component**

```tsx
import { cn } from '@/lib/utils';

interface LuxuryStudyTrackerProps {
  todayMinutes: number;
  weekMinutes: number;
  onStartSession?: () => void;
  className?: string;
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export function LuxuryStudyTracker({
  todayMinutes,
  weekMinutes,
  onStartSession,
  className,
}: LuxuryStudyTrackerProps) {
  const isEmpty = todayMinutes === 0;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* Today's time - Large editorial display */}
      <div className="text-center mb-4">
        <span
          className="font-heading text-3xl font-light tracking-wide"
          style={{ color: isEmpty ? 'var(--text-muted)' : 'var(--text-primary)' }}
        >
          {isEmpty ? 'Ready to focus?' : formatTime(todayMinutes)}
        </span>
        <div className="font-heading italic text-xs text-[var(--text-muted)] mt-1">
          today
        </div>
      </div>

      {/* This week - Secondary */}
      <div className="text-center mb-6">
        <span className="font-body text-sm text-[var(--text-muted)]">
          this week:{' '}
          <span className="text-[var(--text-secondary)]">{formatTime(weekMinutes)}</span>
        </span>
      </div>

      {/* Start button - Refined */}
      <button
        onClick={onStartSession}
        className={cn(
          "w-full py-3 rounded-2xl font-heading text-sm tracking-wide transition-all",
          "bg-peach-400 text-ice-deep",
          "shadow-[0_4px_20px_rgba(228,168,128,0.3)]",
          "hover:shadow-[0_6px_28px_rgba(228,168,128,0.4)]",
          "hover:translate-y-[-1px]",
          "active:translate-y-0"
        )}
      >
        Begin Session
      </button>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add client/src/components/LuxuryStudyTracker.tsx
git commit -m "feat(components): add LuxuryStudyTracker with editorial styling"
```

---

### Task 4.6: Create Editorial Fun Fact Card

**Files:**
- Create: `client/src/components/LuxuryFunFact.tsx`

**Step 1: Write the component**

```tsx
import { cn } from '@/lib/utils';

interface LuxuryFunFactProps {
  title: string;
  content: string;
  category?: string;
  className?: string;
}

export function LuxuryFunFact({
  title,
  content,
  category = 'Fun Fact',
  className,
}: LuxuryFunFactProps) {
  return (
    <div className={cn("relative", className)}>
      {/* Decorative open quote */}
      <span
        className="absolute -top-2 -left-1 font-display text-4xl text-peach-300/30"
        aria-hidden="true"
      >
        "
      </span>

      {/* Content */}
      <div className="pl-4 pt-4">
        {/* Title */}
        <h4 className="font-heading text-base text-peach-400 mb-2">
          {title}
        </h4>

        {/* Body */}
        <p
          className="font-body text-sm leading-relaxed"
          style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}
        >
          {content}
        </p>
      </div>

      {/* Decorative close quote */}
      <span
        className="absolute -bottom-4 right-2 font-display text-4xl text-peach-300/30 rotate-180"
        aria-hidden="true"
      >
        "
      </span>

      {/* Category footer */}
      <div className="flex items-center gap-2 mt-6 pt-3 border-t border-white/5">
        <span className="font-heading-sc text-[10px] tracking-wide text-[var(--text-muted)]">
          {category}
        </span>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add client/src/components/LuxuryFunFact.tsx
git commit -m "feat(components): add LuxuryFunFact with editorial quotes"
```

---

## Phase 5: Dashboard Integration

### Task 5.1: Update DashboardV4 Layout

**Files:**
- Modify: `client/src/pages/DashboardV4.tsx`

**Step 1: Update imports**

Add at the top of the file after existing imports:

```tsx
// Luxury v5 Components
import { LuxuryProgressRing } from '@/components/LuxuryProgressRing';
import { LuxuryWeeklyRhythm } from '@/components/LuxuryWeeklyRhythm';
import { LuxuryHabitGrid } from '@/components/LuxuryHabitGrid';
import { LuxuryGoalItem } from '@/components/LuxuryGoalItem';
import { LuxuryStudyTracker } from '@/components/LuxuryStudyTracker';
import { LuxuryFunFact } from '@/components/LuxuryFunFact';
```

**Step 2: Update header with typography classes**

Replace the header section (lines ~304-317):

```tsx
{/* HEADER: Logo + Habit Orbs + Stats */}
<header className="flex justify-between items-center mb-8">
  <div className="flex items-center gap-8">
    <h1 className="logo-text">
      GOAL CONNECT
    </h1>
    <div className="flex-shrink-0">
      <GlowingOrbHabits />
    </div>
  </div>
  <div className="flex gap-6 text-xs">
    <div className="font-body text-[var(--text-muted)]">
      <span className="font-heading text-base text-peach-400">{xp.toLocaleString()}</span>
      {' '}points
    </div>
    <div className="font-body text-[var(--text-muted)]">
      <span className="font-heading text-base text-peach-400">14</span>
      {' '}day streak
    </div>
  </div>
</header>
```

**Step 3: Update Weekly Goals card to use LuxuryGoalItem**

Replace the Weekly Goals card content:

```tsx
{/* Weekly Goals */}
<div className="glass-card frost-accent min-h-[280px]">
  <span className="card-title">Weekly Goals</span>
  {goalsLoading ? (
    <div className="space-y-2">
      {[1, 2, 3].map(i => <div key={i} className="h-12 bg-white/5 animate-pulse rounded-xl" />)}
    </div>
  ) : weeklyGoals.length === 0 ? (
    <Link href="/goals">
      <div className="font-heading italic text-sm text-[var(--text-muted)] hover:text-peach-400 py-8 text-center cursor-pointer transition-colors">
        + Add weekly goals
      </div>
    </Link>
  ) : (
    <div className="space-y-2">
      {weeklyGoals.map(goal => (
        <LuxuryGoalItem
          key={goal.id}
          title={goal.title}
          current={goal.currentValue}
          target={goal.targetValue}
        />
      ))}
    </div>
  )}
</div>
```

**Step 4: Update Study Tracker card**

Replace the Study Tracker card:

```tsx
{/* Study Tracker */}
<div className="glass-card frost-accent min-h-[280px]">
  <span className="card-title">Study Tracker</span>
  <LuxuryStudyTracker
    todayMinutes={0}
    weekMinutes={0}
    onStartSession={() => {
      toast({ title: "Study session started" });
    }}
  />
</div>
```

**Step 5: Update Monthly Progress card**

Replace the Monthly Progress card:

```tsx
{/* Monthly Progress */}
<div className="glass-card frost-accent min-h-[280px]">
  <span className="card-title">Monthly Progress</span>
  <div className="flex-1 flex items-center justify-around pt-4">
    {monthlyGoals.length === 0 ? (
      <Link href="/goals">
        <div className="font-heading italic text-sm text-[var(--text-muted)] hover:text-peach-400 py-4 text-center cursor-pointer transition-colors">
          + Add monthly goals
        </div>
      </Link>
    ) : (
      monthlyGoals.slice(0, 3).map(goal => {
        const progress = Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100);
        return (
          <LuxuryProgressRing
            key={goal.id}
            progress={progress}
            label={goal.title}
          />
        );
      })
    )}
  </div>
</div>
```

**Step 6: Update Row 2 cards**

Replace Place to Explore card:

```tsx
{/* Place to Explore */}
<div className="glass-card frost-accent min-h-[200px]">
  <span className="card-title">Place to Explore</span>
  <LuxuryFunFact
    title="The Term 'Beta'"
    content="Climbers call route information 'beta' after Bates Method videos in the 1980s. Jack Bates filmed climbers solving problems, and the footage became the original way to share route knowledge."
    category="Climbing Lore"
  />
</div>
```

Replace Weekly Rhythm card:

```tsx
{/* Weekly Rhythm */}
<div className="glass-card frost-accent min-h-[200px]">
  <span className="card-title">Weekly Rhythm</span>
  <LuxuryWeeklyRhythm data={weeklyRhythm} className="mt-4" />
</div>
```

Replace This Week card:

```tsx
{/* This Week */}
<div className="glass-card frost-accent min-h-[200px]">
  <span className="card-title">This Week</span>
  <LuxuryHabitGrid
    habits={todayHabits.slice(0, 4).map(habit => ({
      name: habit.name,
      days: week.dates.map(date => completionMap[habit.id]?.[date] ?? false),
      completed: week.dates.filter(date => completionMap[habit.id]?.[date]).length,
      total: 7,
    }))}
    className="mt-3"
  />
</div>
```

**Step 7: Verify the dashboard renders**

Run: `npm run dev`
Navigate to: `/v4`
Expected: Dashboard loads with new luxury components

**Step 8: Commit**

```bash
git add client/src/pages/DashboardV4.tsx
git commit -m "feat(dashboard): integrate luxury v5 components"
```

---

## Phase 6: Accessibility & Micro-Interactions

### Task 6.0: Add Accessibility Enhancements

**Files:**
- Modify: `client/src/styles/enchanted.css`
- Modify: `client/src/components/LuxuryProgressRing.tsx`

**Step 1: Add focus states to CSS**

```css
/* ===== ACCESSIBILITY ===== */

/* Visible focus states */
.glass-card:focus-visible,
button:focus-visible,
a:focus-visible {
  outline: 2px solid var(--peach-400);
  outline-offset: 2px;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Step 2: Add ARIA to LuxuryProgressRing**

Update the SVG element to include:
```tsx
<svg
  role="progressbar"
  aria-valuenow={progress}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label={label ? `${label}: ${progress}% complete` : `${progress}% complete`}
  viewBox={`0 0 ${size} ${size / 2 + 8}`}
  className="w-full h-full overflow-visible"
>
```

**Step 3: Commit**

```bash
git add client/src/styles/enchanted.css client/src/components/LuxuryProgressRing.tsx
git commit -m "feat(a11y): add focus states and ARIA labels"
```

---

### Task 6.1: Add Staggered Card Entry Animation

**Files:**
- Modify: `client/src/styles/enchanted.css`

**Step 1: Add card entry animation**

```css
/* ===== MICRO-INTERACTIONS ===== */

/* Staggered card entry */
@keyframes card-enter {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.glass-card {
  animation: card-enter 0.4s ease-out backwards;
}

.card-grid > .glass-card:nth-child(1) { animation-delay: 0ms; }
.card-grid > .glass-card:nth-child(2) { animation-delay: 50ms; }
.card-grid > .glass-card:nth-child(3) { animation-delay: 100ms; }
.card-grid > .glass-card:nth-child(4) { animation-delay: 150ms; }
.card-grid > .glass-card:nth-child(5) { animation-delay: 200ms; }
.card-grid > .glass-card:nth-child(6) { animation-delay: 250ms; }

/* Checkbox completion pop */
@keyframes check-pop {
  0% { transform: scale(0); }
  70% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.goal-complete-check {
  animation: check-pop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* Bar chart grow */
@keyframes bar-grow {
  from {
    transform: scaleY(0);
    transform-origin: bottom;
  }
  to {
    transform: scaleY(1);
  }
}

.rhythm-bar {
  animation: bar-grow 0.6s ease-out backwards;
}
```

**Step 2: Add card-grid class to DashboardV4**

Update the grid containers in DashboardV4.tsx:
```tsx
<div className="card-grid grid grid-cols-3 gap-4">
```

**Step 3: Commit**

```bash
git add client/src/styles/enchanted.css client/src/pages/DashboardV4.tsx
git commit -m "feat(animations): add staggered card entry and completion animations"
```

---

## Phase 7: Polish & Empty States

### Task 6.1: Add Empty State Messaging

**Files:**
- Modify: Various luxury components

**Step 1: Update LuxuryProgressRing empty state**

When progress is 0, show encouraging message on hover (already has shimmer animation).

**Step 2: Update LuxuryStudyTracker empty state**

Already shows "Ready to focus?" - this is good.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat(empty-states): add encouraging empty state messages"
```

---

### Task 6.2: Add Hover Interactions

**Files:**
- Modify: `client/src/styles/enchanted.css`

**Step 1: Add interactive hover states**

```css
/* ===== INTERACTIVE STATES ===== */

/* Goal items */
.goal-item {
  cursor: pointer;
  transition: all 0.2s ease;
}

.goal-item:hover {
  background: rgba(228, 168, 128, 0.08);
}

/* Habit grid circles */
.habit-circle {
  cursor: pointer;
  transition: all 0.15s ease;
}

.habit-circle:hover {
  transform: scale(1.2);
}

/* Link hover with underline */
.link-subtle {
  position: relative;
  color: var(--peach-400);
  text-decoration: none;
}

.link-subtle::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--peach-400);
  transform: scaleX(0);
  transition: transform 0.2s ease;
}

.link-subtle:hover::after {
  transform: scaleX(1);
}
```

**Step 2: Commit**

```bash
git add client/src/styles/enchanted.css
git commit -m "feat(interactions): add refined hover states"
```

---

## Phase 7: Final Integration & Testing

### Task 7.1: Full Visual QA

**Step 1: Run dev server and check all cards**

Run: `npm run dev`
Check each card renders correctly with:
- Proper typography (serif headers, sans body)
- Unified peach accent color
- Glassmorphism effect
- Frost accent in corners
- Proper spacing

**Step 2: Check empty states**

- Remove test data to verify empty states show encouraging messages
- Verify shimmer animation on progress rings

**Step 3: Check hover states**

- Hover over goal items
- Hover over habit circles
- Hover over buttons

**Step 4: Check responsive behavior**

- Resize browser to verify cards stack properly

### Task 7.2: Final Commit

**Step 1: Stage all changes**

```bash
git add -A
git status
```

**Step 2: Create final commit**

```bash
git commit -m "feat(v5): complete luxury journal redesign

- Typography: Cormorant Garamond serif system
- Colors: Unified peach-400 accent palette
- Cards: Glassmorphism with frost accents
- Visualizations: Refined rings, charts, grids
- Empty states: Encouraging messaging with shimmer
- Interactions: Polished hover states"
```

---

## Summary

### Files Created
- `client/src/components/LuxuryProgressRing.tsx`
- `client/src/components/LuxuryWeeklyRhythm.tsx`
- `client/src/components/LuxuryHabitGrid.tsx`
- `client/src/components/LuxuryGoalItem.tsx`
- `client/src/components/LuxuryStudyTracker.tsx`
- `client/src/components/LuxuryFunFact.tsx`

### Files Modified
- `client/src/styles/enchanted.css`
- `tailwind.config.ts`
- `client/src/pages/DashboardV4.tsx`

### Key Design Decisions
1. **Typography**: Single voice with Cormorant Garamond (luxury journal)
2. **Color**: Unified `--peach-400` (#e4a880) for all accent uses
3. **Cards**: 78% opacity glassmorphism with 20px radius, frost corner accents
4. **Data viz**: Editorial styling with proper labels, encouraging empty states
5. **Grounding**: Drop shadows and ground plane gradient

---

**Plan complete.** Ready for execution via `executing-plans` skill.
