import { seedMountaineeringData } from '../server/seed-mountaineering-data';

async function main() {
  console.log('Running mountaineering seed...');
  try {
    await seedMountaineeringData();
    console.log('✅ Mountaineering seed completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

main();
