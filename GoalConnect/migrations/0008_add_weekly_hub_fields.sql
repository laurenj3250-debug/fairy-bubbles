-- Add Weekly Hub fields to habits table
ALTER TABLE habits ADD COLUMN IF NOT EXISTS category VARCHAR(20) DEFAULT 'training';
ALTER TABLE habits ADD COLUMN IF NOT EXISTS effort VARCHAR(10) DEFAULT 'medium';
ALTER TABLE habits ADD COLUMN IF NOT EXISTS grade TEXT DEFAULT '5.9';
