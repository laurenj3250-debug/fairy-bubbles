-- Add support for habits with multiple daily logs (e.g., "drink 2L water")
-- allowMultipleLogs: when true, users can log multiple times per day toward a daily target
-- dailyTargetValue: the goal for each day (e.g., 2 for 2L of water)

ALTER TABLE "habits" ADD COLUMN IF NOT EXISTS "allow_multiple_logs" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "habits" ADD COLUMN IF NOT EXISTS "daily_target_value" INTEGER;
