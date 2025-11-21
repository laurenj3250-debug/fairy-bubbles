// GoalConnect/shared/lib/habitFrequency.ts

/**
 * Types of frequency patterns for habits.
 * Based on uHabits frequency model using numerator/denominator.
 */
export enum FrequencyType {
  /** Daily habit (1 time per 1 day) */
  DAILY = 'daily',
  /** Weekly habit (1 time per 7 days) */
  WEEKLY = 'weekly',
  /** Custom frequency (N times per M days) */
  CUSTOM = 'custom'
}

/**
 * Represents habit frequency using uHabits numerator/denominator model.
 *
 * Examples:
 * - Daily: {numerator: 1, denominator: 1} = 1.0
 * - Weekly: {numerator: 1, denominator: 7} ≈ 0.143
 * - 3x per week: {numerator: 3, denominator: 7} ≈ 0.429
 * - Monthly: {numerator: 1, denominator: 30} ≈ 0.033
 * - Every other day: {numerator: 1, denominator: 2} = 0.5
 *
 * Based on: https://github.com/iSoron/uhabits/blob/dev/uhabits-core/src/jvmMain/java/org/isoron/uhabits/core/models/Frequency.kt
 */
export interface Frequency {
  /** Number of times to complete the habit */
  numerator: number
  /** Within this many days */
  denominator: number
  /** Type of frequency pattern */
  type: FrequencyType
}

/**
 * Validates a frequency object.
 *
 * Rules:
 * - Both numerator and denominator must be positive integers
 * - Numerator cannot exceed denominator (can't do more than once per day)
 * - Both must be <= 365 (reasonable yearly limit)
 *
 * @param freq - The frequency to validate
 * @returns true if valid, false otherwise
 */
export function isValidFrequency(freq: Frequency): boolean {
  // Check for positive integers
  if (freq.numerator <= 0 || freq.denominator <= 0) {
    return false
  }

  // Check for integers (no fractions)
  if (!Number.isInteger(freq.numerator) || !Number.isInteger(freq.denominator)) {
    return false
  }

  // Check for negative values (redundant with <= 0 check, but explicit)
  if (freq.numerator < 0 || freq.denominator < 0) {
    return false
  }

  // Cannot do more than once per day
  if (freq.numerator > freq.denominator) {
    return false
  }

  // Reasonable yearly limit
  if (freq.numerator > 365 || freq.denominator > 365) {
    return false
  }

  return true
}

/**
 * Converts a frequency to decimal representation for use in scoring algorithms.
 *
 * Formula: numerator / denominator
 *
 * This decimal is used by computeHabitScore() to calculate habit strength.
 *
 * @param freq - The frequency to convert
 * @returns Decimal representation (e.g., 1.0 for daily, ~0.143 for weekly)
 *
 * @example
 * ```typescript
 * const daily = { numerator: 1, denominator: 1, type: FrequencyType.DAILY }
 * frequencyToDecimal(daily) // 1.0
 *
 * const weekly = { numerator: 1, denominator: 7, type: FrequencyType.WEEKLY }
 * frequencyToDecimal(weekly) // ~0.1428571
 *
 * const threePerWeek = { numerator: 3, denominator: 7, type: FrequencyType.CUSTOM }
 * frequencyToDecimal(threePerWeek) // ~0.4285714
 * ```
 */
export function frequencyToDecimal(freq: Frequency): number {
  return freq.numerator / freq.denominator
}

/**
 * Parses a frequency from type and optional custom values.
 *
 * @param type - The frequency type
 * @param numerator - Required for CUSTOM type
 * @param denominator - Required for CUSTOM type
 * @returns A valid Frequency object
 * @throws {Error} If CUSTOM type missing numerator/denominator or if frequency is invalid
 *
 * @example
 * ```typescript
 * // Daily habit
 * parseFrequency(FrequencyType.DAILY) // {1, 1, DAILY}
 *
 * // Weekly habit
 * parseFrequency(FrequencyType.WEEKLY) // {1, 7, WEEKLY}
 *
 * // Custom: 3 times per week
 * parseFrequency(FrequencyType.CUSTOM, 3, 7) // {3, 7, CUSTOM}
 * ```
 */
export function parseFrequency(
  type: FrequencyType,
  numerator?: number,
  denominator?: number
): Frequency {
  let freq: Frequency

  switch (type) {
    case FrequencyType.DAILY:
      freq = { numerator: 1, denominator: 1, type }
      break

    case FrequencyType.WEEKLY:
      freq = { numerator: 1, denominator: 7, type }
      break

    case FrequencyType.CUSTOM:
      if (numerator === undefined || denominator === undefined) {
        throw new Error('Custom frequency requires both numerator and denominator')
      }
      freq = { numerator, denominator, type }
      break

    default:
      throw new Error(`Unknown frequency type: ${type}`)
  }

  // Validate the constructed frequency
  if (!isValidFrequency(freq)) {
    throw new Error(
      `Invalid frequency: numerator=${freq.numerator}, denominator=${freq.denominator}. ` +
      'Must be positive integers with numerator <= denominator <= 365.'
    )
  }

  return freq
}

/**
 * Calculates how many completions are required within a given number of days.
 *
 * Formula: Math.ceil((days * numerator) / denominator)
 *
 * Rounds up to ensure targets are met (e.g., weekly habit for 8 days requires 2, not 1.14).
 *
 * @param freq - The frequency pattern
 * @param days - Number of days to calculate for
 * @returns Required number of completions (always rounds up)
 *
 * @example
 * ```typescript
 * const threePerWeek = { numerator: 3, denominator: 7, type: FrequencyType.CUSTOM }
 * getRequiredCompletions(threePerWeek, 7)  // 3
 * getRequiredCompletions(threePerWeek, 14) // 6
 * getRequiredCompletions(threePerWeek, 10) // 5 (ceil of 4.28)
 *
 * const weekly = { numerator: 1, denominator: 7, type: FrequencyType.WEEKLY }
 * getRequiredCompletions(weekly, 8) // 2 (ceil of 1.14)
 * ```
 */
export function getRequiredCompletions(freq: Frequency, days: number): number {
  return Math.ceil((days * freq.numerator) / freq.denominator)
}

/**
 * Preset constant for daily habits (1 time per 1 day).
 */
export const DAILY_FREQUENCY: Frequency = {
  numerator: 1,
  denominator: 1,
  type: FrequencyType.DAILY
}

/**
 * Preset constant for weekly habits (1 time per 7 days).
 */
export const WEEKLY_FREQUENCY: Frequency = {
  numerator: 1,
  denominator: 7,
  type: FrequencyType.WEEKLY
}
