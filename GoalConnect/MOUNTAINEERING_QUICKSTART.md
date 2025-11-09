# Mountaineering Game - Quick Start Guide

## Overview

This guide helps you quickly get started with the mountaineering expedition game schema. Use this for rapid development and testing.

---

## 1. Database Schema Already Deployed

The schema is complete and will auto-migrate on next server start. No manual SQL needed.

**Tables created:**
- `world_map_regions` - Geographic regions
- `mountains` - 100+ peaks
- `routes` - Climbing routes
- `alpine_gear` - Equipment catalog
- `route_gear_requirements` - Gear per route
- `player_gear_inventory` - Player gear
- `player_climbing_stats` - Player progression
- `player_expeditions` - Climbing attempts
- `expedition_events` - Event log
- `expedition_gear_loadout` - Gear loadouts
- `mountain_unlocks` - Unlocked mountains

---

## 2. Quick Test: Create Sample Data

### Step 1: Start Server

```bash
npm run dev
```

Check logs for migration success:
```
[migrate] ✅ World map regions table created/verified
[migrate] ✅ Mountains table and indexes created/verified
...
```

### Step 2: Initialize Player Stats

For existing users, create climbing stats:

```typescript
// In server console or API endpoint
import { db } from './db';
import { playerClimbingStats, users } from '../shared/schema';

// Create stats for all users
const allUsers = await db.select({ id: users.id }).from(users);

for (const user of allUsers) {
  await db.insert(playerClimbingStats)
    .values({
      userId: user.id,
      climbingLevel: 1,
      totalExperience: 0,
      currentEnergy: 100,
      maxEnergy: 100
    })
    .onConflictDoNothing();
}
```

### Step 3: Add Sample Mountain

```typescript
import { mountains, worldMapRegions } from '../shared/schema';

// Create a region first
const [region] = await db.insert(worldMapRegions)
  .values({
    name: "Cascade Range",
    continent: "North America",
    description: "Mountain range in Pacific Northwest",
    unlockLevel: 1,
    displayOrder: 1
  })
  .returning();

// Add Mount Rainier
const [rainier] = await db.insert(mountains)
  .values({
    name: "Mount Rainier",
    elevation: 4392,
    country: "USA",
    mountainRange: "Cascade Range",
    continent: "North America",
    regionId: region.id,
    latitude: "46.8523° N",
    longitude: "121.7603° W",
    difficultyTier: "novice",
    requiredClimbingLevel: 1,
    description: "Active stratovolcano and the highest mountain in Washington state.",
    firstAscentYear: 1870,
    fatalityRate: "0.5%",
    bestSeasonStart: "June",
    bestSeasonEnd: "September",
    unlockRequirements: JSON.stringify({ minLevel: 1 })
  })
  .returning();
```

### Step 4: Add Sample Route

```typescript
import { routes } from '../shared/schema';

const [dcRoute] = await db.insert(routes)
  .values({
    mountainId: rainier.id,
    routeName: "Disappointment Cleaver",
    gradingSystem: "YDS",
    gradeValue: "Grade II",
    elevationGain: 2743,
    estimatedDays: 3,
    terrainTypes: JSON.stringify(["glacier", "snow", "rock"]),
    hazards: JSON.stringify(["crevasse", "rockfall", "altitude"]),
    requiresOxygen: false,
    requiresFixedRopes: false,
    requiresTechnicalClimbing: false,
    routeDescription: "The most popular route on Mount Rainier, via Muir and the Disappointment Cleaver.",
    firstAscentYear: 1870,
    technicalDifficulty: 3,
    physicalDifficulty: 5
  })
  .returning();
```

### Step 5: Add Sample Gear

```typescript
import { alpineGear } from '../shared/schema';

// Basic ice axe
await db.insert(alpineGear)
  .values({
    name: "Black Diamond Raven Ice Axe",
    category: "ice_axe",
    description: "Classic straight-shaft mountaineering axe",
    weightGrams: 539,
    tier: "basic",
    unlockLevel: 1,
    unlockHabitCount: 0,
    cost: 100,
    stats: JSON.stringify({
      durability: 95,
      technicalGrade: 3,
      weight: 539
    })
  });

// Basic boots
await db.insert(alpineGear)
  .values({
    name: "La Sportiva Nepal Evo GTX",
    category: "boots",
    description: "Classic mountaineering boot for technical climbing",
    weightGrams: 1960,
    tier: "basic",
    unlockLevel: 1,
    unlockHabitCount: 0,
    cost: 200,
    stats: JSON.stringify({
      warmthRating: 6,
      durability: 90,
      waterproofing: 9,
      technicalGrade: 5
    })
  });
```

### Step 6: Auto-Unlock Mountain for Player

```typescript
import { mountainUnlocks } from '../shared/schema';

const userId = 1; // Your test user ID

await db.insert(mountainUnlocks)
  .values({
    userId: userId,
    mountainId: rainier.id,
    unlockedBy: "level"
  });
```

---

## 3. Test Habit → Energy Integration

### When a habit is completed:

```typescript
import { playerClimbingStats, habitLogs } from '../shared/schema';
import { eq, sql } from 'drizzle-orm';

async function onHabitComplete(habitLogId: number) {
  const log = await db.select()
    .from(habitLogs)
    .where(eq(habitLogs.id, habitLogId))
    .limit(1);

  if (!log.length || !log[0].completed) return;

  // Get habit difficulty from habits table
  const habit = await db.select()
    .from(habits)
    .where(eq(habits.id, log[0].habitId))
    .limit(1);

  const energyGain = {
    easy: 5,
    medium: 10,
    hard: 15
  }[habit[0].difficulty];

  // Update player climbing stats
  await db.update(playerClimbingStats)
    .set({
      currentEnergy: sql`LEAST(current_energy + ${energyGain}, max_energy)`,
      trainingDaysCompleted: sql`training_days_completed + 1`
    })
    .where(eq(playerClimbingStats.userId, log[0].userId));

  console.log(`User ${log[0].userId} gained ${energyGain} climbing energy!`);
}
```

---

## 4. Test Expedition Flow

### Start an expedition:

```typescript
import { playerExpeditions } from '../shared/schema';

const userId = 1;
const routeId = 1; // Mount Rainier - Disappointment Cleaver

// Check if user has enough energy
const stats = await db.select()
  .from(playerClimbingStats)
  .where(eq(playerClimbingStats.userId, userId))
  .limit(1);

if (stats[0].currentEnergy < 20) {
  throw new Error("Not enough energy to start expedition");
}

// Deduct energy and start expedition
await db.update(playerClimbingStats)
  .set({
    currentEnergy: sql`current_energy - 20`
  })
  .where(eq(playerClimbingStats.userId, userId));

// Create expedition
const [expedition] = await db.insert(playerExpeditions)
  .values({
    userId: userId,
    routeId: routeId,
    status: "in_progress",
    currentProgress: 0,
    currentAltitude: 1649, // Starting elevation
    currentDay: 1,
    energySpent: 20,
    teamMorale: 100,
    acclimatizationLevel: 0
  })
  .returning();

console.log("Expedition started:", expedition.id);
```

### Add expedition event:

```typescript
import { expeditionEvents } from '../shared/schema';

await db.insert(expeditionEvents)
  .values({
    expeditionId: expedition.id,
    eventType: "weather_delay",
    eventDay: 1,
    eventDescription: "Heavy clouds delay departure by a few hours",
    energyCost: 5,
    progressImpact: 0,
    moraleImpact: -5,
    playerChoice: JSON.stringify({
      choice: "wait",
      options: ["wait", "push_through"],
      consequence: "Waited for better conditions"
    })
  });
```

### Progress expedition (daily):

```typescript
// Called when habits are completed
async function progressExpedition(expeditionId: number, habitsCompletedToday: number) {
  const progressGain = habitsCompletedToday * 5; // 5% per habit

  await db.update(playerExpeditions)
    .set({
      currentProgress: sql`LEAST(current_progress + ${progressGain}, 100)`,
      currentDay: sql`current_day + 1`,
      habitsCompletedDuring: sql`habits_completed_during + ${habitsCompletedToday}`,
      teamMorale: sql`LEAST(team_morale + 5, 100)` // Morale boost
    })
    .where(eq(playerExpeditions.id, expeditionId));
}
```

### Complete expedition:

```typescript
async function completeExpedition(expeditionId: number, summitReached: boolean) {
  const expedition = await db.select()
    .from(playerExpeditions)
    .where(eq(playerExpeditions.id, expeditionId))
    .limit(1);

  const route = await db.select()
    .from(routes)
    .innerJoin(mountains, eq(routes.mountainId, mountains.id))
    .where(eq(routes.id, expedition[0].routeId))
    .limit(1);

  // Calculate XP
  const xpRewards = {
    novice: 100,
    intermediate: 250,
    advanced: 500,
    expert: 750,
    elite: 1000
  };

  const xpEarned = summitReached
    ? xpRewards[route.mountains.difficultyTier]
    : Math.floor(xpRewards[route.mountains.difficultyTier] * 0.3);

  // Update expedition
  await db.update(playerExpeditions)
    .set({
      status: summitReached ? "completed" : "failed",
      summitReached: summitReached,
      experienceEarned: xpEarned,
      completionDate: new Date()
    })
    .where(eq(playerExpeditions.id, expeditionId));

  // Update player stats
  await db.update(playerClimbingStats)
    .set({
      totalExperience: sql`total_experience + ${xpEarned}`,
      climbingLevel: sql`FLOOR(SQRT(total_experience / 100)) + 1`,
      summitsReached: summitReached ? sql`summits_reached + 1` : undefined,
      totalElevationClimbed: summitReached
        ? sql`total_elevation_climbed + ${route.mountains.elevation}`
        : undefined,
      highestPeakClimbed: summitReached
        ? sql`GREATEST(highest_peak_climbed, ${route.mountains.elevation})`
        : undefined
    })
    .where(eq(playerClimbingStats.userId, expedition[0].userId));

  console.log(`Expedition ${summitReached ? 'completed' : 'failed'}. XP gained: ${xpEarned}`);
}
```

---

## 5. Quick API Endpoints

Add these to your Express/Hono server:

```typescript
// GET /api/climbing/stats
app.get('/api/climbing/stats', async (c) => {
  const userId = c.get('userId'); // From auth middleware

  const stats = await db.select()
    .from(playerClimbingStats)
    .where(eq(playerClimbingStats.userId, userId))
    .limit(1);

  return c.json(stats[0]);
});

// GET /api/mountains
app.get('/api/mountains', async (c) => {
  const userId = c.get('userId');

  const unlocked = await db.select({
    mountain: mountains,
    unlockedAt: mountainUnlocks.unlockedAt
  })
  .from(mountains)
  .innerJoin(mountainUnlocks, eq(mountains.id, mountainUnlocks.mountainId))
  .where(eq(mountainUnlocks.userId, userId));

  return c.json(unlocked);
});

// GET /api/mountains/:id/routes
app.get('/api/mountains/:id/routes', async (c) => {
  const mountainId = parseInt(c.req.param('id'));

  const routeList = await db.select()
    .from(routes)
    .where(eq(routes.mountainId, mountainId));

  return c.json(routeList);
});

// GET /api/gear/shop
app.get('/api/gear/shop', async (c) => {
  const userId = c.get('userId');

  const stats = await db.select()
    .from(playerClimbingStats)
    .where(eq(playerClimbingStats.userId, userId))
    .limit(1);

  // Get unlocked gear
  const availableGear = await db.select()
    .from(alpineGear)
    .where(
      and(
        lte(alpineGear.unlockLevel, stats[0].climbingLevel),
        lte(alpineGear.unlockHabitCount, stats[0].trainingDaysCompleted)
      )
    );

  return c.json(availableGear);
});

// POST /api/gear/purchase
app.post('/api/gear/purchase', async (c) => {
  const userId = c.get('userId');
  const { gearId } = await c.req.json();

  // Check points and purchase logic here...

  await db.insert(playerGearInventory)
    .values({
      userId,
      gearId,
      condition: 100
    });

  return c.json({ success: true });
});

// POST /api/expeditions/start
app.post('/api/expeditions/start', async (c) => {
  const userId = c.get('userId');
  const { routeId, gearLoadout } = await c.req.json();

  // Validation and start logic here...

  const [expedition] = await db.insert(playerExpeditions)
    .values({
      userId,
      routeId,
      status: "in_progress"
    })
    .returning();

  return c.json(expedition);
});

// GET /api/expeditions/active
app.get('/api/expeditions/active', async (c) => {
  const userId = c.get('userId');

  const active = await db.select()
    .from(playerExpeditions)
    .where(
      and(
        eq(playerExpeditions.userId, userId),
        eq(playerExpeditions.status, 'in_progress')
      )
    );

  return c.json(active);
});
```

---

## 6. Sample Seed Data Script

Create `server/seed-mountaineering.ts`:

```typescript
import { db } from './db';
import {
  worldMapRegions,
  mountains,
  routes,
  alpineGear,
  routeGearRequirements
} from '../shared/schema';

async function seedMountaineeringData() {
  console.log("Seeding mountaineering data...");

  // Regions
  const [cascades] = await db.insert(worldMapRegions)
    .values({
      name: "Cascade Range",
      continent: "North America",
      description: "Volcanic mountain range in Pacific Northwest",
      unlockLevel: 1
    })
    .returning();

  const [himalayas] = await db.insert(worldMapRegions)
    .values({
      name: "Himalayas",
      continent: "Asia",
      description: "World's highest mountain range",
      unlockLevel: 50
    })
    .returning();

  // Mountains
  const [rainier] = await db.insert(mountains)
    .values({
      name: "Mount Rainier",
      elevation: 4392,
      country: "USA",
      mountainRange: "Cascade Range",
      continent: "North America",
      regionId: cascades.id,
      latitude: "46.8523° N",
      longitude: "121.7603° W",
      difficultyTier: "novice",
      requiredClimbingLevel: 1,
      unlockRequirements: JSON.stringify({ minLevel: 1 })
    })
    .returning();

  const [everest] = await db.insert(mountains)
    .values({
      name: "Mount Everest",
      elevation: 8849,
      country: "Nepal/China",
      mountainRange: "Himalayas",
      continent: "Asia",
      regionId: himalayas.id,
      latitude: "27.9881° N",
      longitude: "86.9250° E",
      difficultyTier: "elite",
      requiredClimbingLevel: 50,
      unlockRequirements: JSON.stringify({
        minLevel: 50,
        previousSummits: 25,
        minHabitStreak: 100
      })
    })
    .returning();

  // Routes
  const [rainierRoute] = await db.insert(routes)
    .values({
      mountainId: rainier.id,
      routeName: "Disappointment Cleaver",
      gradingSystem: "YDS",
      gradeValue: "Grade II",
      elevationGain: 2743,
      estimatedDays: 3,
      terrainTypes: JSON.stringify(["glacier", "snow"]),
      hazards: JSON.stringify(["crevasse", "altitude"]),
      technicalDifficulty: 3,
      physicalDifficulty: 5
    })
    .returning();

  const [everestRoute] = await db.insert(routes)
    .values({
      mountainId: everest.id,
      routeName: "South Col Route",
      gradingSystem: "AD",
      gradeValue: "AD",
      elevationGain: 3400,
      estimatedDays: 45,
      terrainTypes: JSON.stringify(["glacier", "snow", "ice", "rock"]),
      hazards: JSON.stringify(["avalanche", "crevasse", "altitude", "icefall"]),
      requiresOxygen: true,
      technicalDifficulty: 8,
      physicalDifficulty: 10
    })
    .returning();

  // Gear
  const [iceAxe] = await db.insert(alpineGear)
    .values({
      name: "Black Diamond Raven Ice Axe",
      category: "ice_axe",
      tier: "basic",
      unlockLevel: 1,
      cost: 100,
      weightGrams: 539
    })
    .returning();

  const [boots] = await db.insert(alpineGear)
    .values({
      name: "La Sportiva Nepal Evo",
      category: "boots",
      tier: "basic",
      unlockLevel: 1,
      cost: 200,
      weightGrams: 1960
    })
    .returning();

  // Gear requirements
  await db.insert(routeGearRequirements)
    .values([
      { routeId: rainierRoute.id, gearId: iceAxe.id, isRequired: true, quantity: 1 },
      { routeId: rainierRoute.id, gearId: boots.id, isRequired: true, quantity: 1 }
    ]);

  console.log("✅ Mountaineering data seeded successfully!");
}

seedMountaineeringData().catch(console.error);
```

Run with:
```bash
npx tsx server/seed-mountaineering.ts
```

---

## 7. Testing Checklist

- [ ] Server starts without errors
- [ ] All 11 tables created
- [ ] Sample region created
- [ ] Sample mountain created
- [ ] Sample route created
- [ ] Sample gear created
- [ ] Player climbing stats initialized
- [ ] Mountain unlocked for test user
- [ ] Habit completion grants energy
- [ ] Expedition can be started
- [ ] Expedition events can be added
- [ ] Expedition can be completed
- [ ] XP awarded on completion
- [ ] Level calculated correctly
- [ ] Gear can be purchased
- [ ] Unlockable gear shown in shop

---

## 8. Common Issues & Solutions

### Issue: "player_climbing_stats not found"
**Solution:** Initialize stats for user:
```typescript
await db.insert(playerClimbingStats)
  .values({ userId: 1 })
  .onConflictDoNothing();
```

### Issue: "Mountain not unlocked"
**Solution:** Manually unlock for testing:
```typescript
await db.insert(mountainUnlocks)
  .values({ userId: 1, mountainId: 1, unlockedBy: "test" });
```

### Issue: "Not enough energy"
**Solution:** Grant energy manually:
```typescript
await db.update(playerClimbingStats)
  .set({ currentEnergy: 100 })
  .where(eq(playerClimbingStats.userId, 1));
```

---

## 9. Next Steps

1. **Create seed data** for 100+ mountains
2. **Build API endpoints** for all operations
3. **Create frontend components** for UI
4. **Implement cron jobs** for daily energy refresh
5. **Add achievement system**
6. **Build world map interface**
7. **Add multiplayer features** (optional)

---

## 10. Useful Drizzle Queries

```typescript
import { db } from './db';
import {
  mountains, routes, playerExpeditions,
  playerClimbingStats, alpineGear
} from '../shared/schema';
import { eq, and, desc, lte, gte } from 'drizzle-orm';

// Get all mountains with route count
const mountainsWithRoutes = await db.select({
  mountain: mountains,
  routeCount: sql<number>`count(${routes.id})`
})
.from(mountains)
.leftJoin(routes, eq(mountains.id, routes.mountainId))
.groupBy(mountains.id);

// Get expedition history with mountain names
const history = await db.select({
  expedition: playerExpeditions,
  routeName: routes.routeName,
  mountainName: mountains.name
})
.from(playerExpeditions)
.innerJoin(routes, eq(playerExpeditions.routeId, routes.id))
.innerJoin(mountains, eq(routes.mountainId, mountains.id))
.where(eq(playerExpeditions.userId, userId))
.orderBy(desc(playerExpeditions.startDate));

// Get leaderboard
const leaderboard = await db.select({
  userName: users.name,
  level: playerClimbingStats.climbingLevel,
  summits: playerClimbingStats.summitsReached,
  elevation: playerClimbingStats.totalElevationClimbed
})
.from(playerClimbingStats)
.innerJoin(users, eq(playerClimbingStats.userId, users.id))
.orderBy(desc(playerClimbingStats.summitsReached))
.limit(100);
```

---

That's it! You're ready to start building the mountaineering expedition game. Happy climbing! 🏔️
