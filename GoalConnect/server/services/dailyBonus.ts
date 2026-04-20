import { storage } from "../storage";
import { log } from "../lib/logger";
import { XP_CONFIG } from "@shared/xp-config";

/**
 * Award daily activity bonus if not already earned today.
 *
 * @param userId - user
 * @param referenceToday - optional client-local YYYY-MM-DD "today". If omitted,
 *   falls back to server UTC date. Client owns the calendar (see T1).
 * Returns the bonus amount awarded (0 if already earned today).
 */
export async function awardDailyBonusIfNeeded(
  userId: number,
  referenceToday?: string,
): Promise<number> {
  const today = referenceToday ?? new Date().toISOString().split('T')[0];

  const existingBonus = await storage.getPointTransactionByTypeAndDate(
    userId, 'daily_login', today
  );

  if (existingBonus) {
    return 0; // Already earned today
  }

  // Calculate activity streak from recent transactions (60-day lookback).
  // Anchor the lookback to the client-provided today so timezone-local day
  // boundaries line up with log rows the client already wrote.
  const todayMs = new Date(today + 'T00:00:00Z').getTime();
  const lookbackDate = new Date(todayMs - 60 * 86400000).toISOString().split('T')[0];
  const recentTxs = await storage.getPointTransactionsByDateRange(userId, lookbackDate);

  const activeDays = new Set(
    recentTxs
      .filter(tx => tx.amount > 0)
      .map(tx => new Date(tx.createdAt).toISOString().split('T')[0])
  );

  // Count consecutive days backwards from yesterday (relative to client today)
  let activityStreak = 0;
  let checkMs = todayMs - 86400000;
  while (activityStreak < 60) {
    const ds = new Date(checkMs).toISOString().split('T')[0];
    if (!activeDays.has(ds)) break;
    activityStreak++;
    checkMs -= 86400000;
  }

  const { base, week, month } = XP_CONFIG.dailyBonus;
  const dailyBonus = activityStreak >= 30 ? month : activityStreak >= 7 ? week : base;

  await storage.addPoints(userId, dailyBonus, 'daily_login', null,
    `Daily activity bonus (${activityStreak + 1}-day activity streak)`
  );

  log.debug(`[dailyBonus] Awarded ${dailyBonus} XP to user ${userId} (${activityStreak + 1}-day streak)`);

  return dailyBonus;
}
