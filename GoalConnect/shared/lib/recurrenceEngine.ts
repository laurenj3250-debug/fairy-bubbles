/**
 * Recurrence Engine
 * Shared between client and server for calculating recurring task dates
 */

import { addDays, addWeeks, addMonths, addYears, setDay, getDay, getDaysInMonth, isValid, parseISO, format } from 'date-fns';

export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
export type EndConditionType = 'never' | 'on_date' | 'after_count';

export interface RecurrencePattern {
  type: RecurrenceType;
  interval: number; // e.g., every 2 weeks
  daysOfWeek?: number[]; // [0-6] for weekly (0 = Sunday, 6 = Saturday)
  dayOfMonth?: number; // 1-31 for monthly
  endCondition: EndConditionType;
  endDate?: string; // ISO date string
  endAfterCount?: number; // Number of occurrences
}

export interface RecurrencePreview {
  date: Date;
  formatted: string;
}

/**
 * Calculate the next occurrence date based on the recurrence pattern
 */
export function calculateNextOccurrence(
  pattern: RecurrencePattern,
  currentDate: Date | string
): Date | null {
  const baseDate = typeof currentDate === 'string' ? parseISO(currentDate) : currentDate;

  if (!isValid(baseDate)) {
    return null;
  }

  let nextDate: Date;

  switch (pattern.type) {
    case 'daily':
      nextDate = addDays(baseDate, pattern.interval);
      break;

    case 'weekly':
      nextDate = calculateNextWeekly(baseDate, pattern);
      break;

    case 'monthly':
      nextDate = calculateNextMonthly(baseDate, pattern);
      break;

    case 'yearly':
      nextDate = addYears(baseDate, pattern.interval);
      break;

    case 'custom':
      // For custom patterns, default to daily interval
      nextDate = addDays(baseDate, pattern.interval);
      break;

    default:
      return null;
  }

  // Check if we've hit the end condition
  if (shouldStopRecurrence(pattern, nextDate)) {
    return null;
  }

  return nextDate;
}

/**
 * Calculate next weekly occurrence
 */
function calculateNextWeekly(currentDate: Date, pattern: RecurrencePattern): Date {
  if (!pattern.daysOfWeek || pattern.daysOfWeek.length === 0) {
    // Default to same day of week
    return addWeeks(currentDate, pattern.interval);
  }

  // Sort days of week
  const sortedDays = [...pattern.daysOfWeek].sort((a, b) => a - b);
  const currentDayOfWeek = getDay(currentDate);

  // Find next day in the current week
  const nextDayInWeek = sortedDays.find(day => day > currentDayOfWeek);

  if (nextDayInWeek !== undefined) {
    // Next occurrence is later in this week
    return setDay(currentDate, nextDayInWeek);
  } else {
    // Move to next interval and use first day
    const nextWeek = addWeeks(currentDate, pattern.interval);
    return setDay(nextWeek, sortedDays[0]);
  }
}

/**
 * Calculate next monthly occurrence
 */
function calculateNextMonthly(currentDate: Date, pattern: RecurrencePattern): Date {
  const dayOfMonth = pattern.dayOfMonth || currentDate.getDate();
  let nextDate = addMonths(currentDate, pattern.interval);

  // Handle edge case: if target day doesn't exist in next month (e.g., Feb 30)
  const daysInNextMonth = getDaysInMonth(nextDate);
  if (dayOfMonth > daysInNextMonth) {
    // Use last day of month
    nextDate.setDate(daysInNextMonth);
  } else {
    nextDate.setDate(dayOfMonth);
  }

  return nextDate;
}

/**
 * Check if recurrence should stop based on end conditions
 */
function shouldStopRecurrence(pattern: RecurrencePattern, nextDate: Date): boolean {
  switch (pattern.endCondition) {
    case 'never':
      return false;

    case 'on_date':
      if (!pattern.endDate) return false;
      const endDate = parseISO(pattern.endDate);
      return nextDate > endDate;

    case 'after_count':
      // This check requires knowing current count, handled by caller
      return false;

    default:
      return false;
  }
}

/**
 * Generate preview of next N occurrences
 */
export function generateRecurrencePreview(
  pattern: RecurrencePattern,
  startDate: Date | string,
  count: number = 5
): RecurrencePreview[] {
  const previews: RecurrencePreview[] = [];
  let currentDate = typeof startDate === 'string' ? parseISO(startDate) : startDate;

  for (let i = 0; i < count; i++) {
    const nextDate = calculateNextOccurrence(pattern, currentDate);

    if (!nextDate) break;

    previews.push({
      date: nextDate,
      formatted: format(nextDate, 'MMM d, yyyy')
    });

    currentDate = nextDate;
  }

  return previews;
}

/**
 * Validate recurrence pattern
 */
export function validateRecurrencePattern(pattern: RecurrencePattern): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate interval
  if (!pattern.interval || pattern.interval < 1) {
    errors.push('Interval must be at least 1');
  }

  // Validate weekly pattern
  if (pattern.type === 'weekly') {
    if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
      const invalidDays = pattern.daysOfWeek.filter(day => day < 0 || day > 6);
      if (invalidDays.length > 0) {
        errors.push('Days of week must be between 0 (Sunday) and 6 (Saturday)');
      }
    }
  }

  // Validate monthly pattern
  if (pattern.type === 'monthly') {
    if (pattern.dayOfMonth && (pattern.dayOfMonth < 1 || pattern.dayOfMonth > 31)) {
      errors.push('Day of month must be between 1 and 31');
    }
  }

  // Validate end conditions
  if (pattern.endCondition === 'on_date') {
    if (!pattern.endDate) {
      errors.push('End date is required when end condition is "on_date"');
    } else {
      const endDate = parseISO(pattern.endDate);
      if (!isValid(endDate)) {
        errors.push('Invalid end date');
      }
    }
  }

  if (pattern.endCondition === 'after_count') {
    if (!pattern.endAfterCount || pattern.endAfterCount < 1) {
      errors.push('End after count must be at least 1');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Convert pattern to human-readable string
 */
export function patternToString(pattern: RecurrencePattern): string {
  const intervalText = pattern.interval === 1 ? '' : `every ${pattern.interval} `;

  let baseText = '';
  switch (pattern.type) {
    case 'daily':
      baseText = `${intervalText}${pattern.interval === 1 ? 'Daily' : 'days'}`;
      break;
    case 'weekly':
      if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const days = pattern.daysOfWeek.map(d => dayNames[d]).join(', ');
        baseText = `${intervalText}week on ${days}`;
      } else {
        baseText = `${intervalText}${pattern.interval === 1 ? 'Weekly' : 'weeks'}`;
      }
      break;
    case 'monthly':
      const dayText = pattern.dayOfMonth ? `on day ${pattern.dayOfMonth}` : '';
      baseText = `${intervalText}${pattern.interval === 1 ? 'Monthly' : 'months'} ${dayText}`;
      break;
    case 'yearly':
      baseText = `${intervalText}${pattern.interval === 1 ? 'Yearly' : 'years'}`;
      break;
    default:
      baseText = 'Custom pattern';
  }

  // Add end condition
  let endText = '';
  switch (pattern.endCondition) {
    case 'on_date':
      if (pattern.endDate) {
        const endDate = parseISO(pattern.endDate);
        endText = ` until ${format(endDate, 'MMM d, yyyy')}`;
      }
      break;
    case 'after_count':
      if (pattern.endAfterCount) {
        endText = ` for ${pattern.endAfterCount} occurrences`;
      }
      break;
  }

  return baseText + endText;
}

/**
 * Create preset patterns
 */
export const RECURRENCE_PRESETS = {
  daily: (): RecurrencePattern => ({
    type: 'daily',
    interval: 1,
    endCondition: 'never'
  }),

  weekly: (): RecurrencePattern => ({
    type: 'weekly',
    interval: 1,
    endCondition: 'never'
  }),

  monthly: (): RecurrencePattern => ({
    type: 'monthly',
    interval: 1,
    endCondition: 'never'
  }),

  yearly: (): RecurrencePattern => ({
    type: 'yearly',
    interval: 1,
    endCondition: 'never'
  }),

  weekdays: (): RecurrencePattern => ({
    type: 'weekly',
    interval: 1,
    daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
    endCondition: 'never'
  }),

  weekends: (): RecurrencePattern => ({
    type: 'weekly',
    interval: 1,
    daysOfWeek: [0, 6], // Sun, Sat
    endCondition: 'never'
  })
};
