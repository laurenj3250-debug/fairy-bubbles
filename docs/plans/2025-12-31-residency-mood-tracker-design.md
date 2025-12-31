# Residency Mood Tracker - Design Document

## Purpose

A decision-support tool for veterinary neurology residency. Tracks mood, quit/stay feelings, activities, and confounders to answer:

> "Do I actually like vet neurology, or am I just tired/burnt out?"

Key insight: Separate **background mood** from **activity-specific ratings** to identify what you actually like vs what external factors are dragging you down.

---

## Data Model

### Entries

Each check-in captures:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier |
| `timestamp` | ISO string | Yes | When logged |
| `mood` | 1-5 | Yes | Background mood right now |
| `decision` | "quit" \| "stay" | Yes | How you feel about continuing |
| `activity` | string \| null | No | What you just did (if applicable) |
| `activityRating` | 1-5 \| null | No | How that specific activity was |
| `confounders` | string[] | No | Active confounders at time of entry |

### Activities (User-Defined)

Persisted list of activities. User adds new ones as needed.

**Starting set:**
- MRI
- Anaesthesia
- Consult
- Surgery

### Confounders (User-Defined)

Persisted list of external factors. Sticky per day (remembered until changed).

**Starting set:**
- Poor sleep
- Long day
- No outdoors
- Antihistamine
- Visited Adam

---

## UI Flow

### Main Screen - Quick Capture

```
┌─────────────────────────────────────────┐
│           How are you feeling?          │
│                                         │
│      😞    😕    😐    🙂    😊         │
│                                         │
├─────────────────────────────────────────┤
│           Right now, you want to...     │
│                                         │
│       [ Quit ]        [ Stay ]          │
│                                         │
├─────────────────────────────────────────┤
│  Just did something?              [ + ] │
│                                         │
│   [MRI]  [Anaesthesia]  [Consult]       │
│   [Surgery]                             │
│                                         │
├─────────────────────────────────────────┤
│  (Activity selected: MRI)               │
│  How was that specifically?             │
│                                         │
│      😞    😕    😐    🙂    😊         │
│                                         │
├─────────────────────────────────────────┤
│  Today:                           [ + ] │
│                                         │
│   ■ Poor sleep    □ Long day            │
│   □ No outdoors   □ Antihistamine       │
│   □ Visited Adam                        │
│                                         │
├─────────────────────────────────────────┤
│              [ Log Entry ]              │
└─────────────────────────────────────────┘
```

### Flow

1. **Tap mood** (required) - 1-5 emoji scale
2. **Tap quit/stay** (required)
3. **Tap activity** (optional) - if you just did something notable
4. **Rate activity** (only if activity selected) - can differ from mood
5. **Confounders** - sticky checkboxes, remember state until changed
6. **Log** - saves entry

### Add New Activity/Confounder

Tap [ + ] → text input → added to list permanently

---

## Analytics & Insights

### 1. Activity Ratings (Independent of Mood)

Shows how you rate each activity, controlling for background mood state.

```
ACTIVITY        AVG RATING    ON BAD DAYS    ON GOOD DAYS
────────────────────────────────────────────────────────
MRI               4.2           4.0            4.3
Surgery           3.8           3.1            4.2
Anaesthesia       2.4           1.9            2.7
Consult           2.1           1.4            2.5
```

**Insight:** "You rate MRI highly regardless of mood. You hate consults especially when already down."

### 2. Quit Rate by Context

```
OVERALL QUIT RATE: 55%

By confounder:
  After poor sleep:     72%  (+17%)
  After long day:       68%  (+13%)
  No confounders:       28%  (baseline)

By activity:
  After MRI:            15%
  After Surgery:        35%
  After Consult:        75%  ← problem area
  After Anaesthesia:    60%
```

**Insight:** "Your quit feelings are driven by consults and poor sleep, not by neurology itself."

### 3. Confounder Impact on Mood

```
CONFOUNDER          MOOD IMPACT    QUIT IMPACT
──────────────────────────────────────────────
Poor sleep            -1.5           +25%
Long day              -1.2           +18%
No outdoors           -0.8           +12%
Visited Adam          -0.3           +5%
Antihistamine         -0.2           +3%
```

**Insight:** "Sleep is your biggest lever. Antihistamine barely matters."

### 4. Mood Trend Over Time

Rolling 7-day and 30-day averages with visualization.

```
LAST 7 DAYS:    3.2 avg mood    45% quit
LAST 30 DAYS:   3.4 avg mood    52% quit
ALL TIME:       3.1 avg mood    55% quit

Trend: Slight improvement ↗
```

### 5. The Decision Summary

Aggregate view answering the core question:

```
┌─────────────────────────────────────────────────────┐
│  THE EVIDENCE                                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Activities you consistently enjoy:                 │
│    • MRI (4.2 avg, even 4.0 on bad days)           │
│    • Surgery (3.8 avg)                              │
│                                                     │
│  Activities dragging you down:                      │
│    • Consult (2.1 avg, 75% quit rate after)        │
│    • Anaesthesia (2.4 avg)                         │
│                                                     │
│  External factors to address:                       │
│    • Poor sleep causes 72% of quit feelings        │
│    • Removing poor-sleep days: quit rate → 28%     │
│                                                     │
│  ───────────────────────────────────────────────── │
│                                                     │
│  INTERPRETATION:                                    │
│  You enjoy core neuro work (MRI, surgery).         │
│  Quit feelings come from consults + poor sleep.    │
│  This suggests: optimize job for less admin,       │
│  prioritize sleep. Not a "quit neurology" signal.  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 6. Calendar Heatmap

Visual overview:
- Color intensity = mood (red=1 to green=5)
- Dot overlay = quit (red) or stay (green)
- Tap day to see entries

---

## Technical Considerations

### Storage

Use `window.storage` (existing pattern) with keys:
- `residency-tracker-entries` - array of entry objects
- `residency-tracker-activities` - array of activity strings
- `residency-tracker-confounders` - array of confounder strings
- `residency-tracker-active-confounders` - current sticky confounder state

### Minimum Data for Insights

Show "not enough data" until thresholds met:
- Activity stats: minimum 5 entries with that activity
- Confounder impact: minimum 10 entries with/without
- Trends: minimum 14 days of data

### Export

Future: CSV export of all entries for external analysis

---

## Open Questions

1. **Entry frequency** - How often will you realistically log? Design optimizes for quick capture to encourage multiple daily entries.

2. **Historical import** - Want to import data from current tracker version?

3. **Visualization priority** - Which analytics view is most important to build first?

---

## Next Steps

1. Implement core data model and storage
2. Build quick capture UI
3. Build activity/confounder management
4. Build analytics dashboard
5. Add calendar heatmap view
