-- Initial Schema Migration
-- Creates all tables from scratch for fresh Railway database
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

-- Create index on session expire for cleanup
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

-- Create habit_logs table
CREATE TABLE IF NOT EXISTS habit_logs (
  id SERIAL PRIMARY KEY,
  habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  completed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  notes TEXT
);

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  deadline TIMESTAMP,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  progress INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create todos table
CREATE TABLE IF NOT EXISTS todos (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create virtual_pets table
CREATE TABLE IF NOT EXISTS virtual_pets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL DEFAULT 'Gremlin',
  happiness INTEGER NOT NULL DEFAULT 50 CHECK (happiness >= 0 AND happiness <= 100),
  health INTEGER NOT NULL DEFAULT 50 CHECK (health >= 0 AND health <= 100),
  hunger INTEGER NOT NULL DEFAULT 50 CHECK (hunger >= 0 AND hunger <= 100),
  level INTEGER NOT NULL DEFAULT 1,
  experience INTEGER NOT NULL DEFAULT 0,
  last_fed TIMESTAMP,
  last_played TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  theme VARCHAR(10) DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create user_points table
CREATE TABLE IF NOT EXISTS user_points (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  total_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create costumes table
CREATE TABLE IF NOT EXISTS costumes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cost INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create user_costumes table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS user_costumes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  costume_id INTEGER NOT NULL REFERENCES costumes(id) ON DELETE CASCADE,
  purchased_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, costume_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id ON habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_id ON habit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_user_costumes_user_id ON user_costumes(user_id);

-- Add comments
COMMENT ON TABLE users IS 'User accounts with bcrypt hashed passwords';
COMMENT ON TABLE session IS 'Express session store managed by connect-pg-simple';
COMMENT ON TABLE habits IS 'User habits to track';
COMMENT ON TABLE habit_logs IS 'Logs of when habits were completed';
COMMENT ON TABLE goals IS 'User goals and progress';
COMMENT ON TABLE todos IS 'User todo items';
COMMENT ON TABLE virtual_pets IS 'User virtual pets (one per user)';
COMMENT ON TABLE user_settings IS 'User preferences';
COMMENT ON TABLE user_points IS 'User points for gamification';
COMMENT ON TABLE costumes IS 'Available costumes for pets';
COMMENT ON TABLE user_costumes IS 'Costumes purchased by users';
