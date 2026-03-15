# Sundown Dashboard — Full Implementation Plan

**Reference:** The "Sundown Personal Dashboard" image — warm amber monochrome, desert hero, glass cards, no-scroll viewport.

**Branch:** `feature/sundown-dashboard` (off `feature/strip-unused-features`)

---

## Design Decisions (all locked)

### Palette: Warm Amber Monochrome
```
--base: #1a1210                          /* dark warm brown-black */
--surface: rgba(180, 120, 60, 0.08)      /* amber-tinted surface */
--glass: rgba(30, 20, 14, 0.6)           /* warm glass card bg */
--glass-border: rgba(200, 140, 70, 0.12) /* warm border */
--glass-glow: rgba(200, 140, 70, 0.04)   /* inner top highlight */
--text-primary: #f5e6d0                  /* warm cream */
--text-secondary: rgba(245, 230, 208, 0.5)
--text-muted: rgba(245, 230, 208, 0.3)
--accent: #d4854a                        /* warm amber */
--accent-soft: rgba(212, 133, 74, 0.25)  /* completed cells */
--accent-glow: rgba(212, 133, 74, 0.3)   /* ring glow */
```

### Layout: No-Scroll Fixed Viewport
```
100vh, overflow: hidden
┌─────────────────────────────────────────────┐
│ HERO BANNER (150px)                         │
│ Desert gradient + silhouettes + stats       │
├─────────────────────────────────────────────┤
│ NAV BAR (36px) — pill tabs                  │
├──────────────────────┬──────────────────────┤
│ THIS WEEK (55%)      │ GOALS (45%)          │
│                      │                      │
│ Weekly habit grid    │ 4 yearly goals       │
│ 5 habits x 7 days   │ with progress rings  │
│                      │                      │
│ Streak strip         │ March + This Week    │
│                      │ goal checklists      │
├──────────┬───────────┴─────┬────────────────┤
│ BOTTOM STRIP (64px) — 4 mini cards          │
│ Wellness | Reading | Adventures | Media     │
└─────────────────────────────────────────────┘
```

### What's IN the dashboard (all kept widgets):
1. **Hero:** gradient bg, tower silhouettes, "Your Summit Awaits", greeting, XP, streak, residency countdown
2. **Nav:** Dashboard (active), Habits, Goals, Analytics, Adventures, Wishlist, Wellness, Settings
3. **Left column — habits:** GlowingOrbHabits (moved into hero?), LuxuryHabitGrid (resized to fit), progress ring (3/5 today), streak strip with milestones
4. **Right column — goals:** 4 yearly goals with progress rings (2x2 grid), WeeklyMonthlyGoalsWidget (month + week checklists)
5. **Bottom strip:** WellnessWheelWidget (compact), MediaWidget, RecentAdventuresWidget, NextRewardWidget
6. **Modals (rendered but hidden):** HabitNoteDialog, HabitDetailDialog, AdventureModal, CriticalHit overlay

### What's CUT from the current dashboard:
- DashboardInsights (collapsible deep insights) — moved to Analytics page
- YearlyGoalsSection (full categorized list) — moved to Yearly Goals page
- The entire scrolling layout below the fold

### Interactive features preserved:
- Habit cell click → toggle completion
- Habit name click → detail dialog
- Note-required habits → note dialog
- Confetti on all-complete
- CriticalHit 25% chance
- Sound + haptic on completion
- XP toast messages
- Streak milestone celebrations
- Quick outdoor day button

### Time-of-day hero gradient:
- Morning (6-11): cool blue-grey → warm peach horizon
- Afternoon (11-17): warm amber → golden horizon (the Sundown default)
- Evening (17-20): deep orange → coral → purple
- Night (20-6): deep indigo → dark warm brown

### Climber position:
- CSS `bottom: X%` where X = daily completion percentage
- 0 habits done = base of tower
- All done = summit

---

## Files to modify:

### 1. `client/src/pages/IcyDash.tsx` — FULL REWRITE
- Replace entire JSX with new fixed-viewport layout
- Keep ALL hooks, queries, mutations, state — just restructure the render
- Remove DashboardInsights, YearlyGoalsSection (moved to other pages)
- Add time-of-day gradient logic (useTimeOfDay hook already exists)
- Add climber position calculation

### 2. `tailwind.config.ts` — NEW PALETTE
- Replace forest/ice/peach/mountain palettes with single "sundown" palette
- Update CSS variables

### 3. `client/src/index.css` — UPDATE GLASS CLASSES
- Update .glass-card class with warm amber tint
- Update body background to warm base
- Add new .sundown-hero class

### 4. `client/src/components/LuxuryHabitGrid.tsx` — RESIZE
- Make it fit in constrained height (no scroll inside card)
- Compact mode for no-scroll viewport

### 5. `client/src/components/MainLayout.tsx` — UPDATE
- Remove sidebar nav on dashboard route (hero + nav bar replaces it)
- Keep sidebar for other pages

### 6. `client/src/components/GlowingOrbHabits.tsx` — OPTIONAL MOVE
- Consider moving into hero banner area
- Or keep in habits card header

### 7. Component color updates:
- ProgressRing.tsx — warm amber gradient
- PointsBreakdownPopover.tsx — warm palette
- TokenCounter.tsx — warm palette
- StreakFlame.tsx — already warm, verify
- All glass card components — warm glass treatment
