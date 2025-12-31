# de Lahunta Reading Schedule Integration Plan

## Overview
Integrate the de Lahunta textbook reading schedule into yearly goals as a compound goal with 26 week-by-week sub-items.

---

## Current State

### What Exists:
1. **Seed endpoint** (`POST /api/seed/reading-schedule`) - Creates 26-week schedule (currently 2025)
2. **26-week breakdown** - pp. 1-621, ~23 pages/week, Chapters 1-22
3. **Compound yearly goal support** - `goalType: "compound"` with `subItems[]`

### What's Missing:
1. 2026 version of the reading schedule
2. de Lahunta as compound goal in seed-2026-goals.ts (currently just binary)

---

## Phase 1: Update Seed Script for 2026

### Task 1.1: Update seed-2026-goals.ts

Change de Lahunta from binary to compound goal with 26 sub-items:

```typescript
// Change from:
{ category: "residency", title: "Finish de Lahunta", goalType: "binary", targetValue: 1, xpReward: 150 }

// To:
{
  category: "residency",
  title: "Complete de Lahunta",
  goalType: "compound",
  targetValue: 26,
  xpReward: 500,
  subItems: [
    { id: randomUUID(), title: "Week 1: pp. 1-23 (Ch 1 + Ch 2)", completed: false },
    { id: randomUUID(), title: "Week 2: pp. 24-46 (Ch 2 + Ch 3)", completed: false },
    { id: randomUUID(), title: "Week 3: pp. 47-69 (Ch 3)", completed: false },
    { id: randomUUID(), title: "Week 4: pp. 70-92 (Ch 3 + Ch 4)", completed: false },
    { id: randomUUID(), title: "Week 5: pp. 93-115 (Ch 4 + Ch 5)", completed: false },
    { id: randomUUID(), title: "Week 6: pp. 116-138 (Ch 5)", completed: false },
    { id: randomUUID(), title: "Week 7: pp. 139-161 (Ch 5)", completed: false },
    { id: randomUUID(), title: "Week 8: pp. 162-184 (Ch 5 + Ch 6)", completed: false },
    { id: randomUUID(), title: "Week 9: pp. 185-207 (Ch 6 + Ch 7)", completed: false },
    { id: randomUUID(), title: "Week 10: pp. 208-229 (Ch 7)", completed: false },
    { id: randomUUID(), title: "Week 11: pp. 246-268 (Ch 9 + Ch 10)", completed: false },
    { id: randomUUID(), title: "Week 12: pp. 269-291 (Ch 10)", completed: false },
    { id: randomUUID(), title: "Week 13: pp. 292-314 (Ch 10 + Ch 11)", completed: false },
    { id: randomUUID(), title: "Week 14: pp. 315-337 (Ch 11)", completed: false },
    { id: randomUUID(), title: "Week 15: pp. 338-360 (Ch 11 + Ch 12)", completed: false },
    { id: randomUUID(), title: "Week 16: pp. 361-383 (Ch 12 + Ch 13)", completed: false },
    { id: randomUUID(), title: "Week 17: pp. 384-406 (Ch 13)", completed: false },
    { id: randomUUID(), title: "Week 18: pp. 407-429 (Ch 13 + Ch 14)", completed: false },
    { id: randomUUID(), title: "Week 19: pp. 430-452 (Ch 14)", completed: false },
    { id: randomUUID(), title: "Week 20: pp. 453-475 (Ch 14-17)", completed: false },
    { id: randomUUID(), title: "Week 21: pp. 476-498 (Ch 17 + Ch 18)", completed: false },
    { id: randomUUID(), title: "Week 22: pp. 499-521 (Ch 18-20)", completed: false },
    { id: randomUUID(), title: "Week 23: pp. 522-544 (Ch 20 + Ch 21)", completed: false },
    { id: randomUUID(), title: "Week 24: pp. 545-567 (Ch 21 + Ch 22)", completed: false },
    { id: randomUUID(), title: "Week 25: pp. 568-590 (Ch 22)", completed: false },
    { id: randomUUID(), title: "Week 26: pp. 591-621 (Ch 22)", completed: false },
  ]
}
```

**File to modify:**
- `scripts/seed-2026-goals.ts`

---

## Implementation

Single task:
1. Update seed script with compound de Lahunta goal
2. Run seed script to populate database
3. de Lahunta shows in yearly goals on IcyDash (collapsed by default)
4. User expands "Residency" category → sees 26 checkable sub-items

---

## Success Criteria

- [ ] "Complete de Lahunta" shows as compound goal with 26 sub-items
- [ ] Each sub-item shows week number, page range, and chapters
- [ ] Checking a sub-item updates progress (e.g., 5/26)
- [ ] Goal auto-completes when all 26 sub-items are done
