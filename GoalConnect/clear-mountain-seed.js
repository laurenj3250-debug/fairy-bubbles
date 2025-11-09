import { getDb } from './server/db.ts';
import { sql } from 'drizzle-orm';

const db = getDb();

console.log('Clearing partial mountaineering seed data...');

await db.execute(sql`DELETE FROM route_gear_requirements`);
await db.execute(sql`DELETE FROM routes`);
await db.execute(sql`DELETE FROM alpine_gear`);
await db.execute(sql`DELETE FROM mountains`);
await db.execute(sql`DELETE FROM world_map_regions`);

console.log('✅ Cleared!');
process.exit(0);
