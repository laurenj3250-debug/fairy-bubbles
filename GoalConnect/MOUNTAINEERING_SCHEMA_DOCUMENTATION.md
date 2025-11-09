# Mountaineering Expedition Game - Database Schema Documentation

## Overview

This document describes the comprehensive database schema for the solo mountaineering expedition game that integrates real-world climbing with habit tracking. The schema supports 100+ mountains, 300+ routes, authentic mountaineering mechanics, and progression-based unlocks.

---

## Table of Contents

1. [Core Tables](#core-tables)
2. [Relationships & Foreign Keys](#relationships--foreign-keys)
3. [Indexing Strategy](#indexing-strategy)
4. [Habit Integration System](#habit-integration-system)
5. [Progression & Unlock Mechanics](#progression--unlock-mechanics)
6. [Data Examples](#data-examples)
7. [Query Patterns](#query-patterns)
8. [Scalability Considerations](#scalability-considerations)

---

## Core Tables

### 1. world_map_regions

**Purpose:** Organize mountains into geographic regions for the world map interface.

**Schema:**
```typescript
{
  id: serial (PK)
  name: text (unique) - e.g., "Himalayas", "Alps", "Andes"
  continent: varchar(50) - e.g., "Asia", "Europe", "South America"
  description: text - Lore and information about the region
  unlockLevel: integer - Minimum player level to access region
  displayOrder: integer - Sort order on world map
  createdAt: timestamp
}
```

**Use Cases:**
- Organize mountains by geographic location
- Progressive map unlocking (unlock Himalayas at level 20, etc.)
- Filter/browse mountains by region
- Display region-specific achievements

**Indexes:**
- Primary key on `id`
- Unique constraint on `name`

---

### 2. mountains

**Purpose:** Store all real-world peaks with metadata, coordinates, and unlock requirements.

**Schema:**
```typescript
{
  id: serial (PK)
  name: text (unique) - e.g., "Mount Everest", "K2", "Denali"
  elevation: integer - Height in meters (8849 for Everest)
  country: text - e.g., "Nepal/China"
  mountainRange: text - e.g., "Himalayas"
  continent: varchar(50) - e.g., "Asia"
  regionId: integer (FK -> world_map_regions.id)

  // Geographic positioning
  latitude: text - e.g., "27.9881° N"
  longitude: text - e.g., "86.9250° E"

  // Difficulty & progression
  difficultyTier: varchar(20) - "novice" | "intermediate" | "advanced" | "expert" | "elite"
  requiredClimbingLevel: integer - Minimum player level to attempt

  // Metadata
  description: text - Mountain history, significance, challenges
  firstAscentYear: integer - e.g., 1953 for Everest
  fatalityRate: text - e.g., "3.5%"
  bestSeasonStart: varchar(20) - e.g., "April"
  bestSeasonEnd: varchar(20) - e.g., "May"

  // Unlock logic (JSON)
  unlockRequirements: text - {
    minLevel: 50,
    previousSummits: 20,
    requiredClimbs: [2, 5, 12],
    minHabitStreak: 100
  }

  // Display
  imageUrl: text - URL to mountain image
  mapPositionX: integer - X coordinate on world map
  mapPositionY: integer - Y coordinate on world map

  createdAt: timestamp
}
```

**Use Cases:**
- Display all available/unlocked mountains
- Check if player meets unlock requirements
- Show mountain details (elevation, location, history)
- Filter by difficulty tier, continent, region
- Calculate unlock progression

**Indexes:**
- Primary key on `id`
- Unique constraint on `name`
- Index on `difficulty_tier` (filter by difficulty)
- Index on `continent` (filter by continent)
- Index on `region_id` (join with regions)

---

### 3. routes

**Purpose:** Store multiple climbing routes for each mountain with technical details.

**Schema:**
```typescript
{
  id: serial (PK)
  mountainId: integer (FK -> mountains.id)
  routeName: text - e.g., "South Col Route", "North Ridge"

  // Grading
  gradingSystem: varchar(20) - "YDS", "UIAA", "French", "AD/D/ED"
  gradeValue: text - e.g., "5.10a", "AD", "III"

  // Route characteristics
  elevationGain: integer - Meters climbed
  estimatedDays: integer - Expected expedition duration
  terrainTypes: text (JSON) - ["glacier", "rock", "snow", "mixed"]
  hazards: text (JSON) - ["avalanche", "crevasse", "rockfall", "altitude"]

  // Requirements
  requiresOxygen: boolean - Supplemental oxygen needed
  requiresFixedRopes: boolean - Fixed ropes required
  requiresTechnicalClimbing: boolean - Technical climbing skills needed

  // Description
  routeDescription: text - Detailed route description
  firstAscentYear: integer - First successful climb

  // Difficulty ratings (1-10 scale)
  technicalDifficulty: integer - Technical skill required
  physicalDifficulty: integer - Physical endurance required

  createdAt: timestamp
}
```

**Use Cases:**
- Display available routes for a mountain
- Calculate expedition difficulty and duration
- Check gear requirements via route_gear_requirements
- Generate expedition events based on hazards
- Filter routes by difficulty, duration, requirements

**Indexes:**
- Primary key on `id`
- Index on `mountain_id` (find all routes for a mountain)

---

### 4. alpine_gear

**Purpose:** All mountaineering equipment items with stats, unlock requirements, and costs.

**Schema:**
```typescript
{
  id: serial (PK)
  name: text (unique) - e.g., "Scarpa Phantom 6000 Boots"
  category: varchar(30) - "boots" | "crampons" | "rope" | "tent" | "clothing" |
                          "safety" | "oxygen" | "ice_axe" | "harness" | "backpack" |
                          "sleeping_bag" | "stove" | "miscellaneous"
  description: text - Detailed gear description

  // Physical properties
  weightGrams: integer - Weight for pack management

  // Progression
  tier: varchar(20) - "basic" | "intermediate" | "advanced" | "elite"
  unlockLevel: integer - Player level required to unlock
  unlockHabitCount: integer - Total habits completed required to unlock

  // Acquisition
  cost: integer - In-game currency cost

  // Stats (JSON) - Flexible stats for different gear types
  stats: text - {
    warmthRating: 8,      // For clothing
    durability: 90,       // How long it lasts
    technicalGrade: 5,    // For technical gear
    oxygenCapacity: 10,   // For oxygen bottles
    waterproofing: 9      // For tents, clothing
  }

  // Display
  imageUrl: text - Gear image URL

  createdAt: timestamp
}
```

**Use Cases:**
- Display Alpine Shop inventory
- Check unlock status based on player level/habits
- Calculate total pack weight for expeditions
- Track gear degradation (via condition field)
- Filter gear by category, tier

**Indexes:**
- Primary key on `id`
- Unique constraint on `name`
- Index on `category` (filter by gear type)
- Index on `tier` (filter by progression tier)

---

### 5. route_gear_requirements

**Purpose:** Define what gear is needed (required vs. recommended) for each route.

**Schema:**
```typescript
{
  id: serial (PK)
  routeId: integer (FK -> routes.id)
  gearId: integer (FK -> alpine_gear.id)
  isRequired: boolean - true = required, false = recommended
  quantity: integer - How many needed (e.g., 2 ice axes, 60m rope)
  notes: text - Additional context (e.g., "Only above 7000m")
}
```

**Use Cases:**
- Check if player has all required gear before starting expedition
- Calculate recommended pack weight
- Display gear checklist for route planning
- Warn player about missing critical gear

**Indexes:**
- Primary key on `id`
- Index on `route_id` (find all gear for a route)
- Index on `gear_id` (find which routes need specific gear)

---

### 6. player_gear_inventory

**Purpose:** Track gear owned by each player with condition and usage stats.

**Schema:**
```typescript
{
  id: serial (PK)
  userId: integer (FK -> users.id)
  gearId: integer (FK -> alpine_gear.id)
  acquiredDate: timestamp - When gear was obtained
  timesUsed: integer - Number of expeditions with this gear
  condition: integer - 0-100%, degrades with use
}
```

**Use Cases:**
- Display player's owned gear inventory
- Check if player owns required gear for a route
- Track gear degradation over time
- Require repairs/replacement when condition drops
- Calculate when to purchase new gear

**Indexes:**
- Primary key on `id`
- Index on `user_id` (find all gear for a player)
- Index on `gear_id` (find which players own specific gear)

---

### 7. player_climbing_stats

**Purpose:** One-to-one table with users tracking overall climbing progression and achievements.

**Schema:**
```typescript
{
  userId: integer (PK, FK -> users.id)

  // Progression
  climbingLevel: integer - Current player level (1-100+)
  totalExperience: integer - Total XP earned

  // Achievements
  summitsReached: integer - Total successful summits
  totalElevationClimbed: integer - Cumulative meters climbed
  continentsCompleted: text (JSON) - ["Asia", "Europe", "South America"]
  achievements: text (JSON) - ["first_8000m", "seven_summits", "speed_climber"]

  // Energy system (habit integration)
  currentEnergy: integer - Available energy for climbing (0-100+)
  maxEnergy: integer - Maximum energy capacity
  trainingDaysCompleted: integer - Total days of habit completion

  // Stats
  longestExpedition: integer - Longest expedition in days
  highestPeakClimbed: integer - Highest elevation reached (meters)

  // Timestamps
  lastEnergyRefresh: timestamp - Last time energy was refreshed
  updatedAt: timestamp - Last stat update
}
```

**Use Cases:**
- Display player profile and stats
- Calculate level-up progression
- Check unlock requirements for mountains/gear
- Refresh energy based on habit completions
- Track achievements and milestones
- Leaderboards (highest peak, most summits, etc.)

**Indexes:**
- Primary key on `user_id`

---

### 8. player_expeditions

**Purpose:** Track individual climbing attempts with detailed progress and outcome data.

**Schema:**
```typescript
{
  id: serial (PK)
  userId: integer (FK -> users.id)
  routeId: integer (FK -> routes.id)

  // Status
  status: varchar(20) - "planning" | "in_progress" | "completed" | "failed" | "abandoned"

  // Timeline
  startDate: timestamp - When expedition started
  completionDate: timestamp - When finished (null if in progress)

  // Progress tracking
  currentProgress: integer - 0-100% completion
  currentAltitude: integer - Current elevation (meters)
  currentDay: integer - Day number of expedition

  // Resources
  energySpent: integer - Total energy consumed
  habitsCompletedDuring: integer - Habits completed during expedition

  // Outcome
  summitReached: boolean - Did player reach the top?
  experienceEarned: integer - XP awarded

  // Journal
  notes: text - Player's expedition journal/notes

  // Expedition state
  weatherCondition: varchar(20) - Current weather
  teamMorale: integer - 0-100 morale level
  acclimatizationLevel: integer - 0-100 acclimatization progress

  createdAt: timestamp
  updatedAt: timestamp
}
```

**Use Cases:**
- Display active expeditions
- Track expedition progress day-by-day
- Calculate success/failure conditions
- Show expedition history
- Award XP and unlock achievements
- Filter by status (show in-progress only)

**Indexes:**
- Primary key on `id`
- Index on `user_id` (find all expeditions for a player)
- Index on `route_id` (find all attempts on a route)
- Composite index on `(user_id, status)` (find active expeditions)

---

### 9. expedition_events

**Purpose:** Log events that occur during expeditions (weather, hazards, decisions).

**Schema:**
```typescript
{
  id: serial (PK)
  expeditionId: integer (FK -> player_expeditions.id)

  // Event details
  eventType: varchar(30) - "weather_delay" | "storm" | "avalanche" | "crevasse" |
                          "altitude_sickness" | "equipment_failure" | "success" |
                          "rest_day" | "acclimatization" | "team_conflict" | "rescue"
  eventDay: integer - Which day of expedition this occurred
  eventDescription: text - Narrative description of event

  // Impact
  energyCost: integer - Energy consumed by event
  progressImpact: integer - Progress gained/lost (can be negative)
  moraleImpact: integer - Morale change (can be negative)

  // Player decision (JSON)
  playerChoice: text - {
    choice: "push_through",
    options: ["wait_out_storm", "push_through", "retreat"],
    consequence: "Lost 10 morale but gained 15 progress"
  }

  createdAt: timestamp
}
```

**Use Cases:**
- Display expedition timeline/log
- Generate random events based on route hazards
- Track player decisions and consequences
- Calculate cumulative impact on expedition
- Create narrative expedition experience
- Analyze success/failure patterns

**Indexes:**
- Primary key on `id`
- Index on `expedition_id` (find all events for an expedition)

---

### 10. expedition_gear_loadout

**Purpose:** Track what gear was taken on each expedition and how it degraded.

**Schema:**
```typescript
{
  id: serial (PK)
  expeditionId: integer (FK -> player_expeditions.id)
  gearId: integer (FK -> alpine_gear.id)
  quantity: integer - How many brought
  conditionBefore: integer - Condition before expedition (0-100)
  conditionAfter: integer - Condition after expedition (0-100)
}
```

**Use Cases:**
- Validate gear requirements before starting
- Calculate total pack weight
- Apply gear degradation after expedition
- Track which gear was used for which climbs
- Display expedition gear history

**Indexes:**
- Primary key on `id`
- Index on `expedition_id` (find all gear for an expedition)

---

### 11. mountain_unlocks

**Purpose:** Track which mountains are unlocked for each player and how they were unlocked.

**Schema:**
```typescript
{
  id: serial (PK)
  userId: integer (FK -> users.id)
  mountainId: integer (FK -> mountains.id)
  unlockedAt: timestamp - When unlocked
  unlockedBy: varchar(50) - "level" | "achievement" | "previous_climb" | "habit_milestone"
}
```

**Use Cases:**
- Check if player has access to a mountain
- Display locked/unlocked mountains on world map
- Show unlock progression timeline
- Prevent players from accessing locked content
- Track unlock achievements

**Indexes:**
- Primary key on `id`
- Index on `user_id` (find all unlocks for a player)
- Index on `mountain_id` (find which players unlocked a mountain)
- Unique composite index on `(user_id, mountain_id)` (prevent duplicate unlocks)

---

## Relationships & Foreign Keys

### Entity Relationship Diagram (Text)

```
users (existing table)
  ├─→ player_climbing_stats (1:1)
  ├─→ player_gear_inventory (1:N)
  ├─→ player_expeditions (1:N)
  └─→ mountain_unlocks (1:N)

world_map_regions
  └─→ mountains (1:N)

mountains
  ├─→ routes (1:N)
  └─→ mountain_unlocks (1:N)

routes
  ├─→ route_gear_requirements (1:N)
  └─→ player_expeditions (1:N)

alpine_gear
  ├─→ route_gear_requirements (1:N)
  ├─→ player_gear_inventory (1:N)
  └─→ expedition_gear_loadout (1:N)

player_expeditions
  ├─→ expedition_events (1:N)
  └─→ expedition_gear_loadout (1:N)
```

### Key Relationships

1. **Users to Stats (1:1):** Each user has one player_climbing_stats record
2. **Mountains to Routes (1:N):** Each mountain has multiple climbing routes
3. **Routes to Gear Requirements (1:N):** Each route requires specific gear
4. **Players to Expeditions (1:N):** Players can have multiple expeditions
5. **Expeditions to Events (1:N):** Each expedition has multiple events
6. **Players to Gear Inventory (1:N):** Players own multiple gear items
7. **Regions to Mountains (1:N):** Mountains are grouped into regions

### Cascade Delete Strategy

- **ON DELETE CASCADE:** When a user is deleted, all their climbing data is deleted
- **ON DELETE CASCADE:** When a mountain is deleted, all routes and unlocks are deleted
- **ON DELETE CASCADE:** When an expedition is deleted, all events and loadouts are deleted
- **ON DELETE CASCADE:** Routes, gear requirements cascade from parent tables

---

## Indexing Strategy

### Performance-Critical Indexes

1. **User Lookups:**
   - `idx_player_gear_user_id` on `player_gear_inventory(user_id)`
   - `idx_player_expeditions_user_id` on `player_expeditions(user_id)`
   - `idx_mountain_unlocks_user_id` on `mountain_unlocks(user_id)`

2. **Mountain/Route Browsing:**
   - `idx_mountains_difficulty_tier` on `mountains(difficulty_tier)`
   - `idx_mountains_continent` on `mountains(continent)`
   - `idx_routes_mountain_id` on `routes(mountain_id)`

3. **Expedition Tracking:**
   - `idx_player_expeditions_status` on `player_expeditions(user_id, status)` (composite)
   - `idx_expedition_events_expedition_id` on `expedition_events(expedition_id)`

4. **Gear Management:**
   - `idx_alpine_gear_category` on `alpine_gear(category)`
   - `idx_alpine_gear_tier` on `alpine_gear(tier)`
   - `idx_route_gear_route_id` on `route_gear_requirements(route_id)`

5. **Unlock Prevention:**
   - `idx_mountain_unlocks_user_mountain` on `mountain_unlocks(user_id, mountain_id)` (unique)

### Query Optimization Patterns

**Example 1: Find all unlocked mountains for a user**
```sql
SELECT m.* FROM mountains m
INNER JOIN mountain_unlocks mu ON m.id = mu.mountain_id
WHERE mu.user_id = 123
ORDER BY m.elevation DESC;
```
Uses indexes: `idx_mountain_unlocks_user_id`

**Example 2: Check if player has required gear for a route**
```sql
SELECT rg.*, pg.condition
FROM route_gear_requirements rg
LEFT JOIN player_gear_inventory pg ON rg.gear_id = pg.gear_id AND pg.user_id = 123
WHERE rg.route_id = 45 AND rg.is_required = true;
```
Uses indexes: `idx_route_gear_route_id`, `idx_player_gear_user_id`

**Example 3: Get active expeditions with route and mountain data**
```sql
SELECT pe.*, r.route_name, m.name as mountain_name
FROM player_expeditions pe
INNER JOIN routes r ON pe.route_id = r.id
INNER JOIN mountains m ON r.mountain_id = m.id
WHERE pe.user_id = 123 AND pe.status = 'in_progress';
```
Uses indexes: `idx_player_expeditions_status` (composite), `idx_routes_mountain_id`

---

## Habit Integration System

### How Habits Power Climbing Progression

The game integrates the existing habit tracking system with the mountaineering mechanics:

#### 1. Energy System

**Earning Energy:**
- Completing a habit = +10 energy (configurable based on difficulty)
- Daily habit streak bonus = +5 energy
- Weekly target completion = +25 energy bonus
- Energy caps at `max_energy` (default 100, increases with level)

**Spending Energy:**
- Starting an expedition: -20 energy (base cost)
- Daily expedition progress: -5 energy per day
- Pushing through difficult events: -10-30 energy
- Rest days restore +5 energy

**Implementation:**
```typescript
// When habit is completed (habit_logs table)
async function onHabitComplete(userId: number, habitDifficulty: string) {
  const energyGain = {
    easy: 5,
    medium: 10,
    hard: 15
  }[habitDifficulty];

  // Update player_climbing_stats
  await db.update(playerClimbingStats)
    .set({
      currentEnergy: sql`LEAST(current_energy + ${energyGain}, max_energy)`,
      trainingDaysCompleted: sql`training_days_completed + 1`
    })
    .where(eq(playerClimbingStats.userId, userId));
}
```

#### 2. Gear Unlocks

**Unlock Conditions:**
- Gear has `unlock_level` (player level) AND `unlock_habit_count` (total habits completed)
- Both conditions must be met to unlock

**Example:**
```typescript
// Elite Oxygen System
{
  name: "Bottled Oxygen System - Elite",
  unlockLevel: 40,
  unlockHabitCount: 500,  // 500 total habits completed
  tier: "elite"
}
```

**Query to check unlocks:**
```sql
SELECT g.* FROM alpine_gear g
WHERE g.unlock_level <= (SELECT climbing_level FROM player_climbing_stats WHERE user_id = 123)
  AND g.unlock_habit_count <= (SELECT training_days_completed FROM player_climbing_stats WHERE user_id = 123);
```

#### 3. Mountain Unlocks

Mountains use flexible JSON-based unlock requirements:

```typescript
// Example: Mount Everest unlock requirements
{
  unlockRequirements: {
    minLevel: 50,                    // Player must be level 50+
    previousSummits: 20,             // Must have 20+ total summits
    requiredClimbs: [2, 5, 12],     // Must have completed mountains 2, 5, and 12
    minHabitStreak: 100,            // Must have 100+ day habit streak
    requiredContinents: ["Asia"],   // Must have completed at least one Asian peak
  }
}
```

**Validation Logic:**
```typescript
async function checkMountainUnlock(userId: number, mountainId: number) {
  const mountain = await getMountain(mountainId);
  const stats = await getPlayerClimbingStats(userId);
  const requirements = JSON.parse(mountain.unlockRequirements);

  // Check level
  if (stats.climbingLevel < requirements.minLevel) return false;

  // Check summits
  if (stats.summitsReached < requirements.previousSummits) return false;

  // Check habit streak (from habit_logs table)
  const habitStreak = await getCurrentStreak(userId);
  if (habitStreak < requirements.minHabitStreak) return false;

  // Check required climbs
  const completedClimbs = await getCompletedMountains(userId);
  const hasRequiredClimbs = requirements.requiredClimbs.every(
    id => completedClimbs.includes(id)
  );
  if (!hasRequiredClimbs) return false;

  return true;
}
```

#### 4. Experience & Leveling

**XP Sources:**
- Summit reached: +100-1000 XP (based on mountain difficulty)
- Partial completion: +10-50 XP
- Expedition events overcome: +5-20 XP
- Achievements: +50-500 XP

**Level Progression:**
```typescript
function calculateLevel(totalExperience: number): number {
  // Level 1-100 with exponential curve
  return Math.floor(Math.sqrt(totalExperience / 100)) + 1;
}
```

**XP Awarded:**
```typescript
const xpRewards = {
  novice: 100,
  intermediate: 250,
  advanced: 500,
  expert: 750,
  elite: 1000
};

// On successful summit
await db.update(playerClimbingStats)
  .set({
    totalExperience: sql`total_experience + ${xpRewards[mountain.difficultyTier]}`,
    climbingLevel: sql`FLOOR(SQRT(total_experience / 100)) + 1`,
    summitsReached: sql`summits_reached + 1`
  })
  .where(eq(playerClimbingStats.userId, userId));
```

#### 5. Habit-Based Expedition Progress

**Daily Progress Mechanic:**
- Each real-world day, player can complete habits to advance expedition
- Each habit completed = +5-10% expedition progress (based on route difficulty)
- Miss habits = expedition stalls, morale drops, risk increases

**Example Flow:**
1. Player starts expedition on Monday (status = "in_progress")
2. Tuesday: Completes 3 habits → +15% progress, +15 energy
3. Wednesday: Completes 2 habits → +10% progress, +10 energy
4. Thursday: Completes 0 habits → 0% progress, -10 morale, risk event triggered
5. Friday: Completes 4 habits → +20% progress, +20 energy, morale restored

```typescript
async function processExpeditionDay(expeditionId: number) {
  const expedition = await getExpedition(expeditionId);
  const habitsToday = await getHabitsCompletedToday(expedition.userId);

  const progressGain = habitsToday * 5; // 5% per habit
  const moraleChange = habitsToday > 0 ? 5 : -10;

  await db.update(playerExpeditions)
    .set({
      currentProgress: sql`LEAST(current_progress + ${progressGain}, 100)`,
      teamMorale: sql`GREATEST(team_morale + ${moraleChange}, 0)`,
      currentDay: sql`current_day + 1`
    })
    .where(eq(playerExpeditions.id, expeditionId));

  // Low morale triggers risk events
  if (expedition.teamMorale < 30) {
    await generateRiskEvent(expeditionId);
  }
}
```

---

## Progression & Unlock Mechanics

### Player Progression Path

**Level 1-10: Novice Climber**
- Access: Local peaks, basic mountains (< 3000m)
- Gear: Basic boots, simple ice axe, basic tent
- Energy: 100 max
- Unlock: Complete 50 habits to reach level 10

**Level 11-25: Intermediate Climber**
- Access: Regional peaks (3000-5000m), Alps, Rockies
- Gear: Intermediate crampons, advanced clothing, better oxygen
- Energy: 150 max
- Unlock: Complete previous tier + 200 total habits

**Level 26-40: Advanced Climber**
- Access: Major peaks (5000-7000m), some 8000m peaks
- Gear: Advanced technical gear, high-altitude equipment
- Energy: 200 max
- Unlock: Summit 10 intermediate peaks + 400 total habits

**Level 41-60: Expert Climber**
- Access: 8000m peaks, technical routes
- Gear: Elite gear, specialized equipment
- Energy: 250 max
- Unlock: Summit 5 advanced peaks + 600 total habits

**Level 61-100: Elite Climber**
- Access: All mountains including Everest, K2, extreme routes
- Gear: All gear unlocked
- Energy: 300 max
- Unlock: Summit 20 expert peaks + 1000 total habits

### Mountain Unlock Examples

**Mount Rainier (Novice - 4392m)**
```json
{
  "requiredClimbingLevel": 1,
  "unlockRequirements": {
    "minLevel": 1
  }
}
```

**Mont Blanc (Intermediate - 4808m)**
```json
{
  "requiredClimbingLevel": 12,
  "unlockRequirements": {
    "minLevel": 12,
    "previousSummits": 3,
    "minHabitStreak": 7
  }
}
```

**Aconcagua (Advanced - 6961m)**
```json
{
  "requiredClimbingLevel": 25,
  "unlockRequirements": {
    "minLevel": 25,
    "previousSummits": 10,
    "requiredClimbs": [1, 5, 8],
    "minHabitStreak": 30
  }
}
```

**Mount Everest (Elite - 8849m)**
```json
{
  "requiredClimbingLevel": 50,
  "unlockRequirements": {
    "minLevel": 50,
    "previousSummits": 25,
    "requiredClimbs": [15, 18, 22],
    "minHabitStreak": 100,
    "required8000mPeaks": 5
  }
}
```

### Achievements System

Stored in `player_climbing_stats.achievements` as JSON array:

```typescript
const achievementDefinitions = {
  first_summit: { name: "First Summit", xp: 50 },
  habit_warrior: { name: "100 Day Streak", xp: 200 },
  seven_summits: { name: "Seven Summits", xp: 1000 },
  speed_climber: { name: "Summit in Under 7 Days", xp: 300 },
  death_zone: { name: "Survive Above 8000m", xp: 500 },
  no_oxygen: { name: "Summit 8000m Without Oxygen", xp: 1000 }
};
```

---

## Data Examples

### Example Mountain: Mount Everest

```typescript
{
  id: 1,
  name: "Mount Everest",
  elevation: 8849,
  country: "Nepal/China",
  mountainRange: "Himalayas",
  continent: "Asia",
  regionId: 1,
  latitude: "27.9881° N",
  longitude: "86.9250° E",
  difficultyTier: "elite",
  requiredClimbingLevel: 50,
  description: "The world's highest mountain at 8,849 meters...",
  firstAscentYear: 1953,
  fatalityRate: "3.5%",
  bestSeasonStart: "April",
  bestSeasonEnd: "May",
  unlockRequirements: JSON.stringify({
    minLevel: 50,
    previousSummits: 25,
    requiredClimbs: [15, 18, 22],
    minHabitStreak: 100
  }),
  imageUrl: "/images/mountains/everest.jpg",
  mapPositionX: 850,
  mapPositionY: 450
}
```

### Example Route: Everest South Col

```typescript
{
  id: 1,
  mountainId: 1,
  routeName: "South Col Route",
  gradingSystem: "AD",
  gradeValue: "AD",
  elevationGain: 3400,
  estimatedDays: 45,
  terrainTypes: JSON.stringify(["glacier", "snow", "ice", "rock"]),
  hazards: JSON.stringify(["avalanche", "crevasse", "altitude", "icefall", "storm"]),
  requiresOxygen: true,
  requiresFixedRopes: true,
  requiresTechnicalClimbing: true,
  routeDescription: "The standard route via the South Col, climbing through the Khumbu Icefall...",
  firstAscentYear: 1953,
  technicalDifficulty: 8,
  physicalDifficulty: 10
}
```

### Example Alpine Gear: Elite Boots

```typescript
{
  id: 1,
  name: "Scarpa Phantom 6000 Boots",
  category: "boots",
  description: "Double-insulated boots rated for extreme altitude...",
  weightGrams: 1850,
  tier: "elite",
  unlockLevel: 40,
  unlockHabitCount: 500,
  cost: 5000,
  stats: JSON.stringify({
    warmthRating: 10,
    durability: 85,
    waterproofing: 9,
    technicalGrade: 8,
    comfortRating: 7
  }),
  imageUrl: "/images/gear/scarpa-phantom-6000.jpg"
}
```

### Example Active Expedition

```typescript
{
  id: 1,
  userId: 123,
  routeId: 5,
  status: "in_progress",
  startDate: "2025-01-01T08:00:00Z",
  completionDate: null,
  currentProgress: 65,
  currentAltitude: 7200,
  currentDay: 12,
  energySpent: 120,
  habitsCompletedDuring: 10,
  summitReached: false,
  experienceEarned: 0,
  notes: "Day 12: Reached Camp 3. Weather holding. Feeling strong.",
  weatherCondition: "clear",
  teamMorale: 85,
  acclimatizationLevel: 70
}
```

---

## Query Patterns

### 1. Get All Unlocked Mountains for User

```typescript
async function getUnlockedMountains(userId: number) {
  return await db
    .select({
      mountain: mountains,
      unlock: mountainUnlocks
    })
    .from(mountains)
    .innerJoin(mountainUnlocks, eq(mountains.id, mountainUnlocks.mountainId))
    .where(eq(mountainUnlocks.userId, userId))
    .orderBy(mountains.elevation);
}
```

### 2. Check if User Can Start Expedition

```typescript
async function canStartExpedition(userId: number, routeId: number) {
  // 1. Get player stats
  const stats = await db.select()
    .from(playerClimbingStats)
    .where(eq(playerClimbingStats.userId, userId))
    .limit(1);

  // 2. Check energy
  if (stats[0].currentEnergy < 20) return { canStart: false, reason: "Not enough energy" };

  // 3. Check if mountain is unlocked
  const route = await db.select()
    .from(routes)
    .innerJoin(mountains, eq(routes.mountainId, mountains.id))
    .where(eq(routes.id, routeId))
    .limit(1);

  const isUnlocked = await db.select()
    .from(mountainUnlocks)
    .where(
      and(
        eq(mountainUnlocks.userId, userId),
        eq(mountainUnlocks.mountainId, route.mountain.id)
      )
    )
    .limit(1);

  if (!isUnlocked.length) return { canStart: false, reason: "Mountain not unlocked" };

  // 4. Check gear requirements
  const requiredGear = await db.select()
    .from(routeGearRequirements)
    .where(
      and(
        eq(routeGearRequirements.routeId, routeId),
        eq(routeGearRequirements.isRequired, true)
      )
    );

  for (const req of requiredGear) {
    const hasGear = await db.select()
      .from(playerGearInventory)
      .where(
        and(
          eq(playerGearInventory.userId, userId),
          eq(playerGearInventory.gearId, req.gearId)
        )
      )
      .limit(1);

    if (!hasGear.length) {
      return { canStart: false, reason: `Missing required gear: ${req.gearId}` };
    }
  }

  return { canStart: true };
}
```

### 3. Get Expedition Timeline with Events

```typescript
async function getExpeditionTimeline(expeditionId: number) {
  const expedition = await db.select()
    .from(playerExpeditions)
    .where(eq(playerExpeditions.id, expeditionId))
    .limit(1);

  const events = await db.select()
    .from(expeditionEvents)
    .where(eq(expeditionEvents.expeditionId, expeditionId))
    .orderBy(expeditionEvents.eventDay);

  return {
    expedition: expedition[0],
    events
  };
}
```

### 4. Calculate Player Level from Experience

```typescript
async function updatePlayerLevel(userId: number) {
  await db.execute(sql`
    UPDATE player_climbing_stats
    SET climbing_level = FLOOR(SQRT(total_experience / 100)) + 1
    WHERE user_id = ${userId}
  `);
}
```

### 5. Get Available Gear in Alpine Shop

```typescript
async function getAvailableGear(userId: number) {
  const stats = await db.select()
    .from(playerClimbingStats)
    .where(eq(playerClimbingStats.userId, userId))
    .limit(1);

  return await db.select()
    .from(alpineGear)
    .where(
      and(
        lte(alpineGear.unlockLevel, stats[0].climbingLevel),
        lte(alpineGear.unlockHabitCount, stats[0].trainingDaysCompleted)
      )
    )
    .orderBy(alpineGear.tier, alpineGear.category);
}
```

---

## Scalability Considerations

### Database Performance

**Current Scale:**
- 100+ mountains
- 300+ routes (3 routes per mountain average)
- 50+ gear items
- Supports 10,000+ concurrent users

**Optimization Strategies:**

1. **Indexes:** All foreign keys and frequently queried columns are indexed
2. **JSON Fields:** Flexible data (hazards, stats, requirements) use JSON for easy modification
3. **Denormalization:** Player stats table caches computed values (level, total elevation)
4. **Pagination:** Use LIMIT/OFFSET for mountain browsing, expedition history
5. **Caching:** Cache mountain/gear data (rarely changes) in Redis/memory

### Future Enhancements

**Potential Additions:**

1. **Weather System:** Real-time weather API integration
2. **Multiplayer Expeditions:** Team climbing with friends
3. **Trading System:** Trade/sell gear between players
4. **Seasonal Events:** Time-limited climbing challenges
5. **Custom Routes:** Player-created custom routes
6. **Photo Journal:** Upload photos to expedition notes
7. **Leaderboards:** Global/friend leaderboards
8. **Achievements:** 50+ achievement types
9. **Mountain Challenges:** Timed speedrun challenges
10. **Training System:** Specific training regimens for skills

---

## Integration with Existing Habit System

### Tables Used from Existing Schema

1. **users:** Core user authentication and profiles
2. **habits:** Daily habit tracking
3. **habit_logs:** Habit completion records
4. **user_points:** In-game currency for gear purchases

### Energy Refresh System

```typescript
// Run daily cron job
async function refreshDailyEnergy() {
  // For each user with active expeditions
  const activeUsers = await db.selectDistinct({ userId: playerExpeditions.userId })
    .from(playerExpeditions)
    .where(eq(playerExpeditions.status, 'in_progress'));

  for (const { userId } of activeUsers) {
    // Get habits completed today
    const today = new Date().toISOString().split('T')[0];
    const habitsToday = await db.select()
      .from(habitLogs)
      .where(
        and(
          eq(habitLogs.userId, userId),
          eq(habitLogs.date, today),
          eq(habitLogs.completed, true)
        )
      );

    // Calculate energy gain
    const energyGain = habitsToday.length * 10;

    // Update player stats
    await db.update(playerClimbingStats)
      .set({
        currentEnergy: sql`LEAST(current_energy + ${energyGain}, max_energy)`,
        lastEnergyRefresh: new Date()
      })
      .where(eq(playerClimbingStats.userId, userId));
  }
}
```

### Gear Purchase with Points

```typescript
async function purchaseGear(userId: number, gearId: number) {
  const gear = await db.select()
    .from(alpineGear)
    .where(eq(alpineGear.id, gearId))
    .limit(1);

  const points = await db.select()
    .from(userPoints)
    .where(eq(userPoints.userId, userId))
    .limit(1);

  if (points[0].available < gear[0].cost) {
    throw new Error("Not enough points");
  }

  // Deduct points
  await db.update(userPoints)
    .set({
      available: sql`available - ${gear[0].cost}`,
      totalSpent: sql`total_spent + ${gear[0].cost}`
    })
    .where(eq(userPoints.userId, userId));

  // Add gear to inventory
  await db.insert(playerGearInventory).values({
    userId,
    gearId,
    condition: 100,
    timesUsed: 0
  });

  // Log transaction
  await db.insert(pointTransactions).values({
    userId,
    amount: -gear[0].cost,
    type: 'gear_purchase',
    relatedId: gearId,
    description: `Purchased ${gear[0].name}`
  });
}
```

---

## Summary

This mountaineering expedition schema provides:

1. **Complete Game Systems:** Mountains, routes, gear, expeditions, events
2. **Habit Integration:** Energy system powered by daily habit completion
3. **Progression Mechanics:** Level-based unlocks, achievement tracking
4. **Authentic Climbing:** Real mountains, routes, hazards, gear requirements
5. **Scalability:** Indexed, normalized, with JSON flexibility
6. **Performance:** Optimized queries, composite indexes, efficient joins
7. **Extensibility:** Easy to add new mountains, gear, achievements, features

The schema supports 100+ mountains, 300+ routes, and scales to thousands of users while maintaining authentic mountaineering simulation mechanics tied to real-world habit building.
