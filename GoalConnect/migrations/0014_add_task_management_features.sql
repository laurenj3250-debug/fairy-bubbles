-- Migration: Add Todoist-level task management features
-- Projects, Labels, Priorities, and enhanced task metadata

-- Projects table (organize tasks into projects/areas)
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  icon TEXT DEFAULT '📁',
  parent_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  position INTEGER NOT NULL DEFAULT 0,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_parent_id ON projects(parent_id);

-- Labels table (flexible tagging system)
CREATE TABLE IF NOT EXISTS labels (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#gray',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_labels_user_id ON labels(user_id);
CREATE UNIQUE INDEX idx_labels_user_name ON labels(user_id, name);

-- Task-Label junction (many-to-many)
CREATE TABLE IF NOT EXISTS task_labels (
  task_id INTEGER NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  label_id INTEGER NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (task_id, label_id)
);

CREATE INDEX idx_task_labels_task_id ON task_labels(task_id);
CREATE INDEX idx_task_labels_label_id ON task_labels(label_id);

-- Add new columns to todos table
ALTER TABLE todos ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 4; -- 1=P1 (urgent), 4=P4 (low)
ALTER TABLE todos ADD COLUMN IF NOT EXISTS recurring_pattern TEXT; -- cron-like pattern
ALTER TABLE todos ADD COLUMN IF NOT EXISTS next_recurrence DATE; -- when next instance appears
ALTER TABLE todos ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0; -- manual ordering
ALTER TABLE todos ADD COLUMN IF NOT EXISTS notes TEXT; -- long-form notes
ALTER TABLE todos ADD COLUMN IF NOT EXISTS parent_task_id INTEGER REFERENCES todos(id) ON DELETE CASCADE; -- for subtask hierarchy

CREATE INDEX idx_todos_project_id ON todos(project_id);
CREATE INDEX idx_todos_priority ON todos(priority);
CREATE INDEX idx_todos_parent_task_id ON todos(parent_task_id);

-- Saved filters/views (custom smart lists)
CREATE TABLE IF NOT EXISTS saved_filters (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '🔍',
  filter_config JSONB NOT NULL, -- {projectIds: [1,2], labelIds: [3], priority: [1,2], etc}
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_saved_filters_user_id ON saved_filters(user_id);

-- Task comments (discussion threads)
CREATE TABLE IF NOT EXISTS task_comments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);

-- Productivity stats (karma/streaks tracking)
CREATE TABLE IF NOT EXISTS task_productivity_stats (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  karma_points INTEGER DEFAULT 0,
  tasks_completed_today INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_completion_date DATE,
  total_completed INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
