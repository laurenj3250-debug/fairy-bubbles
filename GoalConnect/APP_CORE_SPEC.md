# Mountain Habit & Expedition App – Core Spec

## Core Fantasy & Loop

- User fantasy: The user is on a long-term **mountaineering expedition**.
- Core loop:
  - Do real-life **habits** and **tasks**.
  - Earn **XP / energy**.
  - Progress a **climber** along routes, through storms, and up mountains.
- Priority: This should feel like an **expedition game first**, and a productivity tool second.

---

## Core Systems (Must Exist)

### 1. Expedition Game System
- Player has:
  - **Level** (integer).
  - **XP** and a level XP bar (e.g., `340 / 500 XP`).
- Each expedition:
  - Has a **name** (e.g., "Alps Traverse", "Andes Ridge").
  - Has a **visual ridge/path** the climber moves along.
  - Has **segments/camps** (Camp I, Camp II, summit).
- Progress:
  - XP earned from habits/tasks moves the climber along the current expedition route.
  - Level ups unlock new expeditions, gear, or cosmetics (conceptually).

### 2. Storm / Weather System
- States like:
  - Clear / Calm
  - Incoming Storm / Warning
  - Full Storm / Dangerous Conditions
- Storms affect:
  - Copy/feedback (e.g., "Storm day: pick 1–2 key moves only").
  - Visual theme (darker, snow, clouds).
  - Optionally expectations or bonuses (e.g., reduced required habits, bonus XP for any progress).

### 3. Habits
- Each habit has:
  - Name and icon.
  - Schedule: daily, x times per week, etc.
  - **XP / energy value** (e.g., Pimsleur = 10 XP, Gym = 15 XP).
  - Difficulty label (easy / medium / hard) for flavor or weighting.
  - Streaks (number of consecutive days).
  - Recent performance (e.g., last 7 days).
- Habits can be **linked to one or more goals/routes**.
- Completing a habit:
  - Grants XP to the player (level bar).
  - Moves the climber along the expedition.
  - Advances any linked goal/route progress.

### 4. Tasks / To-Dos
- One-off actions (not recurring).
- Can optionally:
  - Be linked to a goal/route.
  - Grant XP on completion.
- Good for "loose scree" admin and misc life stuff.

### 5. Goals / Routes
- Higher-level goals represented as **routes**.
  - Examples:
    - "Learn German – 12 Pimsleur lessons."
    - "Climb 4 times this month."
    - "Finish Chapter 2 of De Lahunta."
- Each route/goal tracks:
  - Target amount (e.g., 12 lessons).
  - Current progress (e.g., 3 / 12).
  - Percentage / status.
- Habits and tasks can be **tagged** to these routes so that completing them advances the route.

### 6. Journal / Ideas ("Campfire Notes")
- A cozy space for:
  - Future goals / "want to do" ideas.
  - Expedition ideas.
  - Reflections, notes, brain dumps.
- Entries can be tagged (e.g., "habit idea", "goal idea", "expedition idea").
- From a journal entry, user can:
  - Convert it into a **habit**.
  - Convert it into a **goal/route**.
  - Convert it into a **task**.

---

## Screen Specs

### 1. Dashboard / Home – "Today on the Ridge"

**Purpose:** Main dopamine screen used multiple times per day.

**Layout (top → bottom):**

1. **Expedition Header (Game Layer)**
   - Shows:
     - Current expedition name (e.g., "Alps Traverse – Camp I → Camp II").
     - Player level and XP bar (`Level 7 • 340 / 500 XP`).
     - Small ridge/path with a climber icon that moves with progress.
     - Storm status (clear, incoming storm, storm active).
   - Every time the user completes a habit or task:
     - XP bar visibly jumps.
     - Climber moves along the ridge.
     - Optional micro-feedback (e.g., `+10 XP` badge).

2. **Today's Habits ("Today's Moves")**
   - Compact, thumb-friendly list, **not** giant cards.
   - Each row:
     - Left: icon + habit name.
     - Middle: small info (XP value, streak, maybe a small 7-day indicator).
     - Right: large tappable circle/checkbox for "done".
   - On tap:
     - Mark habit as complete.
     - Show `+XP` popup.
     - Update Expedition Header (XP bar + climber).
   - Long-press or `⋯` button opens a **Habit Detail** view for that habit.

3. **Quests Panel (Goals + Key Tasks)**
   - Single card with two sections:
     - **Active Routes (Goals)**:
       - Shows 2–4 active goals with small progress bars (e.g., "German – 3 / 12 lessons").
     - **Side Quests (Tasks)**:
       - Today's or important tasks that also grant XP when done.
   - Completing a task updates:
     - XP bar + climber.
     - Any linked route/goal progress.
   - This panel is intentionally simple: quick status without heavy stats.

**Behavior / Design Notes:**
- Dashboard focuses on **today's actions** and **immediate gratification** (XP, movement), not deep analytics.
- Heavy stats and detailed graphs live on other screens.

---

### 2. Habits Screen – "Training Routes"

**Purpose:** Management and deeper view of habits.

**Key elements:**
- List or grouped view of all habits, e.g.:
  - By category (Mind, Body, Work).
  - Or by linked goal/route.
  - Or by difficulty.
- For each habit, show:
  - Name, icon, XP value.
  - Frequency (e.g., "4x/week").
  - Streak.
  - Small chart of last 7/30 days.
- Tapping a habit opens a **Habit Detail** view with:
  - Full stats (history, streak heatmap, storm-day performance if applicable).
  - Settings:
    - Name, icon.
    - XP / energy value.
    - Schedule.
    - Linked goal(s)/route(s).
    - Difficulty.
- Visual theme: this is the **training control room** for the climber, not a second dashboard.

---

### 3. Journal / Ideas Screen – "Campfire Notes"

**Purpose:** Space for ideas, reflections, and future plans, not daily check-offs.

**Key elements:**
- Sections or filters such as:
  - "Route Ideas" (future goals).
  - "Gear & Training Ideas" (potential habits).
  - "Future Expeditions".
  - "Reflections / Logbook".
- Each entry:
  - Has a title, optional body text, tags.
  - Can be converted into:
    - Habit.
    - Goal/route.
    - Task.
- Visual tone:
  - Slower, cozy, "around the campfire at night" rather than urgent checklist.
- Optional: journal entries can reference expeditions, goals, or specific days.

---

## Design Principles

- **Mountain / Expedition Theme**
  - Use naming and visual metaphors like: base camp, ridge, summit, routes, storms, camps, side quests.

- **ADHD-Friendly UX**
  - Clear hierarchy on each screen (1–3 main actions, max).
  - Large, obvious tap targets for primary actions (logging a habit, completing a task).
  - Minimal clutter on Dashboard: prioritize "What should I do next?" and "How far am I?".

- **Dopamine-First**
  - Logging a habit or task should immediately:
    - Show XP gained.
    - Show progress on the expedition.
  - Level-ups and expedition milestones should be celebrated (e.g., new camp reached).

- **Game-First, Dashboard-Second**
  - The app should feel like progressing an expedition with training, not like looking at a generic productivity dashboard.
  - Analytics and charts are secondary and live on dedicated screens (Habits, Stats, etc.), not cluttering the home screen.

---

## Navigation Overview

- **Dashboard / Today** – "Today on the Ridge"
  - Entry point for daily use.
  - Expedition header, today's habits list, quests panel.

- **Habits / Training Routes**
  - Manage and analyze habits, adjust settings, see patterns.

- **Journal / Campfire Notes**
  - Capture ideas, reflections, future routes/goals, and convert them into habits/tasks/goals.

- **Expedition / Map (Existing)**
  - Dedicated view for the full expedition map, past expeditions, and big-picture progress (reuses existing game system).

All new designs for Dashboard, Habits, and Journal should plug into these systems and respect this spec.

---

# DETAILED UX REDESIGN SPECIFICATION

## Executive Summary

You have **excellent** game systems (XP, levels, expeditions, routes, storms, weather, gear). The problem is the current UI tries to show everything at once. This redesign separates concerns:

- **Dashboard** = Today's climb (fast action + visible progress)
- **Habits** = Training control room (deep stats + management)
- **Journal** = Future expeditions (reflection + ideas)

---

## SCREEN 1: DASHBOARD / HOME — "Today's Climb"

### Design Philosophy
**The dashboard is NOT a command center. It's a launchpad.**

Current problem: Dashboard.tsx shows 15+ different sections. Users get paralyzed.

New approach: **3 zones only**
1. **The Mountain** (where am I?)
2. **Today's Pitch** (what should I do?)
3. **Quick Pulse** (how am I doing?)

---

### Dashboard Wireframe (Top to Bottom)

```
┌─────────────────────────────────────────────────┐
│  [STATUS BAR - Fixed at top]                    │
│  🔥 7 day streak   Level 12   ⚡ 850/1000 XP   │
│  Storm Warning: Clear skies today ☀️            │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  THE RIDGE (Expedition Visual)                  │
│                                                 │
│     Current Route: "K2 - Abruzzi Spur"        │
│     [━━━━━━━━━━━━━━░░░░░░] 65% to Summit      │
│                                                 │
│     Today: Base Camp → Camp 1                  │
│     Distance: 2.4km   Elevation: +600m         │
│                                                 │
│  [Large, beautiful visualization of the        │
│   current route segment - think topo map       │
│   with your position marked as a climber icon] │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  TODAY'S PITCH (Core Action Zone)               │
│                                                 │
│  ☑️ Morning Routine       [✓] +15 XP           │
│  🏃 Run 5km               [ ] +25 XP           │
│  📚 Learn German          [ ] +15 XP           │
│  🧘 Meditate              [✓] +10 XP           │
│                                                 │
│  [Compact rows, thumb-friendly checkboxes,     │
│   instant XP feedback when you tap]            │
│                                                 │
│  2/4 Complete   +40 XP earned today            │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  ACTIVE ROUTES (Mini-goals preview)             │
│                                                 │
│  🎯 Learn German A2                             │
│     [━━━━━━░░░░░░] 52% (23/45 lessons)         │
│                                                 │
│  🏔️ Climb 12x this month                        │
│     [━━━━━━━━░░░░] 67% (8/12 sessions)         │
│                                                 │
│  → View All Routes                              │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  WEATHER REPORT (Storm/conditions)              │
│                                                 │
│  ☀️ Clear Conditions                            │
│  Perfect day for climbing!                      │
│  Bonus: +20% XP for completing 4/4 habits      │
│                                                 │
│  [OR if storm:]                                 │
│  ⛈️ Storm Warning - Next 2 days                 │
│  Complete habits to maintain shelter!          │
└─────────────────────────────────────────────────┘
```

---

### Dashboard: Sections Detail

#### 1. Status Bar (Always Visible - Fixed)
**Data:**
- Current streak (from playerClimbingStats.trainingDaysCompleted)
- Player level & XP bar (from playerClimbingStats.climbingLevel, totalExperience)
- Weather/storm status (from weather system)

**Interaction:**
- Tap streak → opens streak details modal
- Tap XP bar → shows level progress + next unlock
- Tap weather → shows 7-day forecast

**Why it works:**
- Always know where you are
- No scrolling needed
- Glanceable status

---

#### 2. The Ridge (Expedition Visual)
**Data:**
- Current active expedition (from playerExpeditions where status='in_progress')
- Route name (from routes.routeName)
- Progress % (from playerExpeditions.currentProgress)
- Current segment (calculated from progress)

**Interaction:**
- Tap anywhere → opens full expedition detail screen
- Shows your climber icon moving up the route as you complete habits

**Visual:**
- Think: vertical route diagram (like climbing topo)
- Your position = pulsing climber icon
- Camps = waypoint markers
- Summit = at the top

**Why it works:**
- Instant context: "I'm climbing K2"
- Visual progress is dopamine
- Mountain-themed, not generic progress bar

---

#### 3. Today's Pitch (Habit Checklist)
**Data:**
- Today's habits (from habits where cadence matches today)
- Completion status (from habitLogs where date=today)
- XP values (from habits.difficulty → calculated)

**Interaction:**
- Tap checkbox → toggle habit
- Instant feedback: +XP animation, checkbox fills
- Long press → opens habit detail (notes, mood)

**Visual:**
- Maximum 6 habits shown (rest go to "View All")
- Large tap targets (48px minimum)
- Icon + Title + XP value
- Completed items stay visible but dimmed

**Why it works:**
- This is THE action zone
- Fast, thumb-friendly
- Clear "what's next"

---

#### 4. Active Routes (Goal Preview)
**Data:**
- Top 2-3 active goals (from goals where currentValue < targetValue)
- Progress % (currentValue / targetValue)

**Interaction:**
- Tap route → goes to Goals page with that goal highlighted
- Shows just enough to feel progress

**Why it works:**
- Not too much detail (that's for Goals page)
- Just a pulse check: "Am I on track?"

---

#### 5. Weather Report (Storm Status)
**Data:**
- Current weather condition (from weather system)
- Storm warnings (from expeditionEvents where eventType='storm')
- Bonus/penalty modifiers

**Interaction:**
- Tap → shows detailed weather forecast modal
- Explains how weather affects XP/progress

**Why it works:**
- Game flavor without cluttering
- Clear stakes: "Storm coming = complete habits"

---

### Dashboard: What Got Removed/Moved

**Removed from Dashboard:**
- Virtual pet (move to separate Pet screen or bottom nav)
- Ascent map (move to Expedition screen)
- Calendar view (move to Habits page)
- Weekly/monthly widgets (move to Habits page)
- Dream scroll widget (move to Journal page)
- Achievement spotlight (move to Profile/Achievements page)
- 7-day progress charts (move to Habits page)

**Why:**
- Dashboard is for **today's action**
- Deep stats go to Habits page
- Future planning goes to Journal page

---

## SCREEN 2: HABITS SCREEN — "Training Camp"

### Design Philosophy
**This is your control room for habit management and analytics.**

Current problem: Habits.tsx mixes today's logging with management.

New approach: **3 tabs:**
1. **Today** (quick logging with date picker)
2. **Library** (all habits + editing)
3. **Insights** (stats, streaks, patterns)

---

### Habits Wireframe (Top to Bottom)

```
┌─────────────────────────────────────────────────┐
│  [HEADER]                                       │
│  🏕️ Training Camp                               │
│  Your habits, your way                          │
│                                                 │
│  [+ New Habit]                                  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  [TABS]                                         │
│  [ Today ]  [ Library ]  [ Insights ]           │
└─────────────────────────────────────────────────┘

═════════════════════════════════════════════════
TAB 1: TODAY
═════════════════════════════════════════════════

┌─────────────────────────────────────────────────┐
│  [DATE PICKER]                                  │
│  ← Monday, Nov 11, 2025 →   [Jump to Today]    │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  DAILY HABITS                                   │
│                                                 │
│  ☑️ Morning Routine    [✓]  🔥 7 days          │
│     Daily • Easy • +10 XP                       │
│                                                 │
│  🏃 Run 5km            [ ]  🔥 3 days          │
│     Daily • Hard • +25 XP                       │
│                                                 │
│  [... more habits ...]                          │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  WEEKLY HABITS                                  │
│                                                 │
│  📚 Learn German       ●●○○○  (2/5 this week)  │
│     Weekly • Medium • +15 XP                    │
│                                                 │
│  [... more habits ...]                          │
└─────────────────────────────────────────────────┘

═════════════════════════════════════════════════
TAB 2: LIBRARY
═════════════════════════════════════════════════

┌─────────────────────────────────────────────────┐
│  [FILTERS]                                      │
│  All  | Daily  | Weekly  | By Route            │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  BASE CAMP HABITS (Foundation)                  │
│                                                 │
│  ☑️ Morning Routine                             │
│     [━━━━━━━━━━] 85% completion (30 days)      │
│     Streak: 7 days | Linked: Recovery Route    │
│     [Edit] [Archive]                            │
│                                                 │
│  🏃 Run 5km                                     │
│     [━━━━━━░░░░] 65% completion (30 days)      │
│     Streak: 3 days | Linked: Endurance Route   │
│     [Edit] [Archive]                            │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  HIGH ALTITUDE HABITS (Advanced)                │
│                                                 │
│  📚 Learn German                                │
│     [━━━━━░░░░░] 52% completion (30 days)      │
│     Weekly (2/5 this week)                      │
│     [Edit] [Archive]                            │
└─────────────────────────────────────────────────┘

═════════════════════════════════════════════════
TAB 3: INSIGHTS
═════════════════════════════════════════════════

┌─────────────────────────────────────────────────┐
│  TRAINING SUMMARY                               │
│                                                 │
│  Current Streak:  🔥 7 days                     │
│  Best Streak:     🏆 14 days                    │
│  Total Sessions:  152 completions               │
│  This Week:       18/21 habits (86%)           │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  HABIT HEATMAP (Last 30 days)                   │
│                                                 │
│  [Calendar grid showing completion patterns]    │
│  Green = all done, Yellow = partial, Gray = 0   │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  BEST DAYS                                      │
│                                                 │
│  1. Monday     94% complete (17 weeks)          │
│  2. Tuesday    89% complete (16 weeks)          │
│  3. Wednesday  85% complete (15 weeks)          │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  STORM PERFORMANCE                              │
│                                                 │
│  Clear Days:   87% completion                   │
│  Storm Days:   62% completion                   │
│                                                 │
│  Tip: Your completion drops 25% during storms.  │
│  Consider easier habits on storm days!          │
└─────────────────────────────────────────────────┘
```

---

### Habits: Section Details

#### Tab 1: Today
**Purpose:** Fast logging for any date

**Data:**
- Habits scheduled for selected date
- Completion logs for that date
- Streaks (calculated from habitLogs)

**Interaction:**
- Date picker to navigate days
- Toggle completion (same as Dashboard)
- Shows daily vs weekly habits separately

**Why separate from Library:**
- Library is for managing habits (CRUD)
- Today is for logging completion
- Different mental modes

---

#### Tab 2: Library
**Purpose:** Manage your habits (edit, archive, organize)

**Data:**
- All habits grouped by category
- 30-day completion rates
- Linked goals/routes

**Interaction:**
- Edit button → opens habit editor
- Archive → soft delete
- Can filter by cadence, difficulty, route

**Grouping ideas:**
- "Base Camp" = foundation habits (morning routine, etc.)
- "Training" = physical habits
- "High Altitude" = challenging/new habits
- "Recovery" = rest/wellness habits

**Why it works:**
- Clear separation: viewing vs editing
- All habits visible at once
- Easy to see which habits are working

---

#### Tab 3: Insights
**Purpose:** Understand your patterns

**Data:**
- Aggregate stats from habitLogs
- Streak calculations
- Day-of-week performance
- Storm vs clear day performance

**Visualizations:**
- Heatmap calendar (30 days)
- Bar chart for day-of-week
- Line chart for weekly trends
- Storm performance comparison

**Why it works:**
- Moves ALL the analytics here
- Dashboard stays clean
- You can nerd out on data when you want

---

### Habits: What Got Removed/Moved

**Removed:**
- Date navigation from header (now in Today tab only)
- Heavy visualization on every habit card (now in Insights)

**Added:**
- Tab structure for mental clarity
- Grouping by difficulty/category
- Storm performance tracking

---

## SCREEN 3: JOURNAL / IDEAS — "Route Planning"

### Design Philosophy
**This is NOT a task list. It's a dream book.**

Current problem: DreamScrollMountain mixes tasks with dreams.

New approach: **2 modes:**
1. **Route Ideas** (future goals/expeditions)
2. **Campfire Notes** (reflections, lessons learned)

---

### Journal Wireframe (Top to Bottom)

```
┌─────────────────────────────────────────────────┐
│  [HEADER]                                       │
│  📖 Expedition Log                              │
│  Your journey, your story                       │
│                                                 │
│  [+ New Entry]                                  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  [MODE TOGGLE]                                  │
│  [ Route Ideas ]  [ Campfire Notes ]            │
└─────────────────────────────────────────────────┘

═════════════════════════════════════════════════
MODE 1: ROUTE IDEAS
═════════════════════════════════════════════════

┌─────────────────────────────────────────────────┐
│  [FILTERS]                                      │
│  🏔️ Peaks  | 🎒 Gear  | 🧗 Skills  | 🗺️ Places │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  PEAKS TO CLIMB                                 │
│                                                 │
│  ⛰️ Climb Kilimanjaro                           │
│     "Marangu Route - 6 days"                    │
│     Priority: High  |  Difficulty: ⛰️⛰️        │
│     Tags: [Africa] [5895m]                      │
│     → Convert to Route                          │
│                                                 │
│  🏔️ Learn Ice Climbing                          │
│     "Take a course in Chamonix"                 │
│     Priority: Medium  |  Difficulty: ⛰️⛰️⛰️    │
│     Tags: [Technical] [France]                  │
│     → Convert to Habit                          │
│                                                 │
│  [... more ideas ...]                           │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  GEAR WISHLIST                                  │
│                                                 │
│  🎒 Arc'teryx Alpha SV Jacket                   │
│     "For high-altitude expeditions"             │
│     Cost: $$$ | Priority: Medium                │
│                                                 │
│  [... more gear ...]                            │
└─────────────────────────────────────────────────┘

═════════════════════════════════════════════════
MODE 2: CAMPFIRE NOTES
═════════════════════════════════════════════════

┌─────────────────────────────────────────────────┐
│  📅 November 11, 2025                           │
│  ⛈️ Storm Day - Completed 3/4 habits           │
│                                                 │
│  Felt tired today but pushed through morning    │
│  routine. Skipped the run because of rain.      │
│  Noticed I'm more consistent on Mondays.        │
│                                                 │
│  Next week: Try the new route to work.          │
│                                                 │
│  [Edit] [Delete]                                │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  📅 November 5, 2025                            │
│  🏆 7-Day Streak Achieved!                      │
│                                                 │
│  Hit my first week-long streak! Morning         │
│  routine is becoming automatic. The key was     │
│  laying out clothes the night before.           │
│                                                 │
│  Lesson: Preparation > Willpower               │
│                                                 │
│  [Edit] [Delete]                                │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  [REFLECTION PROMPTS]                           │
│                                                 │
│  • What went well this week?                    │
│  • What habit felt hardest?                     │
│  • What would I change next week?               │
│  • What peak am I eyeing next?                  │
└─────────────────────────────────────────────────┘
```

---

### Journal: Section Details

#### Mode 1: Route Ideas
**Purpose:** Brainstorm future goals without committing

**Data:**
- dreamScrollItems where category matches filter
- Tags, priority, difficulty (cost field repurposed)

**Interaction:**
- Add new idea (quick capture)
- Edit/delete ideas
- **KEY:** "Convert to Route" button → creates a Goal
- **KEY:** "Convert to Habit" button → creates a Habit

**Categories (Mountain-themed):**
- **Peaks to Climb** = Big life goals (climb Kilimanjaro, run marathon)
- **Gear Wishlist** = Things to buy (climbing gear, books)
- **Skills to Master** = Things to learn (ice climbing, German)
- **Ranges to Explore** = Places to visit (Patagonia, Alps)
- **Views to Witness** = Experiences (sunrise summit, northern lights)

**Why it works:**
- Low-pressure idea capture
- Not a todo list (no deadlines, no guilt)
- Easy to promote ideas to real goals/habits

---

#### Mode 2: Campfire Notes
**Purpose:** Reflect on your journey

**Data:**
- New table: `journalEntries` (or reuse dreamScrollItems with special category)
- Fields: date, content, mood, linkedHabits, linkedExpedition

**Interaction:**
- Freeform text entry
- Auto-suggests reflection prompts
- Can attach: "Today's stats", "Current expedition", "Weather"

**Entry types:**
- Daily reflection
- Weekly review
- Milestone celebration
- Storm survival story
- Lesson learned

**Why it works:**
- Separate from "ideas" (different energy)
- Encourages reflection without pressure
- Builds narrative: "My climbing story"

---

### Journal: What Got Removed/Moved

**Removed:**
- Completion tracking (that's for Goals page)
- Task checkboxes (that's for Habits page)
- Progress bars (that's for Goals/Dashboard)

**Added:**
- Campfire Notes (reflection mode)
- "Convert to Goal/Habit" actions
- Reflection prompts

---

## INFORMATION ARCHITECTURE: HOW PAGES CONNECT

```
┌─────────────────┐
│  BOTTOM NAV     │
└─────────────────┘
│
├── 🏠 Dashboard    → Today's action + progress pulse
├── 🏕️ Habits       → Manage training routines
├── 🗺️ Expeditions  → View full route progress (NEW!)
├── 📖 Journal      → Ideas + reflections
└── 👤 Profile      → Stats, achievements, settings
```

### Navigation Flow

**Dashboard → Habits:**
- Tap "View All Habits" → goes to Habits > Today tab

**Dashboard → Expeditions:**
- Tap "The Ridge" visual → goes to Expeditions (full route view)

**Dashboard → Journal:**
- Tap "Dream Scroll" (if you add widget back) → goes to Journal > Route Ideas

**Habits → Dashboard:**
- Completing habit → shows "+XP" animation → tap to see Dashboard progress update

**Journal → Goals:**
- Tap "Convert to Route" → creates Goal, opens Goals page

**Journal → Habits:**
- Tap "Convert to Habit" → opens Habit creation dialog pre-filled

---

## MAPPING TO EXISTING SYSTEMS

### Dashboard Uses:
- `playerClimbingStats` → Level, XP, streak, energy
- `playerExpeditions` → Current expedition, progress
- `routes` → Route name, difficulty
- `habitLogs` → Today's completion status
- `goals` → Active routes preview
- Weather system → Storm warnings

### Habits Uses:
- `habits` → All habit data
- `habitLogs` → Completion history
- `goals` → Linked routes
- Calculated streaks
- Weather system → Storm performance analysis

### Journal Uses:
- `dreamScrollItems` → Route ideas
- `dreamScrollTags` → Tags for organization
- New: `journalEntries` → Campfire notes

---

## MOUNTAIN-THEMED COPY SUGGESTIONS

### Dashboard
- **Page Title:** "Today's Climb"
- **Habit Section:** "Today's Pitch" (climbing term for section)
- **Goal Section:** "Active Routes"
- **Progress:** "Distance to Summit"
- **Weather:** "Conditions Report"

### Habits
- **Page Title:** "Training Camp"
- **Tabs:** "Today" / "Training Log" / "Performance"
- **Categories:**
  - "Base Camp" = Foundation habits
  - "Approach" = Building strength
  - "High Altitude" = Advanced habits
  - "Acclimatization" = Recovery/rest

### Journal
- **Page Title:** "Expedition Log"
- **Modes:** "Route Ideas" / "Campfire Notes"
- **Actions:**
  - "Convert to Route" → Promote idea to goal
  - "Convert to Training" → Promote idea to habit
  - "Archive to Summit Log" → Mark complete

### Universal Terms
- **Habits** = "Training sessions"
- **Goals** = "Routes" or "Expeditions"
- **Streaks** = "Climbing days"
- **XP** = "Altitude gained" or keep "XP"
- **Level** = "Climbing grade" (5.9, 5.10, etc.)
- **Weather** = "Conditions"
- **Storm** = "Storm warning"

---

## WHAT'S NEXT: IMPLEMENTATION PRIORITY

### Phase 1: Dashboard Redesign
1. Build new Dashboard layout (3 zones)
2. Move ridge visualization to top
3. Simplify habit list (Today's Pitch)
4. Add weather widget
5. Remove all the sidebar widgets

### Phase 2: Habits Redesign
1. Add tab structure (Today/Library/Insights)
2. Move date picker to Today tab only
3. Build Library view with grouping
4. Build Insights tab with charts

### Phase 3: Journal Redesign
1. Add mode toggle (Ideas/Notes)
2. Keep existing Route Ideas functionality
3. Build Campfire Notes (reflection mode)
4. Add "Convert to X" actions

---

## TECHNICAL NOTES

### Existing Components to Reuse
- `HabitToggleRow` → Perfect for Today's Pitch
- `RidgeTraverseWeek` → Adapt for The Ridge visual
- `WeatherOverlay` → Use for Conditions Report
- `HabitHeatmap` → Use in Habits > Insights
- `GoalBadge` → Use in Active Routes section

### Existing Components to Remove/Deprecate
- `AchievementSpotlight` → Move to Profile page
- `VirtualPet` → Move to separate Pet screen
- `AscentMap` → Move to Expeditions screen
- `WeekAtAGlance` → Move to Habits > Insights
- `MonthlyGoalsWidget` → Move to Goals page

### New Components Needed
1. `ExpeditionRidgeVisualization` → For Dashboard's "The Ridge"
2. `TodaysPitch` → Compact habit list for Dashboard
3. `ConditionsReport` → Weather widget for Dashboard
4. `HabitsTabView` → Tab structure for Habits page
5. `CampfireNotes` → Reflection mode for Journal

---

## FINAL CHECKLIST: IS THIS ADHD-FRIENDLY?

✅ **Clear hierarchy:** Each screen has ONE primary action
✅ **Few core actions:** Dashboard = check habits, Habits = log/manage, Journal = reflect/plan
✅ **Big tap targets:** All checkboxes, buttons = 48px minimum
✅ **Minimal clutter:** Dashboard shows 3 zones max, no scrolling needed for primary action
✅ **Dopamine hits:**
  - Instant XP animation on habit complete
  - Ridge progress visually updates
  - Streak counter pulses
  - Weather bonuses feel rewarding

✅ **Mountain theme throughout:** Every screen uses climbing metaphors consistently

---

## DATABASE SCHEMA REQUIREMENTS

### Existing Tables Used
- `habits` - habit definitions
- `habitLogs` - completion tracking
- `goals` - route/goal definitions
- `goalUpdates` - goal progress tracking
- `todos` - one-off tasks
- `playerClimbingStats` - player level, XP, energy
- `playerExpeditions` - current expedition progress
- `routes` - expedition route definitions
- `mountains` - mountain/peak data
- `expeditionEvents` - storm/weather events
- `dreamScrollItems` - route ideas (Route Ideas mode)
- `dreamScrollTags` - tags for organizing ideas

### New Tables Needed
- `journalEntries` (for Campfire Notes mode)
  - id: serial
  - userId: integer
  - date: varchar (YYYY-MM-DD)
  - content: text
  - mood: varchar (optional)
  - linkedHabitIds: text (JSON array)
  - linkedExpeditionId: integer (optional)
  - weatherCondition: varchar (optional)
  - entryType: varchar ('daily' | 'weekly' | 'milestone' | 'reflection')
  - createdAt: timestamp
