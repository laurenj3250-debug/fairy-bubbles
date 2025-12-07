# IcyDash Dream Scroll Widget Integration

**Design Date:** December 7, 2025
**Status:** Approved for Implementation

## Summary

Add the existing Dream Scroll (Notes & Ideas) widget to the IcyDash dashboard with a new "pull to calendar" feature, and redesign the dashboard layout for better visual hierarchy with varied row sizes.

## Features

### 1. Dream Scroll Widget on IcyDash
- Use existing `DreamScrollWidget` component
- Category picker (6 categories: Peaks to Climb, Gear Wishlist, etc.)
- Add new items inline
- Mark items complete
- Link to full Dream Scroll page

### 2. New "Pull to Calendar" Feature
- Each Dream Scroll item gets a calendar icon button
- Clicking opens a quick date picker
- Creates a Todo with the item's title and selected due date
- Toast confirmation: "Added to schedule for [date]"
- Item remains in Dream Scroll (ideas persist, tasks are created from them)

### 3. Dashboard Layout Redesign

```
┌─────────────────────────────────┬─────────────────────────────────┐
│          WEEKLY GOALS           │         STUDY TRACKER           │
│            (medium)             │            (medium)             │
└─────────────────────────────────┴─────────────────────────────────┘

┌─────────────────────────────────┬─────────────────────────────────┐
│                                 │         DREAM SCROLL            │
│       THIS WEEK HABITS          │            (tall)               │
│            (tall)               │                                 │
│                                 │       Category picker           │
│        7-day habit grid         │       + idea list               │
│                                 │       + pull to calendar        │
└─────────────────────────────────┴─────────────────────────────────┘

┌────────────────────┬────────────────────┬──────────────────────────┐
│  MONTHLY PROGRESS  │   WEEKLY RHYTHM    │      CLIMBING TIP        │
│      (small)       │      (small)       │        (small)           │
└────────────────────┴────────────────────┴──────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                          SCHEDULE                                  │
│                       (full width)                                 │
└────────────────────────────────────────────────────────────────────┘
```

**Layout rationale:**
- Row 1: 2 equal columns (medium height) - primary action items
- Row 2: 2 equal columns (tall) - habits + ideas side by side, main content
- Row 3: 3 small columns - supporting/reference info
- Row 4: Full-width schedule - needs space for 7 days

## Technical Implementation

### Files to Modify

1. **`client/src/pages/IcyDash.tsx`**
   - Import DreamScrollWidget
   - Restructure grid layout from 3-col to mixed 2/3-col rows
   - Adjust card min-heights for row variation

2. **`client/src/components/DreamScrollWidget.tsx`**
   - Add calendar icon button per item
   - Add date picker popover (use existing Popover + Calendar components)
   - Add mutation to create todo from dream scroll item

3. **`server/routes.ts`** (if needed)
   - Endpoint already exists: POST `/api/todos`
   - No new API needed

### UI Components Needed
- Calendar icon from lucide-react (already available)
- Popover from radix (already in project)
- Calendar component (already exists at `components/ui/calendar.tsx`)

### Grid CSS Changes
```css
/* Row 1: 2 columns, medium height */
grid-template-columns: 1fr 1fr;
min-height: 200px;

/* Row 2: 2 columns, tall */
grid-template-columns: 1fr 1fr;
min-height: 320px;

/* Row 3: 3 columns, small */
grid-template-columns: 1fr 1fr 1fr;
min-height: 160px;

/* Row 4: full width */
grid-template-columns: 1fr;
```

## Data Flow

### Pull to Calendar
1. User clicks calendar icon on Dream Scroll item
2. Date picker popover opens
3. User selects date
4. Frontend calls `POST /api/todos` with:
   ```json
   {
     "title": "[Dream Scroll item title]",
     "dueDate": "2025-12-10",
     "priority": 4
   }
   ```
5. Toast shows success
6. Schedule widget auto-refreshes (TanStack Query invalidation)

## Success Criteria
- Dream Scroll widget visible on IcyDash
- Can switch categories within widget
- Can add new ideas from dashboard
- Can pull any idea to calendar with date selection
- Layout has clear visual hierarchy with varied row heights
- All existing functionality preserved
