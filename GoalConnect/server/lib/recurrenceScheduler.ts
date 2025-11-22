/**
 * Recurrence Scheduler
 * Background job to process recurring tasks
 */

import { getDb } from "../db";
import { todos } from "../../shared/schema";
import { and, isNotNull, lte, sql } from "drizzle-orm";
import { calculateNextOccurrence, type RecurrencePattern } from "../../shared/lib/recurrenceEngine";

interface RecurringTask {
  id: number;
  userId: number;
  title: string;
  difficulty: string;
  projectId: number | null;
  priority: number;
  notes: string | null;
  recurringPattern: string;
  nextRecurrence: string;
  subtasks: string | null;
  dueDate: string | null;
}

/**
 * Process all recurring tasks that are due
 */
export async function processRecurringTasks(): Promise<{
  processed: number;
  created: number;
  errors: number;
}> {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  const results = {
    processed: 0,
    created: 0,
    errors: 0
  };

  try {
    // Find tasks ready for next recurrence
    const recurringTasks = await db
      .select()
      .from(todos)
      .where(
        and(
          isNotNull(todos.recurringPattern),
          isNotNull(todos.nextRecurrence),
          lte(todos.nextRecurrence, today)
        )
      ) as RecurringTask[];

    console.log(`[Recurrence Scheduler] Found ${recurringTasks.length} tasks to process`);

    for (const task of recurringTasks) {
      try {
        results.processed++;

        // Parse the recurrence pattern
        const pattern: RecurrencePattern = JSON.parse(task.recurringPattern);

        // Check if we should stop (end conditions handled by engine)
        const nextOccurrenceDate = calculateNextOccurrence(pattern, task.nextRecurrence);

        if (!nextOccurrenceDate) {
          // Recurrence has ended, clear the pattern
          await db
            .update(todos)
            .set({
              recurringPattern: null,
              nextRecurrence: null
            })
            .where(sql`${todos.id} = ${task.id}`);

          console.log(`[Recurrence Scheduler] Task ${task.id} recurrence ended`);
          continue;
        }

        // Create new instance of the task
        const newDueDate = task.dueDate
          ? calculateNextOccurrence(pattern, task.dueDate)?.toISOString().split('T')[0]
          : null;

        await db.insert(todos).values({
          userId: task.userId,
          title: task.title,
          difficulty: task.difficulty as "easy" | "medium" | "hard",
          dueDate: newDueDate,
          projectId: task.projectId,
          priority: task.priority,
          notes: task.notes ?? undefined,
          subtasks: task.subtasks ?? undefined,
          completed: false,
          recurringPattern: undefined, // New instances are not recurring themselves
          nextRecurrence: undefined,
          createdAt: new Date()
        });

        results.created++;

        // Update original task's next recurrence date
        await db
          .update(todos)
          .set({
            nextRecurrence: nextOccurrenceDate.toISOString().split('T')[0]
          })
          .where(sql`${todos.id} = ${task.id}`);

        console.log(`[Recurrence Scheduler] Created instance for task ${task.id}, next: ${nextOccurrenceDate.toISOString().split('T')[0]}`);

      } catch (error) {
        results.errors++;
        console.error(`[Recurrence Scheduler] Error processing task ${task.id}:`, error);
      }
    }

    console.log(`[Recurrence Scheduler] Complete: ${results.created} created, ${results.errors} errors`);
    return results;

  } catch (error) {
    console.error('[Recurrence Scheduler] Fatal error:', error);
    throw error;
  }
}

/**
 * Calculate and set next recurrence for a task
 */
export async function setTaskRecurrence(
  taskId: number,
  pattern: RecurrencePattern,
  startDate?: Date | string
): Promise<void> {
  const db = getDb();
  const baseDate = startDate ? (typeof startDate === 'string' ? new Date(startDate) : startDate) : new Date();
  const nextRecurrence = calculateNextOccurrence(pattern, baseDate);

  if (!nextRecurrence) {
    throw new Error('Invalid recurrence pattern - no next occurrence');
  }

  await db
    .update(todos)
    .set({
      recurringPattern: JSON.stringify(pattern),
      nextRecurrence: nextRecurrence.toISOString().split('T')[0]
    })
    .where(sql`${todos.id} = ${taskId}`);
}

/**
 * Remove recurrence from a task
 */
export async function removeTaskRecurrence(taskId: number): Promise<void> {
  const db = getDb();
  await db
    .update(todos)
    .set({
      recurringPattern: null,
      nextRecurrence: null
    })
    .where(sql`${todos.id} = ${taskId}`);
}

/**
 * Skip the next occurrence of a recurring task
 */
export async function skipNextOccurrence(taskId: number): Promise<void> {
  const db = getDb();
  // Get the task
  const [task] = await db
    .select()
    .from(todos)
    .where(sql`${todos.id} = ${taskId}`)
    .limit(1) as RecurringTask[];

  if (!task || !task.recurringPattern || !task.nextRecurrence) {
    throw new Error('Task is not recurring');
  }

  const pattern: RecurrencePattern = JSON.parse(task.recurringPattern);
  const nextAfterSkip = calculateNextOccurrence(pattern, task.nextRecurrence);

  if (!nextAfterSkip) {
    // No more occurrences after skip, end recurrence
    await removeTaskRecurrence(taskId);
  } else {
    await db
      .update(todos)
      .set({
        nextRecurrence: nextAfterSkip.toISOString().split('T')[0]
      })
      .where(sql`${todos.id} = ${taskId}`);
  }
}

/**
 * Get all instances of a recurring task (parent + created instances)
 */
export async function getRecurringTaskInstances(taskId: number): Promise<any[]> {
  const db = getDb();
  // For now, return tasks with similar title from same user
  // In production, you might want to add a parent_recurring_id field
  const [parentTask] = await db
    .select()
    .from(todos)
    .where(sql`${todos.id} = ${taskId}`)
    .limit(1);

  if (!parentTask) {
    return [];
  }

  // Get all tasks with same title from same user (this is a simplification)
  const instances = await db
    .select()
    .from(todos)
    .where(
      and(
        sql`${todos.userId} = ${parentTask.userId}`,
        sql`${todos.title} = ${parentTask.title}`
      )
    )
    .orderBy(sql`${todos.createdAt} DESC`);

  return instances;
}
