-- Migration: Add sprites table and dream scroll wishlist
-- Sprites stored in PostgreSQL for persistence across deployments
-- Dream Scroll is a magical wishlist for goals/purchases/experiences
-- Date: 2025-11-08

-- ========== SPRITES (Game assets stored in database) ==========
CREATE TABLE IF NOT EXISTS sprites (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL UNIQUE,
  category VARCHAR(20) NOT NULL CHECK (category IN ('creature', 'biome', 'item', 'ui', 'uncategorized')),
  name TEXT, -- Optional name for creatures
  data TEXT NOT NULL, -- Base64-encoded image data
  mime_type TEXT NOT NULL, -- image/png, image/jpeg, etc.
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ========== DREAM SCROLL (Magical wishlist) ==========
CREATE TABLE IF NOT EXISTS dream_scroll_items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category VARCHAR(20) NOT NULL CHECK (category IN ('do', 'buy', 'see', 'visit', 'learn', 'experience')),
  priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  cost VARCHAR(10) CHECK (cost IN ('free', '$', '$$', '$$$')),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for user queries
CREATE INDEX IF NOT EXISTS idx_dream_scroll_user_id ON dream_scroll_items(user_id);
CREATE INDEX IF NOT EXISTS idx_dream_scroll_category ON dream_scroll_items(user_id, category);
CREATE INDEX IF NOT EXISTS idx_dream_scroll_completed ON dream_scroll_items(user_id, completed);
