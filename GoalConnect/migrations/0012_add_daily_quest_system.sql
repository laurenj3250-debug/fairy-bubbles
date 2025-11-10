-- Migration: Add daily quest system for bonus token rewards
-- Created: 2025-11-10

-- Quest templates
CREATE TABLE IF NOT EXISTS daily_quests (
  id SERIAL PRIMARY KEY,
  quest_type VARCHAR(50) NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  target_value INTEGER NOT NULL,
  reward_tokens INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- User quest assignments and progress
CREATE TABLE IF NOT EXISTS user_daily_quests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_date DATE NOT NULL,
  quest_id INTEGER NOT NULL REFERENCES daily_quests(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0 NOT NULL,
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  claimed BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE(user_id, quest_date, quest_id)
);

-- Insert default quest templates
INSERT INTO daily_quests (quest_type, title, description, target_value, reward_tokens) VALUES
  ('complete_training', 'Complete 3 Training Habits', 'Finish 3 habits in the Foundation category', 3, 30),
  ('maintain_streak', 'Maintain Your Streak', 'Log at least one habit today to keep your streak alive', 1, 20),
  ('complete_adventure', 'Adventure Day', 'Complete 1 Adventure habit', 1, 40),
  ('log_before_noon', 'Early Bird', 'Log a habit before 12:00 PM', 1, 25),
  ('perfect_day', 'Perfect Day', 'Complete all habits for the day', 1, 50),
  ('complete_mind', 'Mental Clarity', 'Complete 3 Mind category habits', 3, 30),
  ('complete_five', 'Five for Five', 'Complete any 5 habits today', 5, 35),
  ('weekend_warrior', 'Weekend Warrior', 'Complete 3 habits on Saturday or Sunday', 3, 35)
ON CONFLICT (quest_type) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_user_daily_quests_user_date ON user_daily_quests(user_id, quest_date);
CREATE INDEX IF NOT EXISTS idx_user_daily_quests_claimed ON user_daily_quests(claimed);
