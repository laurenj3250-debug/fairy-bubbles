# Manual Test: Habit Score Display in UI

This document describes how to manually verify that habit scores are correctly displayed in the UI.

## Prerequisites

- Development server running (`npm run dev`)
- At least one habit with a score > 0
- Browser with dev tools open

## Test Steps

### 1. Create Test Data (via API or UI)

If you need to create test data, you can use the existing habit creation UI or run this script:

```bash
# Start the dev server first
npm run dev

# In another terminal, run the test script (once server is running)
npx tsx scripts/test-score-display.ts
```

The script will:
- Create a test habit
- Log 12/14 completions over 2 weeks
- Verify the score is calculated
- Clean up after itself

### 2. Navigate to Today's Pitch

1. Open the app in your browser (usually http://localhost:5000)
2. Log in if needed
3. Navigate to the main dashboard/today's pitch view

### 3. Verify Score Display

For each habit with a score:

**Visual Verification:**
- [ ] Score badge appears next to habit title
- [ ] Badge shows percentage (e.g., "75%")
- [ ] Badge shows category label (Strong/Building/Growing/Weak)
- [ ] Badge has appropriate color:
  - Green for Strong (≥75%)
  - Blue for Building (50-74%)
  - Yellow for Growing (25-49%)
  - Gray for Weak (<25%)

**Interaction:**
- [ ] Hover over badge shows tooltip with full score info
- [ ] Badge doesn't interfere with habit completion toggle
- [ ] Badge is readable and not too small
- [ ] Badge layout looks good on mobile (if applicable)

### 4. Test Edge Cases

**New Habits:**
- [ ] Habits with no completions don't show a score badge
- [ ] Habits with score = 0 don't show a badge

**Score Ranges:**
- Create or find habits with different score ranges:
  - [ ] 0-24%: Shows gray "Weak" badge
  - [ ] 25-49%: Shows yellow "Growing" badge
  - [ ] 50-74%: Shows blue "Building" badge
  - [ ] 75-100%: Shows green "Strong" badge

**Boundary Cases:**
- [ ] Score of exactly 25% shows "Growing" (yellow)
- [ ] Score of exactly 50% shows "Building" (blue)
- [ ] Score of exactly 75% shows "Strong" (green)

### 5. Browser Console Checks

Open browser dev tools and check:

```javascript
// Verify habit data includes score fields
// Open React DevTools or console and run:
console.log('Habits with scores:', window.localStorage.getItem('habits'));
```

**No Errors:**
- [ ] No console errors related to HabitScoreIndicator
- [ ] No TypeScript errors in the browser console
- [ ] No warnings about invalid props

### 6. API Response Verification

Using browser network tab:

1. Filter network requests to "habits"
2. Check the response body includes:
   ```json
   {
     "id": 1,
     "title": "Exercise",
     "currentScore": "0.75",
     "scoreHistory": [
       {"date": "2025-11-20", "score": 0.75, "completed": true},
       ...
     ]
   }
   ```
3. [ ] `currentScore` field is present
4. [ ] `scoreHistory` array is populated
5. [ ] Score values are in 0-1 range

### 7. Responsive Design

Test on different screen sizes:

**Desktop (>1024px):**
- [ ] Badge appears inline next to title
- [ ] Text is readable
- [ ] Layout doesn't wrap awkwardly

**Tablet (768-1024px):**
- [ ] Badge scales appropriately
- [ ] Still readable
- [ ] Doesn't cause overflow

**Mobile (<768px):**
- [ ] Badge uses smaller size variant
- [ ] Layout remains functional
- [ ] Touch targets are adequate

## Expected Results

### Visual Appearance

The score indicator should look like this:

```
[Habit Icon] Habit Title  [80% Strong]  [Grade Badge] [Checkbox]
                          └─ Score badge (green, rounded)
```

### Color Coding

| Score Range | Color  | Label    | Background             |
|-------------|--------|----------|------------------------|
| 75-100%     | Green  | Strong   | `bg-green-500/20`      |
| 50-74%      | Blue   | Building | `bg-blue-500/20`       |
| 25-49%      | Yellow | Growing  | `bg-yellow-500/20`     |
| 0-24%       | Gray   | Weak     | `bg-gray-500/20`       |

### Size Variants

The component supports three sizes:
- `sm`: Used in habit lists (default in TodaysPitch)
- `md`: Medium size
- `lg`: Large size for emphasis

## Troubleshooting

### Badge Not Showing

If the badge doesn't appear:

1. Check habit has `currentScore` field set
2. Verify score is > 0
3. Check browser console for errors
4. Verify HabitScoreIndicator component is imported

### Wrong Colors

If colors don't match expectations:

1. Check score value is in 0-1 range (not 0-100)
2. Verify Tailwind classes are being applied
3. Check for CSS conflicts

### Layout Issues

If badge breaks layout:

1. Check parent container has flex layout
2. Verify gap spacing is adequate
3. Test on different screen sizes

## Success Criteria

- ✅ All habits with scores show badge
- ✅ Badges have correct colors and labels
- ✅ No console errors
- ✅ Responsive on all screen sizes
- ✅ Doesn't interfere with habit interaction
- ✅ API returns score data correctly
- ✅ Tests pass (18/18 component tests)

## Related Files

- Component: `client/src/components/HabitScoreIndicator.tsx`
- Tests: `client/src/components/HabitScoreIndicator.test.tsx`
- Integration: `client/src/components/TodaysPitch.tsx`
- E2E Test: `scripts/test-score-display.ts`
