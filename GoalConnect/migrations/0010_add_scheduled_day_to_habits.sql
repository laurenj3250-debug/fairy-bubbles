-- Migration: Add scheduledDay field to habits table for Adventure scheduling
-- Date: 2025-11-09

ALTER TABLE habits ADD COLUMN scheduled_day VARCHAR(10);

-- Add comment for clarity
COMMENT ON COLUMN habits.scheduled_day IS 'ISO date string (YYYY-MM-DD) for which day this week the Adventure habit is scheduled';
