-- Migration: Add streak freeze system
-- Created: 2025-11-10

CREATE TABLE IF NOT EXISTS streak_freezes (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  freeze_count INTEGER DEFAULT 0 NOT NULL,
  last_earned_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_streak_freezes_user_id ON streak_freezes(user_id);
