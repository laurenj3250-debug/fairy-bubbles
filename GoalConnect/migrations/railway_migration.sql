-- Railway Migration: Switch from Supabase to Simple Auth
-- Date: 2025-11-05
-- Purpose: Add password field, remove supabase_user_id

-- Add password column to users table (will need to be populated manually or via registration)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password TEXT;

-- Drop the supabase_user_id column if it exists
ALTER TABLE users
DROP COLUMN IF EXISTS supabase_user_id;

-- Add comment
COMMENT ON COLUMN users.password IS 'Bcrypt hashed password';

-- Note: Existing users will need to re-register or have passwords set manually
-- The password column is required for new auth system but may be temporarily null for existing users
