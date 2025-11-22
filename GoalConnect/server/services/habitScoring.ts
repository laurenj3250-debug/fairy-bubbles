// GoalConnect/server/services/habitScoring.ts

import { getDb } from '../db'
import { habits, habitLogs } from '@shared/schema'
import { eq, and, gte, lte, desc } from 'drizzle-orm'
import { HabitScoreHistory, HabitScorePoint } from '@shared/lib/habitScoring'
import { frequencyToDecimal, FrequencyType } from '@shared/lib/habitFrequency'

/**
 * Result of updating a habit's score
 */
export interface ScoreUpdateResult {
  newScore: number
  scoreChange: number
  updatedHistory: HabitScorePoint[]
}

/**
 * Updates the habit score based on completion history.
 *
 * This function:
 * 1. Retrieves the habit and validates it exists
 * 2. Calculates frequency as decimal from DB fields
 * 3. Loads completion logs for the past 30 days
 * 4. Computes scores using the HabitScoreHistory class
 * 5. Updates the habit's currentScore and scoreHistory
 *
 * @param habitId - The habit ID to update
 * @param date - The date of the latest log (YYYY-MM-DD)
 * @returns ScoreUpdateResult with new score, change, and history
 * @throws {Error} If habit not found
 */
export async function updateHabitScore(
  habitId: number,
  date: string
): Promise<ScoreUpdateResult> {
  const db = getDb()

  // 1. Get the habit
  const habit = await db.query.habits.findFirst({
    where: eq(habits.id, habitId)
  })

  if (!habit) {
    throw new Error(`Habit ${habitId} not found`)
  }

  // 2. Calculate frequency as decimal
  // Default to daily (1/1) if frequency fields are not set
  const numerator = habit.frequencyNumerator ?? 1
  const denominator = habit.frequencyDenominator ?? 1
  const frequencyType = habit.frequencyType ?? 'daily'

  const frequency = frequencyToDecimal({
    numerator,
    denominator,
    type: frequencyType as FrequencyType
  })

  // 3. Get completion logs for the past 30 days
  const thirtyDaysAgo = new Date(date)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const startDateStr = thirtyDaysAgo.toISOString().split('T')[0]

  const logs = await db.query.habitLogs.findMany({
    where: and(
      eq(habitLogs.habitId, habitId),
      gte(habitLogs.date, startDateStr),
      lte(habitLogs.date, date)
    ),
    orderBy: [desc(habitLogs.date)]
  })

  // 4. Build completions map
  const completions = new Map<string, boolean>()
  logs.forEach(log => {
    completions.set(log.date, log.completed)
  })

  // 5. Compute scores
  const scoreHistory = new HabitScoreHistory(frequency)
  const scores = scoreHistory.computeScores(
    completions,
    startDateStr,
    date
  )

  const newScore = scoreHistory.getCurrentScore(scores)
  const oldScore = parseFloat(habit.currentScore || '0')

  // 6. Update habit in database
  await db.update(habits)
    .set({
      currentScore: newScore.toFixed(8),
      scoreHistory: scores.slice(-30) // Keep last 30 days
    })
    .where(eq(habits.id, habitId))

  return {
    newScore,
    scoreChange: newScore - oldScore,
    updatedHistory: scores.slice(-30)
  }
}
