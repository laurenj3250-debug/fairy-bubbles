import { storage } from "../storage";
import { log } from "../lib/logger";
import { XP_CONFIG } from "@shared/xp-config";

/**
 * Award daily activity bonus if not already earned today (server time).
 * Returns the bonus amount awarded (0 if already earned today).
 */
export async function awardDailyBonusIfNeeded(userId: number): Promise<number> {
  const serverToday = new Date().toISOString().split('T')[0];

  const existingBonus = await storage.getPointTransactionByTypeAndDate(
    userId, 'daily_login', serverToday
  );

  if (existingBonus) {
    return 0; // Already earned today
  }

  // Calculate activity streak from recent transactions (60-day lookback)
  const lookbackDate = new Date(Date.now() - 60 * 86400000).toISOString().split('T')[0];
  const recentTxs = await storage.getPointTransactionsByDateRange(userId, lookbackDate);

  const activeDays = new Set(
    recentTxs
      .filter(tx => tx.amount > 0)
      .map(tx => new Date(tx.createdAt).toISOString().split('T')[0])
  );

  // Count consecutive days backwards from yesterday
  let activityStreak = 0;
  const checkDate = new Date();
  checkDate.setDate(checkDate.getDate() - 1);
  while (activityStreak < 60) {
    const ds = checkDate.toISOString().split('T')[0];
    if (!activeDays.has(ds)) break;
    activityStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  const { base, week, month } = XP_CONFIG.dailyBonus;
  const dailyBonus = activityStreak >= 30 ? month : activityStreak >= 7 ? week : base;

  await storage.addPoints(userId, dailyBonus, 'daily_login', null,
    `Daily activity bonus (${activityStreak + 1}-day activity streak)`
  );

  log.debug(`[dailyBonus] Awarded ${dailyBonus} XP to user ${userId} (${activityStreak + 1}-day streak)`);

  return dailyBonus;
}
