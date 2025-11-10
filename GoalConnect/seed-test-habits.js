// Quick script to seed test habits for testing gamification features
import { db } from './server/storage.js';
import { sql } from 'drizzle-orm';

async function seedTestHabits() {
  console.log('[seed-habits] Starting...');

  try {
    // Check if user 1 exists
    const user = await db.execute(sql`SELECT id FROM users LIMIT 1`);
    if (!user.rows || user.rows.length === 0) {
      console.log('[seed-habits] ⚠️  No users found. Please create an account first.');
      return;
    }

    const userId = user.rows[0].id;
    console.log('[seed-habits] Using user ID:', userId);

    // Clear existing habits for this user (optional)
    await db.execute(sql`DELETE FROM habit_logs WHERE user_id = ${userId}`);
    await db.execute(sql`DELETE FROM habits WHERE user_id = ${userId}`);
    console.log('[seed-habits] Cleared existing habits');

    // Insert test habits
    const testHabits = [
      {
        title: 'Morning Stretch',
        icon: '🧘',
        category: 'mind',
        effort: 'light',
        grade: '5.6',
        cadence: 'daily',
        description: 'Light morning movement',
      },
      {
        title: 'Gym Training',
        icon: '💪',
        category: 'training',
        effort: 'heavy',
        grade: '5.10',
        cadence: 'weekly',
        targetPerWeek: 3,
        description: 'Hard physical training',
      },
      {
        title: 'Read',
        icon: '📚',
        category: 'mind',
        effort: 'light',
        grade: '5.7',
        cadence: 'daily',
        description: 'Daily reading habit',
      },
      {
        title: 'Walk Outside',
        icon: '🥾',
        category: 'foundation',
        effort: 'light',
        grade: '5.5',
        cadence: 'daily',
        description: 'Daily outdoor movement',
      },
      {
        title: 'Meditate',
        icon: '🧠',
        category: 'mind',
        effort: 'light',
        grade: '5.8',
        cadence: 'daily',
        description: 'Mindfulness practice',
      },
    ];

    for (const habit of testHabits) {
      await db.execute(sql`
        INSERT INTO habits (
          user_id, title, icon, category, effort, grade, cadence,
          target_per_week, description, color, difficulty, created_at
        )
        VALUES (
          ${userId},
          ${habit.title},
          ${habit.icon},
          ${habit.category},
          ${habit.effort},
          ${habit.grade},
          ${habit.cadence},
          ${habit.targetPerWeek || null},
          ${habit.description},
          'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          ${habit.effort === 'light' ? 'easy' : habit.effort === 'heavy' ? 'hard' : 'medium'},
          NOW()
        )
      `);
      console.log(`[seed-habits] ✅ Added: ${habit.title}`);
    }

    console.log('[seed-habits] ✅ All test habits created!');
    console.log('[seed-habits] 💡 Visit http://localhost:5000 to see them');

  } catch (error) {
    console.error('[seed-habits] ❌ Error:', error);
  }

  process.exit(0);
}

seedTestHabits();
