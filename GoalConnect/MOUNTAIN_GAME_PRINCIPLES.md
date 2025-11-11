# Mountain Habit Climbing Game - Design Principles

**You are building a solo mountain expedition habit game.**

This document contains the **non-negotiable principles** that guide every UX, feature, and architectural decision in this app.

---

## CORE VISION

- **Real-world inspired** climbing/mountaineering locations and regions
- **Habits = effort** that lets you gain gear, unlock routes, and move through regions
- **Theme:** mountains, routes, basecamp, pitches, gear, weather windows, conditions
- **Goal:** daily use, low friction, high dopamine, **not spreadsheet-y**

---

## NON-NEGOTIABLE LAWS (DO NOT IGNORE)

These rules outrank everything else.

### 1. **Logging Speed Law**
- From the main/home screen, logging a common habit must take **≤ 2 taps**.
- If a suggestion makes this slower, you must either reject it or propose a simpler variant.

### 2. **Single-Focus Screen Law**
- Each screen must have **one primary CTA** (call to action).
- All other actions are clearly secondary or tucked away.

### 3. **Anti-Bloat Law**
- For every new mechanic/feature you suggest, you must name **at least one thing to simplify or remove**, so the overall system does not grow in complexity.

### 4. **Effort Labeling Law**
For every suggested change, label the dev effort as:
- **(S)** small tweak (copy/layout/visibility, minor logic)
- **(M)** medium change (new component or flow, but contained)
- **(L)** large rework (new system, major architecture change)

**Default to S and M only.** Do **not** suggest **L** unless explicitly asked.

### 5. **Core Loop Clarity Law**
For each screen/flow you comment on, you must be able to state:
- **Action:** what the user is supposed to do here in one sentence
- **Immediate feedback:** what visibly happens the instant they do it
- **Progress:** how this feeds into longer-term progress (gear, route, summit, region, etc.)

### 6. **Zombie-Lauren Law**
- Assume the user is exhausted, low-motivation, ADHD, and half-asleep.
- If a flow only works when the user has lots of energy, attention, or time, mark it as **unsafe** and propose a simpler alternative.

---

## CLIMBING METAPHOR RULES

Use climbing details in ways that **increase clarity and delight**, not confusion.

### Mapping System

Whenever useful, map:

- **Grades** = habit difficulty / intensity
  - e.g., easier habits = 5.7–5.9; hard habits = 5.12 / 7a+
- **Pitches** = small steps inside a bigger project or goal
  - Multi-pitch route = multi-step project
- **Approach days** = setup/planning tasks
- **Summit pushes** = deep-focus or high-effort sessions
- **Weather / conditions / objective hazards**
  - Represent life chaos, fatigue, schedule shifts
  - Used for **soft landing mechanics**, NOT harsh punishment
- **Regions/crags/massifs**
  - Represent bigger arcs of progress (e.g., moving from local crag to Alps to Himalaya)
- **Gear**
  - Upgrades and unlocks earned through consistency

### Guidelines

- Don't force metaphors where they muddle usability
- Prefer **simple, readable visuals** over dense topo-style information
- Make progression feel like moving through **real-ish climbing journeys**, not random icons

---

## ADHD & HABIT PRINCIPLES

Always design as if the user:
- Has low energy and decision fatigue
- Hates long forms, wizards, and configuration screens
- Does not want to "set up a system," just to **do one tiny thing now**
- Will abandon anything that looks like a spreadsheet or project-management tool

### Therefore:

- **Reduce choices:** show only the few most important options at once
- **Prefer defaults** that "just work" without setup
- **Make the next action painfully obvious:** a single, high-contrast, clearly named button
- **Design for relapse and re-entry:**
  - After missing days, it should feel **safe and easy to re-open the app**, not shame-inducing
  - Use soft recovery: "weather break", "conditions improved" rather than "streak destroyed"

---

## RESPONSE STRUCTURE FOR UX REVIEW

When reviewing a screen / flow / idea, respond in this exact structure:

### 1. Quick Diagnosis (Top 3 Problems)

Identify **up to 3** of the most important issues for:
- Habit adherence
- ADHD-friendliness
- Clarity of the climbing metaphor

Examples of issues:
- Too many taps
- Overwhelm / clutter
- No obvious "do this now"
- Weak or invisible reward
- Theme slapped on but not integrated

Be blunt and concise.

---

### 2. Surgical Fixes (Max 5 Changes)

Suggest **up to 5 concrete, implementable changes**.

For each change, use this format:

**Change #N – [Short Name] – (S/M/L)**
- **What to change:**
  Specific copy, layout tweaks, element visibility, navigation changes, or simple mechanic change.
- **Why it helps (ADHD + habits):**
  1–2 sentences tied to friction, reward, or clarity.
- **Climbing flavor (if applicable):**
  How (if at all) to tie this to routes/grades/pitches/gear/regions *without* adding complexity.

Remember:
- Prefer **S** changes (copy, visibility, hierarchy) before suggesting **M** or **L**
- If you suggest any **L**, justify why it's worth it and what we could cut to pay for it

---

### 3. Keep / Kill / Park

Based on what's been shown:

- **Keep:**
  List elements that are genuinely strong for ADHD + habit loops + theme.
- **Kill:**
  List elements that add friction, clutter, or confusion and should be removed.
- **Park for later:**
  Interesting advanced mechanics or features that might be cool, but only once the core loop is rock-solid.

Keep this section short but decisive.

---

### 4. Tiny Next Steps (1–3 Micro-Moves)

End with **1–3 smallest possible changes** that give the biggest win.

These should be things that can realistically be done in a short coding session, like:
- "Make the main habit log button sticky at the bottom of the weekly view."
- "Rename vague labels to clear action verbs (e.g., 'Manage' → 'Log Today')."
- "Add a single progress bar that shows route progress when you log anything."

Each next step should connect back to:
- Faster logging
- Clearer core loop
- Stronger feeling of climbing progress

---

### 5. Optional: Core Loop Summary (1–2 sentences)

If relevant, finish with:
- **Core loop here:** "[User does X] → [sees Y feedback] → [progresses toward Z (gear/route/region)]."

If you cannot clearly describe this loop, flag it as a problem.

---

## TONE & BOUNDARIES

- Be **direct, opinionated, and concise**. Strong guidance over menus of options.
- Do **not** give code unless explicitly asked. Focus on UX, copy, structure, and game mechanics.
- Do **not** suggest entirely new subsystems (currencies, pets, social features, etc.) unless they clearly simplify or replace something existing.
- When in doubt, choose:
  - Less text over more
  - Fewer taps over richer configuration
  - Clear, grounded climbing metaphors over generic productivity language

---

## CORE LOOP (Current Target)

**Open app → Weekly Hub → Today's Pitch → 1-tap log habits → see progress → feel progress toward route/gear/region → close app**

Every feature must strengthen this loop or be removed.

---

## DEVELOPMENT PRIORITIES

1. **Make habit logging work reliably** (≤ 2 taps, synced between all views)
2. **Clear visual feedback** (immediate + progress toward climbing goals)
3. **Soft recovery mechanics** (weather windows, not punishment)
4. **Unlock progression** (gear, routes, regions that feel earned)

Everything else is secondary until these four pillars are rock-solid.

---

## IMPLEMENTED FEATURES: Weekly Hub Dashboard

### Visual Motivation System

**Purpose:** Provide instant feedback and clear progress visibility to maintain momentum and celebrate wins.

#### 1. Daily Completion Progress Bar (Topo Line)
**Location:** `TodaysPitch` component header

- Replaces plain text with a visual progress bar showing daily habit completion
- Displays as: "Daily Progress: X/Y" with progress bar below
- Progress bar fills from granite gray (muted) to accent color as habits are completed
- When 100% complete, gradient shifts to accent/primary celebration colors
- **ADHD-friendly:** Instant visual scan of "how far through today's pitch am I?"

#### 2. Today's Token Counter
**Location:** `TodaysPitch` component header (top-right)

- Shows: "Today: +X 💎" in accent-colored badge
- Displays total tokens earned from completed habits today
- Updates in real-time as habits are logged
- Only shows when tokens > 0 (no clutter when starting fresh)
- **Motivation:** Immediate dopamine hit—see rewards accumulate throughout the day

#### 3. Summit Celebration Overlay
**Location:** `TodaysPitch` component (full overlay)

- Triggers when ALL habits scheduled for today are completed
- Shows sparkle icon with "Summit Reached! All pitches sent today."
- Auto-dismisses after 4 seconds
- Uses sessionStorage to prevent re-showing on page refresh
- **Celebration without interruption:** Quick, satisfying win moment

### Routes Panel Clarity Fix

**Problem:** Routes panel was duplicating habits shown in Today's Pitch, causing confusion ("why am I seeing the same 3 habits twice?")

**Solution:** Routes panel now shows ONLY Goals (long-term projects), not habits.

#### Updated Routes Panel
**Location:** Right sidebar on Weekly Hub

- **Header:** "Routes — Long-term goals & projects"
- **Content:** Displays all Goals with:
  - Goal title and icon (🎯)
  - Current progress: "X / Y units • Z%"
  - Visual progress bar (fills toward accent color)
  - "+1 [unit]" button for quick incremental progress
  - "Complete" badge when goal is 100%
- **Empty state:** Target icon with "Create goals to track your big climbs!"

**Distinction:**
- **Today's Pitch (left):** Daily habits—quick 1-tap logging for consistency
- **Routes (right):** Long-term goals—incremental progress toward bigger objectives

This separation mirrors climbing semantics:
- Daily habits = pitches (short sections you climb today)
- Goals = routes/summits (multi-day objectives you're projecting)

---

## DESIGN SYSTEM NOTES

### Progress Bars
All progress bars use:
- Background: `bg-muted/30` with `border-border/30`
- Fill (incomplete): `bg-gradient-to-r from-muted-foreground/40 to-primary`
- Fill (complete): `bg-gradient-to-r from-[hsl(var(--accent))] to-primary`
- Smooth `transition-all duration-500` for satisfying fills

### Token/Badge Display
- Accent-colored background: `bg-[hsl(var(--accent))]/20`
- Accent border: `border-[hsl(var(--accent))]/30`
- Text: `text-foreground font-semibold`
- Rounded pill shape: `rounded-full`

### Celebration Overlays
- Full overlay: `absolute inset-0 z-50`
- Backdrop: `bg-background/80 backdrop-blur-sm`
- Content card: Accent border, icon, title, description
- Auto-dismiss: 4s timeout, no manual close needed (keeps it quick)

---

## XP & LEVELING SYSTEM

### Core XP Mechanics
**Location:** Habit toggle endpoint (`/api/habit-logs/toggle`)

- Award **10 XP** per habit completion (matches 10 token reward)
- Deduct **10 XP** when uncompleting habits
- **100 XP per level** (simple, predictable progression)
- Auto level-up when crossing XP threshold
- Wrapped in try/catch to never break core habit logging

**Climbing Grades by Level:**
- Level 1-5: 5.5 → 5.9 (beginner)
- Level 6-9: 5.10a → 5.10d (intermediate)
- Level 10-13: 5.11a → 5.11d (advanced)
- Level 14-17: 5.12a → 5.12d (expert)
- Level 18-20: 5.13a → 5.13d (elite)

### XP Progress Bar Component
**Location:** `XPProgressBar.tsx` (rendered in `TopStatusBar`)

Displays:
- Current level and climbing grade (e.g., "Level 3 - 5.7")
- XP progress within current level (e.g., "30 / 100 XP")
- Visual progress bar with gradient fill
- Percentage completion
- "Almost there!" pulse when ≥80% to next level

**Design:**
- Compact card with gradient icon background
- Updates every 5 seconds via React Query
- Hidden if data fails to load (graceful degradation)
- Climbing grade shown prominently for motivation

**Progression Feel:**
- 10 habits = 1 level (100 XP ÷ 10 XP per habit)
- Tangible sense of "climbing harder routes" as you level up
- Grade progression mirrors real climbing difficulty system
