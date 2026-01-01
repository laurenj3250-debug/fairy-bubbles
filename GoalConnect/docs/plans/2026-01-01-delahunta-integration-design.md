# de Lahunta Integration + Yearly Goals Redesign

## Overview
Integrate de Lahunta textbook tracking between study planner and yearly goals, plus redesign yearly goals UI to compact 3-column grid.

## Goals
1. Track de Lahunta by 22 chapters (not 26 weeks)
2. Sync study planner chapter completion → yearly goal progress
3. Compact grid layout for yearly goals (3 per row, smaller cards)

---

## Part 1: de Lahunta Study Planner Integration

### Data Changes

**1. Seed de Lahunta book + chapters:**
```typescript
// study_books
{ id: ?, userId: 1, title: "de Lahunta", abbreviation: "dL" }

// study_chapters (22 entries)
{ bookId: ?, title: "Introduction", pageStart: 1, pageEnd: 5 }
{ bookId: ?, title: "Neuroanatomy Atlas", pageStart: 6, pageEnd: 44 }
{ bookId: ?, title: "Development/Malformations", pageStart: 45, pageEnd: 78 }
// ... etc
```

**2. Add linkedBookId to yearly_goals schema:**
```sql
ALTER TABLE yearly_goals ADD COLUMN linked_book_id INTEGER REFERENCES study_books(id);
```

**3. Update yearly goal:**
- Delete old 26-week subItems
- Set linkedBookId to de Lahunta book
- targetValue = 22

### Sync Behavior

- **Direction:** One-way (study_chapters → yearly_goals)
- **Trigger:** When fetching yearly goals, compute progress from study_chapters
- **Sub-items:** Computed from study_chapters, not stored in yearly_goals.subItems

### API Changes

```typescript
// GET /api/yearly-goals returns:
{
  id: 55,
  title: "Complete de Lahunta",
  goalType: "compound",
  linkedBookId: 3,
  computedValue: 8,  // count of completed chapters
  targetValue: 22,
  isCompleted: false,
  subItems: [
    // Computed from study_chapters:
    {
      id: "ch-1",
      title: "1. Introduction",
      pageStart: 1,
      pageEnd: 5,
      pageCount: 5,
      completed: true
    },
    // ...
  ]
}
```

---

## Part 2: Compact Grid Layout

### Specs
- 3 columns on desktop/tablet
- 2 columns on mobile
- Card size: ~120px × 100px
- Gap: 12px

### Card Content
```
┌─────────────────────┐
│ 📚  Category Icon   │
│ Goal Title (trunc)  │
│ ▓▓▓▓░░░░  40%      │
│ ⭐ 100 XP          │
└─────────────────────┘
```

### Visual States
- **Not started:** Gray background, muted text
- **In progress:** Amber border glow, partial progress fill
- **Complete:** Green checkmark overlay, strikethrough title

### For Compound Goals (like de Lahunta)
Show chapter cards when expanded:
```
┌─────────────────────┐
│ 📖  5. LMN Spinal   │
│ pp. 106-165 (60p)   │
│ ○ Not started       │
└─────────────────────┘
```

---

## Part 3: Chapter Data

From actual de Lahunta Table of Contents:

| # | Title | Pages | Count |
|---|-------|-------|-------|
| 1 | Introduction | 1-5 | 5 |
| 2 | Neuroanatomy Gross Description and Atlas | 6-44 | 39 |
| 3 | Development of the Nervous System: Malformations | 45-78 | 34 |
| 4 | Cerebrospinal Fluid and Hydrocephalus | 79-105 | 27 |
| 5 | Lower Motor Neuron: Spinal Nerve, GSE | 106-165 | 60 |
| 6 | Lower Motor Neuron: GSE, Cranial Nerve | 166-202 | 37 |
| 7 | Lower Motor Neuron: GVE | 203-229 | 27 |
| 8 | Upper Motor Neuron | 230-245 | 16 |
| 9 | General Sensory Systems: GP and GSA | 246-266 | 21 |
| 10 | Small Animal Spinal Cord Disease | 267-311 | 45 |
| 11 | Large Animal Spinal Cord Disease | 312-344 | 33 |
| 12 | Vestibular System: Special Proprioception | 345-373 | 29 |
| 13 | Cerebellum | 374-413 | 40 |
| 14 | Visual System | 414-456 | 43 |
| 15 | Auditory System: Special Somatic Afferent | 457-464 | 8 |
| 16 | Visceral Afferent Systems | 465-470 | 6 |
| 17 | Nonolfactory Rhinencephalon: Limbic System | 471-477 | 7 |
| 18 | Seizure Disorders and Narcolepsy | 478-503 | 26 |
| 19 | Diencephalon | 504-514 | 11 |
| 20 | Uncontrolled Involuntary Skeletal Muscle Contractions | 515-530 | 16 |
| 21 | The Neurologic Examination | 531-546 | 16 |
| 22 | Case Descriptions | 547-570 | 24 |

**Total: ~570 pages**

---

## Implementation Order

1. **Schema:** Add linked_book_id column to yearly_goals
2. **Seed:** Create de Lahunta book + 22 chapters in study planner
3. **Migration:** Update yearly goal to link to book, delete old subItems
4. **API:** Modify GET /api/yearly-goals to compute progress from study_chapters
5. **UI Components:** Create CompactGoalCard and CompactGoalGrid components
6. **Pages:** Update IcyDash and /goals to use new grid layout

---

## Success Criteria

- [ ] de Lahunta appears in study planner as book with 22 chapters
- [ ] Completing chapter in study planner updates yearly goal progress
- [ ] Yearly goals display in 3-column grid
- [ ] Cards show: title, progress bar, category icon, XP
- [ ] de Lahunta cards show page count
- [ ] XP claiming works when 22/22 complete
