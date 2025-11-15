-- Add test habits for Today's Pitch to see glowing climbing holds
-- These habits will show up in Today's Pitch section

-- First, check if user 1 exists
DO $$
DECLARE
  v_user_id INTEGER := 1;
  v_today VARCHAR(10) := TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD');
  v_habit_count INTEGER;
BEGIN
  -- Count existing habits
  SELECT COUNT(*) INTO v_habit_count FROM habits WHERE user_id = v_user_id;

  IF v_habit_count > 0 THEN
    RAISE NOTICE 'User already has % habit(s). Checking if they will show in Today''s Pitch...', v_habit_count;

    -- Show existing habits
    FOR rec IN (SELECT id, title, category, cadence, scheduled_day FROM habits WHERE user_id = v_user_id) LOOP
      RAISE NOTICE '  - % (category: %, cadence: %, scheduled: %)', rec.title, rec.category, rec.cadence, COALESCE(rec.scheduled_day, 'unscheduled');
    END LOOP;

    -- Check if adventure habits need scheduling
    FOR rec IN (SELECT id, title FROM habits WHERE user_id = v_user_id AND category = 'adventure' AND scheduled_day IS NULL) LOOP
      RAISE NOTICE '⚠️  Adventure habit "%" is not scheduled. It won''t show in Today''s Pitch until scheduled.', rec.title;
    END LOOP;

  ELSE
    RAISE NOTICE 'No habits found for user %. Adding test habits...', v_user_id;

    -- Add 3 test habits with different categories
    INSERT INTO habits (user_id, title, description, icon, color, cadence, category, effort, grade, difficulty)
    VALUES
      -- Mind category habit
      (v_user_id, 'Morning Stretch', 'Light morning movement to start the day', '🧘',
       'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 'daily', 'mind', 'light', '5.6', 'easy'),

      -- Foundation category habit
      (v_user_id, 'Push-ups', 'Build upper body strength', '💪',
       'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 'daily', 'foundation', 'medium', '5.9', 'medium'),

      -- Training category habit
      (v_user_id, 'Read 20 min', 'Daily reading practice', '📚',
       'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 'daily', 'training', 'light', '5.7', 'easy');

    RAISE NOTICE '✅ Added 3 test habits (mind, foundation, training)';

    -- Now add an adventure habit scheduled for today so it shows up
    INSERT INTO habits (user_id, title, description, icon, color, cadence, category, effort, grade, difficulty, scheduled_day)
    VALUES
      (v_user_id, 'Outdoor Adventure', 'Weekly outdoor activity - hike, climb, or explore', '🏔️',
       'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', 'weekly', 'adventure', 'heavy', '5.11', 'hard', v_today);

    RAISE NOTICE '✅ Added 1 adventure habit scheduled for today';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Total habits that will show in Today''s Pitch: 4';
    RAISE NOTICE '   - Mind: 1';
    RAISE NOTICE '   - Foundation: 1';
    RAISE NOTICE '   - Training: 1';
    RAISE NOTICE '   - Adventure: 1 (scheduled for today)';
    RAISE NOTICE '';
    RAISE NOTICE 'Refresh the app to see the glowing climbing holds! 🧗';
  END IF;
END $$;
