import { getDb } from '../server/db';
import { sql } from 'drizzle-orm';

async function deleteOldHabits() {
  const db = getDb();

  try {
    // First, find the habits
    console.log('Searching for RemNote and Pimsleur habits...');
    const result = await db.execute(sql`
      SELECT id, title, icon, created_at
      FROM habits
      WHERE title ILIKE '%remnote%' OR title ILIKE '%pimsleur%'
    `);

    if (result.rows.length === 0) {
      console.log('No habits found matching RemNote or Pimsleur');
      return;
    }

    console.log(`\nFound ${result.rows.length} habit(s):`);
    result.rows.forEach((row: any) => {
      console.log(`  - ID: ${row.id}, Title: "${row.title}", Icon: ${row.icon}, Created: ${row.created_at}`);
    });

    // Delete the habits
    console.log('\nDeleting habits...');
    for (const row of result.rows) {
      await db.execute(sql`DELETE FROM habits WHERE id = ${row.id}`);
      console.log(`  ✓ Deleted habit "${row.title}" (ID: ${row.id})`);
    }

    console.log('\nDone! All matching habits have been deleted.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteOldHabits();
