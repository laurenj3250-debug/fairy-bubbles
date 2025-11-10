-- Migration: Add combo system for habit completion multipliers
-- Created: 2025-11-10

CREATE TABLE IF NOT EXISTS user_combo_stats (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_combo INTEGER DEFAULT 0 NOT NULL,
  daily_high_score INTEGER DEFAULT 0 NOT NULL,
  last_completion_time TIMESTAMP,
  combo_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_combo_user_id ON user_combo_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_combo_expires ON user_combo_stats(combo_expires_at);
