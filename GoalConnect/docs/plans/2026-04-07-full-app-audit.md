# GoalConnect — Full App Audit Plan

> **Created:** 2026-04-07
> **Scope:** Entire GoalConnect app — style, functionality, UI, dead code, data integrity
> **Note:** Sundown is NOT the default homepage (needs routing fix)

---

## Phase 1: Routing & Dead Code Sweep

**Goal:** Map what's live, what's dead, and what's misconfigured.

### 1.1 Route Audit
- [ ] **Default page routing** — SundownDash is at `/` but shouldn't be. Determine correct default (IcyDash? Habits? New landing?)
- [ ] Verify every route in App.tsx loads without errors (14 authenticated + 2 auth + 404)
- [ ] Check for routes that exist in code but aren't in App.tsx (orphaned pages)
- [ ] Verify `RequireAuth` wraps every authenticated route
- [ ] Test direct URL navigation (paste URL → loads correct page, not redirect loop)

### 1.2 Dead Code Inventory
- [ ] **ErrorTest.tsx** — not routed, development-only. Delete or gate behind dev flag
- [ ] **IcyDash.tsx** — imported in App.tsx but not routed. Superseded by SundownDash? Delete or clarify
- [ ] **HabitDialogNew.tsx** — check if imported anywhere or orphaned
- [ ] Grep for unused component exports (`export function` not imported elsewhere)
- [ ] Check for unused API endpoints (defined in server but never called from frontend)
- [ ] Check `package.json` for unused dependencies

### 1.3 Verification
```bash
# Route existence check (Playwright)
# Navigate to each route, verify 200 + content renders
# Routes: /, /habits, /habit-insights, /goals, /yearly-goals, /dream-scroll,
#         /journey, /analytics, /adventures, /media, /rewards, /wheel,
#         /settings, /settings/import, /login, /signup
```

---

## Phase 2: Functionality — Feature-by-Feature E2E

**Goal:** Every feature works end-to-end. Not presence checks — OUTCOME checks.

### 2.1 Habits
- [ ] Create a new habit → appears in list
- [ ] Toggle habit completion → checkmark, XP toast, state persists on reload
- [ ] Toggle habit OFF → unchecked, state persists
- [ ] Edit habit name/icon/schedule → changes reflect
- [ ] Delete habit → removed from list, logs preserved or cleaned
- [ ] Backfill a past date → log appears in history
- [ ] Streak calculation: complete 3 consecutive days → streak shows 3
- [ ] Streak break: miss a day → streak resets
- [ ] Contribution graph: logs show on correct dates

### 2.2 Goals
- [ ] Create weekly goal → appears in weekly view
- [ ] Create monthly goal → appears in monthly view
- [ ] Create yearly goal → appears in yearly view with progress bar
- [ ] Increment yearly goal progress → bar updates, percentage correct
- [ ] Complete a yearly goal → 100%, reward claimable
- [ ] Claim reward on completed goal → XP awarded
- [ ] Weekly goals auto-generate from yearly → verify linkage
- [ ] Archive a goal → moves to archived section
- [ ] Goal categories (Fitness, Learning, etc.) → filter works

### 2.3 XP / Points System
- [ ] Habit completion awards correct XP (check XP_CONFIG values)
- [ ] Streak milestones award bonus XP
- [ ] XP total in header/dashboard matches transaction sum
- [ ] Points transaction log shows all earning/spending events
- [ ] Streak freeze purchase costs 250 XP → deducted correctly
- [ ] Reward redemption costs correct amount → deducted

### 2.4 Rewards
- [ ] Create a custom reward with price → appears in shop
- [ ] Redeem reward → XP deducted, reward marked as redeemed
- [ ] Can't redeem if insufficient XP → error shown
- [ ] Target reward widget shows progress toward next reward

### 2.5 Dream Scroll
- [ ] Create item in each category (Do/Learn/Be/Achieve) → appears
- [ ] Toggle item completion → marked done
- [ ] Filter by category → only matching items shown
- [ ] Tags: create, assign, filter by tag
- [ ] Delete item → removed

### 2.6 Journal (SundownDash Journal Tab)
- [ ] Journal tab renders Dream Scroll content
- [ ] Can create entries from journal tab
- [ ] Category filters work within tab

### 2.7 Adventures
- [ ] Create adventure → appears in timeline
- [ ] Edit adventure details → changes persist
- [ ] Delete adventure → removed
- [ ] Recent adventures widget on dashboard shows latest

### 2.8 Wellness Wheel
- [ ] Rate each of 8 dimensions → wheel updates
- [ ] History shows past ratings
- [ ] Log activity → appears in activity list
- [ ] Export data → produces valid file

### 2.9 Media Library
- [ ] Add book → appears in library
- [ ] Update reading progress → percentage correct
- [ ] Change status (reading → completed) → moves to correct section
- [ ] Rate item → rating persists

### 2.10 Analytics
- [ ] Page loads with real data (not empty)
- [ ] Charts render (not blank SVGs)
- [ ] Date range filters work
- [ ] Habit heatmap shows correct completion patterns

### 2.11 Journey
- [ ] Each tab loads (Climbing, Lifting, etc.)
- [ ] Strava sync (if connected) → activities appear
- [ ] Lifting log → sets/reps/weight recorded
- [ ] Session calendar shows workout dates

### 2.12 Settings & Import
- [ ] Settings page loads
- [ ] Export data → downloads valid JSON
- [ ] Import page loads
- [ ] Strava OAuth flow (if credentials valid)
- [ ] CSV import → data appears

### 2.13 Auth
- [ ] Login with valid credentials → redirected to dashboard
- [ ] Login with wrong password → error message
- [ ] Signup → account created, logged in
- [ ] Logout → redirected to login
- [ ] Accessing protected route while logged out → redirect to login

---

## Phase 3: Style & Design Consistency

**Goal:** Every page looks intentional, not like 6 different apps stitched together.

### 3.1 Theme Inventory
- [ ] Document which pages use which theme:
  - SundownDash: plum-brown desert aesthetic (`sundown.css`)
  - Other pages: what theme? Tailwind defaults? IcyDash remnants?
- [ ] Identify pages that feel visually inconsistent with SundownDash
- [ ] Check if dark/light mode exists anywhere (Lauren vetoed dark mode)
- [ ] Font consistency: which pages use Source Sans 3 vs Cormorant Garamond vs system fonts?

### 3.2 Color Consistency
- [ ] Check CSS custom properties usage across pages
- [ ] Identify hardcoded colors that don't match the design system
- [ ] Verify plum-brown palette is used consistently where intended
- [ ] Check for "IcyDash" teal/blue remnants on non-dashboard pages

### 3.3 Component Style Audit
- [ ] Cards: do all pages use the same card style? Or mixed (sd-shell vs Radix Card)?
- [ ] Buttons: consistent sizing, colors, hover states across pages
- [ ] Forms: consistent input styling
- [ ] Modals/Dialogs: consistent backdrop, animation, sizing
- [ ] Navigation: sidebar vs tab dock vs nav links — intentional or accidental?

### 3.4 Typography
- [ ] Heading hierarchy (h1/h2/h3) consistent across pages
- [ ] Body text size consistent
- [ ] Font weights used consistently
- [ ] Line heights / spacing

---

## Phase 4: UI Quality — Layout, Responsive, Accessibility

**Goal:** The app works on all screens and is usable.

### 4.1 Responsive Breakpoints (per page)
For EACH page, test at 3 viewports:
- Desktop (1440x900)
- Tablet (768x1024)
- Mobile (390x844)

Check:
- [ ] Content doesn't overflow horizontally
- [ ] Touch targets ≥ 44px on mobile
- [ ] Text is readable (not clipped, not microscopic)
- [ ] Navigation is accessible on all sizes
- [ ] Forms are usable on mobile (inputs not covered by keyboard)

### 4.2 Accessibility
- [ ] All interactive elements have `aria-label` or visible label
- [ ] Tab key navigates through all interactive elements
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Images/icons have alt text or are decorative (aria-hidden)
- [ ] Error states are announced to screen readers
- [ ] Focus indicators visible on all interactive elements

### 4.3 Layout Issues
- [ ] Check for z-index stacking issues (modals behind content, etc.)
- [ ] Verify fixed/sticky elements don't cover content
- [ ] Check scroll behavior on long pages
- [ ] Verify loading states don't cause layout shift

---

## Phase 5: Data Integrity

**Goal:** Math is correct. What the DB says matches what the UI shows.

### 5.1 Streak Calculation
- [ ] Query raw `habit_logs` for a user, manually count consecutive days
- [ ] Compare to API `/api/habits/streak` result
- [ ] Compare to SundownDash streak display
- [ ] Edge cases: streak across month boundary, streak with timezone offset

### 5.2 XP Calculation
- [ ] Sum all `point_transactions` for user
- [ ] Compare to `/api/points` endpoint
- [ ] Compare to UI display
- [ ] Verify no duplicate transactions (same action, same timestamp)

### 5.3 Goal Progress
- [ ] For a yearly goal with target=200, increment 5 times → progress=5, percentage=2.5%
- [ ] Verify `/api/yearly-goals/with-progress` returns correct computed values
- [ ] Check compound goals (parent + children) math

### 5.4 Weekly/Monthly Auto-Generation
- [ ] Trigger weekly goal generation → goals match yearly parent configuration
- [ ] Verify linked_yearly_goal_id is set correctly
- [ ] Check that duplicate generation doesn't create duplicates

---

## Phase 6: Performance & Error Handling

### 6.1 Error Boundaries
- [ ] SundownDash: 4 tab boundaries (already added)
- [ ] Other pages: which have error boundaries? Which don't?
- [ ] Force an error in each boundary → verify fallback renders

### 6.2 Loading States
- [ ] SundownDash: loading spinner (already added)
- [ ] Other pages: which show loading states? Which flash empty?
- [ ] Slow network simulation (Chrome DevTools throttle) → verify UX

### 6.3 API Error Handling
- [ ] Kill DB connection → verify app shows error, not white screen
- [ ] Return 500 from API → verify toast/error message, not crash
- [ ] Network offline → verify offline indicator works

---

## Execution Order

| Priority | Phase | Effort | Why first |
|----------|-------|--------|-----------|
| 1 | 1 (Routing + Dead Code) | Small | Quick wins, reduces scope for later phases |
| 2 | 2.1-2.3 (Habits + Goals + XP) | Large | Core features, most user-facing |
| 3 | 5 (Data Integrity) | Medium | Math bugs are invisible until they compound |
| 4 | 4.1 (Responsive) | Medium | Mobile is where Lauren uses it |
| 5 | 3 (Style Consistency) | Large | Visual, needs Lauren's judgment calls |
| 6 | 2.4-2.12 (Remaining features) | Large | Lower-traffic features |
| 7 | 4.2 (Accessibility) | Medium | Important but less urgent |
| 8 | 6 (Performance + Errors) | Small | Polish |

---

## Tools Per Phase

| Phase | Tool | Why |
|-------|------|-----|
| 1 | grep + Explore agent | Code analysis, import tracing |
| 2 | Playwright behavioral tests | Click every button, verify outcomes |
| 3 | /vg + screenshots | Visual comparison needs eyes |
| 4 | Playwright at 3 viewports | Automated responsive checks |
| 5 | Direct DB queries + API calls | Compare raw data to UI |
| 6 | Playwright + network throttle | Simulate failure conditions |

---

## Known Issues (from this session)

Already fixed:
- [x] Habit toggle args swapped (SundownDash)
- [x] Emoji icon keys not matching DB values
- [x] Dead component files (Player, Todo, Stats, HabitCard)
- [x] Error boundaries on SundownDash tabs

Known but unfixed:
- [ ] SundownDash is at `/` but shouldn't be the default
- [ ] 4/7 habits have same BookOpen icon (DB data, not code bug)
- [ ] IcyDash.tsx imported but not routed (dead code)
- [ ] ErrorTest.tsx exists but not routed (dead code)
- [ ] No error boundaries on any page besides SundownDash
