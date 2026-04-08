# Phase 6: Visual Page Migration — Detailed Plan

> **Goal:** Migrate 6 pages from icy/enchanted theme to Sundown plum-brown.
> **Foundation:** `sundown-tokens.css` already maps Tailwind HSL vars to Sundown palette.
> **Approach:** Create `SundownPageWrapper`, then migrate one page at a time.

---

## Step 0: Create SundownPageWrapper (~40 lines, new file)

**File:** `client/src/components/sundown/SundownPageWrapper.tsx`

Reusable wrapper that provides:
- `SundownLandscape` background (desert + particles + sun glow)
- `sd-content` wrapper with max-width
- Consistent body styling (font, color, background)

This replaces `ProgressBackground` + `ForestBackground` on every page.

```tsx
// Reuses existing SundownLandscape from SundownDash
// MainLayout still wraps for sidebar nav — SundownPageWrapper only handles the content area background
```

**Critical:** MainLayout provides the sidebar. SundownPageWrapper provides the desert background INSIDE the content area. These are separate concerns.

---

## Page Migration Order (by complexity, simplest first)

### Page 1: Settings (`pages/Settings.tsx`) — ~20 lines changed
**Current state:** Icy waterfall background, 2 cards (Import Data + Unlocked Backgrounds)
**Hardcoded colors:** ~8
**What to change:**
- Replace `ProgressBackground` with `SundownPageWrapper`
- Replace `glass-card` with `sd-shell` + `sd-face`
- Replace `text-foreground` with `var(--sd-text-primary)`
- Replace Mountain icon empty state with Sundown EmptyState
**Verify:** Screenshot comparison + tsc clean

### Page 2: Journey (`pages/Journey.tsx`) — ~15 lines changed
**Current state:** Icy background, tab switcher (Lifting/Climbing/Cycling)
**Hardcoded colors:** ~5
**What to change:**
- Replace background wrapper
- Replace tab styling (currently uses Tailwind `bg-primary/20`)
- Stats cards: swap teal accents for amber
**Verify:** Journey/Cycling tab still shows Strava data

### Page 3: Analytics (`pages/Analytics.tsx`) — ~25 lines changed
**Current state:** Icy background, "Today's Routes" card, habit list with difficulty badges
**Hardcoded colors:** ~10
**What to change:**
- Replace background wrapper
- Restyle "Today's Routes" card with sd-shell/sd-face
- Restyle difficulty badges (EASY/MEDIUM/HARD) from teal/green to amber tones
- Add EmptyState for zero-data state (Phase 5 item #4)
**Verify:** Page loads with data, badges readable

### Page 4: YearlyGoals (`pages/YearlyGoals.tsx`) — ~20 lines changed
**Current state:** Icy background, expandable category cards
**Hardcoded colors:** ~8
**What to change:**
- Replace background wrapper
- Category headers: replace blue/teal with plum-brown
- Progress bars: replace blue gradient with amber gradient
- Stat cards (Completed/In Progress/Total) from teal to amber
**Verify:** Goals expand/collapse, progress bars render

### Page 5: Habits (`pages/Habits.tsx`) — ~40 lines changed
**Current state:** Icy waterfall + climber, contribution graph, habit cards grid
**Hardcoded colors:** ~15 (most complex page after Goals)
**What to change:**
- Replace `ForestBackground` with `SundownPageWrapper`
- Contribution graph: green dots → amber dots
- Habit cards: replace dark navy cards with sd-shell/sd-face
- "New Habit" button: replace orange with Sundown accent
- Badge colors (Growing/Declining/Steady): need amber-family variants
**Verify:** Contribution graph renders, habit toggle still works, cards scrollable

### Page 6: Goals (`pages/Goals.tsx`) — ~60 lines changed (HARDEST)
**Current state:** Icy background, multi-tab (All/Week/Month/Yearly/Archived), Fitness Progress auto-tracking
**Hardcoded colors:** ~25 (most in the app)
**What to change:**
- Replace background wrapper
- Tab bar: replace rounded-full teal pills with sd-tab styling
- Goal cards: replace glass-card with sd-shell
- Progress bars: replace teal/green gradients with amber
- Fitness Progress section: replace blue icons with amber
- Filter pills (MEDIUM/FITNESS): replace orange/teal with Sundown tones
- "New Goal" button styling
**Verify:** All 5 tabs render, goal progress updates, no visual regressions

---

## After All 6 Pages Migrated

### Cleanup Tasks
1. **Delete `ForestBackground.tsx`** (133 lines) — no longer imported
2. **Delete `ProgressBackground.tsx`** — replaced by SundownPageWrapper
3. **Prune `enchanted.css`** from 805 → ~200 lines (remove all `:root` block + unused classes)
4. **Remove unused Tailwind color configs** from `tailwind.config.ts` (ice, forest palettes)
5. **Grep verify:** `grep -r "bg-ice-\|card-ice-\|from-blue-900\|text-cyan-" client/src/pages/` → 0

### Measurement Targets (post-migration)
| Metric | Before | Target |
|--------|--------|--------|
| Hardcoded colors in components | 498 (58%) | <200 (30%) |
| Font families | 7 | 2 (Cormorant Garamond + Source Sans 3) |
| Card patterns | 7 | 2 (sd-shell + glass-card legacy) |
| Border-radius values | 34 | <10 |
| Visual themes | 4 | 1 (Sundown) + 1 (Wellness Wheel standalone) |

---

## Session Estimate

| Page | Est. Time | Complexity |
|------|-----------|-----------|
| SundownPageWrapper | 15 min | Simple |
| Settings | 15 min | Simple |
| Journey | 20 min | Simple |
| Analytics | 25 min | Medium |
| YearlyGoals | 20 min | Simple |
| Habits | 35 min | Medium |
| Goals | 45 min | Complex |
| Cleanup | 20 min | Simple |
| **Total** | **~3 hrs** | |

---

## Risk Mitigation

- **One page per commit.** If a migration breaks something, revert just that page.
- **Screenshot before/after.** Capture every page before starting, compare after.
- **tsc after every page.** TypeScript must compile clean between each migration.
- **Don't change functionality.** Only visual styling. No API changes, no state changes, no logic changes.
- **glass-card special case.** 101 usages. Don't replace all at once — convert per-page, keeping glass-card in index.css as fallback.

---

## Wellness Wheel Exception

The Wellness Wheel (`/wheel`) has a completely unique fantasy forest background with mushrooms and a castle. This is intentionally different from the rest of the app. **Do NOT migrate it to Sundown.** It's a standalone experience, similar to how Habitica has different visual contexts for different features.

Decision for Lauren: keep the fantasy forest, or unify?
