# F1: Design Brief - The Minimal-Lauren Layout™

## Problem Statement
Create an ADHD-friendly weekly planner dashboard that doesn't overwhelm with visual noise or duplicate information.

## Target User
Lauren - needs:
- Quick habit checks (not work)
- Week view as the main hub
- Minimal visual clutter
- Widgets that disappear when empty
- One accent color, not a neon explosion

## Core Requirements

### Layout Structure (3 rows)

```
┌─────────────────────────────────────────────────────────────────┐
│  Habits (sm)  │  Goals (tabs: Week/Month)  │  Universal List   │
├─────────────────────────────────────────────────────────────────┤
│                    CALENDAR (FULL WIDTH)                        │
│                 Today auto-expands · Tasks live here            │
├─────────────────────────────────────────────────────────────────┤
│    (optional widget)          │      (optional widget)          │
│    Hides if empty             │      Hides if empty             │
└─────────────────────────────────────────────────────────────────┘
```

### Row 1: Top Row (3 boxes)
1. **Today's Habits** (left) - Small, quick checks
2. **Weekly/Monthly Goals** (center) - Tabbed interface, NOT two separate boxes
3. **Universal List** (right) - One switchable list (groceries, reading, trips, etc.)

### Row 2: Calendar (full width)
- Each day holds its tasks
- Today auto-expands
- Other days stay compact
- This IS the task hub - no separate "Today's Tasks" box

### Row 3: Optional Widgets (1-2 max)
Candidates:
- Ride Summary (auto-hides if no ride)
- Active Challenge (thin vertical card)
- Want to Try (3 items max)
- Notes to Self (only visible if content exists)

## Visual Rules
1. **Max 6 visible boxes total** (3 top + calendar + 1-2 widgets)
2. **Empty widgets disappear** - No ghost containers
3. **ONE accent color** - Teal OR pink, not both
4. **Glow is optional, not mandatory**
5. **Clean spacing** - Calendar is the heart, give it room

## Emotional Goals
- Clean
- Functional  
- ADHD-friendly
- NOT a neon panic attack
- NOT a cluttered vet med break room

## Must-Haves
- [x] Habits sidebar → moved to top row as small box
- [x] Week view → calendar as main hub (row 2)
- [x] Goals tracking → tabbed in one box
- [x] List functionality → universal list with switcher
- [ ] Auto-hide empty widgets

## Nice-to-Haves
- Strava integration (optional widget)
- Notes widget (if content exists)
- Active challenge indicator
