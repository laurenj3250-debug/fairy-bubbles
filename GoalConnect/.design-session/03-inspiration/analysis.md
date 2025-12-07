# F3: Inspiration Analysis

## Linear (Reference: linear.app)
**What works:**
- Dark theme by default (reduces eye strain)
- "Nothing unless it has a purpose" philosophy
- List/board view toggle
- Custom views with filters
- Clean spacing, intentional typography
- Focused functionality over decoration

**Apply:** Dark theme, purposeful elements only, clean spacing

## Amie Calendar (Reference: amie.so)
**What works:**
- "Opening a calendar shouldn't be stressful"
- Minimal, distraction-free interface
- Calendar + tasks in ONE place (no context-switching)
- Notch overlay / floating UI - out of the way
- One-click automation

**Apply:** Tasks in calendar, not separate. Reduce friction.

## Things 3 (from research)
**What works:**
- Upcoming list shows everything at a glance
- Clean unified view
- Drag-and-drop rescheduling
- "A quick peek is all it takes"

**Apply:** Week view shows everything, drag-and-drop tasks

## Key Patterns to Steal

### Layout
```
┌─────────────────────────────────────────────┐
│  Header: minimal, clock, status only        │
├─────────────────────────────────────────────┤
│  3 cards top row (equal height)             │
├─────────────────────────────────────────────┤
│  CALENDAR (dominant - 60%+ of viewport)     │
├─────────────────────────────────────────────┤
│  Optional widgets (hide if empty)           │
└─────────────────────────────────────────────┘
```

### Visual Style
- Dark theme (#0d1117 background)
- ONE accent color (teal #00D4AA or orange #F97316)
- Subtle borders, no heavy shadows
- Rounded corners (12-16px)
- Generous whitespace

### Interactions
- Drag-and-drop everywhere
- Today auto-highlighted
- Hover reveals actions
- Smooth 200ms transitions
