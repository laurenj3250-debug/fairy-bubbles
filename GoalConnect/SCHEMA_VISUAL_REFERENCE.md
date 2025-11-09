# Mountaineering Expedition Game - Visual Schema Reference

## Quick Reference Guide

This document provides visual diagrams and quick lookups for the mountaineering database schema.

---

## Complete Entity Relationship Diagram

```
┌─────────────────────────┐
│   EXISTING TABLES       │
└─────────────────────────┘

┌──────────┐
│  users   │◄─────────────────────────┐
└────┬─────┘                          │
     │                                │
     │ 1:1                            │
     ├──────────────────┐             │
     │                  │             │
     │            ┌─────▼───────────────────┐
     │            │player_climbing_stats    │
     │            │  - climbing_level       │
     │            │  - total_experience     │
     │            │  - current_energy       │
     │            │  - summits_reached      │
     │            └─────────────────────────┘
     │
     │ 1:N
     ├──────────────────┐
     │                  │
     │            ┌─────▼───────────────────┐
     │            │player_gear_inventory    │
     │            │  - gear_id (FK)         │
     │            │  - condition            │
     │            │  - times_used           │
     │            └──────────┬──────────────┘
     │                       │
     │                       │ N:1
     │                       ▼
     │                  ┌────────────────┐
     │                  │  alpine_gear   │
     │                  │  - category    │
     │                  │  - tier        │
     │                  │  - stats       │
     │                  └────┬───────────┘
     │                       │
     │                       │ 1:N
     │                       ▼
     │              ┌────────────────────────┐
     │              │route_gear_requirements │
     │              │  - route_id (FK)       │
     │              │  - is_required         │
     │              └────────┬───────────────┘
     │                       │
     │ 1:N                   │ N:1
     │                       ▼
     │              ┌──────────────┐
     ├─────────────►│   routes     │
     │              │  - grading   │
     │              │  - hazards   │
     │              │  - terrain   │
     │              └────┬─────────┘
     │                   │
     │                   │ N:1
     │                   ▼
     │              ┌──────────────┐         ┌──────────────────┐
     │              │  mountains   │◄────────│world_map_regions │
     │              │  - elevation │  N:1    │  - continent     │
     │              │  - tier      │         │  - unlock_level  │
     │              └────┬─────────┘         └──────────────────┘
     │                   │
     │                   │ 1:N
     │                   ▼
     │              ┌──────────────────┐
     ├─────────────►│mountain_unlocks  │
     │              │  - unlocked_at   │
     │              │  - unlocked_by   │
     │              └──────────────────┘
     │
     │ 1:N
     ├──────────────────┐
     │                  │
     │            ┌─────▼────────────────────┐
     │            │player_expeditions        │
     │            │  - status                │
     │            │  - current_progress      │
     │            │  - summit_reached        │
     │            └──┬────────────────────┬──┘
     │               │                    │
     │               │ 1:N                │ 1:N
     │               │                    │
     │         ┌─────▼───────────┐  ┌────▼───────────────────┐
     │         │expedition_events│  │expedition_gear_loadout │
     │         │  - event_type   │  │  - gear_id (FK)        │
     │         │  - impact       │  │  - condition_before    │
     │         └─────────────────┘  └────────────────────────┘
     │
     └──────────────────────────────────┘
```

---

## Table Size Reference

### Core Content Tables (Admin Managed)

| Table | Estimated Rows | Growth Rate | Description |
|-------|----------------|-------------|-------------|
| `world_map_regions` | 10-20 | Static | Geographic regions |
| `mountains` | 100-200 | Slow | Real-world peaks |
| `routes` | 300-600 | Slow | Climbing routes |
| `alpine_gear` | 50-100 | Slow | Equipment catalog |
| `route_gear_requirements` | 1,000-3,000 | Slow | Gear per route |

### Player Data Tables (User Generated)

| Table | Estimated Rows | Growth Rate | Description |
|-------|----------------|-------------|-------------|
| `player_climbing_stats` | = # users | 1:1 with users | Player stats |
| `player_gear_inventory` | 20-50 per user | Medium | Owned gear |
| `mountain_unlocks` | 5-50 per user | Medium | Unlocked peaks |
| `player_expeditions` | 10-100 per user | High | All attempts |
| `expedition_events` | 50-500 per expedition | High | Event log |
| `expedition_gear_loadout` | 10-30 per expedition | High | Gear taken |

---

## Quick Lookup Tables

### Difficulty Tier Progression

| Tier | Level Range | Elevation Range | Example Mountains | Gear Tier |
|------|-------------|-----------------|-------------------|-----------|
| **Novice** | 1-10 | 0-3000m | Rainier, Whitney | Basic |
| **Intermediate** | 11-25 | 3000-5000m | Mont Blanc, Elbrus | Intermediate |
| **Advanced** | 26-40 | 5000-7000m | Aconcagua, Kilimanjaro | Advanced |
| **Expert** | 41-60 | 7000-8000m | Cho Oyu, Gasherbrum | Advanced/Elite |
| **Elite** | 61-100 | 8000m+ | Everest, K2, Kangchenjunga | Elite |

### Gear Categories

| Category | Examples | Weight Range | Unlock Tier |
|----------|----------|--------------|-------------|
| `boots` | Scarpa, La Sportiva | 1000-2000g | Basic → Elite |
| `crampons` | Petzl, Black Diamond | 800-1200g | Basic → Elite |
| `rope` | 50m, 60m, 80m | 3000-5000g | Basic → Advanced |
| `ice_axe` | Technical, Walking | 400-700g | Basic → Elite |
| `tent` | 2-person, 4-person | 2000-4000g | Basic → Elite |
| `oxygen` | Bottles, masks | 5000-8000g | Advanced → Elite |
| `clothing` | Jackets, pants, gloves | 500-2000g | Basic → Elite |
| `safety` | Harness, belay device | 500-1000g | Basic → Advanced |
| `backpack` | 40L, 60L, 80L | 1500-3000g | Basic → Elite |
| `sleeping_bag` | -10°C to -40°C | 1000-2500g | Basic → Elite |
| `stove` | Gas, multi-fuel | 300-600g | Basic → Intermediate |

### Event Types & Impact

| Event Type | Energy Cost | Progress Impact | Morale Impact | Frequency |
|------------|-------------|-----------------|---------------|-----------|
| `weather_delay` | -5 | 0 | -10 | Common |
| `storm` | -15 | -10 | -20 | Uncommon |
| `avalanche` | -30 | -25 | -30 | Rare |
| `crevasse` | -20 | -15 | -25 | Uncommon |
| `altitude_sickness` | -10 | -5 | -15 | Common |
| `equipment_failure` | -10 | 0 | -10 | Uncommon |
| `rest_day` | +5 | 0 | +10 | Player Choice |
| `acclimatization` | -5 | +5 | +5 | Player Choice |
| `success` | 0 | +20 | +30 | Summit Day |

### Status Flow

```
┌─────────┐
│planning │ ──► Start Expedition (costs 20 energy)
└────┬────┘
     │
     ▼
┌────────────┐
│in_progress │ ──► Daily Progress (habit completion)
└─┬────────┬─┘
  │        │
  │        └──► Abandon (player quits)
  │                  │
  │                  ▼
  │            ┌──────────┐
  │            │abandoned │
  │            └──────────┘
  │
  ├──► Summit Reached
  │          │
  │          ▼
  │    ┌──────────┐
  │    │completed │
  │    └──────────┘
  │
  └──► Failed (morale = 0, energy = 0, etc.)
             │
             ▼
       ┌────────┐
       │ failed │
       └────────┘
```

---

## Index Quick Reference

### Most Important Indexes

**User-specific queries:**
```sql
-- Find user's expeditions
idx_player_expeditions_user_id ON player_expeditions(user_id)

-- Find user's gear
idx_player_gear_user_id ON player_gear_inventory(user_id)

-- Find user's unlocks
idx_mountain_unlocks_user_id ON mountain_unlocks(user_id)

-- Find active expeditions (composite)
idx_player_expeditions_status ON player_expeditions(user_id, status)
```

**Content browsing:**
```sql
-- Filter mountains by difficulty
idx_mountains_difficulty_tier ON mountains(difficulty_tier)

-- Filter mountains by continent
idx_mountains_continent ON mountains(continent)

-- Get routes for mountain
idx_routes_mountain_id ON routes(mountain_id)

-- Browse gear by category
idx_alpine_gear_category ON alpine_gear(category)
```

**Relationships:**
```sql
-- Get gear requirements for route
idx_route_gear_route_id ON route_gear_requirements(route_id)

-- Get events for expedition
idx_expedition_events_expedition_id ON expedition_events(expedition_id)

-- Prevent duplicate unlocks (unique)
idx_mountain_unlocks_user_mountain ON mountain_unlocks(user_id, mountain_id)
```

---

## Common Query Patterns

### 1. Get All Unlocked Mountains for User

```sql
SELECT m.*
FROM mountains m
INNER JOIN mountain_unlocks mu ON m.id = mu.mountain_id
WHERE mu.user_id = ?
ORDER BY m.elevation ASC;
```

### 2. Check if Player Has Required Gear

```sql
SELECT rg.gear_id, ag.name, pg.id as owned
FROM route_gear_requirements rg
INNER JOIN alpine_gear ag ON rg.gear_id = ag.id
LEFT JOIN player_gear_inventory pg ON rg.gear_id = pg.gear_id AND pg.user_id = ?
WHERE rg.route_id = ? AND rg.is_required = true;
```

### 3. Get Active Expedition with Details

```sql
SELECT pe.*, r.route_name, m.name as mountain_name, m.elevation
FROM player_expeditions pe
INNER JOIN routes r ON pe.route_id = r.id
INNER JOIN mountains m ON r.mountain_id = m.id
WHERE pe.user_id = ? AND pe.status = 'in_progress'
LIMIT 1;
```

### 4. Get Expedition Timeline

```sql
SELECT *
FROM expedition_events
WHERE expedition_id = ?
ORDER BY event_day ASC;
```

### 5. Check Unlockable Gear

```sql
SELECT g.*
FROM alpine_gear g
WHERE g.unlock_level <= (
  SELECT climbing_level FROM player_climbing_stats WHERE user_id = ?
)
AND g.unlock_habit_count <= (
  SELECT training_days_completed FROM player_climbing_stats WHERE user_id = ?
)
AND g.id NOT IN (
  SELECT gear_id FROM player_gear_inventory WHERE user_id = ?
);
```

### 6. Get Player Leaderboard

```sql
SELECT u.name, pcs.summits_reached, pcs.total_elevation_climbed, pcs.climbing_level
FROM player_climbing_stats pcs
INNER JOIN users u ON pcs.user_id = u.id
ORDER BY pcs.summits_reached DESC, pcs.total_elevation_climbed DESC
LIMIT 100;
```

---

## JSON Field Schemas

### mountains.unlock_requirements

```typescript
{
  minLevel?: number;              // Minimum climbing level
  previousSummits?: number;       // Total summits required
  requiredClimbs?: number[];      // Specific mountain IDs required
  minHabitStreak?: number;        // Consecutive days of habits
  requiredContinents?: string[];  // Must have summited on these continents
  required8000mPeaks?: number;    // Number of 8000m peaks required
  specificAchievements?: string[]; // Specific achievements required
}
```

### alpine_gear.stats

```typescript
{
  warmthRating?: number;      // 1-10 for clothing/sleeping bags
  durability?: number;        // Base durability 0-100
  technicalGrade?: number;    // 1-10 for technical gear
  oxygenCapacity?: number;    // Liters for oxygen systems
  waterproofing?: number;     // 1-10 for tents/clothing
  comfortRating?: number;     // 1-10 for boots/clothing
  packVolume?: number;        // Liters for backpacks
  temperatureRating?: number; // °C for sleeping bags
}
```

### routes.terrain_types

```typescript
[
  "glacier",    // Glacier travel
  "rock",       // Rock climbing
  "snow",       // Snow climbing
  "ice",        // Ice climbing
  "mixed",      // Mixed terrain
  "scramble",   // Scrambling
  "technical"   // Technical climbing
]
```

### routes.hazards

```typescript
[
  "avalanche",          // Avalanche danger
  "crevasse",           // Crevasse danger
  "rockfall",           // Rockfall hazard
  "altitude",           // Altitude sickness
  "icefall",            // Icefall danger
  "serac",              // Serac collapse
  "storm",              // Severe weather
  "exposure",           // Exposure to elements
  "objective_danger"    // General objective hazards
]
```

### expedition_events.player_choice

```typescript
{
  choice: string;            // What player chose
  options: string[];         // Available options
  consequence: string;       // Result of choice
  alternateOutcome?: string; // What would have happened
}

// Example
{
  "choice": "push_through",
  "options": ["wait_out_storm", "push_through", "retreat"],
  "consequence": "Lost 10 morale but gained 15 progress",
  "alternateOutcome": "Waiting would have restored 5 morale"
}
```

### player_climbing_stats.achievements

```typescript
[
  "first_summit",        // First successful climb
  "habit_warrior_30",    // 30 day habit streak
  "habit_warrior_100",   // 100 day habit streak
  "seven_summits",       // Summit highest peak on each continent
  "speed_climber",       // Complete expedition in < 50% estimated time
  "death_zone",          // Survive above 8000m
  "no_oxygen",           // Summit 8000m peak without oxygen
  "gear_collector",      // Own 50+ items
  "continental_climber", // Summit on 3+ continents
  "elite_climber",       // Reach level 50
  "everest_conqueror",   // Summit Mount Everest
  "k2_conqueror"         // Summit K2
]
```

---

## Validation Rules

### Energy System

```typescript
// Energy constraints
MIN_ENERGY = 0
MAX_ENERGY = player_climbing_stats.max_energy
STARTING_ENERGY = 100

// Energy costs
EXPEDITION_START_COST = 20
DAILY_EXPEDITION_COST = 5
EVENT_COSTS = {
  weather_delay: 5,
  storm: 15,
  avalanche: 30,
  altitude_sickness: 10
}

// Energy gains (per habit)
HABIT_ENERGY = {
  easy: 5,
  medium: 10,
  hard: 15
}
```

### Progression Constraints

```typescript
// Level constraints
MIN_LEVEL = 1
MAX_LEVEL = 100

// Condition constraints
MIN_CONDITION = 0
MAX_CONDITION = 100

// Morale constraints
MIN_MORALE = 0
MAX_MORALE = 100

// Acclimatization constraints
MIN_ACCLIMATIZATION = 0
MAX_ACCLIMATIZATION = 100

// Progress constraints
MIN_PROGRESS = 0
MAX_PROGRESS = 100
```

### Gear Constraints

```typescript
// Weight constraints
MAX_PACK_WEIGHT_GRAMS = 25000 // 25kg typical max

// Condition degradation
DEGRADATION_PER_USE = {
  boots: 5,
  crampons: 3,
  rope: 4,
  tent: 2,
  clothing: 6,
  oxygen: 10 // Consumable
}
```

---

## Migration Checklist

When migrating to production:

- [ ] Run migrations on dev/staging first
- [ ] Verify all 11 tables created
- [ ] Verify all 20+ indexes created
- [ ] Verify foreign key constraints
- [ ] Verify check constraints on enums
- [ ] Initialize player_climbing_stats for existing users
- [ ] Populate seed data for mountains
- [ ] Populate seed data for routes
- [ ] Populate seed data for alpine_gear
- [ ] Populate seed data for route_gear_requirements
- [ ] Test unlock logic
- [ ] Test energy system
- [ ] Test expedition flow
- [ ] Performance test queries with indexes
- [ ] Set up monitoring for slow queries
- [ ] Configure backup schedule for game data

---

## Performance Optimization Tips

### Query Optimization

1. **Always filter by user_id first** - Reduces result set significantly
2. **Use composite indexes** - For user_id + status queries
3. **Limit results** - Use pagination for large result sets
4. **Cache static data** - Mountains, gear, routes change infrequently
5. **Denormalize summits** - Already done in player_climbing_stats

### Scaling Strategies

1. **Read replicas** - For mountain/gear browsing
2. **Redis caching** - For player stats, active expeditions
3. **Batch processing** - Daily energy refresh via cron
4. **Archive old expeditions** - Move completed expeditions > 1 year old
5. **Partition large tables** - Partition expedition_events by date

---

## Summary Statistics

### Schema Totals

- **Tables:** 11 new tables
- **Foreign Keys:** 15 relationships
- **Indexes:** 20+ performance indexes
- **JSON Fields:** 6 flexible fields
- **Enum Types:** 8 constrained types
- **Cascade Deletes:** All user data cascades

### Expected Data Volume (10K Users)

- Mountains: 100-200 rows
- Routes: 300-600 rows
- Alpine Gear: 50-100 rows
- Player Stats: 10,000 rows (1:1 with users)
- Player Gear Inventory: 200K-500K rows
- Mountain Unlocks: 50K-500K rows
- Expeditions: 100K-1M rows
- Expedition Events: 5M-50M rows

Total estimated DB size: **1-5 GB** for 10K active users
