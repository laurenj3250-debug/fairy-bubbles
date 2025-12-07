import "../server/load-env";
import pkg from "pg";
const { Client } = pkg;

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("DATABASE_URL not found");
    process.exit(1);
  }

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  // Check current state
  const result = await client.query("SELECT id, title, month, deadline, archived, current_value, target_value FROM goals WHERE user_id = 1");
  for (const row of result.rows) {
    console.log(`${row.id}: "${row.title}" month=${row.month} deadline=${row.deadline} archived=${row.archived} progress=${row.current_value}/${row.target_value}`);
  }

  await client.end();
}
main();
