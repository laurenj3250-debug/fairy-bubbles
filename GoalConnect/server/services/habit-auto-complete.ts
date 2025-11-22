/**
 * Habit Auto-Complete Service
 *
 * Applies matching results to habits - creates logs for binary habits
 * and increments values for cumulative goals.
 */

import { getDb } from "../db";
import { habitLogs, habits, habitDataMappings } from "@shared/schema";
import type { ExternalWorkout, ClimbingSession } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import {
  processHabitMatches,
  getDateFromData,
  type MatchResult,
} from "./habit-matcher";

interface AutoCompleteResult {
  habitsCompleted: number;
  habitsIncremented: number;
  errors: string[];
  results: Array<{
    habitId: number;
    action: "completed" | "incremented" | "skipped";
    reason?: string;
  }>;
}

/**
 * Apply habit matches for an imported workout
 */
export async function applyWorkoutMatches(
  workout: ExternalWorkout,
  userId: number
): Promise<AutoCompleteResult> {
  const db = getDb();
  const date = getDateFromData(workout);

  // Get user's mappings for apple_watch source
  const mappings = await db
    .select()
    .from(habitDataMappings)
    .where(
      and(
        eq(habitDataMappings.userId, userId),
        eq(habitDataMappings.sourceType, workout.sourceType)
      )
    );

  // Process matches
  const matches = processHabitMatches(workout, mappings, date);

  return await applyMatches(matches, userId, "apple_watch", workout.id);
}

/**
 * Apply habit matches for an imported climbing session
 */
export async function applySessionMatches(
  session: ClimbingSession,
  userId: number
): Promise<AutoCompleteResult> {
  const db = getDb();
  const date = session.sessionDate;

  // Get user's mappings for kilter_board source
  const mappings = await db
    .select()
    .from(habitDataMappings)
    .where(
      and(
        eq(habitDataMappings.userId, userId),
        eq(habitDataMappings.sourceType, session.sourceType)
      )
    );

  // Process matches with increment value set to problems sent
  const matches = processHabitMatches(session, mappings, date, {
    incrementValue: session.problemsSent,
  });

  return await applyMatches(matches, userId, "kilter_board", session.id);
}

/**
 * Apply match results to habits
 */
async function applyMatches(
  matches: MatchResult[],
  userId: number,
  sourceType: string,
  linkedId: number
): Promise<AutoCompleteResult> {
  const db = getDb();
  const result: AutoCompleteResult = {
    habitsCompleted: 0,
    habitsIncremented: 0,
    errors: [],
    results: [],
  };

  for (const match of matches) {
    try {
      // Check if habit log already exists for this date
      const [existingLog] = await db
        .select()
        .from(habitLogs)
        .where(
          and(
            eq(habitLogs.habitId, match.habitId),
            eq(habitLogs.userId, userId),
            eq(habitLogs.date, match.date)
          )
        )
        .limit(1);

      // If manual entry exists, don't override
      if (existingLog && !existingLog.autoCompleteSource) {
        result.results.push({
          habitId: match.habitId,
          action: "skipped",
          reason: "Manual entry exists",
        });
        continue;
      }

      if (match.action === "complete") {
        // Binary habit - mark as complete
        if (existingLog) {
          // Update existing log
          await db
            .update(habitLogs)
            .set({
              completed: true,
              autoCompleteSource: sourceType,
              linkedWorkoutId: sourceType === "apple_watch" ? linkedId : null,
              linkedSessionId: sourceType === "kilter_board" ? linkedId : null,
            })
            .where(eq(habitLogs.id, existingLog.id));
        } else {
          // Create new log
          await db.insert(habitLogs).values({
            habitId: match.habitId,
            userId,
            date: match.date,
            completed: true,
            autoCompleteSource: sourceType,
            linkedWorkoutId: sourceType === "apple_watch" ? linkedId : null,
            linkedSessionId: sourceType === "kilter_board" ? linkedId : null,
            incrementValue: 1,
          });
        }

        result.habitsCompleted++;
        result.results.push({
          habitId: match.habitId,
          action: "completed",
        });
      } else if (match.action === "increment") {
        // Cumulative habit - increment value
        const incrementValue = match.incrementValue || 1;

        // Get habit to update currentValue
        const [habit] = await db
          .select()
          .from(habits)
          .where(eq(habits.id, match.habitId))
          .limit(1);

        if (habit) {
          // Update habit's currentValue
          await db
            .update(habits)
            .set({
              currentValue: (habit.currentValue || 0) + incrementValue,
            })
            .where(eq(habits.id, match.habitId));

          // Create or update log
          if (existingLog) {
            await db
              .update(habitLogs)
              .set({
                completed: true,
                quantityCompleted: (existingLog.quantityCompleted || 0) + incrementValue,
                incrementValue: (existingLog.incrementValue || 0) + incrementValue,
                autoCompleteSource: sourceType,
                linkedWorkoutId: sourceType === "apple_watch" ? linkedId : null,
                linkedSessionId: sourceType === "kilter_board" ? linkedId : null,
              })
              .where(eq(habitLogs.id, existingLog.id));
          } else {
            await db.insert(habitLogs).values({
              habitId: match.habitId,
              userId,
              date: match.date,
              completed: true,
              quantityCompleted: incrementValue,
              incrementValue,
              autoCompleteSource: sourceType,
              linkedWorkoutId: sourceType === "apple_watch" ? linkedId : null,
              linkedSessionId: sourceType === "kilter_board" ? linkedId : null,
            });
          }

          result.habitsIncremented++;
          result.results.push({
            habitId: match.habitId,
            action: "incremented",
          });
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      result.errors.push(`Failed to apply match for habit ${match.habitId}: ${errorMessage}`);
      result.results.push({
        habitId: match.habitId,
        action: "skipped",
        reason: errorMessage,
      });
    }
  }

  return result;
}

/**
 * Process all workouts for a user and apply matches
 */
export async function processWorkoutsForMatching(
  workouts: ExternalWorkout[],
  userId: number
): Promise<AutoCompleteResult> {
  const combined: AutoCompleteResult = {
    habitsCompleted: 0,
    habitsIncremented: 0,
    errors: [],
    results: [],
  };

  for (const workout of workouts) {
    const result = await applyWorkoutMatches(workout, userId);
    combined.habitsCompleted += result.habitsCompleted;
    combined.habitsIncremented += result.habitsIncremented;
    combined.errors.push(...result.errors);
    combined.results.push(...result.results);
  }

  return combined;
}

/**
 * Process all sessions for a user and apply matches
 */
export async function processSessionsForMatching(
  sessions: ClimbingSession[],
  userId: number
): Promise<AutoCompleteResult> {
  const combined: AutoCompleteResult = {
    habitsCompleted: 0,
    habitsIncremented: 0,
    errors: [],
    results: [],
  };

  for (const session of sessions) {
    const result = await applySessionMatches(session, userId);
    combined.habitsCompleted += result.habitsCompleted;
    combined.habitsIncremented += result.habitsIncremented;
    combined.errors.push(...result.errors);
    combined.results.push(...result.results);
  }

  return combined;
}
