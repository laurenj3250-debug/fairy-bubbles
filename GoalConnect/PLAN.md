# IcyDash Enhancement Plan

**Philosophy**: Do less, do it right. Minimal, polished additions.

---

## Current State

IcyDash has:
- Habits grid with weekly view
- Goals (weekly + monthly)
- Drag-drop weekly schedule
- Study tracker
- Climbing fun facts

IcyDash is MISSING:
- FAB (exists at `components/FAB.tsx`, never rendered)
- Keyboard shortcuts (hook exists at `hooks/useKeyboardShortcuts.ts`, never used in IcyDash)
- Hide completed toggle
- Navigation to other pages (only has "+ habit" and "+ Add goals" links)

**Critical insight**: KeyboardShortcutsModal shows shortcuts (n, g+h, etc.) that DON'T ACTUALLY WORK - they're just documentation. The hook exists but isn't wired to actions.

---

## Plan (4 Tasks)

### Task 1: FAB + Quick Add Modal
**Goal**: Tap FAB or press `n` to add a task inline

**Implementation**:
1. Import and render `<FAB />` in IcyDash
2. Add state: `const [quickAddOpen, setQuickAddOpen] = useState(false)`
3. FAB onClick opens quick add (either modal or focuses inline add for today)
4. Style FAB to match glass card aesthetic (peach-400 accent)

**Files**: `client/src/pages/IcyDash.tsx`

---

### Task 2: Keyboard Shortcuts
**Goal**: Wire up `n` for new task, navigation shortcuts

**Implementation**:
1. Import `useKeyboardShortcuts` hook into IcyDash
2. Define shortcuts array:
   - `n` → open quick add / focus today's inline add
   - `c` → toggle first uncompleted habit for today
   - `?` → open keyboard shortcuts modal (already works globally)
3. Add g-sequence navigation (g+h, g+d, g+g, g+t, g+s) using `useLocation` from wouter

**Files**: `client/src/pages/IcyDash.tsx`

---

### Task 3: Hide Completed Toggle + Linger
**Goal**: Toggle to hide completed tasks, with 2-second linger animation

**Implementation**:
1. Add state: `const [hideCompleted, setHideCompleted] = useState(false)`
2. Add toggle button in Schedule header (small eye icon)
3. Filter `todosByDay` when hideCompleted is true
4. Add linger effect: when task is completed, delay hiding by 2s with fade-out animation
5. Use `framer-motion` AnimatePresence for smooth exit animations

**Files**: `client/src/pages/IcyDash.tsx`, `client/src/components/dashboard/DroppableDayColumn.tsx`

---

### Task 4: Navigation Links to Climbing Features
**Goal**: Connect IcyDash to existing climbing-themed pages

**Implementation**:
1. Add subtle navigation row below header or in footer:
   - Alpine Shop (`/alpine-shop`)
   - Expedition Missions (`/expedition-missions`)
   - World Map (`/world-map`)
   - Summit Journal (`/summit-journal`)
2. Use small icons + text, glass-card style
3. Keep minimal - just icons with tooltips, or a small "Explore" dropdown

**Files**: `client/src/pages/IcyDash.tsx`

---

## Order of Implementation

1. **Task 2: Keyboard shortcuts** (most invisible, foundation for everything)
2. **Task 1: FAB** (simple, high impact)
3. **Task 3: Hide completed** (UX polish)
4. **Task 4: Navigation** (connect the app)

---

## Out of Scope (Future)
- Quick capture widget
- Time blindness features
- Complex gamification integration
- Streak celebrations beyond confetti
