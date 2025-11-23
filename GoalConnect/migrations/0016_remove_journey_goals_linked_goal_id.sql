-- Remove unused linkedGoalId column from journey_goals
-- This column was added to schema but never used; Journey goals now source data directly from fitness integrations
ALTER TABLE "journey_goals" DROP COLUMN IF EXISTS "linked_goal_id";
