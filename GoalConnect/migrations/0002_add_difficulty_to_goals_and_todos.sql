-- Add difficulty column to goals table
ALTER TABLE goals ADD COLUMN IF NOT EXISTS difficulty VARCHAR(10) NOT NULL DEFAULT 'medium';

-- Add difficulty column to todos table and remove static points column
ALTER TABLE todos ADD COLUMN IF NOT EXISTS difficulty VARCHAR(10) NOT NULL DEFAULT 'medium';
ALTER TABLE todos DROP COLUMN IF EXISTS points;
