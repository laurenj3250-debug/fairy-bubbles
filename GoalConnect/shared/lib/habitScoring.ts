// GoalConnect/shared/lib/habitScoring.ts

/**
 * Computes habit strength score using exponential decay formula from uHabits.
 *
 * The formula gradually reduces score on misses but preserves momentum from long streaks.
 * This encourages consistency over perfection.
 *
 * Based on: https://github.com/iSoron/uhabits/blob/dev/uhabits-core/src/jvmMain/java/org/isoron/uhabits/core/models/Score.kt
 *
 * @param frequency - Habit frequency as decimal (1.0 = daily, 0.143 ≈ weekly, 0.429 ≈ 3x/week)
 *                    Must be > 0. Typical range: 0.03 (monthly) to 7.0 (multiple times daily)
 * @param previousScore - Score from previous day (should be 0-1 range, will be clamped if outside)
 * @param completed - Whether habit was completed today
 * @returns New score value between 0 and 1 (asymptotically approaches 1.0, never reaches it)
 * @throws {Error} If frequency is invalid (≤0, NaN, or Infinity)
 *
 * @example
 * ```typescript
 * // Daily habit with 30-day streak
 * let score = 0
 * for (let i = 0; i < 30; i++) {
 *   score = computeHabitScore(1.0, score, true)
 * }
 * console.log(score) // ~0.80
 *
 * // Missing one day only slightly reduces score
 * score = computeHabitScore(1.0, score, false)
 * console.log(score) // ~0.76
 * ```
 */
export function computeHabitScore(
  frequency: number,
  previousScore: number,
  completed: boolean
): number {
  // Validate inputs
  if (frequency <= 0 || !Number.isFinite(frequency)) {
    throw new Error(`Invalid frequency: ${frequency}. Must be positive finite number.`)
  }
  if (!Number.isFinite(previousScore)) {
    throw new Error(`Invalid previousScore: ${previousScore}. Must be finite number.`)
  }

  // Clamp previousScore to valid range [0, 1]
  previousScore = Math.max(0, Math.min(1, previousScore))

  // The constant 13.0 controls decay rate calibration.
  // From uHabits: empirically tuned so daily habits decay ~5% per miss
  const DECAY_CALIBRATION_CONSTANT = 13.0

  // Decay multiplier: habits with lower frequency decay slower
  const multiplier = Math.pow(0.5, Math.sqrt(frequency) / DECAY_CALIBRATION_CONSTANT)

  // Apply decay to previous score
  let score = previousScore * multiplier

  // Add contribution from today's completion (if any)
  const checkmarkValue = completed ? 1.0 : 0.0
  score += checkmarkValue * (1 - multiplier)

  return score
}

/**
 * Represents a single point in habit score history
 */
export interface HabitScorePoint {
  date: string
  score: number
  completed: boolean
}

/**
 * Computes habit score history over a date range
 */
export class HabitScoreHistory {
  constructor(private frequency: number) {
    if (frequency <= 0 || !Number.isFinite(frequency)) {
      throw new Error(`Invalid frequency: ${frequency}. Must be positive finite number.`)
    }
  }

  /**
   * Compute scores for a date range given completion data
   *
   * @param completions - Map of date string to completion boolean
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @returns Array of score points chronologically ordered
   * @throws {Error} If dates are invalid or startDate > endDate
   */
  computeScores(
    completions: Map<string, boolean>,
    startDate: string,
    endDate: string
  ): HabitScorePoint[] {
    const start = new Date(startDate + 'T00:00:00Z')
    const end = new Date(endDate + 'T00:00:00Z')

    // Validate dates
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
      throw new Error(`Invalid date format: startDate=${startDate}, endDate=${endDate}`)
    }
    if (start > end) {
      throw new Error(`startDate (${startDate}) must be before or equal to endDate (${endDate})`)
    }

    const scores: HabitScorePoint[] = []

    let currentScore = 0
    let currentDate = new Date(start)

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const completed = completions.get(dateStr) ?? false

      currentScore = computeHabitScore(this.frequency, currentScore, completed)

      scores.push({
        date: dateStr,
        score: currentScore,
        completed
      })

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return scores
  }

  /**
   * Get current score (most recent)
   */
  getCurrentScore(scores: HabitScorePoint[]): number {
    return scores.length > 0 ? scores[scores.length - 1].score : 0
  }

  /**
   * Convert score to percentage (0-100)
   */
  static toPercentage(score: number): number {
    return Math.round(score * 100)
  }
}
