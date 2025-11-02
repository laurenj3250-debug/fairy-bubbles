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
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL not configured');
  }

  // Simple connection - let the connection string handle SSL via sslmode=require
  const client = new Pool({
    connectionString,
    max: 1, // Vercel serverless: keep connections minimal
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  try {
    const result = await client.query(sql, params);
    await client.end();
    return result;
  } catch (error) {
    await client.end();
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

app.get('/init-database', async (_req, res) => {
  try {
    // Create tables
    await queryDb(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS habits (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name TEXT NOT NULL,
        description TEXT,
        frequency TEXT NOT NULL DEFAULT 'weekly',
        target_count INTEGER DEFAULT 4,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS goals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        title TEXT NOT NULL,
        description TEXT,
        category TEXT,
        target_value INTEGER DEFAULT 1,
        current_value INTEGER DEFAULT 0,
        deadline TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS habit_logs (
        id SERIAL PRIMARY KEY,
        habit_id INTEGER REFERENCES habits(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        completed_at TIMESTAMPTZ DEFAULT NOW(),
        notes TEXT
      );
    `);

    // Insert user
    await queryDb(
      `INSERT INTO users (id, email, name)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name`,
      [USER_ID, `${USERNAME}@goalconnect.local`, 'Lauren']
    );

    // Insert November goals (only if they don't exist)
    const goals = [
      ['Pimsleur: 16 lessons', 'Complete 16 Pimsleur lessons for language learning', 'Language', 16],
      ['Duolingo: 1 unit', 'Complete 1 full Duolingo unit', 'Language', 1],
      ['Complete 16 Gym Sessions', 'Hit the gym 16 times this month', 'Fitness', 16],
      ['Play Piano 12 times', 'Practice piano 12 sessions', 'Hobbies', 12],
      ['Ship 1 App Feature', 'Complete and deploy one app feature', 'Projects', 1]
    ];

    for (const [title, description, category, target] of goals) {
      await queryDb(
        `INSERT INTO goals (user_id, title, description, category, target_value, current_value, deadline)
         SELECT $1, $2, $3, $4, $5, 0, $6
         WHERE NOT EXISTS (
           SELECT 1 FROM goals WHERE user_id = $1 AND title = $2
         )`,
        [USER_ID, title, description, category, target, '2025-11-30']
      );
    }

    // Insert weekly habits (only if they don't exist)
    const habits = [
      ['Pimsleur', 'Complete 1 Pimsleur lesson', 'weekly', 4],
      ['Duolingo', 'Do Duolingo practice', 'weekly', 5],
      ['Gym', 'Go to the gym', 'weekly', 4],
      ['Piano', 'Practice piano', 'weekly', 3]
    ];

    for (const [name, description, frequency, target] of habits) {
      await queryDb(
        `INSERT INTO habits (user_id, name, description, frequency, target_count)
         SELECT $1, $2, $3, $4, $5
         WHERE NOT EXISTS (
           SELECT 1 FROM habits WHERE user_id = $1 AND name = $2
         )`,
        [USER_ID, name, description, frequency, target]
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
      'SELECT * FROM habits WHERE user_id = $1 ORDER BY created_at DESC',
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
    const { name, description, frequency, target_count } = req.body;
    const result = await queryDb(
      `INSERT INTO habits (user_id, name, description, frequency, target_count)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [USER_ID, name, description || '', frequency || 'weekly', target_count || 4]
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
      'SELECT * FROM goals WHERE user_id = $1 ORDER BY deadline ASC, created_at DESC',
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
    const { title, description, category, target_value, deadline } = req.body;
    const result = await queryDb(
      `INSERT INTO goals (user_id, title, description, category, target_value, current_value, deadline)
       VALUES ($1, $2, $3, $4, $5, 0, $6)
       RETURNING *`,
      [USER_ID, title, description || '', category || '', target_value || 1, deadline || null]
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
    const { current_value } = req.body;
    const result = await queryDb(
      `UPDATE goals SET current_value = $1 WHERE id = $2 AND user_id = $3 RETURNING *`,
      [current_value, id, USER_ID]
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
    const { date } = req.query;
    let query = 'SELECT * FROM habit_logs WHERE user_id = $1';
    const params: any[] = [USER_ID];

    if (date) {
      query += ` AND DATE(completed_at) = $2`;
      params.push(date);
    }

    query += ' ORDER BY completed_at DESC';

    const result = await queryDb(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching habit logs:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/habit-logs', async (req, res) => {
  try {
    const { habit_id, notes } = req.body;
    const result = await queryDb(
      `INSERT INTO habit_logs (habit_id, user_id, notes, completed_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [habit_id, USER_ID, notes || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating habit log:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
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
