import { getDb } from '../server/db';
import * as schema from '../shared/schema';
import { sql } from 'drizzle-orm';

async function reseedMountains() {
  const db = getDb();

  try {
    console.log('🗑️  Clearing existing mountaineering data...');

    // Delete in correct order (respecting foreign keys)
    await db.delete(schema.expeditionGearLoadout);
    await db.delete(schema.expeditionEvents);
    await db.delete(schema.playerExpeditions);
    await db.delete(schema.playerGearInventory);
    await db.delete(schema.routeGearRequirements);
    await db.delete(schema.routes);
    await db.delete(schema.alpineGear);
    await db.delete(schema.mountainBackgrounds);
    await db.delete(schema.mountainUnlocks);
    await db.delete(schema.mountains);

    console.log('✅ Cleared old data');
    console.log('🌱 Reseeding mountaineering data...');

    // Import and run the seed
    const { seedMountaineeringData } = await import('../server/seed-mountaineering-data');
    await seedMountaineeringData();

    console.log('✅ Mountaineering data reseeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error reseeding:', error);
    process.exit(1);
  }
}

reseedMountains();
