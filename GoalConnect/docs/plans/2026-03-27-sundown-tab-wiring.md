# Sundown Dashboard — Tab Wiring & Live Data (v2 — post-roast)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire up the 4 dashboard tabs (Overview, Goals, Habits, Journal) so each shows different content, and replace the hardcoded weather pill with real data.

**Architecture:** CSS `display:none` tab switching (NOT conditional rendering — avoids remounting components and re-firing useEffects). Each tab reuses existing sundown components. Weather proxied through Express (Open-Meteo has no CORS headers).

**Tech Stack:** React, TanStack Query, TypeScript, existing sundown component library

**Roast fixes applied:**
- [x] CSS hidden tabs instead of conditional render (kills GoalsCard POST spam)
- [x] Weather proxied through Express (CORS confirmed missing)
- [x] Field name: `h.streak` not `h.currentStreak` (verified server/routes/habits.ts:218)
- [x] Task ordering fixed (tab components before wiring)

**Production Checklist:**
- [x] Centralized config — residency dates already centralized in SundownCountdown
- [ ] Error boundaries around tab content
- [ ] Loading states for weather fetch
- [ ] Toast notifications — already wired for habit toggles
- [ ] Mobile-friendly — existing responsive breakpoints apply
- [ ] Type safety — strict TypeScript throughout

---

## Current State

| Element | Status |
|---------|--------|
| Habit data (list + logs + toggle) | Working — real API data |
| Habit toggle mutation + confetti | Working |
| Weekly progress ring | Working — computed from real logs |
| Aurora reward / streak | Working — computed from real logs |
| Yearly goals grid | Working — real API data via useYearlyGoals |
| Weekly goals card | Working — auto-generates from yearly goals |
| Residency countdown | Working — dates hardcoded but correct (2025-07-14 to 2028-07-14) |
| Weather pill | Hardcoded "72° Clear" — needs fix |
| Tab switching | Broken — all tabs render same Overview content |

## API Shape Reference (VERIFIED)

**`/api/habits-with-data`** returns:
```json
[{
  ...habit,
  "streak": 5,              // ← NOT currentStreak
  "weeklyCompletion": 0.71,
  "history": [...]
}]
```

**Open-Meteo** — NO `Access-Control-Allow-Origin` header. Must proxy through Express.

---

## Task 0: Weather Proxy Endpoint

**Files:**
- Modify: `server/routes.ts` (add `/api/weather` route)
- Modify: `client/src/components/sundown/SundownHero.tsx`

**Step 1: Add Express proxy route**

In `server/routes.ts`, add near the other API routes:

```typescript
// Weather proxy (Open-Meteo has no CORS headers)
app.get("/api/weather", async (_req, res) => {
  try {
    const url = "https://api.open-meteo.com/v1/forecast?latitude=55.86&longitude=-4.25&current=temperature_2m,weather_code&temperature_unit=fahrenheit";
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch {
    res.json({ current: { temperature_2m: null, weather_code: null } });
  }
});
```

**Step 2: Update SundownHero to fetch from proxy**

```typescript
import { useQuery } from '@tanstack/react-query';

const WMO_CODES: Record<number, string> = {
  0: 'Clear', 1: 'Mostly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Rime Fog',
  51: 'Light Drizzle', 53: 'Drizzle', 55: 'Heavy Drizzle',
  61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain',
  71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow',
  80: 'Showers', 81: 'Heavy Showers', 82: 'Violent Showers',
  95: 'Thunderstorm', 96: 'Hail Storm', 99: 'Heavy Hail',
};

function useWeather() {
  return useQuery({
    queryKey: ['weather'],
    queryFn: async () => {
      const res = await fetch('/api/weather');
      const data = await res.json();
      return {
        temp: Math.round(data.current.temperature_2m),
        condition: WMO_CODES[data.current.weather_code] || 'Unknown',
      };
    },
    staleTime: 30 * 60 * 1000, // 30 min cache
    retry: 1,
  });
}
```

Replace hardcoded pill:
```tsx
const { data: weather } = useWeather();
// ...
<span className="sd-pill-val">{weather?.temp ?? '--'}°</span> {weather?.condition ?? '...'}
```

**Step 3: Commit**

```bash
git add server/routes.ts client/src/components/sundown/SundownHero.tsx
git commit -m "feat(sundown): live weather via Open-Meteo proxy"
```

---

## Task 1: Goals Tab Component

**Files:**
- Create: `client/src/components/sundown/SundownGoalsTab.tsx`

```tsx
import { SundownGoalsCard } from './SundownGoalsCard';
import { SundownMonthlyGoals } from './SundownMonthlyGoals';

interface GoalData {
  id: number;
  title: string;
  current: number;
  target: number;
  category: string;
}

interface SundownGoalsTabProps {
  goals: GoalData[];
}

export function SundownGoalsTab({ goals }: SundownGoalsTabProps) {
  return (
    <>
      <SundownGoalsCard />
      <div style={{ marginTop: 20 }}>
        <SundownMonthlyGoals goals={goals} />
      </div>
    </>
  );
}
```

**Commit:**
```bash
git add client/src/components/sundown/SundownGoalsTab.tsx
git commit -m "feat(sundown): Goals tab component"
```

---

## Task 2: Habits Tab Component

**Files:**
- Create: `client/src/components/sundown/SundownHabitsTab.tsx`

**IMPORTANT:** Uses `h.streak` (verified from server/routes/habits.ts:218), NOT `h.currentStreak`.

```tsx
import { SundownStardustTrail } from './SundownStardustTrail';
import { SundownStardustRing } from './SundownStardustRing';
import { SundownCard } from './SundownCard';
import { useQuery } from '@tanstack/react-query';

interface HabitData { id: number; name: string; icon: string; }
interface LogData { habitId: number; date: string; completed: boolean; }

interface SundownHabitsTabProps {
  habits: HabitData[];
  habitLogs: LogData[];
  weekDates: string[];
  todayIndex: number;
  onToggle: (habitId: number, date: string) => void;
  completionPct: number;
}

export function SundownHabitsTab({
  habits, habitLogs, weekDates, todayIndex, onToggle, completionPct,
}: SundownHabitsTabProps) {
  const { data: habitsWithData = [] } = useQuery<any[]>({
    queryKey: ['/api/habits-with-data'],
  });

  return (
    <>
      <SundownStardustTrail
        habits={habits}
        habitLogs={habitLogs}
        weekDates={weekDates}
        todayIndex={todayIndex}
        onToggle={onToggle}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
        <SundownStardustRing percentage={completionPct} />

        <SundownCard title="Streaks">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {habitsWithData.map((h: any) => (
              <div key={h.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 0', borderBottom: '1px solid rgba(255,200,140,0.06)',
              }}>
                <span style={{ fontSize: 13, color: 'var(--sd-text-primary)' }}>
                  {h.icon} {h.title}
                </span>
                <span style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 16, fontWeight: 700,
                  color: h.streak > 0 ? 'var(--sd-text-accent)' : 'var(--sd-text-muted)',
                }}>
                  {h.streak || 0}d
                </span>
              </div>
            ))}
          </div>
        </SundownCard>
      </div>
    </>
  );
}
```

**Commit:**
```bash
git add client/src/components/sundown/SundownHabitsTab.tsx
git commit -m "feat(sundown): Habits tab with streaks (uses verified h.streak field)"
```

---

## Task 3: Journal Tab Component

**Files:**
- Create: `client/src/components/sundown/SundownJournalTab.tsx`

```tsx
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { SundownCard } from './SundownCard';
import { useToast } from '@/hooks/use-toast';

const CUPS = ['Body', 'Adventure', 'Novelty', 'Soul', 'People', 'Mastery'];

interface DreamItem {
  id: number;
  title: string;
  description?: string;
  category: string;
  priority: string;
  cups: number[];
  completed: boolean;
}

export function SundownJournalTab() {
  const [filter, setFilter] = useState<string>('all');
  const [showCompleted, setShowCompleted] = useState(false);
  const { toast } = useToast();

  const { data: items = [] } = useQuery<DreamItem[]>({
    queryKey: ['/api/dream-scroll'],
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('POST', `/api/dream-scroll/${id}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dream-scroll'] });
      toast({ title: 'Updated!' });
    },
  });

  const filtered = items.filter(item => {
    if (!showCompleted && item.completed) return false;
    if (filter === 'all') return true;
    const cupIdx = CUPS.indexOf(filter);
    return cupIdx >= 0 && item.cups?.includes(cupIdx);
  });

  const badge = (
    <span className="sd-yearly-tab" style={{ pointerEvents: 'none' }}>
      {items.filter(i => i.completed).length}/{items.length}
    </span>
  );

  return (
    <SundownCard title="Dream Scroll" headerRight={badge}>
      {/* Cup filters */}
      <div className="sd-yearly-tabs" style={{ marginBottom: 14 }}>
        <button className={`sd-yearly-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
        {CUPS.map(cup => (
          <button key={cup} className={`sd-yearly-tab ${filter === cup ? 'active' : ''}`} onClick={() => setFilter(cup)}>{cup}</button>
        ))}
      </div>

      <button
        onClick={() => setShowCompleted(!showCompleted)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--sd-text-muted)', padding: 0, marginBottom: 12, display: 'block' }}
      >
        {showCompleted ? 'Hide' : 'Show'} completed ({items.filter(i => i.completed).length})
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--sd-text-muted)', textAlign: 'center', padding: 20 }}>
            {items.length === 0 ? 'No dream scroll items yet' : 'No items match this filter'}
          </div>
        )}
        {filtered.map(item => (
          <div key={item.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 0', borderBottom: '1px solid rgba(255,200,140,0.06)',
            opacity: item.completed ? 0.5 : 1,
          }}>
            <button
              onClick={() => toggleMutation.mutate(item.id)}
              style={{
                width: 24, height: 24, minWidth: 24, borderRadius: 6,
                border: `2px solid ${item.completed ? 'var(--sd-text-accent)' : 'rgba(255,200,140,0.2)'}`,
                background: item.completed ? 'rgba(200,131,73,0.3)' : 'transparent',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--sd-text-accent)', fontSize: 12,
              }}
            >
              {item.completed ? '✓' : ''}
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13, color: 'var(--sd-text-primary)',
                textDecoration: item.completed ? 'line-through' : 'none',
              }}>
                {item.title}
              </div>
              {item.cups?.length > 0 && (
                <div style={{ fontSize: 10, color: 'var(--sd-text-muted)', marginTop: 2 }}>
                  {item.cups.map(c => CUPS[c]).join(' · ')}
                </div>
              )}
            </div>
            <span style={{ fontSize: 10, color: 'var(--sd-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {item.category}
            </span>
          </div>
        ))}
      </div>
    </SundownCard>
  );
}
```

**Commit:**
```bash
git add client/src/components/sundown/SundownJournalTab.tsx
git commit -m "feat(sundown): Journal tab with Dream Scroll + cup filters"
```

---

## Task 4: Wire Tabs with CSS display:none (NOT conditional rendering)

**Files:**
- Modify: `client/src/pages/SundownDash.tsx`

**Why CSS hidden tabs, not conditional render:**
- `SundownGoalsCard` fires a POST request in useEffect on mount
- Conditional rendering remounts on every tab switch → POST spam
- CSS `display:none` keeps all tabs mounted, data fetched once

**Step 1: Add imports**

```tsx
import { SundownGoalsTab } from '@/components/sundown/SundownGoalsTab';
import { SundownHabitsTab } from '@/components/sundown/SundownHabitsTab';
import { SundownJournalTab } from '@/components/sundown/SundownJournalTab';
```

**Step 2: Replace the card layout section**

Replace everything inside `<div className="sd-row">` with:

```tsx
<div className="sd-row">
  {/* Overview tab */}
  <div style={{ display: activeTab === 'Overview' ? 'block' : 'none' }}>
    <div className="sd-layout-2col">
      <SundownStardustTrail
        habits={habitCardData}
        habitLogs={habitLogCardData}
        weekDates={week.dates}
        todayIndex={week.todayIndex}
        onToggle={handleToggle}
      />
      <div className="sd-col-stack">
        <SundownAuroraReward streak={streak} />
        <SundownStardustRing percentage={completionPct} />
      </div>
    </div>
    <SundownMonthlyGoals goals={yearlyGoalsData} />
  </div>

  {/* Goals tab */}
  <div style={{ display: activeTab === 'Goals' ? 'block' : 'none' }}>
    <SundownGoalsTab goals={yearlyGoalsData} />
  </div>

  {/* Habits tab */}
  <div style={{ display: activeTab === 'Habits' ? 'block' : 'none' }}>
    <SundownHabitsTab
      habits={habitCardData}
      habitLogs={habitLogCardData}
      weekDates={week.dates}
      todayIndex={week.todayIndex}
      onToggle={handleToggle}
      completionPct={completionPct}
    />
  </div>

  {/* Journal tab */}
  <div style={{ display: activeTab === 'Journal' ? 'block' : 'none' }}>
    <SundownJournalTab />
  </div>

  {/* Nav links — always visible */}
  <div className="sd-nav-row">
    {/* ...existing nav links... */}
  </div>
</div>
```

**Step 3: Commit**

```bash
git add client/src/pages/SundownDash.tsx
git commit -m "feat(sundown): wire all 4 tabs with CSS display:none (prevents remount POST spam)"
```

---

## Task 5: TypeScript Check & Manual Verify

```bash
npm run check
```

Test each tab, verify weather loads, confirm no console errors.

---

## Summary

| Task | What | Critical Fix |
|------|------|-------------|
| 0 | Weather proxy through Express | CORS (RPN 168) |
| 1 | Goals tab component | — |
| 2 | Habits tab with `h.streak` | Wrong field name (RPN 180) |
| 3 | Journal tab with Dream Scroll | — |
| 4 | CSS display:none tab wiring | POST spam (RPN 378) |
| 5 | Verify | — |

**Total: ~45 min, 5 commits, 0 critical bugs remaining**
