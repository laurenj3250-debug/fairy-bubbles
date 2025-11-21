import "../server/load-env";
import { getDb } from "../server/db";
import { sql } from "drizzle-orm";

const db = getDb();

async function main() {
  try {
    const result = await db.execute(sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'todos'
      ORDER BY ordinal_position
    `);

    console.log('Todos table columns:');
    result.rows.forEach((row: any) => console.log(`- ${row.column_name}: ${row.data_type}`));
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
