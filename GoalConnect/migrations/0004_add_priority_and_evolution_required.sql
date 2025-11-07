-- Add priority column to goals table
ALTER TABLE goals ADD COLUMN IF NOT EXISTS priority VARCHAR(10) NOT NULL DEFAULT 'medium';

-- Add evolutionRequired column to costumes table
ALTER TABLE costumes ADD COLUMN IF NOT EXISTS evolution_required VARCHAR(20) NOT NULL DEFAULT 'seed';
