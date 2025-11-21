import { describe, it, expect } from 'vitest';
import {
  calculateNextOccurrence,
  generateRecurrencePreview,
  validateRecurrencePattern,
  patternToString,
  RECURRENCE_PRESETS,
  type RecurrencePattern
} from './recurrenceEngine';
import { parseISO, addDays, addWeeks, addMonths, format } from 'date-fns';

describe('recurrenceEngine', () => {
  const baseDate = parseISO('2025-01-15'); // Wednesday

  describe('calculateNextOccurrence', () => {
    it('calculates daily recurrence', () => {
      const pattern: RecurrencePattern = {
        type: 'daily',
        interval: 1,
        endCondition: 'never'
      };

      const next = calculateNextOccurrence(pattern, baseDate);
      expect(next).toEqual(addDays(baseDate, 1));
    });

    it('calculates daily recurrence with interval', () => {
      const pattern: RecurrencePattern = {
        type: 'daily',
        interval: 3,
        endCondition: 'never'
      };

      const next = calculateNextOccurrence(pattern, baseDate);
      expect(next).toEqual(addDays(baseDate, 3));
    });

    it('calculates weekly recurrence', () => {
      const pattern: RecurrencePattern = {
        type: 'weekly',
        interval: 1,
        endCondition: 'never'
      };

      const next = calculateNextOccurrence(pattern, baseDate);
      expect(next).toEqual(addWeeks(baseDate, 1));
    });

    it('calculates weekly recurrence with specific days', () => {
      const pattern: RecurrencePattern = {
        type: 'weekly',
        interval: 1,
        daysOfWeek: [1, 5], // Monday and Friday
        endCondition: 'never'
      };

      // baseDate is Wednesday (3), next should be Friday (5)
      const next = calculateNextOccurrence(pattern, baseDate);
      expect(next?.getDay()).toBe(5); // Friday
    });

    it('wraps to next week when no more days in current week', () => {
      const pattern: RecurrencePattern = {
        type: 'weekly',
        interval: 1,
        daysOfWeek: [1, 2], // Monday and Tuesday
        endCondition: 'never'
      };

      // baseDate is Wednesday, so next should be Monday of next week
      const next = calculateNextOccurrence(pattern, baseDate);
      expect(next?.getDay()).toBe(1); // Monday
      expect(next! > baseDate).toBe(true);
    });

    it('calculates monthly recurrence', () => {
      const pattern: RecurrencePattern = {
        type: 'monthly',
        interval: 1,
        endCondition: 'never'
      };

      const next = calculateNextOccurrence(pattern, baseDate);
      expect(next).toEqual(addMonths(baseDate, 1));
    });

    it('calculates monthly recurrence with specific day', () => {
      const pattern: RecurrencePattern = {
        type: 'monthly',
        interval: 1,
        dayOfMonth: 20,
        endCondition: 'never'
      };

      const next = calculateNextOccurrence(pattern, baseDate);
      expect(next?.getDate()).toBe(20);
    });

    it('handles end of month edge case', () => {
      const pattern: RecurrencePattern = {
        type: 'monthly',
        interval: 1,
        dayOfMonth: 31,
        endCondition: 'never'
      };

      const januaryDate = parseISO('2025-01-31');
      const next = calculateNextOccurrence(pattern, januaryDate);

      // February doesn't have 31 days, should use last day (28 or 29)
      expect(next?.getMonth()).toBe(1); // February
      expect(next?.getDate()).toBeLessThanOrEqual(29);
    });

    it('calculates yearly recurrence', () => {
      const pattern: RecurrencePattern = {
        type: 'yearly',
        interval: 1,
        endCondition: 'never'
      };

      const next = calculateNextOccurrence(pattern, baseDate);
      expect(next?.getFullYear()).toBe(baseDate.getFullYear() + 1);
    });

    it('respects end date condition', () => {
      const pattern: RecurrencePattern = {
        type: 'daily',
        interval: 1,
        endCondition: 'on_date',
        endDate: '2025-01-17'
      };

      const firstNext = calculateNextOccurrence(pattern, baseDate);
      expect(firstNext).toBeTruthy(); // Jan 16 is before end date

      const secondNext = calculateNextOccurrence(pattern, firstNext!);
      expect(secondNext).toBeTruthy(); // Jan 17 is on end date

      const thirdNext = calculateNextOccurrence(pattern, secondNext!);
      expect(thirdNext).toBeNull(); // Would be Jan 18, after end date
    });

    it('handles invalid date', () => {
      const pattern: RecurrencePattern = {
        type: 'daily',
        interval: 1,
        endCondition: 'never'
      };

      const next = calculateNextOccurrence(pattern, 'invalid-date');
      expect(next).toBeNull();
    });
  });

  describe('generateRecurrencePreview', () => {
    it('generates preview for daily pattern', () => {
      const pattern: RecurrencePattern = {
        type: 'daily',
        interval: 1,
        endCondition: 'never'
      };

      const preview = generateRecurrencePreview(pattern, baseDate, 5);
      expect(preview).toHaveLength(5);
      expect(preview[0].formatted).toBe('Jan 16, 2025');
      expect(preview[4].formatted).toBe('Jan 20, 2025');
    });

    it('generates preview for weekly pattern', () => {
      const pattern: RecurrencePattern = {
        type: 'weekly',
        interval: 1,
        daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
        endCondition: 'never'
      };

      const preview = generateRecurrencePreview(pattern, baseDate, 3);
      expect(preview).toHaveLength(3);
      expect(preview[0].date.getDay()).toBe(5); // Friday (next day)
      expect(preview[1].date.getDay()).toBe(1); // Monday (next week)
      expect(preview[2].date.getDay()).toBe(3); // Wednesday (next week)
    });

    it('stops preview at end date', () => {
      const pattern: RecurrencePattern = {
        type: 'daily',
        interval: 1,
        endCondition: 'on_date',
        endDate: '2025-01-18'
      };

      const preview = generateRecurrencePreview(pattern, baseDate, 10);
      expect(preview.length).toBeLessThanOrEqual(3); // Only until Jan 18
    });
  });

  describe('validateRecurrencePattern', () => {
    it('validates valid daily pattern', () => {
      const pattern: RecurrencePattern = {
        type: 'daily',
        interval: 1,
        endCondition: 'never'
      };

      const result = validateRecurrencePattern(pattern);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects invalid interval', () => {
      const pattern: RecurrencePattern = {
        type: 'daily',
        interval: 0,
        endCondition: 'never'
      };

      const result = validateRecurrencePattern(pattern);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Interval must be at least 1');
    });

    it('validates weekly days of week', () => {
      const pattern: RecurrencePattern = {
        type: 'weekly',
        interval: 1,
        daysOfWeek: [0, 7], // 7 is invalid
        endCondition: 'never'
      };

      const result = validateRecurrencePattern(pattern);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Days of week must be between');
    });

    it('validates monthly day of month', () => {
      const pattern: RecurrencePattern = {
        type: 'monthly',
        interval: 1,
        dayOfMonth: 32,
        endCondition: 'never'
      };

      const result = validateRecurrencePattern(pattern);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Day of month must be between');
    });

    it('requires end date when condition is on_date', () => {
      const pattern: RecurrencePattern = {
        type: 'daily',
        interval: 1,
        endCondition: 'on_date'
      };

      const result = validateRecurrencePattern(pattern);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('End date is required');
    });

    it('requires end count when condition is after_count', () => {
      const pattern: RecurrencePattern = {
        type: 'daily',
        interval: 1,
        endCondition: 'after_count'
      };

      const result = validateRecurrencePattern(pattern);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('End after count must be at least 1');
    });
  });

  describe('patternToString', () => {
    it('converts daily pattern to string', () => {
      const pattern: RecurrencePattern = {
        type: 'daily',
        interval: 1,
        endCondition: 'never'
      };

      expect(patternToString(pattern)).toBe('Daily');
    });

    it('converts daily pattern with interval to string', () => {
      const pattern: RecurrencePattern = {
        type: 'daily',
        interval: 3,
        endCondition: 'never'
      };

      expect(patternToString(pattern)).toBe('every 3 days');
    });

    it('converts weekly pattern with days to string', () => {
      const pattern: RecurrencePattern = {
        type: 'weekly',
        interval: 1,
        daysOfWeek: [1, 3, 5],
        endCondition: 'never'
      };

      expect(patternToString(pattern)).toBe('week on Mon, Wed, Fri');
    });

    it('converts monthly pattern with specific day', () => {
      const pattern: RecurrencePattern = {
        type: 'monthly',
        interval: 1,
        dayOfMonth: 15,
        endCondition: 'never'
      };

      expect(patternToString(pattern)).toBe('Monthly on day 15');
    });

    it('includes end date in string', () => {
      const pattern: RecurrencePattern = {
        type: 'daily',
        interval: 1,
        endCondition: 'on_date',
        endDate: '2025-12-31'
      };

      expect(patternToString(pattern)).toContain('until Dec 31, 2025');
    });

    it('includes end count in string', () => {
      const pattern: RecurrencePattern = {
        type: 'daily',
        interval: 1,
        endCondition: 'after_count',
        endAfterCount: 10
      };

      expect(patternToString(pattern)).toContain('for 10 occurrences');
    });
  });

  describe('RECURRENCE_PRESETS', () => {
    it('creates daily preset', () => {
      const pattern = RECURRENCE_PRESETS.daily();
      expect(pattern.type).toBe('daily');
      expect(pattern.interval).toBe(1);
      expect(pattern.endCondition).toBe('never');
    });

    it('creates weekdays preset', () => {
      const pattern = RECURRENCE_PRESETS.weekdays();
      expect(pattern.type).toBe('weekly');
      expect(pattern.daysOfWeek).toEqual([1, 2, 3, 4, 5]);
    });

    it('creates weekends preset', () => {
      const pattern = RECURRENCE_PRESETS.weekends();
      expect(pattern.type).toBe('weekly');
      expect(pattern.daysOfWeek).toEqual([0, 6]);
    });
  });
});
