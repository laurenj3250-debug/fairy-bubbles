/**
 * VERCEL-OPTIMIZED API
 * Self-contained serverless function with NO external imports from server/
 * Designed for cross-device user profiles with database persistence
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import express, { type Request, type Response } from 'express';
import pkg from 'pg';
const { Pool } = pkg;

const app = express();
app.use(express.json());

// ============================================================================
// CONFIGURATION
// ============================================================================

const USER_ID = 1;
const USERNAME = 'laurenj3250';

// ============================================================================
// DATABASE CONNECTION (Simple & Clean)
// ============================================================================

async function queryDb(sql: string, params: any[] = []) {
  let connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL not configured');
  }

  // NUCLEAR OPTION: Completely disable SSL verification
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  // Remove any sslmode parameter that might conflict
  connectionString = connectionString.replace(/[?&]sslmode=[^&]+/, '');

  const isLocalhost = connectionString.includes('localhost') ||
                      connectionString.includes('127.0.0.1');

  // Use a single client instead of a pool for serverless
  const { Client } = pkg;

  const client = new Client({
    connectionString,
    ssl: !isLocalhost,
  });

  try {
    await client.connect();
    const result = await client.query(sql, params);
    await client.end();
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    try {
      await client.end();
    } catch (e) {
      // Ignore end errors
    }
    throw error;
  }
}

// ============================================================================
// AUTHENTICATION (Simple - Always Authenticated)
// ============================================================================

app.post('/auth/login', (_req, res) => {
  res.json({
    authenticated: true,
    user: { id: USER_ID, email: `${USERNAME}@goalconnect.local`, name: 'Lauren' }
  });
});

app.get('/auth/session', (_req, res) => {
  res.json({
    authenticated: true,
    user: { id: USER_ID, email: `${USERNAME}@goalconnect.local`, name: 'Lauren' }
  });
});

app.post('/auth/logout', (_req, res) => {
  res.json({ authenticated: false });
});

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

app.get('/reset-database', async (_req, res) => {
  try {
    // DROP all tables and recreate from scratch
    await queryDb(`
      DROP TABLE IF EXISTS habit_logs CASCADE;
      DROP TABLE IF EXISTS todos CASCADE;
      DROP TABLE IF EXISTS goals CASCADE;
      DROP TABLE IF EXISTS habits CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    res.json({
      success: true,
      message: 'All tables dropped! Now visit /api/init-database to recreate them.'
    });
  } catch (error: any) {
    console.error('Database reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset database',
      error: error.message
    });
  }
});

app.get('/init-database', async (_req, res) => {
  try {
    // Create tables matching the actual Drizzle schema
    await queryDb(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS habits (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        icon TEXT NOT NULL,
        color VARCHAR(7) NOT NULL,
        cadence VARCHAR(10) NOT NULL,
        target_per_week INTEGER DEFAULT NULL
      );

      CREATE TABLE IF NOT EXISTS habit_logs (
        id SERIAL PRIMARY KEY,
        habit_id INTEGER NOT NULL REFERENCES habits(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        date VARCHAR(10) NOT NULL,
        completed BOOLEAN NOT NULL DEFAULT false,
        note TEXT,
        mood INTEGER,
        energy_level INTEGER,
        UNIQUE(habit_id, user_id, date)
      );

      CREATE TABLE IF NOT EXISTS goals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        target_value INTEGER NOT NULL,
        current_value INTEGER NOT NULL DEFAULT 0,
        unit TEXT NOT NULL,
        deadline VARCHAR(10) NOT NULL,
        category TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS goal_updates (
        id SERIAL PRIMARY KEY,
        goal_id INTEGER NOT NULL REFERENCES goals(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        date VARCHAR(10) NOT NULL,
        value INTEGER NOT NULL,
        note TEXT
      );

      CREATE TABLE IF NOT EXISTS todos (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        due_date VARCHAR(10),
        completed BOOLEAN NOT NULL DEFAULT false,
        completed_at TIMESTAMPTZ,
        points INTEGER NOT NULL DEFAULT 10,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS virtual_pets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
        name TEXT NOT NULL DEFAULT 'Forest Friend',
        species VARCHAR(50) NOT NULL DEFAULT 'Gremlin',
        happiness INTEGER NOT NULL DEFAULT 50,
        health INTEGER NOT NULL DEFAULT 100,
        level INTEGER NOT NULL DEFAULT 1,
        experience INTEGER NOT NULL DEFAULT 0,
        evolution VARCHAR(20) NOT NULL DEFAULT 'seed',
        current_costume_id INTEGER,
        last_fed TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS user_points (
        user_id INTEGER PRIMARY KEY REFERENCES users(id),
        total_earned INTEGER NOT NULL DEFAULT 0,
        total_spent INTEGER NOT NULL DEFAULT 0,
        available INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS point_transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        amount INTEGER NOT NULL,
        type VARCHAR(30) NOT NULL,
        related_id INTEGER,
        description TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS costumes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        category VARCHAR(50) NOT NULL,
        rarity VARCHAR(20) NOT NULL,
        price INTEGER NOT NULL,
        image_url TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS user_costumes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        costume_id INTEGER NOT NULL REFERENCES costumes(id),
        equipped BOOLEAN DEFAULT false,
        purchased_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        UNIQUE(user_id, costume_id)
      );
    `);

    // Migrate existing tables to add missing columns
    await queryDb(`
      -- Add target_per_week to habits table if it doesn't exist
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'habits' AND column_name = 'target_per_week'
        ) THEN
          ALTER TABLE habits ADD COLUMN target_per_week INTEGER DEFAULT NULL;
        END IF;
      END $$;

      -- Add mood to habit_logs table if it doesn't exist
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'habit_logs' AND column_name = 'mood'
        ) THEN
          ALTER TABLE habit_logs ADD COLUMN mood INTEGER;
        END IF;
      END $$;

      -- Add energy_level to habit_logs table if it doesn't exist
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'habit_logs' AND column_name = 'energy_level'
        ) THEN
          ALTER TABLE habit_logs ADD COLUMN energy_level INTEGER;
        END IF;
      END $$;

      -- Add UNIQUE constraint to habit_logs if it doesn't exist
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'habit_logs_habit_id_user_id_date_key'
        ) THEN
          ALTER TABLE habit_logs ADD CONSTRAINT habit_logs_habit_id_user_id_date_key
          UNIQUE (habit_id, user_id, date);
        END IF;
      END $$;
    `);

    // Insert user
    await queryDb(
      `INSERT INTO users (id, name, email)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name`,
      [USER_ID, 'Lauren', `${USERNAME}@goalconnect.local`]
    );

    // Initialize user points
    await queryDb(
      `INSERT INTO user_points (user_id, total_earned, total_spent, available)
       VALUES ($1, 0, 0, 0)
       ON CONFLICT (user_id) DO NOTHING`,
      [USER_ID]
    );

    // Insert November goals with proper schema (only if they don't exist)
    const goals = [
      ['Pimsleur: 16 lessons', 'Complete 16 Pimsleur lessons for language learning', 'Language learning', 16, 'lessons', '2025-11-30'],
      ['Duolingo: 1 unit', 'Complete 1 full Duolingo unit', 'Language learning', 1, 'unit', '2025-11-30'],
      ['Complete 16 Gym Sessions', 'Hit the gym 16 times this month', 'Fitness', 16, 'sessions', '2025-11-30'],
      ['Play Piano 12 times', 'Practice piano 12 sessions', 'Hobbies', 12, 'times', '2025-11-30'],
      ['Ship 1 App Feature', 'Complete and deploy one app feature', 'Projects', 1, 'feature', '2025-11-30']
    ];

    for (const [title, description, category, target, unit, deadline] of goals) {
      await queryDb(
        `INSERT INTO goals (user_id, title, description, category, target_value, current_value, unit, deadline)
         SELECT $1, $2, $3, $4, $5, 0, $6, $7
         WHERE NOT EXISTS (
           SELECT 1 FROM goals WHERE user_id = $1 AND title = $2
         )`,
        [USER_ID, title, description, category, target, unit, deadline]
      );
    }

    // Insert weekly habits with proper schema (only if they don't exist)
    const habits = [
      ['Pimsleur', 'Complete 1 Pimsleur lesson', 'BookOpen', '#10B981', 'weekly', 4],
      ['Duolingo', 'Do Duolingo practice', 'Languages', '#3B82F6', 'daily', 7],
      ['Gym', 'Go to the gym', 'Dumbbell', '#EF4444', 'weekly', 3],
      ['Piano', 'Practice piano', 'Music', '#8B5CF6', 'weekly', 3]
    ];

    for (const [title, description, icon, color, cadence, targetPerWeek] of habits) {
      await queryDb(
        `INSERT INTO habits (user_id, title, description, icon, color, cadence, target_per_week)
         SELECT $1, $2, $3, $4, $5, $6, $7
         WHERE NOT EXISTS (
           SELECT 1 FROM habits WHERE user_id = $1 AND title = $2
         )`,
        [USER_ID, title, description, icon, color, cadence, targetPerWeek]
      );
    }

    // Insert default costumes (only if they don't exist)
    const costumes = [
      // Popular character-inspired costumes
      ['Pirate Captain', 'Inspired by Jack Sparrow - Adventure awaits!', 'outfit', 'legendary', 150, 'https://api.dicebear.com/7.x/avataaars/svg?seed=pirate&clothing=blazerShirt&clothingColor=262E33&accessories=eyepatch'],
      ['Monster Inc Employee', 'Inspired by Mike Wazowski - Scare up some habits!', 'outfit', 'epic', 120, 'https://api.dicebear.com/7.x/bottts/svg?seed=monster&backgroundColor=b6e3f4'],
      ['Superhero Suit', 'Classic hero outfit with cape', 'outfit', 'legendary', 200, 'https://api.dicebear.com/7.x/avataaars/svg?seed=hero&top=shortHairDreads01&clothing=overall&facialHair=blank'],
      ['Wizard Robes', 'Magical robes for the wise', 'outfit', 'epic', 100, 'https://api.dicebear.com/7.x/avataaars/svg?seed=wizard&top=longHairBigHair&clothing=graphicShirt&accessories=prescription02'],
      ['Space Explorer', 'Astronaut gear for cosmic adventures', 'outfit', 'epic', 110, 'https://api.dicebear.com/7.x/avataaars/svg?seed=space&top=shortHairShortFlat&clothing=overall&backgroundColor=ffdfbf'],
      ['Knight Armor', 'Defend your habits with honor', 'outfit', 'rare', 80, 'https://api.dicebear.com/7.x/avataaars/svg?seed=knight&clothing=hoodie&clothingColor=3c4f5c'],

      // Hats
      ['Pirate Hat', 'Classic tricorn hat', 'hat', 'rare', 50, 'https://api.dicebear.com/7.x/avataaars/svg?seed=piratehat&top=hat'],
      ['Crown', 'Royal headwear', 'hat', 'legendary', 150, 'https://api.dicebear.com/7.x/avataaars/svg?seed=crown&top=hijab&backgroundColor=ffd700'],
      ['Chef Hat', 'For culinary masters', 'hat', 'common', 20, 'https://api.dicebear.com/7.x/avataaars/svg?seed=chef&top=winterHat2'],

      // Accessories
      ['Cool Shades', 'Stylish sunglasses', 'accessory', 'common', 15, 'https://api.dicebear.com/7.x/avataaars/svg?seed=shades&accessories=sunglasses'],
      ['Eye Patch', 'Pirate essential', 'accessory', 'common', 10, 'https://api.dicebear.com/7.x/avataaars/svg?seed=eyepatch&accessories=eyepatch'],

      // Backgrounds
      ['Ocean Waves', 'Pirate ship backdrop', 'background', 'rare', 60, 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400&h=400&fit=crop'],
      ['Space Galaxy', 'Cosmic background', 'background', 'epic', 90, 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=400&fit=crop'],
      ['Magical Forest', 'Enchanted woodland', 'background', 'rare', 75, 'https://images.unsplash.com/photo-1511497584788-876760111969?w=400&h=400&fit=crop']
    ];

    for (const [name, description, category, rarity, price, imageUrl] of costumes) {
      await queryDb(
        `INSERT INTO costumes (name, description, category, rarity, price, image_url)
         SELECT $1, $2, $3, $4, $5, $6
         WHERE NOT EXISTS (
           SELECT 1 FROM costumes WHERE name = $1
         )`,
        [name, description, category, rarity, price, imageUrl]
      );
    }

    res.json({
      success: true,
      message: 'Database initialized! Your November goals and habits are ready across all devices.',
      user: USERNAME
    });

  } catch (error: any) {
    console.error('Database initialization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize database',
      error: error.message
    });
  }
});

// ============================================================================
// HABITS API
// ============================================================================

app.get('/habits', async (_req, res) => {
  try {
    const result = await queryDb(
      'SELECT * FROM habits WHERE user_id = $1',
      [USER_ID]
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching habits:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/habits', async (req, res) => {
  try {
    const { title, description, icon, color, cadence, targetPerWeek } = req.body;
    const result = await queryDb(
      `INSERT INTO habits (user_id, title, description, icon, color, cadence, target_per_week)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [USER_ID, title, description || '', icon, color, cadence, targetPerWeek]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating habit:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// GOALS API
// ============================================================================

app.get('/goals', async (_req, res) => {
  try {
    const result = await queryDb(
      'SELECT * FROM goals WHERE user_id = $1 ORDER BY deadline ASC',
      [USER_ID]
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/goals', async (req, res) => {
  try {
    const { title, description, category, targetValue, unit, deadline } = req.body;
    const result = await queryDb(
      `INSERT INTO goals (user_id, title, description, category, target_value, current_value, unit, deadline)
       VALUES ($1, $2, $3, $4, $5, 0, $6, $7)
       RETURNING *`,
      [USER_ID, title, description || '', category || '', targetValue || 1, unit || '', deadline || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating goal:', error);
    res.status(500).json({ error: error.message });
  }
});

app.patch('/goals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { currentValue } = req.body;
    const result = await queryDb(
      `UPDATE goals SET current_value = $1 WHERE id = $2 AND user_id = $3 RETURNING *`,
      [currentValue, id, USER_ID]
    );
    res.json(result.rows[0] || {});
  } catch (error: any) {
    console.error('Error updating goal:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// HABIT LOGS API
// ============================================================================

app.get('/habit-logs', async (req, res) => {
  try {
    const { date, habitId } = req.query;
    let query = 'SELECT * FROM habit_logs WHERE user_id = $1';
    const params: any[] = [USER_ID];

    if (date) {
      query += ` AND date = $${params.length + 1}`;
      params.push(date);
    }

    if (habitId) {
      query += ` AND habit_id = $${params.length + 1}`;
      params.push(habitId);
    }

    query += ' ORDER BY date DESC';

    const result = await queryDb(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching habit logs:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/habit-logs', async (req, res) => {
  try {
    const { habitId, date, completed, note, mood, energyLevel } = req.body;

    // Use UPSERT to handle duplicate (habit_id, user_id, date) gracefully
    const result = await queryDb(
      `INSERT INTO habit_logs (habit_id, user_id, date, completed, note, mood, energy_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (habit_id, user_id, date)
       DO UPDATE SET
         completed = EXCLUDED.completed,
         note = COALESCE(EXCLUDED.note, habit_logs.note),
         mood = COALESCE(EXCLUDED.mood, habit_logs.mood),
         energy_level = COALESCE(EXCLUDED.energy_level, habit_logs.energy_level)
       RETURNING *`,
      [habitId, USER_ID, date, completed !== false, note || null, mood || null, energyLevel || null]
    );

    // Award points if habit is completed and wasn't already completed
    const wasAlreadyCompleted = result.rows[0].completed && completed === false;
    if (completed !== false && !wasAlreadyCompleted) {
      const POINTS_PER_HABIT = 10;

      // Check if user_points row exists, create if not
      await queryDb(
        `INSERT INTO user_points (user_id, total_earned, available, total_spent)
         VALUES ($1, 0, 0, 0)
         ON CONFLICT (user_id) DO NOTHING`,
        [USER_ID]
      );

      await queryDb(
        `UPDATE user_points
         SET total_earned = total_earned + $1, available = available + $1
         WHERE user_id = $2`,
        [POINTS_PER_HABIT, USER_ID]
      );

      // Log the transaction
      await queryDb(
        `INSERT INTO point_transactions (user_id, amount, type, related_id, description)
         VALUES ($1, $2, 'habit_completion', $3, $4)`,
        [USER_ID, POINTS_PER_HABIT, habitId, 'Completed habit']
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating habit log:', error);
    res.status(500).json({ error: error.message });
  }
});

// Toggle habit completion (smart endpoint)
app.post('/habit-logs/toggle', async (req, res) => {
  try {
    const { habitId, date } = req.body;

    // Find existing log for this habit on this date
    const existingLog = await queryDb(
      `SELECT * FROM habit_logs WHERE habit_id = $1 AND user_id = $2 AND date = $3`,
      [habitId, USER_ID, date]
    );

    let result;
    let pointsAwarded = false;

    if (existingLog.rows.length > 0) {
      // Toggle existing log
      const log = existingLog.rows[0];
      const newCompleted = !log.completed;

      result = await queryDb(
        `UPDATE habit_logs SET completed = $1 WHERE id = $2 RETURNING *`,
        [newCompleted, log.id]
      );

      // Award or deduct points
      if (newCompleted && !log.completed) {
        // Just completed - award points
        const POINTS_PER_HABIT = 10;

        await queryDb(
          `INSERT INTO user_points (user_id, total_earned, available, total_spent)
           VALUES ($1, 0, 0, 0)
           ON CONFLICT (user_id) DO NOTHING`,
          [USER_ID]
        );

        await queryDb(
          `UPDATE user_points
           SET total_earned = total_earned + $1, available = available + $1
           WHERE user_id = $2`,
          [POINTS_PER_HABIT, USER_ID]
        );

        await queryDb(
          `INSERT INTO point_transactions (user_id, amount, type, related_id, description)
           VALUES ($1, $2, 'habit_completion', $3, $4)`,
          [USER_ID, POINTS_PER_HABIT, habitId, 'Completed habit']
        );

        pointsAwarded = true;
      } else if (!newCompleted && log.completed) {
        // Uncompleted - deduct points
        const POINTS_PER_HABIT = 10;

        await queryDb(
          `UPDATE user_points
           SET total_spent = total_spent + $1, available = available - $1
           WHERE user_id = $2`,
          [POINTS_PER_HABIT, USER_ID]
        );

        pointsAwarded = false;
      }
    } else {
      // Create new log as completed
      result = await queryDb(
        `INSERT INTO habit_logs (habit_id, user_id, date, completed, note, mood, energy_level)
         VALUES ($1, $2, $3, true, null, null, null)
         RETURNING *`,
        [habitId, USER_ID, date]
      );

      // Award points
      const POINTS_PER_HABIT = 10;

      await queryDb(
        `INSERT INTO user_points (user_id, total_earned, available, total_spent)
         VALUES ($1, 0, 0, 0)
         ON CONFLICT (user_id) DO NOTHING`,
        [USER_ID]
      );

      await queryDb(
        `UPDATE user_points
         SET total_earned = total_earned + $1, available = available + $1
         WHERE user_id = $2`,
        [POINTS_PER_HABIT, USER_ID]
      );

      await queryDb(
        `INSERT INTO point_transactions (user_id, amount, type, related_id, description)
         VALUES ($1, $2, 'habit_completion', $3, $4)`,
        [USER_ID, POINTS_PER_HABIT, habitId, 'Completed habit']
      );

      pointsAwarded = true;
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error toggling habit log:', error);
    res.status(500).json({ error: error.message });
  }
});

app.patch('/habit-logs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { completed, note, mood, energyLevel } = req.body;

    // Get the current state before updating
    const currentLog = await queryDb(
      `SELECT * FROM habit_logs WHERE id = $1 AND user_id = $2`,
      [id, USER_ID]
    );

    if (currentLog.rows.length === 0) {
      return res.status(404).json({ error: 'Habit log not found' });
    }

    const wasCompleted = currentLog.rows[0].completed;

    // Build dynamic update query to only update provided fields
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (completed !== undefined) {
      updates.push(`completed = $${paramIndex++}`);
      params.push(completed);
    }

    if (note !== undefined) {
      updates.push(`note = $${paramIndex++}`);
      params.push(note);
    }

    if (mood !== undefined) {
      updates.push(`mood = $${paramIndex++}`);
      params.push(mood);
    }

    if (energyLevel !== undefined) {
      updates.push(`energy_level = $${paramIndex++}`);
      params.push(energyLevel);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id, USER_ID);

    const result = await queryDb(
      `UPDATE habit_logs SET ${updates.join(', ')}
       WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1} RETURNING *`,
      params
    );

    // Handle points if completion status changed
    if (completed !== undefined && completed !== wasCompleted) {
      const POINTS_PER_HABIT = 10;
      const pointChange = completed ? POINTS_PER_HABIT : -POINTS_PER_HABIT;

      await queryDb(
        `UPDATE user_points
         SET total_earned = CASE WHEN $1 > 0 THEN total_earned + $1 ELSE total_earned END,
             total_spent = CASE WHEN $1 < 0 THEN total_spent + ABS($1) ELSE total_spent END,
             available = available + $1
         WHERE user_id = $2`,
        [pointChange, USER_ID]
      );

      // Log the transaction
      await queryDb(
        `INSERT INTO point_transactions (user_id, amount, type, related_id, description)
         VALUES ($1, $2, $3, $4, $5)`,
        [USER_ID, Math.abs(pointChange), completed ? 'habit_completion' : 'habit_undo', currentLog.rows[0].habit_id, completed ? 'Completed habit' : 'Unchecked habit']
      );
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating habit log:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/habit-logs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await queryDb('DELETE FROM habit_logs WHERE id = $1 AND user_id = $2', [id, USER_ID]);
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting habit log:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete habit
app.delete('/habits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Delete related habit logs first to avoid foreign key constraint
    await queryDb('DELETE FROM habit_logs WHERE habit_id = $1 AND user_id = $2', [id, USER_ID]);
    // Then delete the habit
    await queryDb('DELETE FROM habits WHERE id = $1 AND user_id = $2', [id, USER_ID]);
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting habit:', error);
    res.status(500).json({ error: error.message });
  }
});

// Patch habit
app.patch('/habits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, icon, color, cadence, targetPerWeek } = req.body;
    const result = await queryDb(
      `UPDATE habits SET title = $1, description = $2, icon = $3, color = $4, cadence = $5, target_per_week = $6
       WHERE id = $7 AND user_id = $8 RETURNING *`,
      [title, description, icon, color, cadence, targetPerWeek, id, USER_ID]
    );
    res.json(result.rows[0] || {});
  } catch (error: any) {
    console.error('Error updating habit:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete goal
app.delete('/goals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await queryDb('DELETE FROM goals WHERE id = $1 AND user_id = $2', [id, USER_ID]);
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// TODOS API
// ============================================================================

app.get('/todos', async (_req, res) => {
  try {
    const result = await queryDb(
      'SELECT * FROM todos WHERE user_id = $1 ORDER BY due_date ASC NULLS LAST, created_at DESC',
      [USER_ID]
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching todos:', error);
    // If table doesn't exist yet, return empty array
    res.json([]);
  }
});

app.post('/todos', async (req, res) => {
  try {
    const { title, description, dueDate, points } = req.body;
    const result = await queryDb(
      `INSERT INTO todos (user_id, title, description, due_date, completed, points)
       VALUES ($1, $2, $3, $4, false, $5)
       RETURNING *`,
      [USER_ID, title, description || '', dueDate || null, points || 10]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating todo:', error);
    res.status(500).json({ error: error.message });
  }
});

app.patch('/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, dueDate, completed } = req.body;

    // Get current state to check if completion status changed
    const currentTodo = await queryDb(
      `SELECT * FROM todos WHERE id = $1 AND user_id = $2`,
      [id, USER_ID]
    );

    if (currentTodo.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const wasCompleted = currentTodo.rows[0].completed;

    let query = 'UPDATE todos SET';
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      params.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(description);
    }
    if (dueDate !== undefined) {
      updates.push(`due_date = $${paramIndex++}`);
      params.push(dueDate);
    }
    if (completed !== undefined) {
      updates.push(`completed = $${paramIndex++}`);
      params.push(completed);
      if (completed) {
        updates.push(`completed_at = NOW()`);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    query += ' ' + updates.join(', ');
    query += ` WHERE id = $${paramIndex++} AND user_id = $${paramIndex} RETURNING *`;
    params.push(id, USER_ID);

    const result = await queryDb(query, params);

    // Award points if todo was just completed
    if (completed !== undefined && completed && !wasCompleted) {
      const TODO_POINTS = 15;

      await queryDb(
        `UPDATE user_points
         SET total_earned = total_earned + $1, available = available + $1
         WHERE user_id = $2`,
        [TODO_POINTS, USER_ID]
      );

      await queryDb(
        `INSERT INTO point_transactions (user_id, amount, type, related_id, description)
         VALUES ($1, $2, 'todo_completion', $3, $4)`,
        [USER_ID, TODO_POINTS, id, `Completed: ${currentTodo.rows[0].title}`]
      );
    }

    // Deduct points if uncompleted
    if (completed !== undefined && !completed && wasCompleted) {
      const TODO_POINTS = 15;

      await queryDb(
        `UPDATE user_points
         SET total_spent = total_spent + $1, available = available - $1
         WHERE user_id = $2`,
        [TODO_POINTS, USER_ID]
      );

      await queryDb(
        `INSERT INTO point_transactions (user_id, amount, type, related_id, description)
         VALUES ($1, $2, 'todo_undo', $3, $4)`,
        [USER_ID, TODO_POINTS, id, `Uncompleted: ${currentTodo.rows[0].title}`]
      );
    }

    res.json(result.rows[0] || {});
  } catch (error: any) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/todos/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;

    // Get todo before completion
    const todoBefore = await queryDb(
      `SELECT * FROM todos WHERE id = $1 AND user_id = $2`,
      [id, USER_ID]
    );

    if (todoBefore.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const wasCompleted = todoBefore.rows[0].completed;

    const result = await queryDb(
      `UPDATE todos SET completed = true, completed_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, USER_ID]
    );

    // Award points if not already completed
    if (!wasCompleted) {
      const TODO_POINTS = 15;

      await queryDb(
        `UPDATE user_points
         SET total_earned = total_earned + $1, available = available + $1
         WHERE user_id = $2`,
        [TODO_POINTS, USER_ID]
      );

      await queryDb(
        `INSERT INTO point_transactions (user_id, amount, type, related_id, description)
         VALUES ($1, $2, 'todo_completion', $3, $4)`,
        [USER_ID, TODO_POINTS, id, `Completed: ${todoBefore.rows[0].title}`]
      );
    }

    res.json(result.rows[0] || {});
  } catch (error: any) {
    console.error('Error completing todo:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await queryDb('DELETE FROM todos WHERE id = $1 AND user_id = $2', [id, USER_ID]);
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// PET & GAMIFICATION API
// ============================================================================

app.get('/pet', async (_req, res) => {
  // Return default pet
  res.json({
    id: 1,
    user_id: USER_ID,
    name: 'Forest Friend',
    species: 'Gremlin',
    happiness: 75,
    health: 100,
    level: 1,
    experience: 0,
    evolution: 'seed'
  });
});

app.get('/points', async (_req, res) => {
  try {
    const result = await queryDb(
      `SELECT * FROM user_points WHERE user_id = $1`,
      [USER_ID]
    );

    if (result.rows.length === 0) {
      return res.json({
        userId: USER_ID,
        totalEarned: 0,
        totalSpent: 0,
        available: 0
      });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching points:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/user-points', async (_req, res) => {
  try {
    const result = await queryDb(
      `SELECT * FROM user_points WHERE user_id = $1`,
      [USER_ID]
    );

    if (result.rows.length === 0) {
      return res.json({
        userId: USER_ID,
        totalEarned: 0,
        totalSpent: 0,
        available: 0
      });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching user points:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/stats', async (_req, res) => {
  // Return basic stats
  res.json({
    totalHabits: 0,
    totalGoals: 0,
    completedToday: 0
  });
});

app.get('/costumes', async (_req, res) => {
  try {
    const result = await queryDb('SELECT * FROM costumes ORDER BY price ASC');
    res.json(result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      rarity: row.rarity,
      price: row.price,
      imageUrl: row.image_url
    })));
  } catch (error: any) {
    console.error('Error fetching costumes:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/user-costumes', async (_req, res) => {
  try {
    const result = await queryDb(
      'SELECT * FROM user_costumes WHERE user_id = $1',
      [USER_ID]
    );
    res.json(result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      costumeId: row.costume_id,
      equipped: row.is_equipped,
      purchasedAt: row.purchased_at
    })));
  } catch (error: any) {
    console.error('Error fetching user costumes:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/costumes/equipped', async (_req, res) => {
  try {
    const result = await queryDb(
      `SELECT c.* FROM costumes c
       JOIN user_costumes uc ON c.id = uc.costume_id
       WHERE uc.user_id = $1 AND uc.is_equipped = true`,
      [USER_ID]
    );
    res.json(result.rows.map(row => ({
      id: row.id,
      name: row.name,
      category: row.category,
      imageUrl: row.image_url
    })));
  } catch (error: any) {
    console.error('Error fetching equipped costumes:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/costumes/purchase', async (req, res) => {
  try {
    const { costumeId } = req.body;

    // Get costume details
    const costume = await queryDb(
      'SELECT * FROM costumes WHERE id = $1',
      [costumeId]
    );

    if (costume.rows.length === 0) {
      return res.status(404).json({ error: 'Costume not found' });
    }

    const price = costume.rows[0].price;

    // Check if user already owns it
    const existing = await queryDb(
      'SELECT * FROM user_costumes WHERE user_id = $1 AND costume_id = $2',
      [USER_ID, costumeId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Already owned' });
    }

    // Check if user has enough points
    const points = await queryDb(
      'SELECT * FROM user_points WHERE user_id = $1',
      [USER_ID]
    );

    if (points.rows.length === 0 || points.rows[0].available < price) {
      return res.status(400).json({ error: 'Insufficient points' });
    }

    // Deduct points
    await queryDb(
      `UPDATE user_points
       SET total_spent = total_spent + $1, available = available - $1
       WHERE user_id = $2`,
      [price, USER_ID]
    );

    // Add costume to user's collection
    await queryDb(
      `INSERT INTO user_costumes (user_id, costume_id)
       VALUES ($1, $2)`,
      [USER_ID, costumeId]
    );

    // Log transaction
    await queryDb(
      `INSERT INTO point_transactions (user_id, amount, type, related_id, description)
       VALUES ($1, $2, 'costume_purchase', $3, $4)`,
      [USER_ID, price, costumeId, `Purchased ${costume.rows[0].name}`]
    );

    res.json({ success: true, message: 'Costume purchased!' });
  } catch (error: any) {
    console.error('Error purchasing costume:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/reset-costumes', async (_req, res) => {
  try {
    // Delete all user costumes
    await queryDb('DELETE FROM user_costumes');

    // Delete all costumes
    await queryDb('DELETE FROM costumes');

    res.json({
      success: true,
      message: 'All costumes reset! Now visit /api/init-database to load new costumes.'
    });
  } catch (error: any) {
    console.error('Error resetting costumes:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/goal-updates', async (req, res) => {
  try {
    const { goalId, value, notes } = req.body;

    // Get goal before update
    const goalBefore = await queryDb(
      `SELECT * FROM goals WHERE id = $1 AND user_id = $2`,
      [goalId, USER_ID]
    );

    if (goalBefore.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const goal = goalBefore.rows[0];
    const progressBefore = (goal.current_value / goal.target_value) * 100;

    // Update the goal's current_value
    const result = await queryDb(
      `UPDATE goals SET current_value = current_value + $1 WHERE id = $2 AND user_id = $3 RETURNING *`,
      [value || 1, goalId, USER_ID]
    );

    const updatedGoal = result.rows[0];
    const progressAfter = (updatedGoal.current_value / updatedGoal.target_value) * 100;

    // Award points for progress
    const BASE_POINTS = 5;
    let totalPoints = BASE_POINTS;
    const milestones = [25, 50, 75, 100];
    const bonusAmount = 25;

    // Check if crossed any milestone thresholds
    for (const milestone of milestones) {
      if (progressBefore < milestone && progressAfter >= milestone) {
        totalPoints += bonusAmount;

        // Log milestone achievement
        await queryDb(
          `INSERT INTO point_transactions (user_id, amount, type, related_id, description)
           VALUES ($1, $2, 'goal_milestone', $3, $4)`,
          [USER_ID, bonusAmount, goalId, `Reached ${milestone}% milestone on ${goal.title}`]
        );
      }
    }

    // Award points
    await queryDb(
      `UPDATE user_points
       SET total_earned = total_earned + $1, available = available + $1
       WHERE user_id = $2`,
      [totalPoints, USER_ID]
    );

    // Log base progress transaction
    await queryDb(
      `INSERT INTO point_transactions (user_id, amount, type, related_id, description)
       VALUES ($1, $2, 'goal_progress', $3, $4)`,
      [USER_ID, BASE_POINTS, goalId, `Progress on ${goal.title}`]
    );

    res.status(201).json(result.rows[0] || {});
  } catch (error: any) {
    console.error('Error updating goal:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// HEALTH CHECK & DEBUG
// ============================================================================

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/debug/db-config', (_req, res) => {
  const hasVercelPostgres = !!process.env.POSTGRES_URL;
  const hasSupabase = !!process.env.DATABASE_URL;
  const activeUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL || 'NOT SET';
  const preview = activeUrl !== 'NOT SET'
    ? activeUrl.substring(0, 30) + '...'
    : 'NOT SET';

  res.json({
    vercel_postgres_configured: hasVercelPostgres,
    supabase_configured: hasSupabase,
    active_connection: preview,
    using: hasVercelPostgres ? 'Vercel Postgres' : (hasSupabase ? 'Supabase' : 'None')
  });
});

app.get('/debug/test-connection', async (_req, res) => {
  try {
    const result = await queryDb('SELECT NOW() as current_time');
    res.json({
      success: true,
      message: 'Database connection successful!',
      timestamp: result.rows[0]?.current_time
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code
    });
  }
});

// Catch all
app.all('*', (_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ============================================================================
// VERCEL SERVERLESS HANDLER
// ============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const path = req.url?.replace(/^\/api/, '') || '/';
  req.url = path;
  return app(req as any, res as any);
}
