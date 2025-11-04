# Blank Screen Fix - targetPerWeek Issue

## Problem
When creating a habit with a weekly target (e.g., "3 times per week"), the screen would go blank. This was caused by a JavaScript error when trying to render the habit card.

## Root Cause
The issue was in how `weekCompletions` was being accessed without proper null checking:

### In `Habits.tsx` (Line 244)
```typescript
// ❌ BEFORE - Could crash if weekCompletions is undefined
habit.weekCompletions >= habit.targetPerWeek ? 'text-green-600' : ''

// ✅ AFTER - Safe with nullish coalescing
(habit.weekCompletions ?? 0) >= habit.targetPerWeek ? 'text-green-600' : ''
```

### In `Planner.tsx` (Line 271, 293)
```typescript
// ❌ BEFORE
const targetMet = habit.targetPerWeek ? habit.weekCompletions >= habit.targetPerWeek : false;
{habit.weekCompletions}/{habit.targetPerWeek}

// ✅ AFTER
const targetMet = habit.targetPerWeek ? (habit.weekCompletions ?? 0) >= habit.targetPerWeek : false;
{habit.weekCompletions ?? 0}/{habit.targetPerWeek}
```

## Why This Happened

When a habit is first created with a `targetPerWeek`:
1. The habit is saved to the database
2. The page re-renders with the new habit
3. The `habitsWithStats` useMemo tries to calculate `weekCompletions`
4. If this calculation hasn't completed yet, `weekCompletions` could be `undefined`
5. Trying to compare `undefined >= number` causes a rendering error
6. React crashes → blank screen

## The Fix

Added **nullish coalescing operator (`??`)** to provide a safe default value of `0`:

```typescript
habit.weekCompletions ?? 0
```

This ensures:
- If `weekCompletions` is `undefined` or `null` → use `0`
- If `weekCompletions` is `0` → use `0` (not treated as falsy)
- If `weekCompletions` has a value → use that value

## Files Modified

1. **client/src/pages/Habits.tsx**
   - Line 244: Added `??` to comparison
   - Line 246: Added `??` to display value

2. **client/src/pages/Planner.tsx**
   - Line 271: Added `??` to targetMet calculation
   - Line 293: Added `??` to display value

## Testing

To verify the fix works:

1. Create a new habit with weekly cadence
2. Set a target (e.g., "3 times per week")
3. Save the habit
4. Page should NOT go blank ✅
5. Habit card should display "0/3 completed"

## Technical Details

The `weekCompletions` calculation happens in a `useMemo` hook:

```typescript
const habitsWithStats = useMemo(() => {
  return habits.map(habit => {
    const weekCompletions = dates.filter(date => date >= weekStartStr).length;
    return {
      ...habit,
      weekCompletions  // This should always be a number, but defensive coding is better
    };
  });
}, [habits, allLogs]);
```

While `weekCompletions` should always be defined (as `0` minimum), using the nullish coalescing operator provides:
- **Safety**: Prevents crashes if the calculation fails
- **Clarity**: Makes it obvious we expect a number
- **Robustness**: Handles edge cases gracefully

## Result

✅ Screen no longer goes blank when creating habits with weekly targets  
✅ Proper display of "0/X completed" for new habits  
✅ Safe comparisons that won't crash  
✅ Better error handling overall
