import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;

const app = express();
app.use(express.json());

const USER_ID = 1;

// Simple in-memory storage as fallback
let inMemoryUser = { id: 1, email: 'laurenj3250@goalconnect.local', name: 'Lauren' };
let habits: any[] = [];
let goals: any[] = [];

// Database helper
function getPool() {
  if (!process.env.DATABASE_URL) {
    return null;
  }
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
}

// Auth routes - ALWAYS return authenticated
app.post('/auth/login', (_req, res) => {
  res.json({ authenticated: true, user: inMemoryUser });
});

app.post('/auth/logout', (_req, res) => {
  res.json({ authenticated: false });
});

app.get('/auth/session', (_req, res) => {
  res.json({ authenticated: true, user: inMemoryUser });
});

// Initialize database
app.get('/init-database', async (_req, res) => {
  const pool = getPool();

  if (!pool) {
    return res.json({
      success: false,
      message: 'No DATABASE_URL set - using in-memory storage'
    });
  }

  try {
    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS habits (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        frequency TEXT NOT NULL,
        target_count INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS goals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT,
        target_value INTEGER,
        current_value INTEGER DEFAULT 0,
        deadline TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Insert user if doesn't exist
    await pool.query(`
      INSERT INTO users (id, email, name)
      VALUES (1, 'laurenj3250@goalconnect.local', 'Lauren')
      ON CONFLICT (email) DO NOTHING
    `);

    // Insert some November goals
    const novemberGoals = [
      ['Pimsleur: 16 lessons', 'Language learning', 16, '2025-11-30'],
      ['Duolingo: 1 unit', 'Language learning', 1, '2025-11-30'],
      ['Complete 16 Gym Sessions', 'Fitness', 16, '2025-11-30'],
      ['Play Piano 12 times', 'Hobbies', 12, '2025-11-30'],
      ['Ship 1 App Feature', 'Projects', 1, '2025-11-30']
    ];

    for (const [title, category, target, deadline] of novemberGoals) {
      await pool.query(`
        INSERT INTO goals (user_id, title, category, target_value, current_value, deadline)
        VALUES ($1, $2, $3, $4, 0, $5)
        ON CONFLICT DO NOTHING
      `, [USER_ID, title, category, target, deadline]);
    }

    // Insert some habits
    const novemberHabits = [
      ['Pimsleur', 'Do 1 Pimsleur lesson', 'weekly', 4],
      ['Duolingo', 'Complete Duolingo session', 'weekly', 5],
      ['Gym', 'Go to the gym', 'weekly', 4],
      ['Piano', 'Practice piano', 'weekly', 3]
    ];

    for (const [name, description, frequency, target] of novemberHabits) {
      await pool.query(`
        INSERT INTO habits (user_id, name, description, frequency, target_count)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
      `, [USER_ID, name, description, frequency, target]);
    }

    await pool.end();

    res.json({
      success: true,
      message: 'Database initialized with November goals and habits!'
    });
  } catch (error: any) {
    console.error('Database init error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get habits
app.get('/habits', async (_req, res) => {
  const pool = getPool();
  if (!pool) {
    return res.json(habits);
  }

  try {
    const result = await pool.query('SELECT * FROM habits WHERE user_id = $1', [USER_ID]);
    await pool.end();
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching habits:', error);
    res.json(habits);
  }
});

// Get goals
app.get('/goals', async (_req, res) => {
  const pool = getPool();
  if (!pool) {
    return res.json(goals);
  }

  try {
    const result = await pool.query('SELECT * FROM goals WHERE user_id = $1', [USER_ID]);
    await pool.end();
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.json(goals);
  }
});

// Catch all for other routes
app.all('*', (_req, res) => {
  res.json({ message: 'API is running but this endpoint is not yet implemented' });
});

// Export for Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const path = req.url?.replace(/^\/api/, '') || '/';
  req.url = path;
  return app(req as any, res as any);
}
