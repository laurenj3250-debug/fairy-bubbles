# Frequency Fields API Documentation

## Overview

GoalConnect now supports flexible habit frequencies using a numerator/denominator model inspired by uHabits. This allows users to set any frequency pattern, from daily habits to complex custom schedules like "3 times every 5 days."

## New Frequency Fields

### Database Schema

Three new fields have been added to the `habits` table:

```typescript
{
  frequencyNumerator: number      // Number of times to complete
  frequencyDenominator: number    // Within this many days
  frequencyType: 'daily' | 'weekly' | 'custom'
}
```

### Frequency Types

#### 1. Daily (`FrequencyType.DAILY`)
- **Pattern**: Every day
- **Values**: `numerator: 1, denominator: 1`
- **Decimal**: `1.0`
- **Example**: Daily meditation habit

#### 2. Weekly (`FrequencyType.WEEKLY`)
- **Pattern**: N times per week
- **Values**: `numerator: N, denominator: 7`
- **Decimal**: `N / 7`
- **Examples**:
  - Once per week: `numerator: 1, denominator: 7` → `~0.143`
  - Three times per week: `numerator: 3, denominator: 7` → `~0.429`

#### 3. Custom (`FrequencyType.CUSTOM`)
- **Pattern**: N times every M days
- **Values**: `numerator: N, denominator: M`
- **Decimal**: `N / M`
- **Examples**:
  - Every other day: `numerator: 1, denominator: 2` → `0.5`
  - 2 times every 5 days: `numerator: 2, denominator: 5` → `0.4`

### Validation Rules

All frequency values must satisfy:
- Both `numerator` and `denominator` must be positive integers
- `numerator` cannot exceed `denominator` (can't do more than once per day)
- Both must be ≤ 365 (reasonable yearly limit)

## API Endpoints

### POST /api/habits

Create a new habit with frequency fields.

**Request Body:**
```json
{
  "userId": 1,
  "title": "Morning Run",
  "icon": "🏃",
  "frequencyNumerator": 3,
  "frequencyDenominator": 7,
  "frequencyType": "weekly",
  "difficulty": "medium",
  "category": "training"
}
```

**Response:**
```json
{
  "id": 123,
  "userId": 1,
  "title": "Morning Run",
  "frequencyNumerator": 3,
  "frequencyDenominator": 7,
  "frequencyType": "weekly",
  "currentScore": "0",
  ...
}
```

### PATCH /api/habits/:id

Update an existing habit's frequency.

**Request Body:**
```json
{
  "frequencyNumerator": 5,
  "frequencyDenominator": 7,
  "frequencyType": "weekly"
}
```

**Response:**
```json
{
  "id": 123,
  "frequencyNumerator": 5,
  "frequencyDenominator": 7,
  "frequencyType": "weekly",
  ...
}
```

### GET /api/habits

Retrieve all habits with frequency data.

**Response:**
```json
[
  {
    "id": 123,
    "title": "Morning Run",
    "frequencyNumerator": 3,
    "frequencyDenominator": 7,
    "frequencyType": "weekly",
    "currentScore": "0.75",
    ...
  }
]
```

## Backward Compatibility

### Legacy Fields

The old `cadence` and `targetPerWeek` fields are still supported for backward compatibility:

```typescript
{
  cadence: 'daily' | 'weekly' | null
  targetPerWeek: number | null
}
```

### Migration Strategy

When creating/updating habits:

1. **New clients** should send frequency fields:
   ```json
   {
     "frequencyNumerator": 3,
     "frequencyDenominator": 7,
     "frequencyType": "weekly"
   }
   ```

2. **Legacy clients** can still send old fields:
   ```json
   {
     "cadence": "weekly",
     "targetPerWeek": 3
   }
   ```

3. **Server auto-converts** old fields to new format if needed

### Reading Habits

When reading habits, the API returns both old and new fields:

```json
{
  "id": 123,
  "cadence": "weekly",           // Legacy field
  "targetPerWeek": 3,             // Legacy field
  "frequencyNumerator": 3,        // New field
  "frequencyDenominator": 7,      // New field
  "frequencyType": "weekly"       // New field
}
```

**Priority**: New fields take precedence when both are present.

## Frequency Configuration Examples

### Common Patterns

```typescript
// Daily habit
{
  frequencyNumerator: 1,
  frequencyDenominator: 1,
  frequencyType: 'daily'
}

// 3x per week
{
  frequencyNumerator: 3,
  frequencyDenominator: 7,
  frequencyType: 'weekly'
}

// Every other day
{
  frequencyNumerator: 1,
  frequencyDenominator: 2,
  frequencyType: 'custom'
}

// 5 days per week (weekdays)
{
  frequencyNumerator: 5,
  frequencyDenominator: 7,
  frequencyType: 'weekly'
}

// Every 3 days
{
  frequencyNumerator: 1,
  frequencyDenominator: 3,
  frequencyType: 'custom'
}

// 10 times per month (~10/30)
{
  frequencyNumerator: 10,
  frequencyDenominator: 30,
  frequencyType: 'custom'
}
```

## Score Calculation

Habit scores are calculated using the frequency decimal:

```typescript
import { computeHabitScore } from '@shared/lib/habitScore'
import { frequencyToDecimal } from '@shared/lib/habitFrequency'

const frequency = {
  numerator: 3,
  denominator: 7,
  type: 'weekly'
}

const decimal = frequencyToDecimal(frequency) // 0.4285714...
const score = computeHabitScore(logs, frequency)
```

The score algorithm uses the frequency decimal to:
1. Calculate expected completions over time
2. Weight recent completions more heavily
3. Apply decay for missed days
4. Return a percentage (0-100+)

## Frontend Integration

### FrequencySelector Component

```tsx
import { FrequencySelector } from '@/components/FrequencySelector'
import { FrequencyType } from '@shared/lib/habitFrequency'

function HabitForm() {
  const [frequency, setFrequency] = useState({
    numerator: 1,
    denominator: 1,
    type: FrequencyType.DAILY
  })

  return (
    <FrequencySelector
      value={frequency}
      onChange={setFrequency}
    />
  )
}
```

The component provides:
- Preset buttons (Daily, Weekly, Custom)
- Weekly quick presets (1x-7x per week)
- Custom numerator/denominator inputs
- Input validation
- Visual frequency summary

## Utilities

### Available Functions

```typescript
import {
  FrequencyType,
  frequencyToDecimal,
  isValidFrequency,
  parseFrequency,
  getRequiredCompletions
} from '@shared/lib/habitFrequency'

// Convert to decimal
const decimal = frequencyToDecimal({ numerator: 3, denominator: 7, type: 'weekly' })
// Result: 0.4285714...

// Validate frequency
const isValid = isValidFrequency({ numerator: 3, denominator: 7, type: 'weekly' })
// Result: true

// Parse from type
const freq = parseFrequency(FrequencyType.WEEKLY, 3, 7)
// Result: { numerator: 3, denominator: 7, type: 'weekly' }

// Calculate required completions
const required = getRequiredCompletions({ numerator: 3, denominator: 7, type: 'weekly' }, 14)
// Result: 6 (3 per week × 2 weeks)
```

## Error Handling

### Validation Errors

```typescript
// Invalid: numerator > denominator
{
  frequencyNumerator: 10,
  frequencyDenominator: 5,
  frequencyType: 'custom'
}
// Error: "numerator cannot exceed denominator"

// Invalid: negative values
{
  frequencyNumerator: -1,
  frequencyDenominator: 7,
  frequencyType: 'weekly'
}
// Error: "numerator and denominator must be positive"

// Invalid: too large
{
  frequencyNumerator: 500,
  frequencyDenominator: 1000,
  frequencyType: 'custom'
}
// Error: "values must be <= 365"
```

## Migration Guide

### For Existing Habits

To migrate existing habits to the new frequency model:

1. **Read habit**: Get current `cadence` and `targetPerWeek`
2. **Convert to frequency**:
   ```typescript
   if (cadence === 'daily') {
     frequency = { numerator: 1, denominator: 1, type: 'daily' }
   } else if (cadence === 'weekly') {
     frequency = { numerator: targetPerWeek || 1, denominator: 7, type: 'weekly' }
   }
   ```
3. **Update habit**: Send new frequency fields

### For New Features

When adding new frequency-based features:

1. Always use `frequencyNumerator`, `frequencyDenominator`, `frequencyType`
2. Fall back to old fields only for legacy support
3. Use `frequencyToDecimal()` for calculations
4. Validate with `isValidFrequency()` before saving

## Testing

### Unit Tests

```bash
npm test -- FrequencySelector.test.tsx
```

### Integration Tests

```bash
npx tsx scripts/test-frequency-selector.ts
```

The test script verifies:
- Habit creation with all frequency types
- Frequency field storage and retrieval
- Score calculation with different frequencies
- Backward compatibility with legacy fields

## Best Practices

1. **Always validate** frequency values before saving
2. **Use decimal representation** for calculations, not raw numerator/denominator
3. **Provide presets** for common patterns (daily, weekly) to reduce user errors
4. **Show human-readable text** (e.g., "3 times per week") in UI
5. **Support both old and new fields** for backward compatibility
6. **Test edge cases** like "every day" (1/1) and extreme custom frequencies

## Resources

- [uHabits Frequency Model](https://github.com/iSoron/uhabits/blob/dev/uhabits-core/src/jvmMain/java/org/isoron/uhabits/core/models/Frequency.kt)
- [Habit Score Algorithm](../scoring/habit-score-algorithm.md)
- [FrequencySelector Component](../../client/src/components/FrequencySelector.tsx)
