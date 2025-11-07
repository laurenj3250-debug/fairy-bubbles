-- Add difficulty column to habits table
ALTER TABLE habits ADD COLUMN IF NOT EXISTS difficulty VARCHAR(10) NOT NULL DEFAULT 'medium';
