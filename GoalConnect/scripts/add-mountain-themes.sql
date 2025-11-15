-- Add background_image and theme_colors columns to mountains table
ALTER TABLE mountains
ADD COLUMN IF NOT EXISTS background_image TEXT,
ADD COLUMN IF NOT EXISTS theme_colors TEXT DEFAULT '{}';

-- Create mountain_backgrounds table if it doesn't exist
CREATE TABLE IF NOT EXISTS mountain_backgrounds (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  mountain_id INTEGER NOT NULL REFERENCES mountains(id),
  expedition_id INTEGER REFERENCES player_expeditions(id),
  unlocked_at TIMESTAMP DEFAULT NOW() NOT NULL,
  is_active BOOLEAN DEFAULT FALSE NOT NULL
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_mountain_backgrounds_user ON mountain_backgrounds(user_id);
CREATE INDEX IF NOT EXISTS idx_mountain_backgrounds_mountain ON mountain_backgrounds(mountain_id);
