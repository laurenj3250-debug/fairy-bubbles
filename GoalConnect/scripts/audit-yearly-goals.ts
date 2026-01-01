import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function audit() {
  const goals = await pool.query(`
    SELECT yg.id, yg.year, yg.title, yg.category, yg.goal_type, yg.target_value, yg.current_value,
           yg.linked_habit_id, yg.linked_journey_key, yg.linked_book_id, yg.completed, yg.due_date,
           h.title as habit_title, h.frequency_type as habit_frequency
    FROM yearly_goals yg
    LEFT JOIN habits h ON yg.linked_habit_id = h.id
    WHERE yg.year IN ('2025', '2026')
    ORDER BY yg.year, yg.category, yg.position
  `);

  console.log('=== YEARLY GOALS AUDIT ===');
  console.log('Total goals:', goals.rows.length);

  let currentYear = '';
  let currentCategory = '';

  for (const g of goals.rows) {
    if (g.year !== currentYear) {
      currentYear = g.year;
      console.log('\n📅 YEAR:', currentYear);
      console.log('='.repeat(50));
    }
    if (g.category !== currentCategory) {
      currentCategory = g.category;
      console.log('\n  📂', currentCategory.toUpperCase());
    }

    const status = g.completed ? '✅' : '⬜';
    const progress = g.goal_type === 'binary' ? '' : ` (${g.current_value}/${g.target_value})`;
    const link = g.linked_habit_id ? `🔗 Habit: ${g.habit_title}` :
                 g.linked_journey_key ? `🔗 Journey: ${g.linked_journey_key}` :
                 g.linked_book_id ? '🔗 Book' : '(manual)';
    const due = g.due_date ? ` 📆 ${g.due_date}` : '';

    console.log(`    ${status} ${g.title}${progress} - ${link}${due}`);
  }

  // Summary
  const habitLinked = goals.rows.filter(g => g.linked_habit_id);
  const journeyLinked = goals.rows.filter(g => g.linked_journey_key);
  const bookLinked = goals.rows.filter(g => g.linked_book_id);
  const manual = goals.rows.filter(g => !g.linked_habit_id && !g.linked_journey_key && !g.linked_book_id);

  console.log('\n\n=== SUMMARY ===');
  console.log('Habit-linked:', habitLinked.length);
  console.log('Journey-linked:', journeyLinked.length);
  console.log('Book-linked:', bookLinked.length);
  console.log('Manual:', manual.length);

  // List available habits that could be linked
  const habits = await pool.query(`
    SELECT id, title, frequency_type FROM habits WHERE user_id = 1 ORDER BY title
  `);

  console.log('\n\n=== AVAILABLE HABITS FOR LINKING ===');
  for (const h of habits.rows) {
    const isLinked = habitLinked.some(g => g.linked_habit_id === h.id);
    const marker = isLinked ? '✓' : ' ';
    console.log(`  [${marker}] ${h.title} (${h.frequency_type})`);
  }

  await pool.end();
}

audit().catch(console.error);
