import { getDb } from './db';
import {
  users,
  goals,
  habits,
  virtualPets,
  userSettings,
  userPoints,
  costumes,
  yearlyGoals,
} from "../shared/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { log } from "./lib/logger";

const NOVEMBER_DEADLINE = '2025-11-30';

/**
 * Check if database has been seeded
 */
export async function isDatabaseSeeded(): Promise<boolean> {
  try {
    const db = getDb();
    const result = await db.select().from(users).limit(1);
    return result.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Seed the de Lahunta reading schedule for a user
 */
async function seedReadingScheduleForUser(userId: number) {
  const db = getDb();

  // Check if already exists
  const existing = await db
    .select()
    .from(yearlyGoals)
    .where(
      and(
        eq(yearlyGoals.userId, userId),
        eq(yearlyGoals.year, "2025"),
        eq(yearlyGoals.title, "Complete de Lahunta")
      )
    );

  if (existing.length > 0) {
    return; // Already seeded
  }

  log.info(`[init-db] Seeding de Lahunta reading schedule for user ${userId}`);

  // Reading schedule data
  const READING_SCHEDULE = [
    { week: 1, startDate: "2024-12-30", endDate: "2025-01-05", startPage: 1, endPage: 23, content: "Ch 1 + Ch 2" },
    { week: 2, startDate: "2025-01-06", endDate: "2025-01-12", startPage: 24, endPage: 46, content: "Ch 2 + Ch 3" },
    { week: 3, startDate: "2025-01-13", endDate: "2025-01-19", startPage: 47, endPage: 69, content: "Ch 3" },
    { week: 4, startDate: "2025-01-20", endDate: "2025-01-26", startPage: 70, endPage: 92, content: "Ch 3 + Ch 4" },
    { week: 5, startDate: "2025-01-27", endDate: "2025-02-02", startPage: 93, endPage: 115, content: "Ch 4 + Ch 5" },
    { week: 6, startDate: "2025-02-03", endDate: "2025-02-09", startPage: 116, endPage: 138, content: "Ch 5" },
    { week: 7, startDate: "2025-02-10", endDate: "2025-02-16", startPage: 139, endPage: 161, content: "Ch 5" },
    { week: 8, startDate: "2025-02-17", endDate: "2025-02-23", startPage: 162, endPage: 184, content: "Ch 5 + Ch 6" },
    { week: 9, startDate: "2025-02-24", endDate: "2025-03-02", startPage: 185, endPage: 207, content: "Ch 6 + Ch 7" },
    { week: 10, startDate: "2025-03-03", endDate: "2025-03-09", startPage: 208, endPage: 229, content: "Ch 7" },
    { week: 11, startDate: "2025-03-10", endDate: "2025-03-16", startPage: 246, endPage: 268, content: "Ch 9 + Ch 10" },
    { week: 12, startDate: "2025-03-17", endDate: "2025-03-23", startPage: 269, endPage: 291, content: "Ch 10" },
    { week: 13, startDate: "2025-03-24", endDate: "2025-03-30", startPage: 292, endPage: 314, content: "Ch 10 + Ch 11" },
    { week: 14, startDate: "2025-03-31", endDate: "2025-04-06", startPage: 315, endPage: 337, content: "Ch 11" },
    { week: 15, startDate: "2025-04-07", endDate: "2025-04-13", startPage: 338, endPage: 360, content: "Ch 11 + Ch 12" },
    { week: 16, startDate: "2025-04-14", endDate: "2025-04-20", startPage: 361, endPage: 383, content: "Ch 12 + Ch 13" },
    { week: 17, startDate: "2025-04-21", endDate: "2025-04-27", startPage: 384, endPage: 406, content: "Ch 13" },
    { week: 18, startDate: "2025-04-28", endDate: "2025-05-04", startPage: 407, endPage: 429, content: "Ch 13 + Ch 14" },
    { week: 19, startDate: "2025-05-05", endDate: "2025-05-11", startPage: 430, endPage: 452, content: "Ch 14" },
    { week: 20, startDate: "2025-05-12", endDate: "2025-05-18", startPage: 453, endPage: 475, content: "Ch 14 + Ch 15 + Ch 16 + Ch 17" },
    { week: 21, startDate: "2025-05-19", endDate: "2025-05-25", startPage: 476, endPage: 498, content: "Ch 17 + Ch 18" },
    { week: 22, startDate: "2025-05-26", endDate: "2025-06-01", startPage: 499, endPage: 521, content: "Ch 18 + Ch 19 + Ch 20" },
    { week: 23, startDate: "2025-06-02", endDate: "2025-06-08", startPage: 522, endPage: 544, content: "Ch 20 + Ch 21" },
    { week: 24, startDate: "2025-06-09", endDate: "2025-06-15", startPage: 545, endPage: 567, content: "Ch 21 + Ch 22" },
    { week: 25, startDate: "2025-06-16", endDate: "2025-06-22", startPage: 568, endPage: 590, content: "Ch 22" },
    { week: 26, startDate: "2025-06-23", endDate: "2025-06-29", startPage: 591, endPage: 621, content: "Ch 22" },
  ];

  // Helper to get ISO week string
  const getISOWeekString = (dateStr: string): string => {
    const date = new Date(dateStr);
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  };

  // Generate sub-items with IDs
  const subItemsWithIds: Array<{ id: string; weekNumber: number; title: string; completed: boolean }> = READING_SCHEDULE.map((week) => ({
    id: randomUUID(),
    weekNumber: week.week,
    title: `Week ${week.week}: pp. ${week.startPage}–${week.endPage} (${week.content})`,
    completed: false,
  }));

  // Create yearly goal
  const subItems = subItemsWithIds.map(({ id, title, completed }) => ({ id, title, completed }));
  const [newYearlyGoal] = await db.insert(yearlyGoals).values({
    userId,
    year: "2025",
    title: "Complete de Lahunta",
    description: "Read de Lahunta's Veterinary Neuroanatomy and Clinical Neurology (~23 pages/week, done June 29)",
    category: "books",
    goalType: "compound",
    targetValue: 26,
    currentValue: 0,
    subItems,
    xpReward: 500,
  }).returning();

  const yearlyGoalId = newYearlyGoal.id;

  // Create weekly goals
  for (let i = 0; i < READING_SCHEDULE.length; i++) {
    const week = READING_SCHEDULE[i];
    const subItem = subItemsWithIds[i];
    const isoWeek = getISOWeekString(week.startDate);
    const title = `Read de Lahunta pp. ${week.startPage}–${week.endPage}`;

    const linkData = JSON.stringify({
      linkedYearlyGoalId: yearlyGoalId,
      linkedSubItemId: subItem.id,
    });

    await db.insert(goals).values({
      userId,
      title,
      description: `${week.content}|||${linkData}`,
      targetValue: 1,
      currentValue: 0,
      unit: "complete",
      deadline: week.endDate,
      category: "reading",
      difficulty: "medium",
      priority: "high",
      week: isoWeek,
    });
  }

  log.info(`[init-db] Created de Lahunta yearly goal #${yearlyGoalId} with 26 weekly goals`);
}

/**
 * Initialize database with default data
 * NOTE: No longer auto-creates users. Users must sign up via the /signup page.
 */
export async function initializeDatabase() {
  const db = getDb();

  // Seed reading schedule for all existing users
  try {
    const allUsers = await db.select().from(users);
    for (const user of allUsers) {
      await seedReadingScheduleForUser(user.id);
    }
  } catch (error) {
    log.error("[init-db] Error seeding reading schedule:", error);
  }

  return {
    success: true,
    message: 'Database ready - users will register via signup page',
    alreadySeeded: false,
  };
}

let initializationPromise: Promise<void> | null = null;

export function ensureDatabaseInitialized(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    return Promise.resolve();
  }

  if (!initializationPromise) {
    initializationPromise = initializeDatabase()
      .then(result => {
        if (!result.success && !result.alreadySeeded) {
          throw new Error(result.message ?? 'Database initialization failed');
        }
      })
      .catch(error => {
        initializationPromise = null;
        throw error;
      });
  }

  return initializationPromise;
}
