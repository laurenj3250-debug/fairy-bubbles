-- Comprehensive seed script to populate all data for testing
-- Run this to see habits, goals, todos, and gamification features in action

-- Get the first user ID (replace with your actual user ID if needed)
DO $$
DECLARE
  v_user_id INTEGER;
  v_habit_id1 INTEGER;
  v_habit_id2 INTEGER;
  v_habit_id3 INTEGER;
  v_habit_id4 INTEGER;
  v_habit_id5 INTEGER;
  v_goal_id1 INTEGER;
  v_goal_id2 INTEGER;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Get first user
  SELECT id INTO v_user_id FROM users ORDER BY id LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'No users found. Please create an account first.';
    RETURN;
  END IF;

  RAISE NOTICE 'Seeding data for user ID: %', v_user_id;

  -- Clear existing data for this user
  DELETE FROM habit_logs WHERE user_id = v_user_id;
  DELETE FROM habits WHERE user_id = v_user_id;
  DELETE FROM goal_updates WHERE goal_id IN (SELECT id FROM goals WHERE user_id = v_user_id);
  DELETE FROM goals WHERE user_id = v_user_id;
  DELETE FROM todos WHERE user_id = v_user_id;

  RAISE NOTICE 'Cleared existing data';

  -- ==================== CREATE HABITS ====================

  -- Habit 1: Morning Stretch (Mind, Daily, Light)
  INSERT INTO habits (user_id, title, icon, category, effort, grade, cadence, description, color, difficulty, created_at)
  VALUES (v_user_id, 'Morning Stretch', '🧘', 'mind', 'light', '5.6', 'daily', 'Light morning movement',
          'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 'easy', NOW())
  RETURNING id INTO v_habit_id1;

  -- Habit 2: Gym Training (Training, Weekly 3x, Heavy)
  INSERT INTO habits (user_id, title, icon, category, effort, grade, cadence, target_per_week, description, color, difficulty, created_at)
  VALUES (v_user_id, 'Gym Training', '💪', 'training', 'heavy', '5.10', 'weekly', 3, 'Hard physical training',
          'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 'hard', NOW())
  RETURNING id INTO v_habit_id2;

  -- Habit 3: Read (Mind, Daily, Light)
  INSERT INTO habits (user_id, title, icon, category, effort, grade, cadence, description, color, difficulty, created_at)
  VALUES (v_user_id, 'Read', '📚', 'mind', 'light', '5.7', 'daily', 'Daily reading habit',
          'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 'easy', NOW())
  RETURNING id INTO v_habit_id3;

  -- Habit 4: Walk Outside (Foundation, Daily, Light)
  INSERT INTO habits (user_id, title, icon, category, effort, grade, cadence, description, color, difficulty, created_at)
  VALUES (v_user_id, 'Walk Outside', '🥾', 'foundation', 'light', '5.5', 'daily', 'Daily outdoor movement',
          'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', 'easy', NOW())
  RETURNING id INTO v_habit_id4;

  -- Habit 5: Meditate (Mind, Daily, Light)
  INSERT INTO habits (user_id, title, icon, category, effort, grade, cadence, description, color, difficulty, created_at)
  VALUES (v_user_id, 'Meditate', '🧠', 'mind', 'light', '5.8', 'daily', 'Mindfulness practice',
          'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', 'easy', NOW())
  RETURNING id INTO v_habit_id5;

  RAISE NOTICE 'Created 5 habits';

  -- ==================== CREATE HABIT LOGS (7 days of history) ====================

  -- Today: All habits completed
  INSERT INTO habit_logs (user_id, habit_id, date, completed) VALUES
    (v_user_id, v_habit_id1, v_today, true),
    (v_user_id, v_habit_id2, v_today, true),
    (v_user_id, v_habit_id3, v_today, true),
    (v_user_id, v_habit_id4, v_today, true),
    (v_user_id, v_habit_id5, v_today, true);

  -- Yesterday: Most completed
  INSERT INTO habit_logs (user_id, habit_id, date, completed) VALUES
    (v_user_id, v_habit_id1, v_today - 1, true),
    (v_user_id, v_habit_id3, v_today - 1, true),
    (v_user_id, v_habit_id4, v_today - 1, true),
    (v_user_id, v_habit_id5, v_today - 1, true);

  -- 2 days ago: Some completed
  INSERT INTO habit_logs (user_id, habit_id, date, completed) VALUES
    (v_user_id, v_habit_id1, v_today - 2, true),
    (v_user_id, v_habit_id3, v_today - 2, true),
    (v_user_id, v_habit_id4, v_today - 2, true);

  -- 3-6 days ago: Progressive history
  INSERT INTO habit_logs (user_id, habit_id, date, completed) VALUES
    (v_user_id, v_habit_id1, v_today - 3, true),
    (v_user_id, v_habit_id1, v_today - 4, true),
    (v_user_id, v_habit_id1, v_today - 5, true),
    (v_user_id, v_habit_id1, v_today - 6, true);

  RAISE NOTICE 'Created habit logs for 7 days';

  -- ==================== CREATE GOALS ====================

  -- Goal 1: Lose 10 pounds (Monthly goal)
  INSERT INTO goals (user_id, title, description, target_value, current_value, unit, deadline, category, priority, difficulty)
  VALUES (v_user_id, 'Lose 10 pounds', 'Get down to target weight',
          10, 5, 'pounds', (v_today + INTERVAL '30 days')::DATE, 'health', 'high', 'hard')
  RETURNING id INTO v_goal_id1;

  -- Add progress updates
  INSERT INTO goal_updates (goal_id, user_id, date, value, note) VALUES
    (v_goal_id1, v_user_id, (v_today - 7)::VARCHAR, 3, 'Lost 3 pounds this week!'),
    (v_goal_id1, v_user_id, (v_today - 3)::VARCHAR, 2, 'Down another 2 pounds');

  -- Goal 2: Read 3 books (Monthly goal)
  INSERT INTO goals (user_id, title, description, target_value, current_value, unit, deadline, category, priority, difficulty)
  VALUES (v_user_id, 'Read 3 books', 'Finish reading list for this month',
          3, 1, 'books', (v_today + INTERVAL '25 days')::DATE, 'learning', 'medium', 'medium')
  RETURNING id INTO v_goal_id2;

  -- Add progress
  INSERT INTO goal_updates (goal_id, user_id, date, value, note) VALUES
    (v_goal_id2, v_user_id, (v_today - 10)::VARCHAR, 1, 'Finished first book');

  RAISE NOTICE 'Created 2 goals with progress updates';

  -- ==================== CREATE TODOS ====================

  INSERT INTO todos (user_id, title, completed, difficulty, subtasks, created_at) VALUES
    (v_user_id, 'Buy new running shoes', false, 'easy', '[]', NOW()),
    (v_user_id, 'Schedule dentist appointment', false, 'easy', '[]', NOW()),
    (v_user_id, 'Meal prep for the week', false, 'medium',
     '[{"text": "Make grocery list", "completed": true}, {"text": "Shop for ingredients", "completed": false}, {"text": "Cook meals", "completed": false}]', NOW()),
    (v_user_id, 'Update resume', false, 'medium', '[]', NOW()),
    (v_user_id, 'Call mom', true, 'easy', '[]', NOW() - INTERVAL '1 day');

  RAISE NOTICE 'Created 5 todos';

  -- ==================== INITIALIZE GAMIFICATION ====================

  -- Give starting tokens
  INSERT INTO point_transactions (user_id, amount, source, description, created_at)
  VALUES (v_user_id, 250, 'Welcome bonus', 'Starting tokens', NOW());

  -- Initialize streak freezes
  INSERT INTO streak_freezes (user_id, count, updated_at)
  VALUES (v_user_id, 1, NOW())
  ON CONFLICT (user_id) DO UPDATE SET count = 1;

  -- Initialize climbing stats
  INSERT INTO player_climbing_stats (user_id, climbing_level, total_xp, summits, longest_streak, current_streak)
  VALUES (v_user_id, 3, 275, 2, 7, 7)
  ON CONFLICT (user_id) DO UPDATE
  SET climbing_level = 3, total_xp = 275, summits = 2, longest_streak = 7, current_streak = 7;

  RAISE NOTICE 'Initialized gamification data';

  -- ==================== SUCCESS ====================

  RAISE NOTICE '========================================';
  RAISE NOTICE 'SUCCESS! All test data created.';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Created:';
  RAISE NOTICE '  - 5 habits (daily + weekly mix)';
  RAISE NOTICE '  - 17 habit logs (7 days of history)';
  RAISE NOTICE '  - 2 goals with progress updates';
  RAISE NOTICE '  - 5 todos (1 completed)';
  RAISE NOTICE '  - 250 starting tokens';
  RAISE NOTICE '  - 1 streak freeze';
  RAISE NOTICE '  - Level 3 climbing stats';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Visit http://localhost:5000 to see everything!';

END $$;
