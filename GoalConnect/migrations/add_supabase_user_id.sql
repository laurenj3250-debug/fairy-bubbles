-- Migration: Add Supabase User ID to users table
-- Date: 2025-11-05
-- Purpose: Link local users with Supabase Auth users

-- Add supabase_user_id column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS supabase_user_id TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_supabase_user_id
ON users(supabase_user_id);

-- Add comment
COMMENT ON COLUMN users.supabase_user_id IS 'UUID from Supabase Auth';
