# Sundown v8 Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current IcyDash dashboard with the Sundown v8 design — full-bleed desert landscape, warm brown 3D glass cards (shell+face+tray), centered title, tab dock, habit grid, goals, progress ring, media player, todo list, statistics.

**Architecture:** New `SundownDash.tsx` page replaces `IcyDash.tsx` at the `/` route. New `sundown/` component directory houses reusable 3D glass card primitives (`SundownShell`, `SundownFace`, `SundownTray`) and section components. CSS custom properties defined in a new `sundown.css` file imported globally. Existing data hooks (`useQuery` for habits, goals, etc.) are reused — only the presentation layer changes.

**Tech Stack:** React 18 + TypeScript, Tailwind CSS 3.4 + CSS custom properties, Framer Motion (hover animations), existing TanStack Query hooks, Wouter routing, Recharts (statistics charts).

**Production Checklist:**
- [ ] Centralized config (CSS variables for all design tokens — no magic strings)
- [ ] Error boundaries around each card section
- [ ] Skeleton loading states matching card structure
- [ ] Toast notifications for habit toggles and goal updates
- [ ] Optimistic updates for habit check-ins (already exist in IcyDash)
- [ ] Mobile-friendly (single column < 1200px, touch targets 44px+)
- [ ] E2E test for dashboard load + habit toggle
- [ ] Accessibility (ARIA labels on interactive elements, keyboard nav for tabs)

---

## Phase 1: Foundation (CSS + Primitives)

### Task 1: Create Sundown CSS Variables

**Files:**
- Create: `client/src/sundown.css`
- Modify: `client/src/main.tsx` (add import)

**Step 1: Create sundown.css with all design tokens**

```css
/* sundown.css — Sundown v8 3D Glass Design Tokens */

:root {
  /* Desert palette */
  --sd-sky-coral: #d4604a;
  --sd-warm-gold: #daa520;
  --sd-burnt-amber: #c47a20;
  --sd-mesa-dark: #8B4513;
  --sd-mesa-mid: #CD853F;
  --sd-charcoal-rock: #2a1f1a;
  --sd-deep-charcoal: #1a0f0a;

  /* 3D glass tokens */
  --sd-shell-bg: rgba(40, 22, 18, 0.75);
  --sd-shell-radius: 28px;
  --sd-shell-pad: 4px;
  --sd-face-bg: rgba(80, 50, 35, 0.35);
  --sd-face-radius: 24px;
  --sd-face-blur: 20px;
  --sd-tray-bg: rgba(15, 10, 8, 0.5);

  /* Shadows */
  --sd-card-shadow:
    0 4px 8px rgba(60,30,15,0.3),
    0 20px 40px rgba(40,20,10,0.4),
    0 40px 80px rgba(20,10,5,0.25);
  --sd-face-inset:
    inset 0 1px 0 rgba(255,200,140,0.15),
    inset 0 -8px 16px rgba(0,0,0,0.2);
  --sd-tray-inset:
    inset 0 4px 8px rgba(0,0,0,0.4),
    inset 0 -2px 4px rgba(0,0,0,0.2);

  /* Typography */
  --sd-text-primary: #F0DEC7;
  --sd-text-secondary: #D9B79A;
  --sd-text-muted: #A9826A;
  --sd-text-accent: #E1A45C;
}
```

**Step 2: Import in main.tsx**

Add `import './sundown.css';` after the existing CSS imports in `client/src/main.tsx`.

**Step 3: Commit**

```bash
git add client/src/sundown.css client/src/main.tsx
git commit -m "feat: add sundown v8 CSS design tokens"
```

---

### Task 2: Create SundownCard Primitives

**Files:**
- Create: `client/src/components/sundown/SundownCard.tsx`

**Step 1: Build the three-tier card system**

```typescript
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { forwardRef, type ReactNode, type HTMLAttributes } from 'react';

// ─── Shell: outer bevel frame ───
interface ShellProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
}

export const SundownShell = forwardRef<HTMLDivElement, ShellProps>(
  ({ children, hover = true, className, ...props }, ref) => {
    const base = (
      <div
        ref={ref}
        className={cn(
          'flex flex-col',
          className
        )}
        style={{
          background: 'var(--sd-shell-bg)',
          borderRadius: 'var(--sd-shell-radius)',
          padding: 'var(--sd-shell-pad)',
          boxShadow: 'var(--sd-card-shadow)',
        }}
        {...props}
      >
        {children}
      </div>
    );

    if (!hover) return base;

    return (
      <motion.div
        ref={ref}
        className={cn('flex flex-col', className)}
        style={{
          background: 'var(--sd-shell-bg)',
          borderRadius: 'var(--sd-shell-radius)',
          padding: 'var(--sd-shell-pad)',
          boxShadow: 'var(--sd-card-shadow)',
          transformStyle: 'preserve-3d',
        }}
        whileHover={{
          y: -4,
          boxShadow: '0 6px 12px rgba(60,30,15,0.3), 0 28px 56px rgba(40,20,10,0.4), 0 56px 100px rgba(20,10,5,0.25)',
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
SundownShell.displayName = 'SundownShell';

// ─── Face: glass surface inside shell ───
interface FaceProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const SundownFace = forwardRef<HTMLDivElement, FaceProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex-1 min-h-0 flex flex-col', className)}
      style={{
        background: 'var(--sd-face-bg)',
        backdropFilter: 'blur(var(--sd-face-blur)) saturate(1.3)',
        WebkitBackdropFilter: 'blur(var(--sd-face-blur)) saturate(1.3)',
        borderRadius: 'var(--sd-face-radius)',
        padding: '24px',
        borderTop: '1px solid rgba(255,200,140,0.12)',
        boxShadow: 'var(--sd-face-inset)',
      }}
      {...props}
    >
      {children}
    </div>
  )
);
SundownFace.displayName = 'SundownFace';

// ─── Tray: recessed inner well ───
interface TrayProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const SundownTray = forwardRef<HTMLDivElement, TrayProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex-1 min-h-0 overflow-hidden', className)}
      style={{
        background: 'var(--sd-tray-bg)',
        border: '1px solid rgba(0,0,0,0.15)',
        borderRadius: '20px',
        padding: '18px',
        boxShadow: 'var(--sd-tray-inset)',
      }}
      {...props}
    >
      {children}
    </div>
  )
);
SundownTray.displayName = 'SundownTray';

// ─── Card Header ───
export function SundownCardHeader({
  title,
  right,
}: {
  title: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-[18px] shrink-0">
      <span
        className="font-display font-semibold"
        style={{ fontSize: '26px', color: 'var(--sd-text-primary)' }}
      >
        {title}
      </span>
      {right}
    </div>
  );
}

// ─── Convenience: Full card (shell > face > optional header + tray) ───
export function SundownCard({
  title,
  headerRight,
  children,
  className,
  useTray = true,
  hover = true,
}: {
  title?: string;
  headerRight?: ReactNode;
  children: ReactNode;
  className?: string;
  useTray?: boolean;
  hover?: boolean;
}) {
  return (
    <SundownShell hover={hover} className={className}>
      <SundownFace>
        {title && <SundownCardHeader title={title} right={headerRight} />}
        {useTray ? <SundownTray>{children}</SundownTray> : children}
      </SundownFace>
    </SundownShell>
  );
}
```

**Step 2: Commit**

```bash
git add client/src/components/sundown/SundownCard.tsx
git commit -m "feat: add SundownCard 3-tier glass card primitives"
```

---

### Task 3: Create Landscape Background Component

**Files:**
- Create: `client/src/components/sundown/SundownLandscape.tsx`

**Step 1: Build the fixed background with overlays**

```typescript
export function SundownLandscape() {
  return (
    <div
      className="fixed inset-0 z-0"
      style={{
        backgroundColor: '#1a0f0a',
        backgroundImage: 'url(/backgrounds/desert-hero.png)',
        backgroundSize: '140vw auto',
        backgroundPosition: 'center bottom',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Warm vignette */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background: [
            'radial-gradient(ellipse at 50% 40%, transparent 40%, rgba(26,15,10,0.55) 100%)',
            'radial-gradient(ellipse 35% 40% at 50% 35%, rgba(255,248,231,0.12) 0%, transparent 70%)',
          ].join(', '),
        }}
      />
      {/* Bottom darkening for card contrast */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(10,5,3,0.92) 0%, rgba(10,5,3,0.6) 20%, rgba(10,5,3,0.15) 40%, transparent 55%)',
        }}
      />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add client/src/components/sundown/SundownLandscape.tsx
git commit -m "feat: add SundownLandscape fixed background component"
```

---

## Phase 2: Page Sections

### Task 4: Create Hero Section

**Files:**
- Create: `client/src/components/sundown/SundownHero.tsx`

**Step 1: Build hero with title + stat pills**

The stat pills will accept dynamic data props (weather, steps, task count) but use static defaults for now. These can be wired to real data later.

```typescript
import { SundownShell, SundownFace } from './SundownCard';

interface StatPillProps {
  icon: string;
  value: string;
  label: string;
}

function StatPill({ icon, value, label }: StatPillProps) {
  return (
    <SundownShell hover={false} style={{ borderRadius: '22px', padding: '2px' }}>
      <div
        className="flex items-center gap-1.5 px-[18px] py-2 text-[13px] font-medium"
        style={{
          background: 'var(--sd-face-bg)',
          backdropFilter: 'blur(20px) saturate(1.3)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
          borderRadius: '20px',
          color: 'var(--sd-text-secondary)',
          borderTop: '1px solid rgba(255,200,140,0.1)',
          boxShadow: 'var(--sd-face-inset)',
        }}
      >
        <span>{icon}</span>
        <span className="font-display font-bold text-lg" style={{ color: 'var(--sd-text-accent)' }}>
          {value}
        </span>
        {label}
      </div>
    </SundownShell>
  );
}

interface SundownHeroProps {
  tasksDone?: number;
  tasksTotal?: number;
}

export function SundownHero({ tasksDone = 4, tasksTotal = 8 }: SundownHeroProps) {
  return (
    <section className="relative flex flex-col items-center justify-center pt-10" style={{ height: '38vh', minHeight: '280px' }}>
      {/* Stat pills — top right */}
      <div className="absolute top-7 right-10 flex gap-3 max-lg:static max-lg:justify-center max-lg:mt-4 max-lg:flex-wrap">
        <StatPill icon="☀️" value="72°" label="Clear" />
        <StatPill icon="🚶" value="7,300" label="Steps" />
        <StatPill icon="✅" value={`${tasksDone}/${tasksTotal}`} label="Tasks" />
      </div>

      <h1
        className="font-display font-normal uppercase tracking-[8px] mb-1.5"
        style={{
          fontSize: '52px',
          color: 'rgba(240, 222, 199, 0.85)',
          textShadow: '0 2px 40px rgba(200,130,70,0.3), 0 0 80px rgba(200,130,70,0.1)',
        }}
      >
        Sundown
      </h1>
      <p
        className="font-body text-[15px] tracking-[2px]"
        style={{ color: 'rgba(217, 183, 154, 0.5)' }}
      >
        Personal Dashboard
      </p>
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add client/src/components/sundown/SundownHero.tsx
git commit -m "feat: add SundownHero section with stat pills"
```

---

### Task 5: Create Tab Dock

**Files:**
- Create: `client/src/components/sundown/SundownTabDock.tsx`

```typescript
import { SundownShell } from './SundownCard';

interface SundownTabDockProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs?: string[];
}

export function SundownTabDock({
  activeTab,
  onTabChange,
  tabs = ['Overview', 'Goals', 'Habits', 'Journal'],
}: SundownTabDockProps) {
  return (
    <div className="flex justify-center px-10 pb-7 max-lg:px-5">
      <SundownShell hover={false} style={{ borderRadius: '34px', maxWidth: '520px', width: '100%' }}>
        <div
          className="flex gap-1 items-center justify-center h-14 px-2"
          style={{
            background: 'var(--sd-face-bg)',
            backdropFilter: 'blur(20px) saturate(1.3)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
            borderRadius: '30px',
            borderTop: '1px solid rgba(255,200,140,0.1)',
            boxShadow: 'var(--sd-face-inset)',
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className="transition-all duration-200 border-none cursor-pointer"
              style={{
                padding: activeTab === tab ? '0' : '8px 18px',
                borderRadius: '22px',
                fontSize: '13.5px',
                fontWeight: activeTab === tab ? 600 : 500,
                color: activeTab === tab ? 'var(--sd-text-primary)' : 'var(--sd-text-secondary)',
                background: activeTab === tab ? 'var(--sd-shell-bg)' : 'none',
                height: activeTab === tab ? '44px' : 'auto',
                display: 'flex',
                alignItems: 'center',
                boxShadow: activeTab === tab ? '0 4px 8px rgba(0,0,0,0.18)' : 'none',
              }}
            >
              {activeTab === tab ? (
                <span
                  className="flex items-center px-[22px] w-full"
                  style={{
                    background: 'var(--sd-face-bg)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderRadius: '20px',
                    height: 'calc(100% - 4px)',
                    borderTop: '1px solid rgba(255,200,140,0.12)',
                    boxShadow: 'inset 0 1px 0 rgba(255,228,195,0.16), inset 0 -5px 8px rgba(0,0,0,0.16)',
                  }}
                >
                  {tab}
                </span>
              ) : (
                tab
              )}
            </button>
          ))}
        </div>
      </SundownShell>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add client/src/components/sundown/SundownTabDock.tsx
git commit -m "feat: add SundownTabDock with shell+face active state"
```

---

### Task 6: Create Habit Grid Card

**Files:**
- Create: `client/src/components/sundown/SundownHabitCard.tsx`

This component takes real habit data from TanStack Query and renders the "This Week" card. It reuses the existing habit toggle mutation from IcyDash.

The component accepts `habits`, `habitLogs`, `weekDates`, `todayIndex`, and an `onToggle` callback — keeping it a presentational component that the parent page wires up.

**Step 1: Build the component** (see mockup lines for exact cell styling — empty cells get `inset box-shadow`, done cells get warm amber background, today cells get accent ring)

**Step 2: Commit**

```bash
git add client/src/components/sundown/SundownHabitCard.tsx
git commit -m "feat: add SundownHabitCard with habit grid"
```

---

### Task 7: Create Goals Card

**Files:**
- Create: `client/src/components/sundown/SundownGoalsCard.tsx`

2x2 grid of goal modules, each with a progress ring in a recessed well. Uses `useYearlyGoals` hook data. Each goal module is a mini shell+face with the ring well + goal info.

**Step 1: Build the component**

**Step 2: Commit**

```bash
git add client/src/components/sundown/SundownGoalsCard.tsx
git commit -m "feat: add SundownGoalsCard with 2x2 goal modules"
```

---

### Task 8: Create Progress Ring Card

**Files:**
- Create: `client/src/components/sundown/SundownProgressCard.tsx`

Large SVG ring (78% default) in a recessed well with gold glow drop-shadow. Takes `percentage` and `label` props.

**Step 1: Build the component**

**Step 2: Commit**

```bash
git add client/src/components/sundown/SundownProgressCard.tsx
git commit -m "feat: add SundownProgressCard with SVG ring"
```

---

### Task 9: Create Media Player Strip

**Files:**
- Create: `client/src/components/sundown/SundownPlayer.tsx`

Shell+face bar with album art, track info, playback controls, progress bar. Initially static/decorative — can be wired to real media data later.

**Step 1: Build the component**

**Step 2: Commit**

```bash
git add client/src/components/sundown/SundownPlayer.tsx
git commit -m "feat: add SundownPlayer media strip"
```

---

### Task 10: Create To-Do List Card

**Files:**
- Create: `client/src/components/sundown/SundownTodoCard.tsx`

Checkbox items with inset/raised styling. Can be wired to a task system later — initially uses static data matching the mockup.

**Step 1: Build the component**

**Step 2: Commit**

```bash
git add client/src/components/sundown/SundownTodoCard.tsx
git commit -m "feat: add SundownTodoCard with checkbox items"
```

---

### Task 11: Create Statistics Card

**Files:**
- Create: `client/src/components/sundown/SundownStatsCard.tsx`

Shell+face with reduced opacity for landscape bleed effect. Contains a CSS bar chart + SVG line graph. Uses Recharts `BarChart` and `LineChart` or raw SVG matching the mockup.

**Step 1: Build the component**

**Step 2: Commit**

```bash
git add client/src/components/sundown/SundownStatsCard.tsx
git commit -m "feat: add SundownStatsCard with charts and landscape bleed"
```

---

## Phase 3: Page Assembly

### Task 12: Create SundownDash Page

**Files:**
- Create: `client/src/pages/SundownDash.tsx`
- Modify: `client/src/App.tsx` (swap route)

**Step 1: Assemble all sections**

```typescript
import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useYearlyGoals } from '@/hooks/useYearlyGoals';

import { SundownLandscape } from '@/components/sundown/SundownLandscape';
import { SundownHero } from '@/components/sundown/SundownHero';
import { SundownTabDock } from '@/components/sundown/SundownTabDock';
import { SundownHabitCard } from '@/components/sundown/SundownHabitCard';
import { SundownGoalsCard } from '@/components/sundown/SundownGoalsCard';
import { SundownProgressCard } from '@/components/sundown/SundownProgressCard';
import { SundownPlayer } from '@/components/sundown/SundownPlayer';
import { SundownTodoCard } from '@/components/sundown/SundownTodoCard';
import { SundownStatsCard } from '@/components/sundown/SundownStatsCard';

import type { Habit, HabitLog } from '@shared/schema';

export default function SundownDash() {
  const [activeTab, setActiveTab] = useState('Overview');
  const { toast } = useToast();

  // ── Data fetching (reuse existing patterns from IcyDash) ──
  const { data: habits = [] } = useQuery<Habit[]>({
    queryKey: ['/api/habits'],
  });

  const { data: habitLogs = [] } = useQuery<HabitLog[]>({
    queryKey: ['/api/habit-logs'],
  });

  const { goals } = useYearlyGoals();

  // ── Week data ──
  const weekData = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const dates = days.map(d => format(d, 'yyyy-MM-dd'));
    const todayStr = format(now, 'yyyy-MM-dd');
    const todayIndex = dates.indexOf(todayStr);
    return { dates, todayIndex: todayIndex === -1 ? 0 : todayIndex };
  }, []);

  // ── Habit toggle mutation (same as IcyDash) ──
  const toggleHabit = useMutation({
    mutationFn: async ({ habitId, date }: { habitId: number; date: string }) => {
      return apiRequest('POST', `/api/habits/${habitId}/toggle`, { date });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/habit-logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/habits'] });
    },
    onError: () => {
      toast({ title: 'Failed to update habit', variant: 'destructive' });
    },
  });

  // ── Completion percentage ──
  const completionPct = useMemo(() => {
    if (!habits.length) return 0;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayLogs = habitLogs.filter(l => l.date === todayStr && l.completed);
    return Math.round((todayLogs.length / habits.length) * 100);
  }, [habits, habitLogs]);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ fontFamily: "'Source Sans 3', sans-serif", color: 'var(--sd-text-primary)' }}>
      <SundownLandscape />

      {/* Warm ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-[3]" style={{
        background: 'radial-gradient(ellipse at 50% 30%, rgba(150,80,45,0.12), transparent 50%)',
      }} />

      <div className="relative z-10" style={{ perspective: '1200px' }}>
        <SundownHero tasksDone={habitLogs.filter(l => l.date === format(new Date(), 'yyyy-MM-dd') && l.completed).length} tasksTotal={habits.length} />

        <SundownTabDock activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Three-column card row */}
        <div className="grid gap-6 px-10 pb-6 mx-auto max-w-[1280px] max-lg:grid-cols-1" style={{ gridTemplateColumns: '1.2fr 1fr 0.8fr' }}>
          <SundownHabitCard
            habits={habits}
            habitLogs={habitLogs}
            weekDates={weekData.dates}
            todayIndex={weekData.todayIndex}
            onToggle={(habitId, date) => toggleHabit.mutate({ habitId, date })}
          />
          <SundownGoalsCard goals={goals} />
          <SundownProgressCard percentage={completionPct} label="This Week" />
        </div>

        {/* Media player */}
        <div className="px-10 pb-6 mx-auto max-w-[1280px] max-lg:px-5">
          <SundownPlayer />
        </div>

        {/* Two-column bottom row */}
        <div className="grid grid-cols-2 gap-6 px-10 pb-16 mx-auto max-w-[1280px] max-lg:grid-cols-1 max-lg:px-5">
          <SundownTodoCard />
          <SundownStatsCard />
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Swap the route in App.tsx**

In `client/src/App.tsx`, change the `/` route from `IcyDash` to `SundownDash`:

```typescript
// Replace:
import IcyDash from '@/pages/IcyDash';
// With:
import SundownDash from '@/pages/SundownDash';

// And in the routes:
// Replace: <Route path="/"><IcyDash /></Route>
// With:    <Route path="/"><SundownDash /></Route>
```

Keep `IcyDash.tsx` — don't delete it. We can revert if needed.

**Step 3: Commit**

```bash
git add client/src/pages/SundownDash.tsx client/src/App.tsx
git commit -m "feat: add SundownDash page and wire to / route"
```

---

## Phase 4: Responsive + Polish

### Task 13: Responsive Breakpoints

**Files:**
- Modify: `client/src/pages/SundownDash.tsx`
- Modify: Individual sundown components as needed

**Breakpoints (matching mockup):**
- `< 1200px`: Three-column → single column, two-column → single column, hero shrinks
- `< 900px`: Habit grid columns narrow, player wraps, stat pills stack

Use Tailwind responsive prefixes (`max-lg:`, `max-md:`) directly in the components.

**Step 1: Add responsive classes**

**Step 2: Test at 375px, 768px, 1024px, 1440px**

**Step 3: Commit**

```bash
git commit -am "feat: add responsive breakpoints to Sundown dashboard"
```

---

### Task 14: Loading Skeletons

**Files:**
- Create: `client/src/components/sundown/SundownSkeleton.tsx`

Skeleton cards that match the exact card structure — shell outline with pulsing face interior.

```typescript
export function SundownCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse', className)}
      style={{
        background: 'var(--sd-shell-bg)',
        borderRadius: 'var(--sd-shell-radius)',
        padding: 'var(--sd-shell-pad)',
      }}
    >
      <div
        style={{
          background: 'rgba(80, 50, 35, 0.15)',
          borderRadius: 'var(--sd-face-radius)',
          padding: '24px',
          minHeight: '200px',
        }}
      >
        <div className="h-6 w-32 rounded mb-4" style={{ background: 'rgba(80,50,35,0.2)' }} />
        <div className="h-4 w-full rounded mb-2" style={{ background: 'rgba(80,50,35,0.15)' }} />
        <div className="h-4 w-3/4 rounded" style={{ background: 'rgba(80,50,35,0.12)' }} />
      </div>
    </div>
  );
}
```

**Step 1: Build skeletons**

**Step 2: Wire into SundownDash with `isLoading` checks**

**Step 3: Commit**

```bash
git add client/src/components/sundown/SundownSkeleton.tsx
git commit -am "feat: add sundown loading skeletons"
```

---

### Task 15: Error Boundaries

**Files:**
- Modify: `client/src/pages/SundownDash.tsx`

Wrap each card section in `<ErrorBoundary>` from the existing `@/components/ErrorBoundary.tsx`. Fallback renders a muted SundownShell with error message.

**Step 1: Add boundaries**

**Step 2: Commit**

```bash
git commit -am "feat: wrap sundown sections in error boundaries"
```

---

## Phase 5: Testing

### Task 16: E2E Test — Dashboard Loads

**Files:**
- Create: `tests/sundown-dashboard.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Sundown Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login first (use existing auth flow)
    await page.goto('/login');
    await page.fill('[name="username"]', 'testuser');
    await page.fill('[name="password"]', 'testpass');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('dashboard loads with all sections', async ({ page }) => {
    // Hero
    await expect(page.locator('text=Sundown')).toBeVisible();
    await expect(page.locator('text=Personal Dashboard')).toBeVisible();

    // Tab dock
    await expect(page.locator('text=Overview')).toBeVisible();
    await expect(page.locator('text=Goals')).toBeVisible();

    // Cards
    await expect(page.locator('text=This Week')).toBeVisible();
    await expect(page.locator('text=Weekly Goals')).toBeVisible();
    await expect(page.locator('text=Progress')).toBeVisible();
  });

  test('habit toggle works', async ({ page }) => {
    // Find a habit cell and click it
    const habitCells = page.locator('[data-testid="habit-cell"]');
    const firstCell = habitCells.first();
    await firstCell.click();

    // Should see toast or visual change
    await expect(firstCell).toHaveAttribute('data-completed', 'true');
  });
});
```

**Step 1: Write tests**

**Step 2: Run tests**

```bash
npx playwright test tests/sundown-dashboard.spec.ts --headed
```

**Step 3: Commit**

```bash
git add tests/sundown-dashboard.spec.ts
git commit -m "test: add E2E tests for Sundown dashboard"
```

---

## File Summary

```
NEW FILES (11):
  client/src/sundown.css
  client/src/components/sundown/SundownCard.tsx
  client/src/components/sundown/SundownLandscape.tsx
  client/src/components/sundown/SundownHero.tsx
  client/src/components/sundown/SundownTabDock.tsx
  client/src/components/sundown/SundownHabitCard.tsx
  client/src/components/sundown/SundownGoalsCard.tsx
  client/src/components/sundown/SundownProgressCard.tsx
  client/src/components/sundown/SundownPlayer.tsx
  client/src/components/sundown/SundownTodoCard.tsx
  client/src/components/sundown/SundownStatsCard.tsx
  client/src/components/sundown/SundownSkeleton.tsx
  client/src/pages/SundownDash.tsx
  tests/sundown-dashboard.spec.ts

MODIFIED FILES (2):
  client/src/main.tsx (add sundown.css import)
  client/src/App.tsx (swap / route to SundownDash)

PRESERVED (not deleted):
  client/src/pages/IcyDash.tsx (kept as fallback)
```

---

## Execution Order

| Phase | Tasks | Estimated Commits |
|-------|-------|-------------------|
| 1. Foundation | Tasks 1-3 (CSS + Card primitives + Landscape) | 3 |
| 2. Sections | Tasks 4-11 (Hero, Tabs, Habits, Goals, Ring, Player, Todo, Stats) | 8 |
| 3. Assembly | Task 12 (SundownDash page + route swap) | 1 |
| 4. Polish | Tasks 13-15 (Responsive, Skeletons, Error boundaries) | 3 |
| 5. Testing | Task 16 (E2E test) | 1 |
| **Total** | **16 tasks** | **16 commits** |
