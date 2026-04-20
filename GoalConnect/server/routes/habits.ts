import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { requireUser } from "../simple-auth";
import { insertHabitSchema, insertHabitLogSchema } from "@shared/schema";
import { calculateStreak, calculateWeeklyCompletion, getStreakMultiplier } from "../pet-utils";
import { XP_CONFIG, STREAK_MILESTONES, XP_BONUSES } from "@shared/xp-config";
import { awardDailyBonusIfNeeded } from "../services/dailyBonus";
import { getDb } from "../db";
import { log } from "../lib/logger";

const getUserId = (req: any) => requireUser(req).id;

// T1: client owns the calendar. The server reads the date the client already
// constructs via `client/src/lib/utils.ts:22` `getToday()` and trusts it for
// calendar-day comparisons. `localHour` is the client's local hour-of-day
// (0-23), used for time-of-day bonuses like early-bird. Both are optional so
// pre-T3 clients keep working; when omitted, server falls back to its own clock.
const YYYY_MM_DD = /^\d{4}-\d{2}-\d{2}$/;

const toggleBodySchema = z.object({
  habitId: z.number().int().positive(),
  date: z.string().regex(YYYY_MM_DD),
  localHour: z.number().int().min(0).max(23).optional(),
  note: z.string().optional(),
  mood: z.number().int().min(1).max(5).optional(),
  energy: z.number().int().min(1).max(5).optional(),
  quantityCompleted: z.number().optional(),
  durationMinutes: z.number().optional(),
  sessionType: z.string().optional(),
  incrementValue: z.number().optional(),
});

type ToggleBody = z.infer<typeof toggleBodySchema>;

/**
 * Derive day-of-week (0=Sun, 6=Sat) from a YYYY-MM-DD string in a way that
 * doesn't depend on server timezone. Parse as UTC to get a deterministic DOW
 * for the calendar date the client chose.
 */
function dayOfWeekFromDate(dateStr: string): number {
  return new Date(dateStr + 'T00:00:00Z').getUTCDay();
}

export function registerHabitRoutes(app: Express) {
  // GET all habits for user
  app.get("/api/habits", async (req, res) => {
    try {
      const userId = getUserId(req);
      const habits = await storage.getHabits(userId);
      res.json(habits);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch habits" });
    }
  });

  // GET user-level streak (perfect days streak) - MUST come before /api/habits/:id
  app.get("/api/habits/streak", async (req, res) => {
    try {
      const userId = getUserId(req);
      const habits = await storage.getHabits(userId);
      const allLogs = await storage.getAllHabitLogs(userId);

      if (habits.length === 0) {
        return res.json({ currentStreak: 0, longestStreak: 0 });
      }

      // T1: client owns the calendar. Accept an optional `today` query param
      // (YYYY-MM-DD, client-local). Fall back to server UTC for old callers.
      const rawToday = typeof req.query.today === 'string' ? req.query.today : undefined;
      const today = rawToday && YYYY_MM_DD.test(rawToday)
        ? rawToday
        : new Date().toISOString().split('T')[0];
      const todayMs = new Date(today + 'T00:00:00Z').getTime();

      // Helper function to check if a day is "perfect" (all habits completed)
      const isPerfectDay = (dateString: string): boolean => {
        const logsForDay = allLogs.filter(log =>
          log.date === dateString && log.completed
        );
        return logsForDay.length === habits.length;
      };

      // Calculate current streak (going backwards from today)
      let currentStreak = 0;
      let checkMs = todayMs;

      while (true) {
        const dateString = new Date(checkMs).toISOString().split('T')[0];

        if (!isPerfectDay(dateString)) {
          // If it's today and not perfect yet, check yesterday
          if (currentStreak === 0 && dateString === today) {
            checkMs -= 86400000;
            continue;
          }
          break;
        }

        currentStreak++;
        checkMs -= 86400000;

        if (currentStreak > 365) break; // Safety limit
      }

      // Calculate longest streak ever over the last 365 days
      let longestStreak = currentStreak;
      let tempStreak = 0;
      let scanMs = todayMs - 365 * 86400000;

      while (scanMs <= todayMs) {
        const dateString = new Date(scanMs).toISOString().split('T')[0];

        if (isPerfectDay(dateString)) {
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          tempStreak = 0;
        }

        scanMs += 86400000;
      }

      res.json({ currentStreak, longestStreak });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get user streak" });
    }
  });

  // GET single habit by ID
  app.get("/api/habits/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      const habit = await storage.getHabit(id);
      if (!habit) {
        return res.status(404).json({ error: "Habit not found" });
      }
      // Verify ownership
      if (habit.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      res.json(habit);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch habit" });
    }
  });

  // POST create new habit
  app.post("/api/habits", async (req, res) => {
    try {
      const userId = getUserId(req);
      const validated = insertHabitSchema.parse({ ...req.body, userId });
      const habit = await storage.createHabit(validated);
      res.status(201).json(habit);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid habit data" });
    }
  });

  // PATCH update habit
  app.patch("/api/habits/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      // Verify ownership before update
      const existing = await storage.getHabit(id);
      if (!existing) {
        return res.status(404).json({ error: "Habit not found" });
      }
      if (existing.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      const habit = await storage.updateHabit(id, req.body);
      res.json(habit);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update habit" });
    }
  });

  // PATCH schedule adventure habit for a specific day
  app.patch("/api/habits/:id/schedule", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      const { scheduledDay } = req.body;

      // Verify ownership
      const existing = await storage.getHabit(id);
      if (!existing) {
        return res.status(404).json({ error: "Habit not found" });
      }
      if (existing.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Validate that it's an adventure habit
      if (existing.category !== "adventure") {
        return res.status(400).json({ error: "Only adventure habits can be scheduled" });
      }

      // Update scheduledDay (can be null to clear schedule)
      const habit = await storage.updateHabit(id, { scheduledDay });
      res.json(habit);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to schedule habit" });
    }
  });

  // DELETE habit
  app.delete("/api/habits/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      // Verify ownership before delete
      const existing = await storage.getHabit(id);
      if (!existing) {
        return res.status(404).json({ error: "Habit not found" });
      }
      if (existing.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      await storage.deleteHabit(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete habit" });
    }
  });

  // GET all habits with enriched data (streak, weekly progress, history) - BATCH ENDPOINT
  app.get("/api/habits-with-data", async (req, res) => {
    try {
      const userId = getUserId(req);
      const habits = await storage.getHabits(userId);
      const allLogs = await storage.getAllHabitLogs(userId);

      const enrichedHabits = await Promise.all(
        habits.map(async (habit) => {
          const logs = allLogs.filter((log) => log.habitId === habit.id);
          const streak = calculateStreak(logs);
          const weeklyCompletion = calculateWeeklyCompletion([habit], logs);

          // Get last 30 days of logs for history
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const history = logs
            .filter((log) => new Date(log.date) >= thirtyDaysAgo)
            .sort((a, b) => a.date.localeCompare(b.date));

          return {
            ...habit,
            streak,
            weeklyCompletion,
            history,
          };
        })
      );

      res.json(enrichedHabits);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch habits with data" });
    }
  });

  // GET metrics for a specific habit
  app.get("/api/habits/:habitId/metrics", async (req, res) => {
    try {
      const userId = getUserId(req);
      const habitId = parseInt(req.params.habitId);

      // Verify habit exists and user owns it
      const habit = await storage.getHabit(habitId);
      if (!habit) {
        return res.status(404).json({ error: "Habit not found" });
      }
      if (habit.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Get metrics from database using getDb
      const db = getDb();
      const metrics = await db.query.habitMetrics.findMany({
        where: (habitMetrics: any, { eq }: any) => eq(habitMetrics.habitId, habitId),
        orderBy: (habitMetrics: any, { asc }: any) => asc(habitMetrics.displayOrder),
      });

      res.json(metrics);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get habit metrics" });
    }
  });

  // GET weekly progress for a specific habit
  app.get("/api/habits/:habitId/weekly-progress", async (req, res) => {
    try {
      const userId = getUserId(req);
      const habitId = parseInt(req.params.habitId);

      // Verify habit exists and user owns it
      const habit = await storage.getHabit(habitId);
      if (!habit) {
        return res.status(404).json({ error: "Habit not found" });
      }
      if (habit.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const logs = await storage.getHabitLogs(habitId);
      const weeklyCompletion = calculateWeeklyCompletion([habit], logs);

      res.json({ habitId, weeklyCompletion });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get weekly progress" });
    }
  });

  // GET streak for a specific habit
  app.get("/api/habits/:habitId/streak", async (req, res) => {
    try {
      const userId = getUserId(req);
      const habitId = parseInt(req.params.habitId);

      // Verify habit exists and user owns it
      const habit = await storage.getHabit(habitId);
      if (!habit) {
        return res.status(404).json({ error: "Habit not found" });
      }
      if (habit.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const logs = await storage.getHabitLogs(habitId);
      const streak = calculateStreak(logs);

      res.json({ habitId, streak });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get habit streak" });
    }
  });

  // GET history for a specific habit
  app.get("/api/habits/:habitId/history", async (req, res) => {
    try {
      const userId = getUserId(req);
      const habitId = parseInt(req.params.habitId);

      // Verify habit exists and user owns it
      const habit = await storage.getHabit(habitId);
      if (!habit) {
        return res.status(404).json({ error: "Habit not found" });
      }
      if (habit.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const logs = await storage.getHabitLogs(habitId);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get habit history" });
    }
  });

  // ============ HABIT LOGS ============

  // GET habit logs for a date range (for heatmaps)
  app.get("/api/habit-logs/range/:startDate/:endDate", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { startDate, endDate } = req.params;
      const allLogs = await storage.getAllHabitLogs(userId);
      // Filter logs within date range
      const filteredLogs = allLogs.filter(log =>
        log.date >= startDate && log.date <= endDate
      );
      res.json(filteredLogs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch habit logs range" });
    }
  });

  // GET habit logs for a specific date
  app.get("/api/habit-logs/:date", async (req, res) => {
    try {
      const userId = getUserId(req);
      const date = req.params.date;
      const logs = await storage.getHabitLogsByDate(userId, date);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch habit logs" });
    }
  });

  // GET habit logs (with optional habitId query param) - SUPPORTS BATCH QUERIES
  app.get("/api/habit-logs", async (req, res) => {
    try {
      const userId = getUserId(req);
      const habitId = req.query.habitId ? parseInt(req.query.habitId as string) : undefined;

      // NEW: Support batch habitIds query param for N+1 fix
      const habitIds = req.query.habitIds
        ? (req.query.habitIds as string).split(',').map(id => parseInt(id))
        : undefined;

      if (habitIds && habitIds.length > 0) {
        // Batch fetch for multiple habits - FIX FOR N+1 QUERY PROBLEM
        const allLogs = await storage.getAllHabitLogs(userId);
        const filteredLogs = allLogs.filter(log => habitIds.includes(log.habitId));
        return res.json(filteredLogs);
      }

      if (habitId) {
        const logs = await storage.getHabitLogs(habitId);
        return res.json(logs);
      }

      const logs = await storage.getAllHabitLogs(userId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch habit logs" });
    }
  });

  // POST create habit log
  app.post("/api/habit-logs", async (req, res) => {
    try {
      const userId = getUserId(req);
      const validated = insertHabitLogSchema.parse(req.body);

      // Verify habit exists and user owns it
      const habit = await storage.getHabit(validated.habitId);
      if (!habit) {
        return res.status(404).json({ error: "Habit not found" });
      }
      if (habit.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const log = await storage.createHabitLog(validated);
      res.status(201).json(log);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid habit log data" });
    }
  });

  // PATCH update habit log
  app.patch("/api/habit-logs/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);

      // Get the log and verify ownership via habit
      const log = await storage.getHabitLog(id);
      if (!log) {
        return res.status(404).json({ error: "Habit log not found" });
      }

      const habit = await storage.getHabit(log.habitId);
      if (!habit || habit.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const updatedLog = await storage.updateHabitLog(id, req.body);
      res.json(updatedLog);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update habit log" });
    }
  });

  // DELETE habit log
  app.delete("/api/habit-logs/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);

      // Get the log and verify ownership via habit
      const log = await storage.getHabitLog(id);
      if (!log) {
        return res.status(404).json({ error: "Habit log not found" });
      }

      const habit = await storage.getHabit(log.habitId);
      if (!habit || habit.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deleteHabitLog(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete habit log" });
    }
  });

  // POST toggle habit log completion (supports cumulative goals and notes)
  app.post("/api/habit-logs/toggle", async (req, res) => {
    // T4: Zod first. All parsing and validation happens before anything else.
    const parsed = toggleBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid request body",
        issues: parsed.error.issues,
      });
    }
    const body: ToggleBody = parsed.data;
    const {
      habitId,
      date,
      localHour,
      note,
      mood,
      energy,
      durationMinutes,
      quantityCompleted,
      sessionType,
      incrementValue,
    } = body;

    let userId: number;
    try {
      userId = getUserId(req);
    } catch {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Authz: fetch habit + confirm ownership before any writes.
    const habit = await storage.getHabit(habitId);
    if (!habit) {
      return res.status(404).json({ error: "Habit not found" });
    }
    if (habit.userId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const warnings: string[] = [];
    const db = getDb();
    const { habitLogs, habits: habitsTable } = await import("@shared/schema");
    const { and, eq } = await import("drizzle-orm");
    const inc = incrementValue ?? 1;

    // T4: Atomic upsert. Read-then-upsert lives inside a DB transaction so the
    // toggle decision (flip existing completed value vs. create completed:true)
    // is race-free and the unique constraint on (habitId, userId, date) can
    // never produce a duplicate row.
    let logResult: any;
    let wasCreated = false;
    try {
      logResult = await db.transaction(async (tx) => {
        const [existing] = await tx
          .select()
          .from(habitLogs)
          .where(
            and(
              eq(habitLogs.habitId, habitId),
              eq(habitLogs.userId, userId),
              eq(habitLogs.date, date)
            )
          );

        // Decide the target `completed` value. If this is a fresh log, it's
        // true. If there's an existing log and the caller did NOT provide an
        // incrementValue, this is a toggle — flip the existing value. When an
        // incrementValue IS provided (cumulative adds), the log stays completed.
        const completed = existing
          ? (incrementValue !== undefined ? true : !existing.completed)
          : true;
        wasCreated = !existing;

        // Build the upsert payload. Only include fields that were explicitly
        // provided so we never clobber existing data with `undefined`. For the
        // note field, preserve the existing note when the caller didn't send one.
        const insertValues = {
          habitId,
          userId,
          date,
          completed,
          incrementValue: inc,
          ...(note !== undefined ? { note } : {}),
          ...(mood !== undefined ? { mood } : {}),
          ...(energy !== undefined ? { energyLevel: energy } : {}),
          ...(durationMinutes !== undefined ? { durationMinutes } : {}),
          ...(quantityCompleted !== undefined ? { quantityCompleted } : {}),
          ...(sessionType !== undefined ? { sessionType } : {}),
        };

        const updateSet: Record<string, unknown> = {
          completed,
          incrementValue: inc,
        };
        if (note !== undefined) updateSet.note = note;
        if (mood !== undefined) updateSet.mood = mood;
        if (energy !== undefined) updateSet.energyLevel = energy;
        if (durationMinutes !== undefined) updateSet.durationMinutes = durationMinutes;
        if (quantityCompleted !== undefined) updateSet.quantityCompleted = quantityCompleted;
        if (sessionType !== undefined) updateSet.sessionType = sessionType;

        const [row] = await tx
          .insert(habitLogs)
          .values(insertValues)
          .onConflictDoUpdate({
            target: [habitLogs.habitId, habitLogs.userId, habitLogs.date],
            set: updateSet,
          })
          .returning();

        // For cumulative goals: adjust currentValue by the delta implied by the
        // toggle. A fresh complete adds `inc`; a flip from true->false subtracts
        // `inc`; a flip from false->true adds `inc`.
        if (habit.goalType === "cumulative") {
          const delta = existing
            ? (completed === existing.completed ? 0 : (completed ? inc : -inc))
            : inc;
          if (delta !== 0) {
            await tx
              .update(habitsTable)
              .set({ currentValue: (habit.currentValue || 0) + delta })
              .where(eq(habitsTable.id, habitId));
          }
        }

        return row;
      });
    } catch (upsertError: any) {
      log.error('[habits] Toggle upsert failed:', upsertError);
      return res.status(500).json({ error: "Failed to toggle habit log" });
    }

    log.debug('[habits] Toggle upsert succeeded', {
      habitId,
      userId,
      date,
      completed: logResult?.completed,
      created: wasCreated,
    });

    // Linked goal update — non-fatal, surfaces as warning on failure.
    if (habit.linkedGoalId) {
      try {
        const linkedGoal = await storage.getGoal(habit.linkedGoalId);
        if (linkedGoal) {
          const newValue = logResult.completed
            ? (linkedGoal.currentValue || 0) + 1
            : Math.max(0, (linkedGoal.currentValue || 0) - 1);
          await storage.updateGoal(habit.linkedGoalId, { currentValue: newValue });
          log.debug('[habits] Updated linked goal on toggle', {
            goalId: habit.linkedGoalId,
            completed: logResult.completed,
            newValue,
          });
        }
      } catch (goalError: any) {
        log.error('[habits] Failed to update linked goal on toggle:', goalError);
        warnings.push(`Linked goal didn't update: ${goalError?.message || "unknown error"}`);
      }
    }

    // Update habit score after logging — non-fatal.
    let scoreData: { current: number; change: number; percentage: number } | undefined;
    try {
      const { updateHabitScore } = await import("../services/habitScoring");
      const scoreResult = await updateHabitScore(habitId, date);
      scoreData = {
        current: scoreResult.newScore,
        change: scoreResult.scoreChange,
        percentage: Math.round(scoreResult.newScore * 100),
      };
    } catch (scoreError: any) {
      log.error('[habits] Score update failed:', scoreError);
      warnings.push(`Habit score didn't update: ${scoreError?.message || "unknown error"}`);
    }

    // Award XP for habit completion — non-fatal.
    let pointsEarned = 0;
    let streakDays = 0;

    if (logResult?.completed) {
      try {
        const logId = logResult.id;

        // Idempotency: check if points already awarded for this log
        const existingTx = await storage.getPointTransactionByTypeAndRelatedId(
          userId, 'habit_complete', logId
        );

        if (!existingTx) {
          // Calculate per-habit streak — anchor to the client's calendar day.
          const habitLogs = await storage.getHabitLogs(habitId);
          streakDays = calculateStreak(habitLogs, date);
          const multiplier = getStreakMultiplier(streakDays);

          // Base XP by difficulty
          const base = XP_CONFIG.habit[habit.difficulty || 'medium'] || XP_CONFIG.habit.medium;
          pointsEarned = Math.round(base * multiplier);

          // Variable bonuses (Hook Model: variable reward).
          // T1: use the client-local hour + the day-of-week derived from the
          // client-local date. Fall back to server clock for old callers.
          const hour = typeof localHour === 'number' ? localHour : new Date().getHours();
          const day = dayOfWeekFromDate(date); // 0=Sun, 6=Sat
          const bonuses: string[] = [];

          if (hour < 7) {
            pointsEarned += XP_BONUSES.morningBird;
            bonuses.push('early bird');
          }
          if (day === 0 || day === 6) {
            pointsEarned += XP_BONUSES.weekendWarrior;
            bonuses.push('weekend');
          }

          await storage.addPoints(
            userId,
            pointsEarned,
            'habit_complete',
            logId,
            `Completed ${habit.title} (${streakDays}-day streak, ${multiplier}x${bonuses.length ? ', ' + bonuses.join('+') : ''})`
          );
          log.debug(`[habits] Awarded ${pointsEarned} XP for habit ${habit.title} (streak: ${streakDays}, multiplier: ${multiplier}x, bonuses: ${bonuses.join(',') || 'none'})`);

          // Check for streak milestones (one-time per habit per milestone)
          for (const milestone of STREAK_MILESTONES) {
            if (streakDays === milestone) {
              try {
                const txs = await storage.getPointTransactions(userId);
                const alreadyAwarded = txs.some(
                  tx => tx.type === 'streak_milestone'
                    && tx.relatedId === habitId
                    && tx.description.includes(`${milestone}-day`)
                );
                if (!alreadyAwarded) {
                  const milestoneXP = XP_CONFIG.streakMilestone[milestone] || 0;
                  if (milestoneXP > 0) {
                    await storage.addPoints(
                      userId,
                      milestoneXP,
                      'streak_milestone',
                      habitId,
                      `${habit.title} ${milestone}-day streak!`
                    );
                    pointsEarned += milestoneXP;
                    log.info(`[habits] Streak milestone! ${habit.title} hit ${milestone}-day streak, awarded ${milestoneXP} XP`);
                  }
                }
              } catch (milestoneError: any) {
                log.error('[habits] Streak milestone award failed:', milestoneError);
                warnings.push(`Streak milestone bonus didn't apply: ${milestoneError?.message || "unknown error"}`);
              }
              break;
            }
          }
        }

        // Daily activity bonus — anchored to the client's calendar day.
        try {
          const dailyBonus = await awardDailyBonusIfNeeded(userId, date);
          pointsEarned += dailyBonus;
        } catch (dailyErr: any) {
          log.error('[habits] Daily bonus check failed:', dailyErr);
          warnings.push(`Daily bonus didn't apply: ${dailyErr?.message || "unknown error"}`);
        }

        // All-done bonus: check if every habit is now completed on the
        // client's calendar day (the date this toggle is for).
        try {
          const allHabits = await storage.getHabits(userId);
          const dayLogs = await storage.getHabitLogsByDate(userId, date);
          const completedCount = dayLogs.filter((l: any) => l.completed).length;
          if (completedCount >= allHabits.length && allHabits.length > 0) {
            pointsEarned += XP_BONUSES.allDone;
            log.info(`[habits] All-done bonus! ${completedCount}/${allHabits.length} habits on ${date}, +${XP_BONUSES.allDone} XP`);
          }
        } catch (allDoneErr: any) {
          log.error('[habits] All-done bonus check failed:', allDoneErr);
          warnings.push(`All-done bonus didn't apply: ${allDoneErr?.message || "unknown error"}`);
        }
      } catch (pointsError: any) {
        log.error('[habits] Points award failed:', pointsError);
        warnings.push(`XP didn't save: ${pointsError?.message || "unknown error"}`);
      }
    }

    return res.json({
      ...logResult,
      ...(scoreData ? { score: scoreData } : {}),
      pointsEarned,
      streakDays,
      ...(warnings.length ? { warnings } : {}),
    });
  });
}
