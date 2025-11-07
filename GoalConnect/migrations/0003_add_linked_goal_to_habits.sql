-- Add linked_goal_id column to habits table to connect habits to goals
ALTER TABLE habits ADD COLUMN IF NOT EXISTS linked_goal_id INTEGER REFERENCES goals(id);

-- Change color column from varchar(7) to text to support gradient strings
ALTER TABLE habits ALTER COLUMN color TYPE text;
