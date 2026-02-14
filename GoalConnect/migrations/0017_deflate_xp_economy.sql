-- Migration: Deflate XP economy by ~5x
-- Rationale: "1 XP = 1 meaningful action" — small numbers feel earned.
-- Previous: habit=5/10/15, now: 1/2/3. All values divided by ~5.
--
-- This migration adjusts existing balances and transaction history
-- to match the new XP_CONFIG values.

-- Deflate user point balances (round up for positive, preserve signs)
UPDATE user_points
SET
  total_earned = CEIL(total_earned::numeric / 5),
  total_spent  = CEIL(total_spent::numeric / 5),
  available    = CEIL(available::numeric / 5);

-- Deflate transaction history (positive amounts round up, negative round down)
UPDATE point_transactions
SET amount = CASE
  WHEN amount > 0 THEN CEIL(amount::numeric / 5)
  WHEN amount < 0 THEN FLOOR(amount::numeric / 5)
  ELSE 0
END;

-- Deflate custom reward costs to match new economy
UPDATE custom_rewards
SET cost = GREATEST(10, CEIL(cost::numeric / 5));
