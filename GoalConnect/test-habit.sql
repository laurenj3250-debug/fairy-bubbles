-- Insert a test habit to see the dashboard in action
INSERT INTO habits (user_id, title, icon, category, effort, grade, cadence, difficulty, target_per_week, color, description)
VALUES (1, 'Morning Stretch', '🧘', 'mind', 'light', '5.6', 'daily', 'easy', NULL, 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 'Light morning movement')
ON CONFLICT DO NOTHING;
