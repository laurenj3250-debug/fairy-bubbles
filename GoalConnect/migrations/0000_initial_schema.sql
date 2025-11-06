-- Initial Schema Migration for Railway PostgreSQL
-- Creates all tables from scratch
-- Date: 2025-11-06

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create session table for express-session
CREATE TABLE IF NOT EXISTS session (
  sid VARCHAR NOT NULL PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);
CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire);

-- Create habits table
CREATE TABLE IF NOT EXISTS habits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL,
  color VARCHAR(7) NOT NULL,
  cadence VARCHAR(10) NOT NULL CHECK (cadence IN ('daily', 'weekly')),
  target_per_week INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create habit_logs table with date field (VARCHAR) not timestamp
CREATE TABLE IF NOT EXISTS habit_logs (
  id SERIAL PRIMARY KEY,
  habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date VARCHAR(10) NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  note TEXT,
  mood INTEGER,
  energy_level INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS habit_logs_habit_id_user_id_date_key ON habit_logs(habit_id, user_id, date);

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  target_value INTEGER NOT NULL,
  current_value INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  deadline VARCHAR(10) NOT NULL,
  category TEXT NOT NULL
);

-- Create goal_updates table
CREATE TABLE IF NOT EXISTS goal_updates (
  id SERIAL PRIMARY KEY,
  goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date VARCHAR(10) NOT NULL,
  value INTEGER NOT NULL,
  note TEXT
);

-- Create todos table
CREATE TABLE IF NOT EXISTS todos (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  due_date VARCHAR(10),
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP,
  points INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create costumes table (must be before virtual_pets for FK)
CREATE TABLE IF NOT EXISTS costumes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category VARCHAR(20) NOT NULL CHECK (category IN ('hat', 'outfit', 'accessory', 'background')),
  price INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary'))
);

-- Create virtual_pets table
CREATE TABLE IF NOT EXISTS virtual_pets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL DEFAULT 'Forest Friend',
  species VARCHAR(50) NOT NULL DEFAULT 'Gremlin',
  happiness INTEGER NOT NULL DEFAULT 50 CHECK (happiness >= 0 AND happiness <= 100),
  health INTEGER NOT NULL DEFAULT 100 CHECK (health >= 0 AND health <= 100),
  level INTEGER NOT NULL DEFAULT 1,
  experience INTEGER NOT NULL DEFAULT 0,
  evolution VARCHAR(20) NOT NULL DEFAULT 'seed' CHECK (evolution IN ('seed', 'sprout', 'sapling', 'tree', 'ancient')),
  current_costume_id INTEGER REFERENCES costumes(id),
  last_fed TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  dark_mode BOOLEAN NOT NULL DEFAULT true,
  notifications BOOLEAN NOT NULL DEFAULT true
);

-- Create user_points table
CREATE TABLE IF NOT EXISTS user_points (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  available INTEGER NOT NULL DEFAULT 0
);

-- Create point_transactions table
CREATE TABLE IF NOT EXISTS point_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type VARCHAR(30) NOT NULL CHECK (type IN ('habit_complete', 'goal_progress', 'costume_purchase', 'daily_login', 'todo_complete')),
  related_id INTEGER,
  description TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create user_costumes table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS user_costumes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  costume_id INTEGER NOT NULL REFERENCES costumes(id) ON DELETE CASCADE,
  purchased_at TIMESTAMP NOT NULL DEFAULT NOW(),
  is_equipped BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id, costume_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id ON habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_id ON habit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_updates_goal_id ON goal_updates(goal_id);
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_user_costumes_user_id ON user_costumes(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON point_transactions(user_id);

-- Add comments
COMMENT ON TABLE users IS 'User accounts with bcrypt hashed passwords';
COMMENT ON TABLE session IS 'Express session store managed by connect-pg-simple';
COMMENT ON TABLE habits IS 'User habits to track (daily or weekly with targetPerWeek)';
COMMENT ON TABLE habit_logs IS 'Logs of when habits were completed (date as YYYY-MM-DD string)';
COMMENT ON TABLE goals IS 'User goals with progress tracking';
COMMENT ON TABLE goal_updates IS 'Updates to goal progress values';
COMMENT ON TABLE todos IS 'User todo items with points';
COMMENT ON TABLE virtual_pets IS 'User virtual pets (one per user) with evolution system';
COMMENT ON TABLE user_settings IS 'User preferences';
COMMENT ON TABLE user_points IS 'User points for gamification';
COMMENT ON TABLE point_transactions IS 'History of all point transactions';
COMMENT ON TABLE costumes IS 'Available costumes for pets';
COMMENT ON TABLE user_costumes IS 'Costumes purchased and equipped by users';
