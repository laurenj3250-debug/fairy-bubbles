import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;

const app = express();
app.use(express.json());

const USER_ID = 1;

// Simple in-memory storage with November goals pre-loaded
let inMemoryUser = { id: 1, email: 'laurenj3250@goalconnect.local', name: 'Lauren' };

let habits: any[] = [
  { id: 1, user_id: 1, name: 'Pimsleur', description: 'Do 1 Pimsleur lesson', frequency: 'weekly', target_count: 4 },
  { id: 2, user_id: 1, name: 'Duolingo', description: 'Complete Duolingo session', frequency: 'weekly', target_count: 5 },
  { id: 3, user_id: 1, name: 'Gym', description: 'Go to the gym', frequency: 'weekly', target_count: 4 },
  { id: 4, user_id: 1, name: 'Piano', description: 'Practice piano', frequency: 'weekly', target_count: 3 }
];

let goals: any[] = [
  { id: 1, user_id: 1, title: 'Pimsleur: 16 lessons', description: 'Complete 16 Pimsleur lessons', category: 'Language learning', target_value: 16, current_value: 0, deadline: '2025-11-30' },
  { id: 2, user_id: 1, title: 'Duolingo: 1 unit', description: 'Complete 1 Duolingo unit', category: 'Language learning', target_value: 1, current_value: 0, deadline: '2025-11-30' },
  { id: 3, user_id: 1, title: 'Complete 16 Gym Sessions', description: 'Go to the gym 16 times', category: 'Fitness', target_value: 16, current_value: 0, deadline: '2025-11-30' },
  { id: 4, user_id: 1, title: 'Play Piano 12 times', description: 'Practice piano 12 times', category: 'Hobbies', target_value: 12, current_value: 0, deadline: '2025-11-30' },
  { id: 5, user_id: 1, title: 'Ship 1 App Feature', description: 'Complete and ship one app feature', category: 'Projects', target_value: 1, current_value: 0, deadline: '2025-11-30' }
];

// Database helper - DISABLED for now due to SSL issues
function getPool() {
  // TODO: Fix SSL certificate issues with Supabase
  // For now, just use in-memory storage
  return null;
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

// Initialize database - currently using in-memory storage
app.get('/init-database', async (_req, res) => {
  res.json({
    success: true,
    message: 'Using in-memory storage with November goals pre-loaded! Your data is ready.',
    note: 'Database persistence temporarily disabled due to SSL issues. Working on fix.'
  });
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
