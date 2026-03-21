# /vg Fix Plan — Sundown Dashboard: MEDIOCRE → EXCELLENT

**Date:** 2026-03-20
**Current Score:** Visual 6.2/10 | Automated C (63.4/100)
**Target Score:** Visual 8.5+/10 | Automated B+ (82+/100)

---

## Phase 1: Make the Glass Visible (Material & Depth — 4/10 → 8/10)

The 3D glass card effect is the signature visual identity. Right now it's invisible because the token values are too subtle.

### 1A. Increase shell padding
**File:** `client/src/sundown.css` line 5
```css
/* BEFORE */ --sd-shell-pad: 4px;
/* AFTER  */ --sd-shell-pad: 6px;
```
**Why:** 4px shell rim is sub-pixel on most screens. 6px creates a visible darker border that reads as physical thickness.

### 1B. Increase face opacity
**File:** `client/src/sundown.css` line 7
```css
/* BEFORE */ --sd-face-bg: rgba(85, 48, 52, 0.35);
/* AFTER  */ --sd-face-bg: rgba(85, 48, 52, 0.50);
```
**Why:** At 0.35, the face layer is nearly transparent — no frosted glass feel. At 0.50, you can actually see the glass surface while still getting blur-through of the landscape behind.

### 1C. Make warm edge glow visible
**File:** `client/src/components/sundown/SundownCard.tsx` line 68
```tsx
/* BEFORE */ borderTop: "1px solid rgba(255,200,140,0.12)",
/* AFTER  */ borderTop: "1px solid rgba(255,200,140,0.25)",
```
**Why:** 12% opacity is invisible. 25% creates a visible warm amber edge along the top of every card, simulating sunlight hitting glass. This is the single most impactful visual detail for warmth.

### 1D. Add warm light bleed into face background
**File:** `client/src/components/sundown/SundownCard.tsx` — SundownFace component, add to style:
```tsx
background: "linear-gradient(135deg, rgba(200,131,73,0.08) 0%, var(--sd-face-bg) 30%)",
```
**Why:** In the reference concept art, cards have warm amber light bleeding from the upper-left corner as if the sunset is illuminating the glass surface. Currently cards have a flat uniform tint.

### 1E. Add side glow
**File:** `client/src/components/sundown/SundownCard.tsx` — SundownFace component, add:
```tsx
borderLeft: "1px solid rgba(255,200,140,0.08)",
```
**Why:** Subtle left-edge glow creates the illusion that light wraps around the glass object. Combined with the top glow, this gives 3D presence.

**Verify:** Run `/vg` after Phase 1. Cards should now look like distinct glass objects, not colored rectangles.

---

## Phase 2: Extend Warmth to Bottom Half (Warmth — 7/10 → 9/10)

The warm atmosphere dies at the 3-card row. Everything below feels like a different app.

### 2A. Extend landscape bottom gradient lower
**File:** `client/src/components/sundown/SundownLandscape.tsx` line 30
```tsx
/* BEFORE */ 'linear-gradient(to top, rgba(12,5,8,0.92) 0%, rgba(12,5,8,0.6) 20%, rgba(12,5,8,0.15) 40%, transparent 55%)'
/* AFTER  */ 'linear-gradient(to top, rgba(12,5,8,0.88) 0%, rgba(12,5,8,0.5) 15%, rgba(12,5,8,0.1) 35%, transparent 55%)'
```
**Why:** The bottom darkening kicks in too aggressively — by 20% up the page it's already at 60% opacity. Soften it so warmth from the landscape bleeds further down.

### 2B. Add a warm body overlay
**File:** `client/src/pages/SundownDash.tsx` — the existing ambient glow (line 198-207) only targets top 20%.
Change to:
```tsx
background: 'radial-gradient(ellipse 100% 80% at 50% 30%, rgba(255,140,50,0.06) 0%, rgba(200,100,40,0.02) 50%, transparent 80%)',
```
**Why:** Extends the warm tint through the full page so even the Yearly Goals area has a hint of desert warmth.

### 2C. Style nav links with glass
**File:** `client/src/pages/SundownDash.tsx` line 51-58, `navLinkStyle`:
```tsx
/* ADD */ boxShadow: 'inset 0 1px 0 rgba(255,200,140,0.08), 0 2px 4px rgba(0,0,0,0.15)',
/* ADD */ backdropFilter: 'blur(8px)',
```
**Why:** Bottom nav pills are cold gray rectangles. Adding glass blur + warm inset highlight connects them to the design language.

**Verify:** Run `/vg`. The entire page should feel warm, not just the top half.

---

## Phase 3: Tame the Yearly Goals Section (Layout — 7/10 → 8/10)

### 3A. Cap visible goals with expand
**File:** `client/src/components/sundown/SundownYearlyGoals.tsx`
- Add `const [expanded, setExpanded] = useState(false);`
- Show only first 5 goals when `!expanded`
- Add "Show all X goals" button below the 5th item
- Style the expand button with `color: var(--sd-text-accent)`, no background

**Why:** 30 goals at full height makes the dashboard a todo list. 5 goals gives a curated overview — the full list is one tap away.

### 3B. Increase goal list text sizes
**File:** `client/src/components/sundown/SundownYearlyGoals.tsx`
- Goal title font: line 103 `fontSize: 13` → `fontSize: 15`
- Progress counter: line 106 `fontSize: 11` → `fontSize: 13`
- Category tab text: line 73 `fontSize: 10` → `fontSize: 12`

**Why:** Text is too small for the card size — especially at the muted color, it strains readability.

**Verify:** Run `/vg`. Yearly Goals should feel like a curated widget, not a data dump.

---

## Phase 4: Touch Targets (Automated — 1.4% → 80%+)

### 4A. Habit checkboxes
**File:** `client/src/components/sundown/SundownHabitCard.tsx` line 209-210
```tsx
/* BEFORE */ width: 34, height: 34,
/* AFTER  */ width: 44, height: 44,
```
Grid column sizing already uses `minmax(0, 1fr)` so this should fit. May need to adjust `columnGap: 6` → `columnGap: 4`.

### 4B. Tab dock buttons
**File:** `client/src/components/sundown/SundownTabDock.tsx`
- Inactive tabs (line 87): add `minHeight: 44`
- Active tab (line 52): already `height: 44` — OK

### 4C. Category filter pills in Yearly Goals
**File:** `client/src/components/sundown/SundownYearlyGoals.tsx` line 74
```tsx
/* BEFORE */ padding: "4px 10px",
/* AFTER  */ padding: "8px 12px", minHeight: 44,
```

### 4D. Nav links
**File:** `client/src/pages/SundownDash.tsx` line 51-58
```tsx
/* ADD to navLinkStyle */ minHeight: 44, display: 'flex', alignItems: 'center',
```

**Verify:** Run `npm run vg`. Touch targets should jump from 1.4% to 80%+.

---

## Phase 5: Accessibility (Automated — 0% → 80%+)

### 5A. Habit checkbox aria-labels
**File:** `client/src/components/sundown/SundownHabitCard.tsx` line 203
Add to each `<button>`:
```tsx
aria-label={`${done ? 'Uncheck' : 'Check'} ${habit.name} for ${format(new Date(date), 'EEEE')}`}
```

### 5B. Year goal progress rings
**File:** `client/src/components/sundown/SundownYearlyGoals.tsx`
Add `role="img"` and `aria-label={`${pct}% complete`}` to SmallProgressRing container div.

### 5C. Category filter buttons
Already have text content — these should pass. Just verify.

### 5D. Nav links
Already have text content — these should pass.

### 5E. Tab dock buttons
Already have text content — these should pass.

**Verify:** Run `npm run vg`. Accessibility should jump from 0% to 80%+.

---

## Phase 6: Token Compliance (Automated — 93.5% → 98%+)

### 6A. Add missing tokens to sundown.css
```css
--sd-accent: #E1A45C;
--sd-accent-dark: #c47a20;
--sd-accent-mid: #D08A4F;
--sd-bg-body: #1a0e10;
--sd-bg-deep: #0a0507;
```

### 6B. Replace hardcoded values
File-by-file replacements:
- `SundownAdventures.tsx:46` — `#c47a20` → `var(--sd-accent-dark)`
- `SundownCountdown.tsx:43` — `#c47a20` → `var(--sd-accent-dark)`, `#E1A45C` → `var(--sd-accent)`
- `SundownGoalsCard.tsx:23` — `#D08A4F` → `var(--sd-accent-mid)`
- `SundownHabitCard.tsx:53` — `#D08A4F` → `var(--sd-accent-mid)`
- `SundownLandscape.tsx:8` — `#1a0e10` → `var(--sd-bg-body)`
- `SundownPlayer.tsx:154` — `#daa520` → `var(--sd-accent-dark)`, `#E1A45C` → `var(--sd-accent)`

Note: SVG `stroke` attributes can't use CSS vars. Leave SVG color values as-is (e.g., `SundownHabitCard.tsx` line 53 inside `<circle stroke="#D08A4F">`).

**Verify:** Run `npm run vg`. Token compliance should hit 98%+.

---

## Execution Order

| Phase | Impact | Effort | Priority |
|-------|--------|--------|----------|
| **1. Glass Visible** | Highest (defines identity) | Small (CSS tokens + 5 lines) | DO FIRST |
| **2. Warmth Extension** | High (cohesive atmosphere) | Small (3 gradient tweaks) | DO SECOND |
| **3. Yearly Goals** | Medium (layout balance) | Medium (state + UI logic) | DO THIRD |
| **4. Touch Targets** | Medium (accessibility score) | Small (size values) | DO FOURTH |
| **5. Accessibility** | Medium (a11y score) | Small (aria-labels) | DO FIFTH |
| **6. Token Compliance** | Low (code hygiene) | Small (find-replace) | DO LAST |

**Total estimated changes:** ~15 files, ~60 lines modified
**Run `/vg` after each phase** to verify improvement.

---

## Success Criteria

After all 6 phases:
- **Visual Score:** 8.5+/10 (from 6.2)
- **Material & Depth:** 8/10 (from 4) — glass cards visibly 3D
- **Warmth:** 9/10 (from 7) — warm atmosphere across entire page
- **Automated Score:** B+ (82+/100) (from C 63.4)
- **Touch Targets:** 80%+ (from 1.4%)
- **Accessibility:** 80%+ (from 0%)
- **Token Compliance:** 98%+ (from 93.5%)
